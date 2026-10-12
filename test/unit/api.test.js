jest.mock('@hapi/wreck')
jest.mock('../../app/config')

const wreck = require('@hapi/wreck')
const config = require('../../app/config')

const {
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
} = require('../../app/api')

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    config.get.mockImplementation(key => ({
      paymentsEndpoint: 'http://payments',
      injectionEndpoint: 'http://injection',
      alertingEndpoint: 'http://alerting',
      retentionEndpoint: 'http://retention',
      statementPublisherEndpoint: 'http://statement',
      trackingEndpoint: 'http://tracking',
      batchProcessorEndpoint: 'http://batch'
    })[key])
  })

  test('postProcessing returns payload', async () => {
    wreck.post.mockResolvedValue({
      payload: { success: true }
    })

    const result = await postProcessing('/test', { foo: 'bar' }, 'token')

    expect(result).toEqual({ success: true })
  })

  test('postInjection returns status code and payload', async () => {
    wreck.post.mockResolvedValue({
      res: { statusCode: 200 },
      payload: { success: true }
    })

    const result = await postInjection('/test', {})

    expect(result).toEqual({
      statusCode: 200,
      payload: { success: true }
    })
  })

  test('postAlerting returns status code and payload', async () => {
    wreck.post.mockResolvedValue({
      res: { statusCode: 200 },
      payload: { success: true }
    })

    const result = await postAlerting('/test', {})

    expect(result).toEqual({
      statusCode: 200,
      payload: { success: true }
    })
  })

  test('postRetention returns payload', async () => {
    wreck.post.mockResolvedValue({
      payload: { success: true }
    })

    const result = await postRetention('/test', {})

    expect(result).toEqual({ success: true })
  })

  test('postStatementPublisher returns status code and payload', async () => {
    wreck.post.mockResolvedValue({
      res: { statusCode: 200 },
      payload: { success: true }
    })

    const result = await postStatementPublisher('/test', {})

    expect(result).toEqual({
      statusCode: 200,
      payload: { success: true }
    })
  })

  test('postBatchProcessor returns payload', async () => {
    wreck.post.mockResolvedValue({
      payload: { success: true }
    })

    const result = await postBatchProcessor('/test', {})

    expect(result).toEqual({ success: true })
  })

  test('getProcessingData calls payments endpoint', async () => {
    await getProcessingData('/test', 'token')

    expect(wreck.get).toHaveBeenCalledWith(
      'http://payments/test',
      expect.objectContaining({
        headers: {
          Authorization: 'token'
        }
      })
    )
  })

  test('getRetentionData calls retention endpoint', async () => {
    await getRetentionData('/test')

    expect(wreck.get).toHaveBeenCalledWith(
      'http://retention/test',
      expect.any(Object)
    )
  })

  test('getTrackingData calls tracking endpoint', async () => {
    await getTrackingData('/test')

    expect(wreck.get).toHaveBeenCalledWith(
      'http://tracking/test',
      expect.any(Object)
    )
  })

  test('getAlertingData calls alerting endpoint', async () => {
    await getAlertingData('/test')

    expect(wreck.get).toHaveBeenCalledWith(
      'http://alerting/test',
      expect.any(Object)
    )
  })

  test('getInjectionData calls injection endpoint', async () => {
    await getInjectionData('/test')

    expect(wreck.get).toHaveBeenCalledWith(
      'http://injection/test',
      expect.any(Object)
    )
  })

  test('getStatementPublisherData returns payload', async () => {
    wreck.get.mockResolvedValue({
      payload: { success: true }
    })

    const result = await getStatementPublisherData('/test')

    expect(result).toEqual({ success: true })
  })

  test('getBatchProcessorData calls batch processor endpoint', async () => {
    await getBatchProcessorData('/test')

    expect(wreck.get).toHaveBeenCalledWith(
      'http://batch/test',
      expect.any(Object)
    )
  })

  test('getHistoricalInjectionData builds date range url', async () => {
    wreck.get.mockResolvedValue({})

    await getHistoricalInjectionData('/history', 7)

    expect(wreck.get).toHaveBeenCalledWith(
      expect.stringMatching(
        /^http:\/\/injection\/history\?from=.*&to=.*$/
      ),
      expect.any(Object)
    )
  })
})
