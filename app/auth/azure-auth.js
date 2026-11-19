const config = require('../config')
const msal = require('@azure/msal-node')
const permissions = require('./permissions')

const AUTH_SCOPES = ['openid', 'profile', 'offline_access']

const hasPdsRole = roles =>
  roles.some(role => Object.values(permissions).includes(role))

const msalLogging = config.isProd
  ? {}
  : {
      loggerCallback (_loglevel, message, _containsPii) {
        console.log(message)
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose
    }

const msalClientApplication = new msal.ConfidentialClientApplication({
  auth: config.authConfig.azure,
  system: { loggerOptions: msalLogging }
})

const getAuthenticationUrl = () => {
  const authCodeUrlParameters = {
    prompt: 'select_account',
    redirectUri: config.authConfig.redirectUrl,
    scopes: AUTH_SCOPES
  }

  return msalClientApplication.getAuthCodeUrl(authCodeUrlParameters)
}

const getSessionAccount = account => ({
  homeAccountId: account.homeAccountId,
  environment: account.environment,
  tenantId: account.tenantId,
  username: account.username,
  localAccountId: account.localAccountId,
  name: account.name
})

const getCachedAccount = async account => {
  if (!account?.homeAccountId) {
    return null
  }

  return msalClientApplication
    .getTokenCache()
    .getAccountByHomeId(account.homeAccountId)
}

const authenticate = async (redirectCode, cookieAuth) => {
  try {
    if (!redirectCode) {
      throw new Error(
        'No authorization code was returned by Microsoft Entra ID'
      )
    }

    const token = await msalClientApplication.acquireTokenByCode({
      code: redirectCode,
      redirectUri: config.authConfig.redirectUrl,
      scopes: AUTH_SCOPES
    })

    if (!token?.account || !token?.idTokenClaims) {
      throw new Error(
        'Microsoft Entra ID returned an incomplete authentication result'
      )
    }

    const roles = token.idTokenClaims.roles || []

    if (!hasPdsRole(roles)) {
      const error = new Error(
        'Authenticated account has no recognised PDS roles'
      )
      error.code = 'NO_PDS_ROLES'
      throw error
    }

    cookieAuth.set({
      scope: roles,
      account: getSessionAccount(token.account)
    })

    return token
  } catch (err) {
    if (err.code !== 'NO_PDS_ROLES') {
      console.error('Failed to authenticate:', {
        name: err?.name,
        errorCode: err?.errorCode,
        errorMessage: err?.errorMessage,
        subError: err?.subError,
        correlationId: err?.correlationId
      })
    }

    throw err
  }
}

const refresh = async (account, cookieAuth, forceRefresh = false) => {
  try {
    const cachedAccount = await getCachedAccount(account)

    if (!cachedAccount) {
      console.warn('Unable to refresh token: account not found in MSAL cache')
      return undefined
    }

    const token = await msalClientApplication.acquireTokenSilent({
      account: cachedAccount,
      scopes: AUTH_SCOPES,
      forceRefresh
    })

    if (!token?.account || !token?.idTokenClaims) {
      throw new Error(
        'Microsoft Entra ID returned an incomplete refresh result'
      )
    }

    const roles = token.idTokenClaims.roles || []

    if (!hasPdsRole(roles)) {
      return undefined
    }

    cookieAuth.set({
      scope: roles,
      account: getSessionAccount(token.account)
    })

    return roles
  } catch (err) {
    console.error('Failed to acquire token on silent refresh:', {
      name: err?.name,
      errorCode: err?.errorCode,
      errorMessage: err?.errorMessage,
      subError: err?.subError,
      correlationId: err?.correlationId
    })

    return undefined
  }
}

const logout = async account => {
  try {
    const cachedAccount = await getCachedAccount(account)

    if (cachedAccount) {
      await msalClientApplication
        .getTokenCache()
        .removeAccount(cachedAccount)
    }
  } catch (err) {
    console.error('Unable to end session', err)
  }
}

module.exports = {
  getAuthenticationUrl,
  authenticate,
  refresh,
  logout
}
