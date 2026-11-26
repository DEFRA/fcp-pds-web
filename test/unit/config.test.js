jest.mock('../../app/config/storage', () => ({}))

const { EMAIL_DOMAIN_NOT_ALLOWED } = require('../../app/constants/validation-errors')

describe('approvedEmailDomains', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test.each([
    ['example.com', ['example.com']],
    [' @EXAMPLE.COM ', ['@EXAMPLE.COM']],
    ['example.com;example.org', ['example.com', 'example.org']],
    ['example.com,example.org', ['example.com', 'example.org']],
    ['example.com;example.org,example.net', ['example.com', 'example.org', 'example.net']],
    ['example.com;;example.org', ['example.com', 'example.org']],
    ['example.com;example.com', ['example.com', 'example.com']],
    [' ;, ; ', []],
    ['   ', []],
    ['', []],
    [undefined, []]
  ])('parses %p as %p and enforces the allowlist', (value, expected) => {
    const env = { ...process.env }
    if (value === undefined) {
      delete env.APPROVED_EMAIL_DOMAINS
    } else {
      env.APPROVED_EMAIL_DOMAINS = value
    }
    jest.replaceProperty(process, 'env', env)

    jest.isolateModules(() => {
      const config = require('../../app/config')
      const { isEmailBlocked } = require('../../app/alerts/validation/is-email-blocked')

      expect(config.get('approvedEmailDomains')).toEqual(expected)
      for (const domain of expected) {
        const address = `user@${domain.replace(/^@/, '').toLowerCase()}`
        expect(() => isEmailBlocked(address)).not.toThrow()
      }
      expect(() => isEmailBlocked('user@sub.example.com')).toThrow(EMAIL_DOMAIN_NOT_ALLOWED)
      if (expected.length === 0) {
        expect(() => isEmailBlocked('user@example.com')).toThrow(EMAIL_DOMAIN_NOT_ALLOWED)
      }
    })
  })
})
