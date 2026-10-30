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

const { createLS } = require('../../../../app/batch-generator/scheme-creators')
const { buildBatch, pad, dateString } = require('../../../../app/batch-generator/scheme-creators/helpers')

describe('create Lump Sums batch contents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls buildBatch with the expected arguments', () => {
    const ctx = {
      sequence: 42
    }

    buildBatch.mockReturnValue('batch-result')

    const result = createLS(ctx)

    expect(result).toBe('batch-result')
    expect(buildBatch).toHaveBeenCalledTimes(1)
    expect(buildBatch).toHaveBeenCalledWith(
      ctx,
      'SITILSES',
      'LSES',
      ctx.sequence,
      'LSES',
      expect.any(Function)
    )
  })

  test('buildBatch callback maps a record into the expected Lump Sums rows', () => {
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

    const result = createLS(ctx)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)

    expect(result[0]).toBe(
      'H^LSES0000012^007^L0000012^FRN123^1^123.45^DB1^GBP'
    )
    expect(result[1]).toBe(
      'L^LSES0000012^123.45^2024^10570^DOM10^DB1^1^G00 - Gross value of claim^2024-11-01'
    )

    expect(pad).toHaveBeenCalledWith(12, 7)
    expect(pad).toHaveBeenCalledWith(7, 3)
    expect(dateString).toHaveBeenCalledWith(new Date(2024, 10, 1))
  })

  test('returns the exact value produced by buildBatch', () => {
    const ctx = { sequence: 99 }
    const expected = { batchId: 'LS-099' }

    buildBatch.mockReturnValue(expected)

    const result = createLS(ctx)

    expect(result).toBe(expected)
  })
})
