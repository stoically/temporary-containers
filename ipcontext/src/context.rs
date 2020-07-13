use anyhow::{bail, Context as _, Result};
use async_std::net::{TcpListener, TcpStream};
use futures::lock::Mutex;
use rand::{rngs::SmallRng, Rng, SeedableRng};
use socket2::{Domain, SockAddr, Socket, Type};
use std::{
    collections::HashMap,
    net::{IpAddr, Ipv6Addr, SocketAddr},
    sync::Arc,
};
use thiserror::Error;

use crate::netlink::{MngTmpAddr, Netlink};
use crate::socks;
use crate::storage::{Storage, StorageBuilder};

#[derive(Error, Debug)]
enum ContextError {
    #[error("we only handle ipv6 capable addresses")]
    UnexpectedIPv4,
}

#[derive(Default)]
pub struct ContextBuilder {
    bind_addr: Option<SocketAddr>,
    storage: Option<Storage>,
    mngtmpaddr: Option<MngTmpAddr>,
}

impl ContextBuilder {
    pub fn new() -> ContextBuilder {
        ContextBuilder::default()
    }

    pub fn set_bind_addr(mut self, addr: SocketAddr) -> Self {
        self.bind_addr = Some(addr);
        self
    }

    pub fn set_mngtmpaddr(mut self, mngtmpaddr: MngTmpAddr) -> Self {
        self.mngtmpaddr = Some(mngtmpaddr);
        self
    }

    pub fn set_storage(mut self, storage: Storage) -> Self {
        self.storage = Some(storage);
        self
    }

    pub async fn build(self) -> Result<Context> {
        debug!("building context");
        let addr = self
            .bind_addr
            .unwrap_or_else(|| SocketAddr::new(IpAddr::V6(Ipv6Addr::LOCALHOST), 3560));

        let storage = match self.storage {
            Some(storage) => storage,
            None => StorageBuilder::new().build().await?,
        };

        let netlink = Netlink::new().await?;

        // TODO: allow mngtmpaddr to be added later on
        let mngtmpaddr = match self.mngtmpaddr {
            None => match netlink.get_mngtmpaddr().await {
                Ok(mngtmpaddr) => mngtmpaddr,
                Err(error) => bail!(error),
            },
            Some(mngtmpaddr) => mngtmpaddr,
        };

        let listener = TcpListener::bind(addr).await?;
        debug!("listening on {:?}", listener.local_addr()?);

        let inner = Arc::new(ContextInner {
            addrs_available: Mutex::new(Vec::new()),
            addrs_assigned: Mutex::new(HashMap::new()),
        });

        Ok(Context {
            inner,
            netlink,
            listener,
            storage,
            mngtmpaddr,
            small_rng: SmallRng::from_entropy(),
        })
    }
}

pub struct Context {
    inner: Arc<ContextInner>,
    netlink: Netlink,
    listener: TcpListener,
    storage: Storage,
    mngtmpaddr: MngTmpAddr,
    small_rng: SmallRng,
}

impl Context {
    pub async fn run(mut self) -> Result<()> {
        debug!("run started");
        self.allocate_addrs().await?;
        loop {
            let (client, _) = self.listener.accept().await?;

            let inner = self.inner.clone();
            async_std::task::spawn(async move {
                match inner.context_task(client).await {
                    Ok(_) => (),
                    Err(error) => error!("{}", error),
                };
            });
        }
    }

    async fn allocate_addrs(&mut self) -> Result<()> {
        debug!("allocating addresses");
        // TODO: get all existing addresses and exclude them from the random
        // generation, so conflicts are less likely
        let preallocate_addrs_count: usize = 5;
        let preallocate_addrs: Vec<u128> = (0..preallocate_addrs_count)
            .map(|_| self.generate_random_ipv6())
            .collect();

        let receiver = self.netlink.address_receiver();
        for addr in &preallocate_addrs {
            self.add_ip_addr(IpAddr::V6(addr.clone().into())).await?;
        }

        let mut addrs_seen: usize = 0;
        loop {
            // TODO: timeout if something goes wrong while allocating
            let addr = receiver.recv().await?;
            if !preallocate_addrs.contains(&addr) {
                continue;
            }

            debug!("pool allocated addr {:?}", addr);
            self.inner.addrs_available.lock().await.push(addr);

            addrs_seen += 1;
            if addrs_seen == preallocate_addrs_count {
                break;
            }
        }
        debug!("pool allocation done");

        Ok(())
    }

    async fn add_ip_addr(&self, addr: IpAddr) -> Result<()> {
        Ok(self
            .netlink
            .add_ip_addr(self.mngtmpaddr.ifa_index, addr, self.mngtmpaddr.prefix_len)
            .await?)
    }

    fn generate_random_ipv6(&mut self) -> u128 {
        let mask = (1 << (128 - self.mngtmpaddr.prefix_len)) - 1;
        let rand_bits: u128 = self.small_rng.gen();

        (rand_bits & mask) | (self.mngtmpaddr.addr & !mask)
    }
}

struct ContextInner {
    addrs_available: Mutex<Vec<u128>>,
    addrs_assigned: Mutex<HashMap<u32, u128>>,
}

impl ContextInner {
    async fn context_task(&self, mut client: TcpStream) -> Result<()> {
        let (handshake, auth, dst_addr) = socks::Handshake::new(&mut client).await?;

        let server = match self.route(auth, dst_addr).await {
            Ok(server) => {
                handshake.success().await?;
                server
            }
            Err(error) => {
                handshake.failure().await?;
                return Err(error);
            }
        };

        match socks::copy(client, server).await {
            Ok((from_client, from_server)) => {
                debug!(
                    "client wrote {} bytes and received {} bytes",
                    from_client, from_server
                );
            }
            Err(e) => {
                debug!("tunnel error: {}", e);
            }
        };

        Ok(())
    }

    async fn route(&self, auth: socks::UserPass, dst_addr: SocketAddr) -> Result<TcpStream> {
        let dst_addr = match dst_addr {
            SocketAddr::V6(dst_addr) => dst_addr,
            SocketAddr::V4(_) => bail!(ContextError::UnexpectedIPv4),
        };

        let bind_addr = {
            let mut addrs_assigned = self.addrs_assigned.lock().await;
            match addrs_assigned.get(&auth.user) {
                Some(addr) => addr.to_owned(),
                None => {
                    let rand_addr = self.addrs_available.lock().await.pop().unwrap();
                    debug!("assigning {} to {:?}", rand_addr, auth);
                    addrs_assigned.insert(auth.user, rand_addr);
                    rand_addr
                }
            }
        };

        let socket = Socket::new(Domain::ipv6(), Type::stream(), None)?;
        let bind_addr = IpAddr::V6(Ipv6Addr::from(bind_addr));
        let bind_addr = SockAddr::from(SocketAddr::new(bind_addr, 0));
        socket
            .bind(&bind_addr)
            .with_context(|| format!("binding to socket failed: {:?}", bind_addr))?;
        debug!("bound to ipv6 {:?}", &bind_addr);

        let connect_addr = socket2::SockAddr::from(dst_addr);
        socket
            .connect(&connect_addr)
            .with_context(|| format!("connecting to socket failed: {:?}", connect_addr))?;
        let server: TcpStream = socket.into_tcp_stream().into();

        Ok(server)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;
    use std::net::{IpAddr, Ipv6Addr, SocketAddr};
    use warp::Filter;

    use crate::netlink;

    async fn get(url: &str, proxy: &str) -> String {
        let proxy = reqwest::Proxy::all(proxy).expect("proxy should be there");
        let client = reqwest::Client::builder()
            .proxy(proxy)
            .build()
            .expect("should be able to build reqwest client");

        client
            .get(url)
            .send()
            .await
            .expect("request should succeed")
            .text()
            .await
            .expect("converting to text failed")
    }

    fn setup() -> SocketAddr {
        env_logger::init();

        let echo_route =
            warp::addr::remote().map(|addr: Option<SocketAddr>| addr.unwrap().ip().to_string());
        let (echo_socket, echo_bind) = warp::serve(echo_route)
            .bind_ephemeral(SocketAddr::new(IpAddr::V6(Ipv6Addr::LOCALHOST), 0));

        async_std::task::spawn(async move {
            echo_bind.await;
        });

        echo_socket
    }

    #[async_std::test]
    async fn ipcontext() {
        let echo_socket = setup();

        // every memory connection is a new db, hence max_size(1)
        let pool = SqlitePool::builder()
            .max_size(1)
            .idle_timeout(None)
            .max_lifetime(None)
            .build(":memory:")
            .await
            .unwrap();

        let storage = StorageBuilder::new().set_pool(pool).build().await.unwrap();

        let context = ContextBuilder::new()
            .set_bind_addr(SocketAddr::new(IpAddr::V6(Ipv6Addr::LOCALHOST), 0))
            .set_storage(storage)
            .set_mngtmpaddr(netlink::MngTmpAddr {
                addr: "fc00:0:0:0:0:0:0:0".parse::<Ipv6Addr>().unwrap().into(),
                prefix_len: 64,
                ifa_index: 2,
            })
            .build()
            .await
            .unwrap();

        let local_addr = context.listener.local_addr().unwrap();
        async_std::task::spawn(async move {
            context.run().await.unwrap();
        });

        let ipv6_echo_1 = get(
            &format!("http://{}", echo_socket.to_string()),
            &format!(
                "socks5h://1:password@[{}]:{}",
                local_addr.ip(),
                local_addr.port()
            ),
        )
        .await;

        let ipv6_echo_2 = get(
            &format!("http://{}", echo_socket.to_string()),
            &format!(
                "socks5h://2:password@[{}]:{}",
                local_addr.ip(),
                local_addr.port()
            ),
        )
        .await;

        assert!(ipv6_echo_1.parse::<IpAddr>().unwrap().is_ipv6());
        assert!(ipv6_echo_2.parse::<IpAddr>().unwrap().is_ipv6());
        assert_ne!(ipv6_echo_1, ipv6_echo_2);
    }
}
