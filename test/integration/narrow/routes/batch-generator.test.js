const mockGenerateBatch = jest.fn()
const mockGetBatchSchemes = jest.fn()
const mockSchemaValidate = jest.fn()
const mockRandomUUID = jest.fn()
let zipInstance

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => {
    if (!zipInstance) {
      zipInstance = {
        file: jest.fn(),
        generateAsync: jest.fn().mockResolvedValue(Buffer.from('zip-data'))
      }
    }

    return zipInstance
  })
})

jest.mock('node:crypto', () => ({
  randomUUID: (...args) => mockRandomUUID(...args)
}))

jest.mock('../../../../app/batch-generator', () => ({
  generateBatch: mockGenerateBatch
}))

jest.mock('../../../../app/helpers/get-batch-schemes', () => ({
  getBatchSchemes: mockGetBatchSchemes
}))

jest.mock('../../../../app/routes/schemas/batch-generator', () => ({
  validate: mockSchemaValidate
}))

describe('batch generator routes', () => {
  let h
  let routes

  beforeEach(() => {
    jest.clearAllMocks()
    zipInstance = null

    mockGetBatchSchemes.mockReturnValue([
      { id: 1, name: 'Scheme one' }
    ])

    mockSchemaValidate.mockReturnValue({
      error: null
    })

    mockRandomUUID.mockReturnValue('test-token')

    h = {
      view: jest.fn((view, context) => ({
        view,
        context
      })),
      redirect: jest.fn(location => ({
        location
      })),
      response: jest.fn(() => ({
        type: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis()
      }))
    }

    jest.isolateModules(() => {
      routes = require('../../../../app/routes/batch-generator')
    })
  })

  const getRoute = (method, path) =>
    routes.find(x => x.method === method && x.path === path)

  describe('GET /batch-generator', () => {
    test('gets the form and displays schemes with default values', async () => {
      const route = getRoute('GET', '/batch-generator')

      const result = await route.options.handler({}, h)

      expect(mockGetBatchSchemes).toHaveBeenCalledTimes(1)

      expect(h.view).toHaveBeenCalledWith('batch-generator', {
        schemes: [{ id: 1, name: 'Scheme one' }],
        createChecksum: false,
        createControl: false
      })

      expect(result).toEqual({
        view: 'batch-generator',
        context: {
          schemes: [{ id: 1, name: 'Scheme one' }],
          createChecksum: false,
          createControl: false
        }
      })
    })
  })

  describe('POST /batch-generator', () => {
    test('redirects to confirmation when validation passes', async () => {
      const route = getRoute('POST', '/batch-generator')

      const request = {
        payload: {
          schemeId: '1',
          createChecksum: true,
          createControl: 'false'
        }
      }

      const result = await route.options.handler(request, h)

      expect(mockSchemaValidate).toHaveBeenCalledWith(request.payload, {
        abortEarly: false
      })

      expect(mockRandomUUID).toHaveBeenCalledTimes(1)

      expect(h.redirect).toHaveBeenCalledWith(
        '/batch-generator/confirm?token=test-token'
      )

      expect(result).toEqual({
        location: '/batch-generator/confirm?token=test-token'
      })
    })

    test('renders the form again when validation fails', async () => {
      const route = getRoute('POST', '/batch-generator')

      const validationError = {
        details: [{ message: 'Bad payload' }]
      }

      mockSchemaValidate.mockReturnValue({
        error: validationError
      })

      const request = {
        payload: {
          schemeId: 'bad',
          createChecksum: 'true'
        }
      }

      await route.options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith('batch-generator', {
        ...request.payload,
        schemes: [{ id: 1, name: 'Scheme one' }],
        errors: validationError
      })
    })
  })

  describe('GET /batch-generator/confirm', () => {
    test('renders the confirm page when token is valid', async () => {
      const postRoute = getRoute('POST', '/batch-generator')

      await postRoute.options.handler({
        payload: {
          schemeId: '1',
          createChecksum: false,
          createControl: false
        }
      }, h)

      const route = getRoute('GET', '/batch-generator/confirm')

      const result = await route.options.handler({
        query: {
          token: 'test-token'
        }
      }, h)

      expect(h.view).toHaveBeenCalledWith('batch-generator-confirm', {
        token: 'test-token',
        payload: {
          schemeId: '1',
          createChecksum: false,
          createControl: false
        },
        alreadyDownloaded: false
      })

      expect(result).toEqual({
        view: 'batch-generator-confirm',
        context: {
          token: 'test-token',
          payload: {
            schemeId: '1',
            createChecksum: false,
            createControl: false
          },
          alreadyDownloaded: false
        }
      })
    })

    test('redirects to the batch generator page when token is missing', async () => {
      const route = getRoute('GET', '/batch-generator/confirm')

      await route.options.handler({
        query: {
          token: 'missing'
        }
      }, h)

      expect(h.redirect).toHaveBeenCalledWith('/batch-generator')
    })
  })

  describe('GET /batch-generator/download', () => {
    test('creates the zip archive and returns it to the client', async () => {
      const route = getRoute('POST', '/batch-generator')
      const downloadRoute = getRoute('GET', '/batch-generator/download')

      await route.options.handler({
        payload: {
          schemeId: '1',
          createChecksum: false,
          createControl: false
        }
      }, h)

      mockGenerateBatch.mockReturnValue([
        {
          filename: 'sample.dat',
          content: 'batch-content'
        }
      ])

      zipInstance = {
        file: jest.fn(),
        generateAsync: jest.fn().mockResolvedValue(Buffer.from('zip-archive'))
      }

      const response = {
        type: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis()
      }

      h.response.mockReturnValue(response)

      const result = await downloadRoute.options.handler({
        query: {
          token: 'test-token'
        }
      }, h)

      expect(mockGenerateBatch).toHaveBeenCalledWith({
        schemeId: '1',
        createChecksum: false,
        createControl: false
      })

      expect(zipInstance.file).toHaveBeenCalledWith(
        'sample.dat',
        'batch-content'
      )

      expect(zipInstance.generateAsync).toHaveBeenCalledWith({
        type: 'nodebuffer'
      })

      expect(h.response).toHaveBeenCalledWith(Buffer.from('zip-archive'))
      expect(response.type).toHaveBeenCalledWith('application/zip')
      expect(response.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="sample.zip"'
      )

      expect(result).toBe(response)
    })

    test('redirects if the token is invalid or file was already downloaded', async () => {
      const route = getRoute('GET', '/batch-generator/download')

      await route.options.handler({
        query: {
          token: 'missing'
        }
      }, h)

      expect(h.redirect).toHaveBeenCalledWith(
        '/batch-generator/confirm?token=missing'
      )
    })
  })
})
