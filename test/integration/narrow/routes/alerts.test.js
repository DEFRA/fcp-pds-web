jest.mock('../../../../app/alerts/get-alert-recipient-view-data', () => ({
  ...jest.requireActual('../../../../app/alerts/get-alert-recipient-view-data'),
  getAlertRecipientViewData: jest.fn()
}))

jest.mock('../../../../app/alerts/update-alert-user', () => ({
  updateAlertUser: jest.fn()
}))

jest.mock('../../../../app/alerts', () => ({
  getAlertsByScheme: jest.fn(),
  getAlertRecipientViewData: jest.requireMock('../../../../app/alerts/get-alert-recipient-view-data').getAlertRecipientViewData,
  getAlertRemoveViewData: jest.fn(),
  updateAlertUser: jest.requireMock('../../../../app/alerts/update-alert-user').updateAlertUser,
  removeAlertUser: jest.fn()
}))

jest.mock('../../../../app/helpers', () => ({
  getSchemes: jest.fn()
}))

jest.mock('../../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

jest.mock('ffc-pay-schemes', () => ({
  getSchemeNameFromSchemeId: jest.fn((schemeId) => {
    if (schemeId === 1) return 'Scheme 1'
    return jest.requireActual('../../../../app/constants/unknown')
  })
}))

const {
  getAlertsByScheme,
  getAlertRecipientViewData,
  getAlertRemoveViewData,
  updateAlertUser,
  removeAlertUser
} = require('../../../../app/alerts')
const { getSchemes } = require('../../../../app/helpers')
const { getAlertingData } = require('../../../../app/api')
const { BAD_GATEWAY, BAD_REQUEST, PRECONDITION_FAILED } = require('../../../../app/constants/http-status-codes')
const routes = require('../../../../app/routes/alerts')

describe('Alerts route handlers', () => {
  let h

  const findRoute = (method, path) => {
    const targetLast = String(path).split('/').filter(Boolean).pop()
    return routes.find((route) => {
      if (route.method !== method) return false
      if (typeof route.path !== 'string') return false
      const routeLast = route.path.split('/').filter(Boolean).pop()
      return routeLast === targetLast
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()

    h = {
      view: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('GET /alerts/manage returns 200 and renders manage view when updated query present', async () => {
    const route = findRoute('GET', '/alerts/manage')
    getAlertingData.mockResolvedValue({
      payload: { contact: { emailAddress: 'user@example.com' } }
    })

    const result = await route.handler({ query: { updated: '123' } }, h)

    expect(getAlertingData).toHaveBeenCalledWith('/contact/123')
    expect(h.view).toHaveBeenCalledWith('alerts/manage', {
      cards: expect.any(Array),
      updated: '123',
      emailAddress: 'user@example.com'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/manage-by-scheme returns 200 and renders scheme management view', async () => {
    const route = findRoute('GET', '/alerts/manage-by-scheme')
    const schemes = {
      payload: {
        paymentSchemes: [{ schemeId: 'S1', name: 'Scheme 1' }]
      }
    }
    getSchemes.mockResolvedValue(schemes)

    const result = await route.handler({}, h)

    expect(getSchemes).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith('alerts/manage-by-scheme', {
      schemes,
      schemeName: undefined,
      emailAddress: undefined
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/by-scheme without schemeId returns precondition failure view', async () => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = [{ schemeId: 'S1', name: 'Scheme 1' }]
    getSchemes.mockReturnValue(schemes)

    const result = await route.handler({ query: {} }, h)

    expect(getSchemes).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      error: 'Select a scheme',
      data: undefined
    })
    expect(h.code).toHaveBeenCalledWith(PRECONDITION_FAILED)
    expect(result).toBe(h)
  })

  test.each([
    ['without a success message', {}, undefined],
    ['with a success message', { success: 'true', emailAddress: 'user@example.com' }, 'user@example.com will now receive email alerts for Scheme 1.']
  ])('GET /alerts/by-scheme renders the scheme alerts view %s', async (_description, query, successMessage) => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = [{ schemeId: 'S1', name: 'Scheme 1' }]

    getSchemes.mockReturnValue(schemes)
    getAlertsByScheme.mockResolvedValue({
      schemeName: 'Scheme 1',
      formattedTypes: [{ displayType: 'Payment alert', users: [] }]
    })

    const result = await route.handler({ query: { schemeId: 'S1', ...query } }, h)

    expect(getSchemes).toHaveBeenCalled()
    expect(getAlertsByScheme).toHaveBeenCalledWith('S1')
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      types: [{ displayType: 'Payment alert', users: [] }],
      schemeName: 'Scheme 1',
      schemeId: 'S1',
      successMessage
    })
    expect(result).toBe(h)
  })

  test.each([
    ['an API error', { data: { payload: { message: 'Lookup failed' } } }, 'Lookup failed'],
    ['a plain error', new Error('Lookup unavailable'), 'Lookup unavailable']
  ])('GET /alerts/by-scheme returns precondition failure for %s', async (_description, error, message) => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = [{ schemeId: 'S1', name: 'Scheme 1' }]

    getSchemes.mockReturnValue(schemes)
    getAlertsByScheme.mockRejectedValue(error)

    const result = await route.handler({ query: { schemeId: 'S1' } }, h)

    expect(getSchemes).toHaveBeenCalled()
    expect(getAlertsByScheme).toHaveBeenCalledWith('S1')
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      error: message,
      schemeId: 'S1',
      data: undefined
    })
    expect(h.code).toHaveBeenCalledWith(PRECONDITION_FAILED)
    expect(result).toBe(h)
  })

  test('GET /alerts/information returns 200 and renders alert descriptions', async () => {
    const route = findRoute('GET', '/alerts/information')
    const fakeAlertDescriptions = [{
      id: 'desc1',
      type: 'PAYMENT_ALERT',
      description: [
        'This alert triggers on payment issues.'
      ]
    }]

    getAlertingData.mockResolvedValue({
      payload: { alertDescriptions: fakeAlertDescriptions }
    })

    const result = await route.handler({}, h)

    expect(getAlertingData).toHaveBeenCalledWith('/alert-descriptions')
    expect(h.view).toHaveBeenCalledWith('alerts/information', {
      alertDescriptions: fakeAlertDescriptions
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/update loads alert recipient data for an existing contact', async () => {
    const route = findRoute('GET', '/alerts/update')
    const viewData = {
      schemesPayload: [],
      alertTypesPayload: ['PAYMENT_ALERT'],
      contactId: '123',
      emailAddress: 'user@example.com'
    }
    getAlertRecipientViewData.mockResolvedValue(viewData)

    const request = {
      query: {
        action: 'edit',
        contactId: '123'
      }
    }

    const result = await route.handler(request, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request, {
      loadContact: true
    })
    expect(h.view).toHaveBeenCalledWith('alerts/update', {
      ...viewData,
      action: 'edit',
      error: null,
      successMessage: undefined
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/update renders the create form when the recipient is not found', async () => {
    const route = findRoute('GET', '/alerts/update')
    const viewData = {
      schemesPayload: [],
      alertTypesPayload: ['PAYMENT_ALERT'],
      selectedAlerts: {
        PAYMENT_ALERT: {}
      },
      contactId: undefined,
      emailAddress: 'missing@example.com'
    }

    getAlertRecipientViewData.mockResolvedValue(viewData)

    const request = {
      query: {
        action: 'edit',
        emailAddress: 'missing@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request, {
      loadContact: true
    })

    expect(h.view).toHaveBeenCalledWith('alerts/update', {
      ...viewData,
      action: 'create',
      error: null,
      successMessage: undefined
    })

    expect(h.redirect).not.toHaveBeenCalled()
    expect(result).toBe(h)
  })

  test('GET /alerts/add-recipient-by-scheme renders the add recipient view', async () => {
    const route = findRoute('GET', '/alerts/add-recipient-by-scheme')
    const viewData = {
      schemesPayload: [{ schemeId: 1, name: 'Scheme 1' }],
      schemeId: '1',
      alertTypesPayload: ['PAYMENT_ALERT']
    }
    getAlertRecipientViewData.mockResolvedValue(viewData)

    const result = await route.handler({ query: { schemeId: '1' } }, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith({ query: { schemeId: '1' } })
    expect(h.view).toHaveBeenCalledWith('alerts/add-recipient-by-scheme', {
      ...viewData,
      action: 'create',
      error: null,
      schemeName: 'Scheme 1',
      pageTitle: 'Add new alert recipient for Scheme 1',
      formAction: '/alerts/add-recipient-by-scheme-confirm'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/confirm-delete with valid query renders confirm view', async () => {
    const route = findRoute('GET', '/alerts/confirm-delete')
    getAlertRemoveViewData.mockResolvedValue({
      contactId: '123',
      emailAddress: 'test@example.com'
    })

    const request = {
      query: { contactId: '123', emailAddress: 'test@example.com' }
    }

    const result = await route.handler(request, h)

    expect(getAlertRemoveViewData).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith('alerts/confirm-delete', {
      contactId: '123',
      emailAddress: 'test@example.com'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/confirm-delete without query still renders confirm route', async () => {
    const route = findRoute('GET', '/alerts/confirm-delete')
    getAlertRemoveViewData.mockResolvedValue({
      contactId: undefined,
      emailAddress: undefined
    })

    const request = { query: {} }

    const result = await route.handler(request, h)

    expect(getAlertRemoveViewData).toHaveBeenCalledWith(request)
    expect(result).toBe(h)
  })

  test('GET /alerts/manage-by-recipient returns a recipient management view with updated contact info', async () => {
    const route = findRoute('GET', '/alerts/manage-by-recipient')
    getAlertingData.mockResolvedValue({
      payload: { contact: { emailAddress: 'user@example.com' } }
    })

    const result = await route.handler({ query: { updated: '123', removed: '456' } }, h)

    expect(getAlertingData).toHaveBeenCalledWith('/contact/123')
    expect(h.view).toHaveBeenCalledWith('alerts/manage-by-recipient', {
      cards: expect.any(Array),
      updated: '123',
      removed: '456',
      emailAddress: 'user@example.com'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/update-by-recipient renders a search view with validation error when email is supplied', async () => {
    const route = findRoute('GET', '/alerts/update-by-recipient')

    const result = await route.handler({
      query: {
        emailAddress: 'bad@example.com',
        validationError: 'true'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/update-by-recipient', {
      emailAddress: 'bad@example.com',
      error: 'The email address provided is either invalid or not configured to receive alerts'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/remove-by-recipient renders a search view with validation error when email is supplied', async () => {
    const route = findRoute('GET', '/alerts/remove-by-recipient')

    const result = await route.handler({
      query: {
        emailAddress: 'bad@example.com',
        validationError: true
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/remove-by-recipient',
      {
        emailAddress: 'bad@example.com',
        error:
          'The email address provided is either invalid or not configured to receive alerts'
      }
    )
    expect(result).toBe(h)
  })

  test('GET /alerts/remove-by-recipient does not show an error when only email is supplied', async () => {
    const route = findRoute('GET', '/alerts/remove-by-recipient')

    await route.handler({
      query: {
        emailAddress: 'bad@example.com'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/remove-by-recipient',
      {
        emailAddress: 'bad@example.com',
        error: null
      }
    )
  })

  test('POST /alerts/update with action remove calls removeAlertUser and returns its result', async () => {
    const route = findRoute('POST', '/alerts/update')
    removeAlertUser.mockResolvedValue('remove-success')

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'remove',
        contactId: '123',
        emailAddress: 'user@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(removeAlertUser).toHaveBeenCalledWith(
      'TestUser',
      '123',
      'user@example.com',
      h
    )
    expect(result).toBe('remove-success')
  })

  test('POST /alerts/update with non-remove action calls updateAlertUser and returns its result', async () => {
    const route = findRoute('POST', '/alerts/update')
    updateAlertUser.mockResolvedValue('update-success')

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'update',
        contactId: '123',
        emailAddress: 'user@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(updateAlertUser).toHaveBeenCalledWith(
      'TestUser',
      request.payload,
      h,
      '/alerts/update?emailAddress=user%40example.com&success=true&successAction=update&contactId=123'
    )
    expect(result).toBe('update-success')
  })

  test('POST /alerts/update handler catches updateAlertUser errors and renders error view with BAD_REQUEST', async () => {
    const route = findRoute('POST', '/alerts/update')
    const error = new Error('Something went wrong')
    updateAlertUser.mockRejectedValue(error)
    getAlertRecipientViewData.mockResolvedValue({ some: 'viewdata' })

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'update',
        contactId: '123',
        emailAddress: 'user@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith('alerts/update', {
      some: 'viewdata',
      action: 'update',
      error: error.message
    })
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(result).toBe(h)
  })

  test('GET /alerts/manage without updated renders manage view with undefined email', async () => {
    const route = findRoute('GET', '/alerts/manage')

    const result = await route.handler({ query: {} }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/manage', {
      cards: expect.any(Array),
      updated: undefined,
      emailAddress: undefined
    })
    expect(result).toBe(h)
  })

  test('POST /alerts/update with schemeId calls updateAlertUser and constructs success redirect', async () => {
    const route = findRoute('POST', '/alerts/update')
    updateAlertUser.mockResolvedValue('update-success')

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'update',
        schemeId: 'S1',
        emailAddress: 'user@example.com'
      }
    }

    const expectedRedirect = `/alerts/update?emailAddress=${encodeURIComponent(
      'user@example.com'
    )}&success=true&successAction=update`

    const result = await route.handler(request, h)

    expect(updateAlertUser).toHaveBeenCalledWith(
      'TestUser',
      request.payload,
      h,
      expectedRedirect
    )
    expect(result).toBe('update-success')
  })

  test('POST /alerts/update with action remove that errors renders update view with BAD_REQUEST', async () => {
    const route = findRoute('POST', '/alerts/update')
    const error = new Error('Remove failed')
    removeAlertUser.mockRejectedValue(error)
    getAlertRecipientViewData.mockResolvedValue({ some: 'viewdata' })

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'remove',
        contactId: '123',
        emailAddress: 'user@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith('alerts/update', {
      some: 'viewdata',
      action: 'remove',
      error: error.message
    })
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(result).toBe(h)
  })

  test('GET /alerts/update redirects to update path when getAlertRecipientViewData rejects', async () => {
    const route = findRoute('GET', '/alerts/update')

    getAlertRecipientViewData.mockRejectedValue(new Error('update fail'))

    const result = await route.handler({
      query: {
        action: 'edit',
        emailAddress: 'bad@example.com'
      }
    }, h)

    expect(h.redirect).toHaveBeenCalledWith(
      '/alerts/update?emailAddress=bad%40example.com&validationError=true'
    )
    expect(result).toBe(h)
  })

  test('GET /alerts/by-scheme returns no scheme found error for invalid schemeId', async () => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = [{ schemeId: 'S1', name: 'Scheme 1' }]

    getSchemes.mockReturnValue(schemes)

    const result = await route.handler({
      query: {
        schemeId: '999'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/by-scheme',
      {
        error: 'No scheme found for Scheme ID 999',
        schemeId: '999',
        data: undefined
      }
    )

    expect(h.code).toHaveBeenCalledWith(PRECONDITION_FAILED)
    expect(result).toBe(h)
  })

  test('GET /alerts/update builds create success message', async () => {
    const route = findRoute('GET', '/alerts/update')

    getAlertRecipientViewData.mockResolvedValue({
      emailAddress: 'user@example.com'
    })

    await route.handler({
      query: {
        success: 'true',
        successAction: 'create'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        successMessage:
          'user@example.com will now receive the selected email alerts.'
      })
    )
  })

  test('GET /alerts/update builds update success message', async () => {
    const route = findRoute('GET', '/alerts/update')

    getAlertRecipientViewData.mockResolvedValue({
      emailAddress: 'user@example.com'
    })

    await route.handler({
      query: {
        success: 'true',
        successAction: 'edit'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        successMessage:
          'Alerts for user@example.com have been updated.'
      })
    )
  })

  test('POST /alerts/update-confirm renders confirmation view', async () => {
    const route = findRoute('POST', '/alerts/update-confirm')

    getAlertRecipientViewData.mockResolvedValue({
      schemesPayload: [],
      alertTypesPayload: []
    })

    await route.handler({
      payload: {
        contactId: '123',
        emailAddress: 'user@example.com',
        action: 'edit'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update-confirm',
      expect.objectContaining({
        contactId: '123',
        emailAddress: 'user@example.com'
      })
    )
  })

  test('GET /alerts/add-recipient-by-scheme returns a precondition failure for an unknown scheme', async () => {
    const route = findRoute('GET', '/alerts/add-recipient-by-scheme')

    getAlertRecipientViewData.mockResolvedValue({ schemeId: '999' })
    getSchemes.mockReturnValue([])

    const result = await route.handler({ query: { schemeId: '999' } }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/add-recipient-by-scheme', {
      error: 'No scheme found for Scheme ID 999',
      data: undefined
    })
    expect(h.code).toHaveBeenCalledWith(PRECONDITION_FAILED)
    expect(result).toBe(h)
  })

  test('GET /alerts/add-recipient-by-scheme passes validation error through sanitiser', async () => {
    const route = findRoute('GET', '/alerts/add-recipient-by-scheme')

    getAlertRecipientViewData.mockResolvedValue({
      schemesPayload: [{
        schemeId: 1,
        name: 'Scheme 1'
      }],
      schemeId: '1'
    })

    await route.handler({
      query: {
        schemeId: '1',
        validationError: 'Email address is required'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/add-recipient-by-scheme',
      expect.objectContaining({
        error: 'Email address is required'
      })
    )
  })

  test('add recipient by scheme preserves the blocked-domain error when returning to the form', async () => {
    const path = '/alerts/add-recipient-by-scheme'
    const payload = { emailAddress: 'user@example.js', schemeId: '1', 1: 'payment_alert', crumb: 'ignored' }
    const message = 'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    updateAlertUser.mockImplementationOnce((_account, _payload, toolkit, _successPath, errorRedirect) =>
      toolkit.redirect(errorRedirect(new Error(message))).takeover()
    )
    getAlertRecipientViewData.mockResolvedValueOnce({ emailAddress: payload.emailAddress, schemeId: payload.schemeId })

    await findRoute('POST', path).handler({ payload }, h)

    expect(h.takeover).toHaveBeenCalledTimes(1)
    const redirect = new URL(h.redirect.mock.calls[0][0], 'http://localhost')
    expect(redirect.pathname).toBe(path)
    expect(redirect.searchParams.has('crumb')).toBe(false)
    expect(redirect.searchParams.get('1')).toBe('payment_alert')

    await findRoute('GET', path).handler({ query: Object.fromEntries(redirect.searchParams) }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/add-recipient-by-scheme', expect.objectContaining({
      emailAddress: payload.emailAddress,
      error: message
    }))
  })

  test('GET /alerts/confirm-delete redirects for NOT_FOUND errors', async () => {
    const route = findRoute('GET', '/alerts/confirm-delete')

    getAlertRemoveViewData.mockRejectedValue({
      isBoom: true,
      output: {
        statusCode: 404
      }
    })

    const result = await route.handler({
      query: {
        emailAddress: 'missing@example.com'
      }
    }, h)

    expect(h.redirect).toHaveBeenCalledWith(
      '/alerts/remove-by-recipient?emailAddress=missing%40example.com&validationError=true'
    )

    expect(result).toBe(h)
  })

  test.each([
    ['GET', '/alerts/manage', getAlertingData, { query: { updated: '123' } }],
    ['GET', '/alerts/manage-by-scheme', getSchemes, {}],
    ['GET', '/alerts/information', getAlertingData, {}],
    ['POST', '/alerts/update-confirm', getAlertRecipientViewData, {}],
    ['GET', '/alerts/add-recipient-by-scheme', getAlertRecipientViewData, {}],
    ['GET', '/alerts/confirm-delete', getAlertRemoveViewData, {}],
    ['GET', '/alerts/manage-by-recipient', getAlertingData, { query: { updated: '123' } }]
  ])('%s %s returns a bad gateway error when its dependency fails', async (method, path, dependency, request) => {
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Unavailable')
    dependency.mockImplementationOnce(() => { throw error })

    const result = await findRoute(method, path).handler(request, h)

    expect(result.output.statusCode).toBe(BAD_GATEWAY)
    expect(result.message).toBe('Alerting Service is unavailable: Unavailable')
    expect(logError).toHaveBeenCalledWith('Alerting Service error:', error)
    expect(h.view).not.toHaveBeenCalled()
    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('GET /alerts/information defaults to an empty list without alert descriptions', async () => {
    getAlertingData.mockResolvedValue({ payload: {} })

    const result = await findRoute('GET', '/alerts/information').handler({}, h)

    expect(h.view).toHaveBeenCalledWith('alerts/information', { alertDescriptions: [] })
    expect(result).toBe(h)
  })

  test.each([
    ['remove', { action: 'remove' }, 'A user must be specified to remove'],
    ['edit', { action: 'edit' }, 'Email address is required']
  ])('POST /alerts/update validates the %s payload with the appropriate schema', async (_action, payload, message) => {
    const { validate } = findRoute('POST', '/alerts/update').options

    await expect(validate.payload(payload)).rejects.toThrow(message)
  })

  test.each(['/alerts/update-confirm', '/alerts/update'])('POST %s redirects invalid edit payloads back to the form', async (path) => {
    const { validate } = findRoute('POST', path).options
    const request = { payload: { emailAddress: 'invalid', action: 'edit', crumb: 'ignored' } }

    const result = await validate.failAction(request, h, new Error('Invalid email'))

    expect(h.redirect).toHaveBeenCalledWith('/alerts/update?emailAddress=invalid&action=edit&validationError=Invalid+email')
    expect(h.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe(h)
  })

  test('POST /alerts/update renders a bad request view for an invalid removal', async () => {
    const { validate } = findRoute('POST', '/alerts/update').options
    const request = { payload: { action: 'remove' } }
    const data = { emailAddress: 'user@example.com' }
    getAlertRecipientViewData.mockResolvedValue(data)

    const result = await validate.failAction(request, h, new Error('Missing contact'))

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith('alerts/update', { ...data, action: 'remove', error: 'Missing contact' })
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe(h)
  })

  test.each(['handler', 'failAction'])('POST /alerts/update %s returns a bad gateway if recovery cannot load view data', async (entryPoint) => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const route = findRoute('POST', '/alerts/update')
    const request = { payload: { action: 'remove' } }
    const error = new Error('Removal failed')
    removeAlertUser.mockRejectedValueOnce(error)
    getAlertRecipientViewData.mockRejectedValueOnce(new Error('View data unavailable'))

    const result = entryPoint === 'handler'
      ? await route.handler(request, h)
      : await route.options.validate.failAction(request, h, error)

    expect(result.output.statusCode).toBe(BAD_GATEWAY)
    expect(result.message).toBe('Alerting Service is unavailable: View data unavailable')
    expect(h.view).not.toHaveBeenCalled()
  })

  test('POST /alerts/update-confirm passes scheme and global alerts separately', async () => {
    const route = findRoute('POST', '/alerts/update-confirm')
    getAlertRecipientViewData.mockResolvedValue({ schemesPayload: [{ schemeId: 1, name: 'Scheme 1' }] })

    const result = await route.handler({ payload: { 1: ['payment_alert'], globalAlerts: 'scheme_added' } }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/update-confirm', expect.objectContaining({
      schemes: [{ schemeId: 1, schemeName: 'Scheme 1', alertTypes: ['payment_alert'] }],
      globalAlertTypes: ['scheme_added']
    }))
    expect(result).toBe(h)
  })

  test('POST /alerts/add-recipient-by-scheme-confirm renders the scheme confirmation view', async () => {
    const route = findRoute('POST', '/alerts/add-recipient-by-scheme-confirm')
    const data = { schemesPayload: [{ schemeId: 1, name: 'Scheme 1' }], emailAddress: 'user@example.com' }
    getAlertRecipientViewData.mockResolvedValue(data)

    const result = await route.handler({ payload: { schemeId: 1, 1: 'payment_alert' } }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/add-recipient-by-scheme-confirm', {
      ...data,
      action: 'create',
      pageTitle: 'Check recipient email and alert details before saving',
      formPath: '/alerts/add-recipient-by-scheme',
      formAction: '/alerts/add-recipient-by-scheme',
      schemeId: 1,
      schemeName: 'Scheme 1',
      schemes: [{ schemeId: 1, schemeName: 'Scheme 1', alertTypes: ['payment_alert'] }],
      formatAlertType: expect.any(Function)
    })
    expect(result).toBe(h)
  })

  test.each([
    [{ emailAddress: 'user+alerts@example.com' }, 'user%2Balerts%40example.com'],
    [{}, '']
  ])('POST /alerts/add-recipient-by-scheme passes the success redirect for %p', async (fields, encodedEmail) => {
    const route = findRoute('POST', '/alerts/add-recipient-by-scheme')
    const payload = { schemeId: 'scheme/1', ...fields }
    updateAlertUser.mockResolvedValueOnce(h)

    const result = await route.handler({ payload }, h)

    expect(updateAlertUser).toHaveBeenCalledWith(
      undefined,
      { ...payload, action: 'create' },
      h,
      `/alerts/by-scheme?schemeId=scheme%2F1&emailAddress=${encodedEmail}&success=true`,
      expect.any(Function)
    )
    expect(result).toBe(h)
  })

  test.each([
    [{ emailAddress: 'user+alerts@example.com' }, 'user%2Balerts%40example.com'],
    [{}, '']
  ])('GET /alerts/confirm-delete redirects invalid queries for %p', async (query, encodedEmail) => {
    const { validate } = findRoute('GET', '/alerts/confirm-delete').options

    const result = await validate.failAction({ query }, h)

    expect(h.redirect).toHaveBeenCalledWith(`/alerts/remove-by-recipient?emailAddress=${encodedEmail}&validationError=true`)
    expect(h.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe(h)
  })

  test.each([
    ['/alerts/update', getAlertRecipientViewData, new Error('Recipient unavailable'), '/alerts/update'],
    ['/alerts/confirm-delete', getAlertRemoveViewData, { isBoom: true, output: { statusCode: 404 } }, '/alerts/remove-by-recipient']
  ])('GET %s redirects with an empty email when recipient lookup fails without a query', async (path, lookup, error, redirectPath) => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    lookup.mockRejectedValueOnce(error)

    const result = await findRoute('GET', path).handler({}, h)

    expect(h.redirect).toHaveBeenCalledWith(`${redirectPath}?emailAddress=&validationError=true`)
    expect(result).toBe(h)
  })

  test('GET /alerts/manage-by-recipient renders without a contact lookup when only removed is set', async () => {
    const route = findRoute('GET', '/alerts/manage-by-recipient')

    const result = await route.handler({ query: { removed: 'true' } }, h)

    expect(getAlertingData).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith('alerts/manage-by-recipient', {
      cards: expect.any(Array),
      updated: undefined,
      removed: 'true',
      emailAddress: undefined
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/update-by-recipient renders without an error before validation', async () => {
    const route = findRoute('GET', '/alerts/update-by-recipient')

    const result = await route.handler({ query: { emailAddress: 'user@example.com' } }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/update-by-recipient', {
      emailAddress: 'user@example.com',
      error: null
    })
    expect(result).toBe(h)
  })
})
