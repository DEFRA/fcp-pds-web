jest.mock('../../../../app/config', () => ({
  get: jest.fn().mockReturnValue(['example.com', ' @COMPANY.COM ', 'approved.org'])
}))

const config = require('../../../../app/config')
const { isEmailBlocked } = require('../../../../app/alerts/validation')

const ERROR_MSG =
  'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'

describe('isEmailBlocked', () => {
  test('reads the approved domains from config', () => {
    expect(config.get).toHaveBeenCalledWith('approvedEmailDomains')
  })

  test.each([null, undefined, 123, {}, '', '   '])(
    'throws error for invalid input: %p',
    (input) => {
      expect(() => isEmailBlocked(input)).toThrow(ERROR_MSG)
    }
  )

  test.each([
    'user@example.com',
    'user@company.com',
    'someone@approved.org',
    'USER@EXAMPLE.COM',
    ' user@company.com  '
  ])('does not throw for approved email: %s', (email) => {
    expect(() => isEmailBlocked(email)).not.toThrow()
  })

  test.each(['user@notapproved.com', 'user@unknown.org', 'user@sub.example.com', 'user@example.com.other.org', 'user@.com'])(
    'throws error for unapproved domain: %s',
    (email) => {
      expect(() => isEmailBlocked(email)).toThrow(ERROR_MSG)
    }
  )

  test.each(['user@', 'user'])(
    'throws error when no domain can be extracted: %s',
    (email) => {
      expect(() => isEmailBlocked(email)).toThrow(ERROR_MSG)
    }
  )
})
