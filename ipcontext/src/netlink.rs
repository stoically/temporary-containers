use anyhow::{Context, Result};
use futures::stream::{StreamExt, TryStreamExt};
use rtnetlink::{
    constants::RTMGRP_IPV6_IFADDR,
    new_connection,
    packet::{
        rtnl::{
            address::nlas::Nla, constants::AF_INET6, route::RouteMessage, AddressMessage,
            RtnlMessage,
        },
        NetlinkMessage, NetlinkPayload,
    },
    sys::{
        constants::{IFA_F_DEPRECATED, IFA_F_MANAGETEMPADDR, IFA_F_TENTATIVE},
        SocketAddr,
    },
    AddressGetRequest, Handle, IpVersion,
};
use std::{
    convert::TryInto,
    net::{IpAddr, Ipv6Addr},
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum NetlinkError {
    #[error("no output interface for ipv6 mngtmpaddr interface found")]
    NoOutputIfOnMngTmpIf,
    #[error("no ipv6 mngtmpaddr found on interface")]
    NoMngTmpAddrFound,
    #[error("no default ipv6 route found")]
    NoDefaultRouteFound,
    #[error("rtnetlink error: {}", .error)]
    RtNetlinkError { error: String },
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl From<rtnetlink::Error> for NetlinkError {
    fn from(error: rtnetlink::Error) -> NetlinkError {
        NetlinkError::RtNetlinkError {
            error: format!("{}", error),
        }
    }
}

pub struct MngTmpAddr {
    pub addr: u128,
    pub prefix_len: u8,
    pub ifa_index: u32,
}

pub struct Netlink {
    pub handle: Handle,
    address_rx: async_channel::Receiver<u128>,
}

impl Netlink {
    pub async fn new() -> Result<Netlink> {
        let (mut connection, handle, mut messages) = new_connection()?;
        let mgroup_flags = RTMGRP_IPV6_IFADDR;
        let addr = SocketAddr::new(0, mgroup_flags);
        connection
            .socket_mut()
            .bind(&addr)
            .context("failed to bind netlink")?;

        let (address_tx, address_rx) = async_channel::unbounded::<u128>();
        async_std::task::spawn(async move {
            while let Some((message, _)) = messages.next().await {
                let msg_addr = extract_msg_addr(message);
                let (msg, addr) = if msg_addr.is_some() {
                    msg_addr.unwrap()
                } else {
                    continue;
                };

                if let Nla::Flags(flags) = &msg.nlas[2] {
                    if flags & IFA_F_TENTATIVE as u32 == 0 {
                        if let Err(_) = address_tx.try_send(addr) {
                            error!("sending AddressMessage to Context failed");
                        }
                    }
                }
            }
        });

        async_std::task::spawn(connection);

        Ok(Netlink { handle, address_rx })
    }

    pub fn address_receiver(&self) -> async_channel::Receiver<u128> {
        self.address_rx.clone()
    }

    pub async fn get_mngtmpaddr(&self) -> Result<MngTmpAddr, NetlinkError> {
        let mut addresses = self.get_addresses().await?.execute();
        while let Some(msg) = addresses.try_next().await? {
            if msg.header.family & AF_INET6 as u8 == 0 {
                continue;
            }

            // TODO check whether .get(2) is reliable in this case
            if let Some(Nla::Flags(flags)) = &msg.nlas.get(2) {
                if flags & (IFA_F_MANAGETEMPADDR as u32) & !(IFA_F_DEPRECATED as u32) != 0 {
                    if let Some(Nla::Address(address)) = &msg.nlas.get(0) {
                        let address: &[u8] = &address;
                        let address: [u8; 16] = address.try_into().context("convert mngtmpaddr")?;
                        return Ok(MngTmpAddr {
                            addr: Ipv6Addr::from(address).into(),
                            prefix_len: msg.header.prefix_len,
                            ifa_index: msg.header.index,
                        });
                    }
                }
            }
        }

        Err(NetlinkError::NoMngTmpAddrFound)
    }

    pub async fn get_addresses(&self) -> Result<AddressGetRequest, NetlinkError> {
        let route = self.get_default_route(IpVersion::V6).await?;
        let iif = route
            .output_interface()
            .ok_or(NetlinkError::NoOutputIfOnMngTmpIf)?;

        Ok(self.handle.address().get().set_link_index_filter(iif))
    }

    async fn get_default_route(&self, ip_version: IpVersion) -> Result<RouteMessage, NetlinkError> {
        let mut routes = self.handle.route().get(ip_version).execute();
        while let Some(route) = routes.try_next().await? {
            if route.header.destination_prefix_length == 0 {
                return Ok(route);
            }
        }

        Err(NetlinkError::NoDefaultRouteFound)
    }

    pub async fn add_ip_addr(
        &self,
        ifa_index: u32,
        addr: IpAddr,
        prefix_len: u8,
    ) -> Result<(), NetlinkError> {
        Ok(self
            .handle
            .address()
            .add(ifa_index, addr, prefix_len)
            .execute()
            .await?)
    }
}

fn extract_msg_addr(message: NetlinkMessage<RtnlMessage>) -> Option<(AddressMessage, u128)> {
    let payload = message.payload;
    if let NetlinkPayload::InnerMessage(inner_msg) = payload {
        if let RtnlMessage::NewAddress(msg) = inner_msg {
            if let Some(Nla::Address(addr)) = &msg.nlas.get(0) {
                let addr: &[u8] = &addr;
                let addr: [u8; 16] = addr.try_into().unwrap();
                let addr: u128 = Ipv6Addr::from(addr).into();
                return Some((msg, addr));
            }
        }
    }

    None
}
