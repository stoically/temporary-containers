# IPContext

Random outgoing IPv6 Socks5 Proxy

## Install

### From Source

```
cargo build --release
sudo setcap CAP_NET_ADMIN+ep ./target/release/ipcontext
./target/release/ipcontext
```

- Build and temporarily load Temporary Containers
- Check ipify.org

## Development

1. Requirements

   - [Podman](https://podman.io/)

2. Create and start container

```
podman run --name ipcontext \
    -p 127.0.0.1:3561:3561 \
    --cap-add=NET_ADMIN \
    -v .:/opt \
    -v ipcontext:/opt/target:exec \
    -v ipcontext-cargo-registry:/usr/local/cargo/registry \
    -v ipcontext-cargo-git:/usr/local/cargo/git \
    -td rust /bin/bash
```

3. Get a shell

```
podman exec -it ipcontext /bin/bash
cd /opt
cargo test
```

### Cleanup

```
podman stop ipcontext
podman rm --volumes ipcontext
```
