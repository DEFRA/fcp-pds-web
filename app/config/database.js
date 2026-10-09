const isProd = () => process.env.NODE_ENV === 'production'

const dbConfig = {
  database: process.env.POSTGRES_DB || 'fcp_pds_web',
  host: process.env.POSTGRES_HOST || 'fcp-pds-web-postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  logging: process.env.POSTGRES_LOGGING || false,
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000
  },
  schema: process.env.POSTGRES_SCHEMA_NAME || 'public',
  ssl: isProd(),
  username: process.env.POSTGRES_USERNAME
}

module.exports = dbConfig
