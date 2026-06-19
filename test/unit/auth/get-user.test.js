const getUser = require('../../../app/auth/get-user')

describe('getUser', () => {
  test('returns userId and username from credentials', () => {
    const request = {
      auth: {
        credentials: {
          account: {
            homeAccountId: 'abc-123',
            name: 'Test User'
          }
        }
      }
    }

    const result = getUser(request)
    expect(result.userId).toBe('abc-123')
    expect(result.username).toBe('Test User')
  })
})
