jest.mock('../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

jest.mock('../../../app/helpers', () => ({
  getSchemes: jest.fn()
}))

const { getAlertTypesAndSchemes } = require('../../../app/alerts/get-alert-types-and-schemes')
const { getAlertingData } = require('../../../app/api')
const { getSchemes } = require('../../../app/helpers')

describe('getAlertTypesAndSchemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns schemes and alert types when alerting data is present', async () => {
    const schemes = ['scheme-a', 'scheme-b']
    const alertTypes = [
      { id: 'type-1', name: 'Alert type 1' },
      { id: 'type-2', name: 'Alert type 2' }
    ]

    getSchemes.mockReturnValue(schemes)
    getAlertingData.mockResolvedValue({
      payload: {
        alertTypes
      }
    })

    const result = await getAlertTypesAndSchemes()

    expect(getSchemes).toHaveBeenCalledTimes(1)
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(result).toEqual({
      schemes,
      alertTypesPayload: alertTypes
    })
  })

  test.each([
    ['the API response is undefined', undefined],
    ['the API response has no payload', {}],
    ['the payload has no alertTypes', { payload: {} }],
    ['alertTypes is null', { payload: { alertTypes: null } }]
  ])('returns an empty alertTypesPayload when %s', async (_description, response) => {
    const schemes = ['scheme-a']

    getSchemes.mockReturnValue(schemes)
    getAlertingData.mockResolvedValue(response)

    const result = await getAlertTypesAndSchemes()

    expect(result).toEqual({
      schemes,
      alertTypesPayload: []
    })
  })
})
