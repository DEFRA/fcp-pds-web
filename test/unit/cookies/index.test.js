jest.mock('../../../app/config', () => ({
  cookieOptions: { path: '/', ttl: 365 * 24 * 60 * 60 * 1000 }
}))

const { getCurrentPolicy, updatePolicy } = require('../../../app/cookies/index')

describe('cookies policy', () => {
  const mockConfig = { path: '/', ttl: 365 * 24 * 60 * 60 * 1000 }

  let mockH

  beforeEach(() => {
    mockH = {
      state: jest.fn(),
      unstate: jest.fn()
    }
  })

  describe('getCurrentPolicy', () => {
    test('returns existing policy from state', () => {
      const request = { state: { cookies_policy: { analytics: true, confirmed: true, essential: true } } }
      const result = getCurrentPolicy(request, mockH)
      expect(result).toEqual({ analytics: true, confirmed: true, essential: true })
    })

    test('creates default policy when none exists', () => {
      const request = { state: {} }
      const result = getCurrentPolicy(request, mockH)
      expect(result).toEqual({ confirmed: false, essential: true, analytics: false })
      expect(mockH.state).toHaveBeenCalledWith('cookies_policy', expect.objectContaining({ analytics: false }), mockConfig)
    })
  })

  describe('updatePolicy', () => {
    test('updates analytics to true on existing policy', () => {
      const request = { state: { cookies_policy: { analytics: false, confirmed: false, essential: true } } }
      updatePolicy(request, mockH, true)
      expect(mockH.state).toHaveBeenCalledWith(
        'cookies_policy',
        expect.objectContaining({ analytics: true, confirmed: true }),
        mockConfig
      )
      expect(mockH.unstate).not.toHaveBeenCalled()
    })

    test('updates analytics to false and unstates GA cookies', () => {
      const request = { state: { cookies_policy: { analytics: true, confirmed: false, essential: true } } }
      updatePolicy(request, mockH, false)
      expect(mockH.unstate).toHaveBeenCalledWith('_ga')
      expect(mockH.unstate).toHaveBeenCalledWith('_gid')
    })

    test('creates default policy when none exists before updating', () => {
      const request = { state: {} }
      updatePolicy(request, mockH, true)
      expect(mockH.state).toHaveBeenCalledTimes(2)
    })
  })
})
