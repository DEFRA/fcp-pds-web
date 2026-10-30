jest.mock('../../../../app/batch-generator/scheme-creators/helpers', () => ({
  buildBatch: jest.fn(),
  pad: jest.fn((value, size) => String(value).padStart(size, '0')),
  lastDigits: jest.fn((value, size) => String(value).slice(-size))
}))

const { createCOHTC } = require('../../../../app/batch-generator/scheme-creators')
const { buildBatch, pad, lastDigits } = require('../../../../app/batch-generator/scheme-creators/helpers')

describe('create COHT capital batch contents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls buildBatch with the expected arguments', () => {
    const ctx = { sequence: 42 }

    buildBatch.mockReturnValue('batch-result')

    const result = createCOHTC(ctx)

    expect(result).toBe('batch-result')
    expect(buildBatch).toHaveBeenCalledTimes(1)
    expect(buildBatch).toHaveBeenCalledWith(
      ctx,
      'SITICOHTC',
      'SITICOHTC',
      '0042',
      'SITICOHTC',
      expect.any(Function)
    )
  })

  test('buildBatch callback maps a requestNumber 1 record into the expected COHTC rows', () => {
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

    const result = createCOHTC(ctx)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)

    expect(result[0]).toBe(
      'H^SITICOHTC0000012^01^Z34567890^1^1234567890^GBP^123.45^DB1^GBP^SITICOHTC^'
    )
    expect(result[1]).toBe(
      'L^SITICOHTC0000012^123.45^2024^80201^DRD10^Z34567890^DB1^N^1^G00 - Gross value of claim^SOS270'
    )

    expect(pad).toHaveBeenCalledWith(ctx.sequence, 4)
    expect(pad).toHaveBeenCalledWith(12, 7)
    expect(pad).toHaveBeenCalledWith(1, 2)
    expect(lastDigits).toHaveBeenCalledWith('1234567890', 8)
  })

  test('buildBatch callback uses requestNumber 2 when requestNumber is not 1', () => {
    const ctx = { sequence: 7 }

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

    const result = createCOHTC(ctx)

    expect(result[0]).toBe(
      'H^SITICOHTC0000008^02^Z76543210^2^9876543210^GBP^99.99^DB2^GBP^SITICOHTC^'
    )
    expect(result[1]).toBe(
      'L^SITICOHTC0000008^99.99^2025^80201^DRD10^Z76543210^DB2^N^1^G00 - Gross value of claim^SOS270'
    )
  })
})
