const Joi = require('joi')
const { DefaultAzureCredential, getBearerTokenProvider } = require('@azure/identity')

// Define config schema
const schema = Joi.object({
  database: Joi.string(),
  dialect: Joi.string().default('postgres'),
  dialectOptions: Joi.object({
    ssl: Joi.boolean().default(false)
  }),
  hooks: Joi.object({
    beforeConnect: Joi.function()
  }),
  host: Joi.string(),
  password: Joi.string(),
  port: Joi.number().default(5432),
  logging: Joi.boolean().default(false),
  retry: Joi.object({
    backoffBase: Joi.number().default(500),
    backoffExponent: Joi.number().default(1.1),
    match: Joi.array().default([/SequelizeConnectionError/]),
    max: Joi.number().default(10),
    name: Joi.string().default('connection'),
    timeout: Joi.number().default(60000)
  }),
  schema: Joi.string().default('public'),
  username: Joi.string()
})

// Build config
const config = {
  database: process.env.POSTGRES_DB,
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production'
  },
  hooks: {
    beforeConnect: async (cfg) => {
      if (process.env.NODE_ENV === 'production') {
        const dbAuthEndpoint = 'https://ossrdbms-aad.database.windows.net/.default'
        const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID })
        const tokenProvider = getBearerTokenProvider(
          credential,
          dbAuthEndpoint
        )
        cfg.password = tokenProvider
      }
    }
  },
  host: process.env.POSTGRES_HOST,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  logging: process.env.POSTGRES_LOGGING || false,
  retry: {
    backoffBase: 500,
    backoffExponent: 1.1,
    match: [/SequelizeConnectionError/],
    max: 10,
    name: 'connection',
    timeout: 60000
  },
  schema: process.env.POSTGRES_SCHEMA_NAME || 'public',
  username: process.env.POSTGRES_USERNAME
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

// Use the Joi validated value
const value = result.value

value.isDev = value.env === 'development'
value.isTest = value.env === 'test'
value.isProd = value.env === 'production'

module.exports = value
