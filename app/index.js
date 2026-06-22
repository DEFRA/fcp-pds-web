require('log-timestamp')
const { setup } = require('./insights')
const { createServer } = require('./server')

const init = async () => {
  try {
    const server = await createServer()
    await server.start()
    console.log('Server running on %s', server.info.uri)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

setup()
init()
