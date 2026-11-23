describe('cookies.js', () => {
  let mockAcceptButton
  let mockRejectButton
  let mockAcceptedBanner
  let mockRejectedBanner
  let mockQuestionBanner
  let mockCookieBanner
  let mockCookieContainer
  let mockHideButtons

  beforeEach(() => {
    // Mock DOM elements
    mockHideButtons = [
      {
        addEventListener: jest.fn()
      },
      {
        addEventListener: jest.fn()
      }
    ]

    mockAcceptButton = {
      addEventListener: jest.fn()
    }

    mockRejectButton = {
      addEventListener: jest.fn()
    }

    mockAcceptedBanner = {
      addEventListener: jest.fn(),
      removeAttribute: jest.fn(),
      setAttribute: jest.fn(),
      focus: jest.fn(),
      querySelector: jest.fn(() => mockHideButtons[0])
    }

    mockRejectedBanner = {
      addEventListener: jest.fn(),
      removeAttribute: jest.fn(),
      setAttribute: jest.fn(),
      focus: jest.fn(),
      querySelector: jest.fn(() => mockHideButtons[1])
    }

    mockQuestionBanner = {
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    mockCookieBanner = {
      setAttribute: jest.fn()
    }

    mockCookieContainer = {
      style: {
        display: 'none'
      }
    }

    // Mock document.querySelector
    const querySelectorMap = {
      '.js-cookies-button-accept': mockAcceptButton,
      '.js-cookies-button-reject': mockRejectButton,
      '.js-cookies-accepted': mockAcceptedBanner,
      '.js-cookies-rejected': mockRejectedBanner,
      '.js-question-banner': mockQuestionBanner,
      '.js-cookies-banner': mockCookieBanner,
      '.js-cookies-container': mockCookieContainer
    }

    global.document = {
      querySelector: jest.fn((selector) => querySelectorMap[selector])
    }

    // Mock XMLHttpRequest
    global.XMLHttpRequest = jest.fn(() => ({
      open: jest.fn(),
      setRequestHeader: jest.fn(),
      send: jest.fn()
    }))
  })

  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('initializes cookie container as visible', () => {
    require('../../../app/frontend/js/cookies')

    expect(mockCookieContainer.style.display).toBe('block')
    expect(global.XMLHttpRequest).not.toHaveBeenCalled()
  })

  test('accept button triggers showBanner with acceptedBanner', () => {
    require('../../../app/frontend/js/cookies')

    const acceptCallback = mockAcceptButton.addEventListener.mock.calls.find(
      call => call[0] === 'click'
    )[1]

    const event = { preventDefault: jest.fn() }
    acceptCallback(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockQuestionBanner.setAttribute).toHaveBeenCalledWith('hidden', 'hidden')
    expect(mockAcceptedBanner.removeAttribute).toHaveBeenCalledWith('hidden')
  })

  test('reject button triggers showBanner with rejectedBanner', () => {
    require('../../../app/frontend/js/cookies')

    const rejectCallback = mockRejectButton.addEventListener.mock.calls.find(
      call => call[0] === 'click'
    )[1]

    const event = { preventDefault: jest.fn() }
    rejectCallback(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockQuestionBanner.setAttribute).toHaveBeenCalledWith('hidden', 'hidden')
    expect(mockRejectedBanner.removeAttribute).toHaveBeenCalledWith('hidden')
  })

  test.each([
    ['accepted', 0],
    ['rejected', 1]
  ])('hide button on the %s banner closes the cookie banner', (_choice, buttonIndex) => {
    require('../../../app/frontend/js/cookies')

    const banner = buttonIndex === 0 ? mockAcceptedBanner : mockRejectedBanner
    expect(banner.querySelector).toHaveBeenCalledWith('.js-hide')

    const hideCallback = mockHideButtons[buttonIndex].addEventListener.mock.calls.find(
      call => call[0] === 'click'
    )[1]

    hideCallback()

    expect(mockCookieBanner.setAttribute).toHaveBeenCalledWith('hidden', 'hidden')
  })

  test.each([
    ['accept', true],
    ['reject', false]
  ])('submits the %s preference via POST request', (_choice, analytics) => {
    const xhrMock = {
      open: jest.fn(),
      setRequestHeader: jest.fn(),
      send: jest.fn()
    }

    global.XMLHttpRequest = jest.fn(() => xhrMock)

    require('../../../app/frontend/js/cookies')

    const button = analytics ? mockAcceptButton : mockRejectButton
    const clickHandler = button.addEventListener.mock.calls.find(
      call => call[0] === 'click'
    )[1]

    clickHandler({ preventDefault: jest.fn() })

    expect(xhrMock.open).toHaveBeenCalledWith('POST', '/cookies', true)
    expect(xhrMock.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    expect(xhrMock.send).toHaveBeenCalledTimes(1)
    expect(xhrMock.send).toHaveBeenCalledWith(
      JSON.stringify({
        analytics,
        async: true
      })
    )
  })

  test('sets focus on banner after showing', () => {
    require('../../../app/frontend/js/cookies')

    const acceptCallback = mockAcceptButton.addEventListener.mock.calls.find(
      call => call[0] === 'click'
    )[1]

    acceptCallback({ preventDefault: jest.fn() })

    expect(mockAcceptedBanner.setAttribute).toHaveBeenCalledWith('tabindex', '-1')
    expect(mockAcceptedBanner.focus).toHaveBeenCalled()
  })

  test('removes tabindex from banner on blur', () => {
    require('../../../app/frontend/js/cookies')

    const acceptCallback = mockAcceptButton.addEventListener.mock.calls.find(
      call => call[0] === 'click'
    )[1]

    acceptCallback({ preventDefault: jest.fn() })

    const blurCallback = mockAcceptedBanner.addEventListener.mock.calls.find(
      call => call[0] === 'blur'
    )[1]

    blurCallback()

    expect(mockAcceptedBanner.removeAttribute).toHaveBeenCalledWith('tabindex')
  })
})
