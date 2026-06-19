const { useAzureMonitor } = require('@azure/monitor-opentelemetry')

function setup () {
  if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
    useAzureMonitor()
    console.log('App Insights running')
  } else {
    console.log('App Insights not running')
  }
}

module.exports = { setup }
