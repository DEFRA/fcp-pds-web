jest.mock('../../../app/plugins/crumb')
jest.mock('../../../app/api')
jest.mock('../../../app/auth')

const { postProcessing } = require('../../../app/api')
const { createServer } = require('../../../app/server')
const { resetViewer } = require('../../../app/auth/permissions')
const Boom = require('@hapi/boom')

const url = '/payment-request/reset'
const validInvoiceNumber = 'S123456789012345V001'
const successUrl = `/payment-request/reset-success?invoiceNumber=${validInvoiceNumber}`

let server
let auth

beforeEach(async () => {
  auth = { strategy: 'session-auth', credentials: { scope: [resetViewer] } }
  jest.clearAllMocks()
  server = await createServer()
})

afterEach(async () => {
  await server?.stop()
  server = undefined
})

const testGetRoute = (expectedStatus, authOverride, redirectLocation) => {
  const options = { method: 'GET', url, auth: authOverride }
  return server.inject(options).then(res => {
    expect(res.statusCode).toBe(expectedStatus)
    if (redirectLocation) {
      expect(res.headers.location).toBe(redirectLocation)
    }
  })
}

describe('Reset payment request', () => {
  test('GET / returns 403 if no permissions', () => testGetRoute(403, { ...auth, credentials: { scope: [] } }))
  test('GET / redirects to login if unauthenticated', () => testGetRoute(302, undefined, '/login'))
  test('GET / renders the reset form if authorised', async () => {
    const res = await server.inject({ method: 'GET', url, auth })

    expect(res.statusCode).toBe(200)
    expect(res.payload).toContain('name="invoiceNumber"')
    expect(res.payload).not.toContain('id="invoiceNumber-error"')
  })

  test.each([
    [{}],
    [{ invoiceNumber: true }],
    [{ invoiceNumber: undefined }]
  ])('POST / returns 400 for invalid payload %#', async (payload) => {
    const res = await server.inject({ method: 'POST', url, auth, payload })

    expect(res.statusCode).toBe(400)
    expect(res.request.response.source.template).toBe('reset-payment-request')
    expect(res.payload).toContain('aria-describedby="invoiceNumber-error"')
    expect(postProcessing).not.toHaveBeenCalled()
  })

  test('POST / redirects to a success page showing the invoice number', async () => {
    postProcessing.mockResolvedValueOnce(undefined)
    const res = await server.inject({ method: 'POST', url, auth, payload: { invoiceNumber: validInvoiceNumber } })

    expect(postProcessing).toHaveBeenCalledTimes(1)
    expect(postProcessing).toHaveBeenCalledWith(url, { invoiceNumber: validInvoiceNumber })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe(successUrl)

    const success = await server.inject({ method: 'GET', url: res.headers.location, auth })

    expect(success.statusCode).toBe(200)
    expect(success.request.response.source.template).toBe('reset-payment-request-success')
    expect(success.payload).toContain(`Payment request ${validInvoiceNumber}`)
  })

  test.each([
    ['a rejected request', Boom.preconditionFailed('Rejected'), 'Rejected'],
    ['an upstream payload message', Boom.preconditionFailed('Rejected', { payload: { message: 'Already processed' } }), 'Already processed'],
    ['an upstream 404', Boom.notFound('Unknown invoice'), 'Invoice number not found'],
    ['a not-found message without a 404', new Error('Invoice not found upstream'), 'Invoice number not found']
  ])('POST / returns 412 and shows the right message for %s', async (_scenario, error, message) => {
    postProcessing.mockRejectedValueOnce(error)
    const res = await server.inject({ method: 'POST', url, auth, payload: { invoiceNumber: validInvoiceNumber } })

    expect(res.statusCode).toBe(412)
    expect(res.request.response.source.template).toBe('reset-payment-request')
    expect(res.request.response.source.context).toMatchObject({
      error: { message },
      invoiceNumber: validInvoiceNumber
    })
    expect(res.payload).toContain(message)
    expect(res.payload).toContain(`value="${validInvoiceNumber}"`)
  })
})
