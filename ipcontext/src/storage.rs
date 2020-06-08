use anyhow::{bail, Context as _, Result};
use sqlx::{query, Sqlite, SqlitePool};

#[derive(Default)]
pub struct StorageBuilder {
    pool: Option<SqlitePool>,
}

impl StorageBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_pool(mut self, pool: SqlitePool) -> Self {
        self.pool = Some(pool);
        self
    }

    pub async fn build(self) -> Result<Storage> {
        let pool = match self.pool {
            Some(pool) => pool,
            None => {
                let mut path = match dirs::data_local_dir() {
                    Some(path) => path,
                    None => bail!("userdata dir not found"),
                };
                path.push("temporary-containers");
                std::fs::create_dir_all(&path)?;

                path.push("ipcontext.db");
                let path = path.to_str().context("could not convert path to str")?;

                SqlitePool::new(path).await?
            }
        };

        let storage = Storage { pool };
        storage.create_tables().await?;

        Ok(storage)
    }
}

#[derive(Debug, Clone)]
pub struct Storage {
    pool: SqlitePool,
}

impl Storage {
    async fn save_ip<S: ToString>(&self, ip: S) -> Result<i64> {
        let mut conn = self.pool.acquire().await?;
        let ip = ip.to_string();

        query!(
            r#"
                INSERT INTO ip ( ip )
                VALUES ( $1 )
            "#,
            ip
        )
        .execute(&mut conn)
        .await?;

        let rec: (i64,) = sqlx::query_as("SELECT last_insert_rowid()")
            .fetch_one(&self.pool)
            .await?;

        Ok(rec.0)
    }

    async fn create_tables(&self) -> Result<()> {
        debug!("creating tables");
        let schema = include_str!("../schema.sql");

        let query = query::<Sqlite>(schema);
        query.execute(&self.pool).await?;

        Ok(())
    }
}
