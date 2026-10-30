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

const { createCS } = require('../../../../app/batch-generator/scheme-creators')
const { buildBatch, pad, dateString } = require('../../../../app/batch-generator/scheme-creators/helpers')

describe('create CS batch contents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls buildBatch with the expected arguments', () => {
    const ctx = {
      sequence: 42
    }

    buildBatch.mockReturnValue('batch-result')

    const result = createCS(ctx)

    expect(result).toBe('batch-result')
    expect(buildBatch).toHaveBeenCalledTimes(1)
    expect(buildBatch).toHaveBeenCalledWith(
      ctx,
      'SITICS',
      'SITI AGRI CS SYS',
      ctx.sequence,
      'SITI AGRI CS SYS',
      expect.any(Function)
    )
  })

  test('buildBatch callback maps a record into the expected CS rows', () => {
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

    const result = createCS(ctx)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)

    expect(result[0]).toBe(
      'H^CS000000012^007^A0000012^2^FRN123^GBP^123.45^NE00^GBP'
    )
    expect(result[1]).toBe(
      'L^CS000000012^123.45^2024^5704A^ERD14^A00000FRN123/MT^NE00^N^1^G00 - Gross value of claim^2024-12-01^SOS273'
    )

    expect(pad).toHaveBeenCalledWith(12, 7)
    expect(pad).toHaveBeenCalledWith(7, 3)
    expect(dateString).toHaveBeenCalledWith(new Date(2024, 11, 1))
  })

  test('returns the exact value produced by buildBatch', () => {
    const ctx = { sequence: 99 }
    const expected = { batchId: 'CS-099' }

    buildBatch.mockReturnValue(expected)

    const result = createCS(ctx)

    expect(result).toBe(expected)
  })
})
