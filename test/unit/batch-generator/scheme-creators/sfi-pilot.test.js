jest.mock('../../../../app/batch-generator/scheme-creators/helpers', () => ({
  buildBatch: jest.fn(),
  pad: jest.fn((value, size) => String(value).padStart(size, '0')),
  dateString: jest.fn((date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
}))

const { createSFIP } = require('../../../../app/batch-generator/scheme-creators')
const { buildBatch, pad, dateString } = require('../../../../app/batch-generator/scheme-creators/helpers')

describe('create SFI Pilot batch contents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls buildBatch with the expected arguments', () => {
    const ctx = {
      sequence: 42
    }

    buildBatch.mockReturnValue('batch-result')

    const result = createSFIP(ctx)

    expect(result).toBe('batch-result')
    expect(buildBatch).toHaveBeenCalledTimes(1)
    expect(buildBatch).toHaveBeenCalledWith(
      ctx,
      'SITIELM',
      'SFIP',
      '0042',
      'SFIP',
      expect.any(Function)
    )
  })

  test('buildBatch callback maps a record into the expected SFI Pilot rows', () => {
    const ctx = { sequence: 7 }

    buildBatch.mockImplementation((context, prefix, schemeName, sequence, source, mapper) => {
      return mapper({
        invoiceNumber: 12,
        requestNumber: 7,
        invoiceValue: 123.45,
        frn: 'FRN123',
        deliveryBody: 'DB1',
        schemeYear: 2024
      })
    })

    const result = createSFIP(ctx)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)

    expect(result[0]).toBe(
      'H^SFIP0000012^07^S0000012^2^FRN123^GBP^123.45^DB1^GBP^SFIP^Q4'
    )
    expect(result[1]).toBe(
      'L^SFIP0000012^123.45^2024^80001^DRD10^S000000FRN123^DB1^N^1^G00 - Gross value of claim^2024-12-01^2024-12-01^SOS270'
    )

    expect(pad).toHaveBeenCalledWith(7, 4)
    expect(pad).toHaveBeenCalledWith(12, 7)
    expect(pad).toHaveBeenCalledWith(7, 2)
    expect(dateString).toHaveBeenCalledWith(new Date(2024, 11, 1))
  })

  test('returns the exact value produced by buildBatch', () => {
    const ctx = { sequence: 99 }
    const expected = { batchId: 'SFIP-099' }

    buildBatch.mockReturnValue(expected)

    const result = createSFIP(ctx)

    expect(result).toBe(expected)
  })
})
