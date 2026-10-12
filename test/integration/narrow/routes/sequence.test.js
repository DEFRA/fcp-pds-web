jest.mock('../../../../app/api', () => ({
  getBatchProcessorData: jest.fn(),
  postBatchProcessor: jest.fn()
}))

const {
  getBatchProcessorData,
  postBatchProcessor
} = require('../../../../app/api')

const routes = require('../../../../app/routes/sequence')

describe('sequence routes', () => {
  let h

  const sequences = [
    {
      schemeId: 1,
      next: 1,
      scheme: {
        scheme: 'Scheme one'
      }
    },
    {
      schemeId: 2,
      next: 25,
      scheme: {
        scheme: 'Scheme two'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    h = {
      view: jest.fn((view, context) => ({
        view,
        context
      })),
      redirect: jest.fn(location => ({
        location
      }))
    }

    getBatchProcessorData.mockResolvedValue({
      payload: {
        sequences
      }
    })

    postBatchProcessor.mockResolvedValue({})
  })

  describe('GET /sequence', () => {
    test('gets sequences and displays formatted table rows', async () => {
      const route = routes.find(x =>
        x.method === 'GET' && x.path === '/sequence'
      )

      const result = await route.options.handler({}, h)

      expect(getBatchProcessorData).toHaveBeenCalledTimes(1)
      expect(getBatchProcessorData).toHaveBeenCalledWith('/sequence')

      expect(h.view).toHaveBeenCalledWith('sequence/sequence', {
        tableRows: [
          [
            { text: '1' },
            { text: 'Scheme one' },
            { text: '0001' }
          ],
          [
            { text: '2' },
            { text: 'Scheme two' },
            { text: '0025' }
          ]
        ]
      })

      expect(result).toEqual({
        view: 'sequence/sequence',
        context: {
          tableRows: [
            [
              { text: '1' },
              { text: 'Scheme one' },
              { text: '0001' }
            ],
            [
              { text: '2' },
              { text: 'Scheme two' },
              { text: '0025' }
            ]
          ]
        }
      })
    })
  })

  describe('GET /edit-sequence', () => {
    test('gets sequences and builds scheme items', async () => {
      const route = routes.find(x =>
        x.method === 'GET' && x.path === '/edit-sequence'
      )

      await route.options.handler({}, h)

      expect(getBatchProcessorData).toHaveBeenCalledWith('/sequence')

      expect(h.view).toHaveBeenCalledWith(
        'sequence/edit-sequence',
        {
          sequences,
          schemeItems: [
            {
              value: '',
              text: ''
            },
            {
              value: 1,
              text: 'Scheme one',
              attributes: {
                'data-sequence-number': 1
              }
            },
            {
              value: 2,
              text: 'Scheme two',
              attributes: {
                'data-sequence-number': 25
              }
            }
          ]
        }
      )
    })
  })

  describe('POST /edit-sequence', () => {
    const getRoute = () => routes.find(x =>
      x.method === 'POST' && x.path === '/edit-sequence'
    )

    test('shows an error when sequence number is not an integer', async () => {
      const request = {
        payload: {
          schemeId: '2',
          sequenceNumber: '1.5'
        }
      }

      await getRoute().options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'sequence/edit-sequence',
        {
          sequences,
          schemeItems: [
            {
              value: '',
              text: ''
            },
            {
              value: 1,
              text: 'Scheme one',
              selected: false,
              attributes: {
                'data-sequence-number': 1
              }
            },
            {
              value: 2,
              text: 'Scheme two',
              selected: true,
              attributes: {
                'data-sequence-number': 25
              }
            }
          ],
          errorMessage:
                        'Sequence number must be between 1 and 9999',
          sequenceNumber: '1.5',
          selectedSchemeId: '2'
        }
      )
    })

    test('shows an error when sequence number is less than 1', async () => {
      const request = {
        payload: {
          schemeId: '1',
          sequenceNumber: '0'
        }
      }

      await getRoute().options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'sequence/edit-sequence',
        expect.objectContaining({
          errorMessage:
                        'Sequence number must be between 1 and 9999',
          sequenceNumber: '0',
          selectedSchemeId: '1'
        })
      )
    })

    test('shows an error when sequence number is greater than 9999', async () => {
      const request = {
        payload: {
          schemeId: '1',
          sequenceNumber: '10000'
        }
      }

      await getRoute().options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'sequence/edit-sequence',
        expect.objectContaining({
          errorMessage:
                        'Sequence number must be between 1 and 9999',
          sequenceNumber: '10000',
          selectedSchemeId: '1'
        })
      )
    })

    test('shows the confirmation page for a valid sequence number', async () => {
      const request = {
        payload: {
          schemeId: '2',
          sequenceNumber: '123'
        }
      }

      const result = await getRoute().options.handler(request, h)

      expect(getBatchProcessorData).toHaveBeenCalledWith('/sequence')

      expect(h.view).toHaveBeenCalledWith(
        'sequence/confirm-sequence-change',
        {
          schemeId: '2',
          schemeName: 'Scheme two',
          currentSequence: '0025',
          newSequence: '0123'
        }
      )

      expect(result).toEqual({
        view: 'sequence/confirm-sequence-change',
        context: {
          schemeId: '2',
          schemeName: 'Scheme two',
          currentSequence: '0025',
          newSequence: '0123'
        }
      })
    })

    test('accepts the minimum sequence number', async () => {
      const request = {
        payload: {
          schemeId: '1',
          sequenceNumber: '1'
        }
      }

      await getRoute().options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'sequence/confirm-sequence-change',
        expect.objectContaining({
          newSequence: '0001'
        })
      )
    })

    test('accepts the maximum sequence number', async () => {
      const request = {
        payload: {
          schemeId: '1',
          sequenceNumber: '9999'
        }
      }

      await getRoute().options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'sequence/confirm-sequence-change',
        expect.objectContaining({
          newSequence: '9999'
        })
      )
    })
  })

  describe('POST /edit-sequence/confirm', () => {
    test('updates the sequence and redirects to sequence page', async () => {
      const route = routes.find(x =>
        x.method === 'POST' &&
                x.path === '/edit-sequence/confirm'
      )

      const request = {
        payload: {
          schemeId: '2',
          sequenceNumber: '123'
        }
      }

      const result = await route.options.handler(request, h)

      expect(postBatchProcessor).toHaveBeenCalledTimes(1)

      expect(postBatchProcessor).toHaveBeenCalledWith(
        '/update-sequence',
        {
          schemeId: 2,
          next: 123
        }
      )

      expect(h.redirect).toHaveBeenCalledWith('/sequence')

      expect(result).toEqual({
        location: '/sequence'
      })
    })
  })
})
