#[macro_use]
extern crate log;

use anyhow::Result;
use dotenv::dotenv;
use ipcontext::ContextBuilder;

#[async_std::main]
async fn main() -> Result<()> {
    dotenv().ok();
    env_logger::init();

    debug!("starting");
    ContextBuilder::new().build().await?.run().await?;

    Ok(())
}
