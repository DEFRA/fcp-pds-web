const wreck = require('@hapi/wreck')
const config = require('./config')

const getConfiguration = (token) => {
  return {
    headers: {
      Authorization: token ?? ''
    },
    json: true
  }
}

const postProcessing = async (url, data, token) => {
  const { payload } = await wreck.post(`${config.get('paymentsEndpoint')}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return payload
}

const postInjection = async (url, data, token) => {
  const { res, payload } = await wreck.post(`${config.get('injectionEndpoint')}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return { statusCode: res.statusCode, payload }
}

const postAlerting = async (url, data, token) => {
  const { res, payload } = await wreck.post(`${config.get('alertingEndpoint')}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return { statusCode: res.statusCode, payload }
}

const postRetention = async (url, data, token) => {
  const { payload } = await wreck.post(`${config.get('retentionEndpoint')}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return payload
}

const postStatementPublisher = async (url, data, token) => {
  const { res, payload } = await wreck.post(`${config.get('statementPublisherEndpoint')}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return { statusCode: res.statusCode, payload }
}

const postBatchProcessor = async (url, data, token) => {
  const { payload } = await wreck.post(`${config.get('batchProcessorEndpoint')}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return payload
}

const getProcessingData = async (url, token) => {
  return wreck.get(`${config.get('paymentsEndpoint')}${url}`, getConfiguration(token))
}

const getRetentionData = async (url, token) => {
  return wreck.get(`${config.get('retentionEndpoint')}${url}`, getConfiguration(token))
}

const getTrackingData = async (url, token) => {
  return wreck.get(`${config.get('trackingEndpoint')}${url}`, getConfiguration(token))
}

const getAlertingData = async (url, token) => {
  return wreck.get(`${config.get('alertingEndpoint')}${url}`, getConfiguration(token))
}

const getInjectionData = async (url, token) => {
  return wreck.get(`${config.get('injectionEndpoint')}${url}`, getConfiguration(token))
}

const getHistoricalInjectionData = async (endpoint, daysBack, token) => {
  const today = new Date()
  const fromDate = new Date()
  fromDate.setDate(today.getDate() - daysBack)

  const from = fromDate.toISOString().split('T')[0]
  const to = today.toISOString().split('T')[0]

  const endpointUrl = `${endpoint}?from=${from}&to=${to}`

  return getInjectionData(endpointUrl, token)
}

const getStatementPublisherData = async (url, token) => {
  const { payload } = await wreck.get(`${config.get('statementPublisherEndpoint')}${url}`, getConfiguration(token))
  return payload
}

const getBatchProcessorData = async (url, token) => {
  return wreck.get(`${config.get('batchProcessorEndpoint')}${url}`, getConfiguration(token))
}

module.exports = {
  postProcessing,
  postInjection,
  postAlerting,
  postRetention,
  postStatementPublisher,
  postBatchProcessor,
  getProcessingData,
  getRetentionData,
  getTrackingData,
  getAlertingData,
  getInjectionData,
  getHistoricalInjectionData,
  getStatementPublisherData,
  getBatchProcessorData
}
