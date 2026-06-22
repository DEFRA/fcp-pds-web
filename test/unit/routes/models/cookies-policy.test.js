const ViewModel = require('../../../../app/routes/models/cookies-policy')

describe('cookies-policy ViewModel', () => {
  test('builds model with default values when no policy provided', () => {
    const model = new ViewModel()
    expect(model.analytics.name).toBe('analytics')
    expect(model.updated).toBe(false)
    expect(model.analytics.items[0].checked).toBeUndefined()
    expect(model.analytics.items[1].checked).toBe(true)
  })

  test('builds model with analytics accepted', () => {
    const model = new ViewModel({ analytics: true }, false)
    expect(model.analytics.items[0].checked).toBe(true)
    expect(model.analytics.items[1].checked).toBe(false)
  })

  test('builds model with analytics rejected', () => {
    const model = new ViewModel({ analytics: false }, false)
    expect(model.analytics.items[0].checked).toBe(false)
    expect(model.analytics.items[1].checked).toBe(true)
  })

  test('sets updated flag', () => {
    const model = new ViewModel({}, true)
    expect(model.updated).toBe(true)
  })
})
