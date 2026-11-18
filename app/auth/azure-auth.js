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
    prompt: 'select_account', // Force the MS account select dialog
    redirectUri: config.authConfig.redirectUrl,
    scopes: AUTH_SCOPES
  }

  return msalClientApplication.getAuthCodeUrl(authCodeUrlParameters)
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

    console.log('PDS AUTH ROLE DEBUG', {
      hasIdTokenClaims: Boolean(token.idTokenClaims),
      roles,
      recognisedRoles: Object.values(permissions),
      hasPdsRole: hasPdsRole(roles)
    })

    if (!hasPdsRole(roles)) {
      const error = new Error(
        'Authenticated account has no recognised PDS roles'
      )
      error.code = 'NO_PDS_ROLES'
      throw error
    }

    cookieAuth.set({
      scope: roles,
      account: token.account
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
    const token = await msalClientApplication.acquireTokenSilent({
      account,
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
      account: token.account
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

const logout = async (account) => {
  try {
    await msalClientApplication.getTokenCache().removeAccount(account)
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
