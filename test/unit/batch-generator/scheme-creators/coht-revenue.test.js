jest.mock('../../../../app/batch-generator/scheme-creators/helpers', () => ({
  buildBatch: jest.fn(),
  pad: jest.fn((value, size) => String(value).padStart(size, '0')),
  lastDigits: jest.fn((value, size) => String(value).slice(-size)),
  dateString: jest.fn((date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
}))

const { createCOHTR } = require('../../../../app/batch-generator/scheme-creators')
const { buildBatch, pad, lastDigits, dateString } = require('../../../../app/batch-generator/scheme-creators/helpers')

describe('create COHT revenue batch contents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls buildBatch with the expected arguments', () => {
    const ctx = { sequence: 42 }

    buildBatch.mockReturnValue('batch-result')

    const result = createCOHTR(ctx)

    expect(result).toBe('batch-result')
    expect(buildBatch).toHaveBeenCalledTimes(1)
    expect(buildBatch).toHaveBeenCalledWith(
      ctx,
      'ESFIO',
      'COHTR',
      '0042',
      'COHTR',
      expect.any(Function)
    )
  })

  test('buildBatch callback maps a requestNumber 1 record into the expected COHTR rows', () => {
    const ctx = { sequence: 7 }

    buildBatch.mockImplementation((context, prefix, schemeName, sequence, source, mapper) => {
      return mapper({
        invoiceNumber: 12,
        requestNumber: 1,
        invoiceValue: 123.45,
        frn: '1234567890',
        deliveryBody: 'DB1',
        schemeYear: 2024
      })
    })

    const result = createCOHTR(ctx)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)

    expect(result[0]).toBe(
      'H^ESFIO0000012^01^Z34567890^1^1234567890^GBP^123.45^DB1^GBP^COHTR^Q4'
    )
    expect(result[1]).toBe(
      'L^ESFIO0000012^123.45^2024^80201^DRD10^Z34567890^DB1^N^1^G00 - Gross value of claim^2024-12-01^2024-12-01^SOS270'
    )

    expect(pad).toHaveBeenCalledWith(7, 4)
    expect(pad).toHaveBeenCalledWith(12, 7)
    expect(pad).toHaveBeenCalledWith(1, 2)
    expect(lastDigits).toHaveBeenCalledWith('1234567890', 8)
    expect(dateString).toHaveBeenCalledWith(new Date(2024, 11, 1))
  })

  test('buildBatch callback uses requestNumber 2 when requestNumber is not 1', () => {
    const ctx = { sequence: 9 }

    buildBatch.mockImplementation((context, prefix, schemeName, sequence, source, mapper) => {
      return mapper({
        invoiceNumber: 8,
        requestNumber: 2,
        invoiceValue: 99.99,
        frn: '9876543210',
        deliveryBody: 'DB2',
        schemeYear: 2025
      })
    })

    const result = createCOHTR(ctx)

    expect(result[0]).toBe(
      'H^ESFIO0000008^02^Z76543210^2^9876543210^GBP^99.99^DB2^GBP^COHTR^Q4'
    )
    expect(result[1]).toBe(
      'L^ESFIO0000008^99.99^2025^80201^DRD10^Z76543210^DB2^N^1^G00 - Gross value of claim^2025-12-01^2025-12-01^SOS270'
    )
  })
})
