const fs = require('fs')
const { getAssetPath } = require('../../../app/helpers/get-asset-path')

describe('getAssetPath', () => {
  let consoleWarnSpy

  beforeEach(() => {
    jest.spyOn(fs, 'existsSync')
    jest.spyOn(fs, 'readdirSync')
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns hashed asset path when file exists', () => {
    fs.existsSync.mockReturnValue(true)
    fs.readdirSync.mockReturnValue(['core.abc123def.css', 'other.css'])

    const result = getAssetPath('core')

    expect(result).toBe('/static/css/core.abc123def.css')
  })

  test('returns default path when asset file not found', () => {
    fs.existsSync.mockReturnValue(true)
    fs.readdirSync.mockReturnValue(['other.hash.css'])

    const result = getAssetPath('core')

    expect(result).toBe('/static/css/core.css')
    expect(consoleWarnSpy).toHaveBeenCalledWith('Asset file not found for: core')
  })

  test('returns default path when dist directory does not exist', () => {
    fs.existsSync.mockReturnValue(false)

    const result = getAssetPath('core')

    expect(result).toBe('/static/css/core')
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Asset directory not found'))
  })

  test('handles multiple hashed assets correctly', () => {
    fs.existsSync.mockReturnValue(true)
    fs.readdirSync.mockReturnValue(['core.abc123.css', 'index.def456.css', 'card.ghi789.css'])

    expect(getAssetPath('core')).toBe('/static/css/core.abc123.css')
    expect(getAssetPath('index')).toBe('/static/css/index.def456.css')
    expect(getAssetPath('card')).toBe('/static/css/card.ghi789.css')
  })

  test('ignores non-css files in search', () => {
    fs.existsSync.mockReturnValue(true)
    fs.readdirSync.mockReturnValue(['core.map', 'core.abc123.css', 'core.backup'])

    const result = getAssetPath('core')

    expect(result).toBe('/static/css/core.abc123.css')
  })
})
