const environments = require('../../../app/constants/environments')

describe('environments', () => {
  test('exports DEVELOPMENT constant', () => {
    expect(environments.DEVELOPMENT).toBe('development')
  })

  test('exports TEST constant', () => {
    expect(environments.TEST).toBe('test')
  })

  test('exports PRODUCTION constant', () => {
    expect(environments.PRODUCTION).toBe('production')
  })

  test('exports all expected keys', () => {
    const keys = Object.keys(environments)
    expect(keys).toHaveLength(3)
    expect(keys).toContain('DEVELOPMENT')
    expect(keys).toContain('TEST')
    expect(keys).toContain('PRODUCTION')
  })

  test('has unique values', () => {
    const values = Object.values(environments)
    const uniqueValues = new Set(values)
    expect(uniqueValues.size).toBe(values.length)
  })
})
