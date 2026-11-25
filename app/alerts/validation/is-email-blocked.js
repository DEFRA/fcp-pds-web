const config = require('../../config')
const { EMAIL_DOMAIN_NOT_ALLOWED } = require('../../constants/validation-errors')

const approvedDomainSet = new Set(
  config.get('approvedEmailDomains')
    .map(domain => domain.trim().toLowerCase())
    .map(domain => domain.startsWith('@') ? domain : '@' + domain)
)

const isEmailBlocked = (emailAddress) => {
  const normalizedEmail = typeof emailAddress === 'string' && emailAddress.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error(EMAIL_DOMAIN_NOT_ALLOWED)
  }

  const atIndex = normalizedEmail.lastIndexOf('@')
  const domain = atIndex !== -1 && atIndex < normalizedEmail.length - 1
    ? normalizedEmail.substring(atIndex)
    : null

  if (!domain || !approvedDomainSet.has(domain)) {
    throw new Error(EMAIL_DOMAIN_NOT_ALLOWED)
  }
}

module.exports = {
  isEmailBlocked
}
