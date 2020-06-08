use anyhow::{bail, Result};
use async_std::{net::TcpStream, prelude::*};
use futures_util::future::try_join;
use std::{
    net::{Shutdown, SocketAddr, ToSocketAddrs},
    str::FromStr,
};
use thiserror::Error;

const SOCKS_VERSION: u8 = 0x05;
const RESERVED: u8 = 0x00;

const ADDRESS_TYPE_V4: u8 = 0x01;
const ADDRESS_TYPE_DOMAIN: u8 = 0x03;

const AUTH_METHOD_USER_PASS: u8 = 0x02;
const AUTH_METHOD_NO_ACCEPTABLE: u8 = 0xff;
const AUTH_STATUS_SUCCESS: u8 = 0x00;

const COMMAND_CONNECT: u8 = 0x01;

const REPLY_SUCCESS: u8 = 0x00;
const REPLY_FAILURE: u8 = 0x01;
const REPLY_COMMAND_NOT_SUPPORTED: u8 = 0x07;
const REPLY_ADDRESS_TYPE_NOT_SUPPORTED: u8 = 0x08;

#[derive(Debug)]
pub struct UserPass {
    pub user: u32,
    pub pass: String,
}

#[derive(Error, Debug)]
pub enum HandshakeError {
    #[error("unsupported socks version: {ver:?}")]
    UnsupportedSocksVersion { ver: u8 },
    #[error("unsupported auth method: {methods:?}")]
    UnsupportedAuthMethod { methods: Vec<u8> },
    #[error("unsupported command: {cmd:?}")]
    UnsupportedCommand { cmd: u8 },
    #[error("unsupported address type: {atyp:?}")]
    UnsupportedAddressType { atyp: u8 },
    #[error("no socket addr for domain found: {domain:?}")]
    NoIpv6SocketAddrForDomainFound { domain: String },
}

pub struct Handshake<'a> {
    client: &'a mut TcpStream,
}

impl<'a> Handshake<'a> {
    pub async fn new(client: &'a mut TcpStream) -> Result<(Handshake<'a>, UserPass, SocketAddr)> {
        let mut handshake = Handshake { client };
        let auth = handshake.handle_auth().await?;
        let dst_addr = handshake.handle_request().await?;

        Ok((handshake, auth, dst_addr))
    }

    pub async fn success(mut self) -> Result<()> {
        self.request_reply(REPLY_SUCCESS).await?;
        Ok(())
    }

    pub async fn failure(mut self) -> Result<()> {
        self.request_reply(REPLY_FAILURE).await?;
        self.shutdown()?;
        Ok(())
    }

    // version/method selection header
    // +----+----------+----------+
    // |VER | NMETHODS | METHODS  |
    // +----+----------+----------+
    // | 1  |    1     | 1 to 255 |
    // +----+----------+----------+
    //
    // auth method selection reply
    // +----+--------+
    // |VER | METHOD |
    // +----+--------+
    // | 1  |   1    |
    // +----+--------+
    //
    // METHOD
    // o  X'00' NO AUTHENTICATION REQUIRED
    // o  X'01' GSSAPI
    // o  X'02' USERNAME/PASSWORD
    // o  X'03' to X'7F' IANA ASSIGNED
    // o  X'80' to X'FE' RESERVED FOR PRIVATE METHODS
    // o  X'FF' NO ACCEPTABLE METHODS
    async fn handle_auth(&mut self) -> Result<UserPass> {
        let mut buf = [0u8; 2];
        self.client.read_exact(&mut buf).await?;
        let ver = buf[0];

        if ver != SOCKS_VERSION {
            bail!(HandshakeError::UnsupportedSocksVersion { ver });
        }

        let nmet = buf[1];
        let mut methods = vec![0u8; nmet as usize];
        self.client.read_exact(&mut methods).await?;

        if !methods.contains(&AUTH_METHOD_USER_PASS) {
            self.auth_selection_reply(AUTH_METHOD_NO_ACCEPTABLE).await?;
            self.shutdown()?;
            bail!(HandshakeError::UnsupportedAuthMethod { methods });
        }
        self.auth_selection_reply(AUTH_METHOD_USER_PASS).await?;

        Ok(self.handle_auth_user_pass().await?)
    }

    async fn auth_selection_reply(&mut self, reply: u8) -> Result<()> {
        let buf = &[SOCKS_VERSION, reply];
        self.client.write_all(buf).await?;
        Ok(())
    }

    // username/password
    // auth request
    // +----+------+----------+------+----------+
    // |VER | ULEN |  UNAME   | PLEN |  PASSWD  |
    // +----+------+----------+------+----------+
    // | 1  |  1   | 1 to 255 |  1   | 1 to 255 |
    // +----+------+----------+------+----------+
    //
    // auth reply
    // +----+--------+
    // |VER | STATUS |
    // +----+--------+
    // | 1  |   1    |
    // +----+--------+
    //
    // A STATUS field of X'00' indicates success. If the server returns a
    // `failure' (STATUS value other than X'00') status, it MUST close the
    // connection.
    async fn handle_auth_user_pass(&mut self) -> Result<UserPass> {
        let mut buf = [0u8; 2];
        self.client.read_exact(&mut buf).await?;
        let ver = buf[0];

        let ulen = buf[1] as usize;
        let mut uname = vec![0u8; ulen];
        self.client.read_exact(&mut uname).await?;

        let mut buf = [0u8];
        self.client.read_exact(&mut buf).await?;
        let plen = buf[0] as usize;
        let mut passwd = vec![0u8; plen];
        self.client.read_exact(&mut passwd).await?;

        let uname = u32::from_str(&String::from_utf8(uname)?)?;
        let passwd = String::from_utf8(passwd)?;

        self.auth_status_reply(ver, AUTH_STATUS_SUCCESS).await?;

        Ok(UserPass {
            user: uname,
            pass: passwd,
        })
    }

    async fn auth_status_reply(&mut self, ver: u8, reply: u8) -> Result<()> {
        let buf = &[ver, reply];
        self.client.write_all(buf).await?;
        Ok(())
    }

    // handle command request
    // +----+-----+-------+------+----------+----------+
    // |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
    // +----+-----+-------+------+----------+----------+
    // | 1  |  1  | X'00' |  1   | Variable |    2     |
    // +----+-----+-------+------+----------+----------+
    // Where:
    //
    // o  VER    protocol version: X'05'
    // o  CMD
    //    o  CONNECT X'01'
    //    o  BIND X'02'
    //    o  UDP ASSOCIATE X'03'
    // o  RSV    RESERVED
    // o  ATYP   address type of following address
    //    o  IP V4 address: X'01'
    //         the address is a version-4 IP address, with a length of 4 octets
    //    o  DOMAINNAME: X'03'
    //         the address field contains a fully-qualified domain name.  The first
    //         octet of the address field contains the number of octets of name that
    //         follow, there is no terminating NUL octet.
    //    o  IP V6 address: X'04'
    //         the address is a version-6 IP address, with a length of 16 octets.
    // o  DST.ADDR       desired destination address
    // o  DST.PORT desired destination port in network octet
    //    order
    async fn handle_request(&mut self) -> Result<SocketAddr> {
        let mut buf = [0u8; 4];
        self.client.read_exact(&mut buf).await?;
        let cmd = buf[1];
        let atyp = buf[3];

        if cmd != COMMAND_CONNECT {
            self.request_reply(REPLY_COMMAND_NOT_SUPPORTED).await?;
            self.shutdown()?;
            bail!(HandshakeError::UnsupportedCommand { cmd });
        }

        match atyp {
            // we only support domains
            ADDRESS_TYPE_DOMAIN => {
                let mut len = [0u8];
                self.client.read_exact(&mut len).await?;
                let mut domain = vec![0u8; len[0] as usize];
                self.client.read_exact(&mut domain).await?;
                let port = self.read_port().await?;
                let domain = String::from_utf8_lossy(&domain);
                let domain_port = format!("{}:{}", domain, port);
                let mut addrs_iter = domain_port.to_socket_addrs()?;

                // we only support ipv6
                let addr = match addrs_iter.find(|addr| addr.is_ipv6()) {
                    Some(addr) => {
                        println!("resolved {} to {}", domain_port, addr);
                        addr
                    }
                    None => bail!(HandshakeError::NoIpv6SocketAddrForDomainFound {
                        domain: domain.into_owned(),
                    }),
                };

                Ok(addr)
            }
            _ => {
                self.request_reply(REPLY_ADDRESS_TYPE_NOT_SUPPORTED).await?;
                self.shutdown()?;
                bail!(HandshakeError::UnsupportedAddressType { atyp })
            }
        }
    }

    async fn read_port(&mut self) -> Result<u16> {
        let mut buf = [0u8; 2];
        self.client.read_exact(&mut buf).await?;
        Ok((u16::from(buf[0]) << 8) | u16::from(buf[1]))
    }

    // reply to the clients relay request
    // +----+-----+-------+------+----------+----------+
    // |VER | REP |  RSV  | ATYP | BND.ADDR | BND.PORT |
    // +----+-----+-------+------+----------+----------+
    // | 1  |  1  | X'00' |  1   | Variable |    2     |
    // +----+-----+-------+------+----------+----------+
    //
    //   o  VER    protocol version: X'05'
    //   o  REP    Reply field:
    //      o  X'00' succeeded
    //      o  X'01' general SOCKS server failure
    //      o  X'02' connection not allowed by ruleset
    //      o  X'03' Network unreachable
    //      o  X'04' Host unreachable
    //      o  X'05' Connection refused
    //      o  X'06' TTL expired
    //      o  X'07' Command not supported
    //      o  X'08' Address type not supported
    //      o  X'09' to X'FF' unassigned
    //   o  RSV    RESERVED
    //   o  ATYP   address type of following address
    //     o  IP V4 address: X'01'
    //     o  DOMAINNAME: X'03'
    //     o  IP V6 address: X'04'
    //  o  BND.ADDR       server bound address
    //  o  BND.PORT       server bound port in network octet order
    async fn request_reply(&mut self, reply: u8) -> Result<()> {
        let buf = &[
            SOCKS_VERSION,
            reply,
            RESERVED,
            ADDRESS_TYPE_V4,
            0,
            0,
            0,
            0,
            0,
            0,
        ];
        self.client.write_all(buf).await?;
        Ok(())
    }

    // disconnect tcpstream
    fn shutdown(&mut self) -> Result<()> {
        self.client.shutdown(Shutdown::Both)?;
        Ok(())
    }
}

pub async fn copy(client: TcpStream, server: TcpStream) -> Result<(u64, u64)> {
    let (mut client_rd, mut client_wr) = (&client, &client);
    let (mut server_rd, mut server_wr) = (&server, &server);
    let client_to_server = async_std::io::copy(&mut client_rd, &mut server_wr);
    let server_to_client = async_std::io::copy(&mut server_rd, &mut client_wr);
    Ok(try_join(client_to_server, server_to_client).await?)
}
