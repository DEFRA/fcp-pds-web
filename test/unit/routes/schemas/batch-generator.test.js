jest.mock('../../../../app/helpers/get-batch-schemes', () => ({
  getBatchSchemes: jest.fn(() => [
    { schemeId: '1', schemeName: 'SFI' },
    { schemeId: '2', schemeName: 'SFI Pilot' },
    { schemeId: '5', schemeName: 'CS' },
    { schemeId: '6', schemeName: 'BPS' },
    { schemeId: '12', schemeName: 'SFI23' }
  ])
}))

const { getSchemeIds } = require('ffc-pay-schemes')
const schema = require('../../../../app/routes/schemas/batch-generator')
const { getBatchSchemes } = require('../../../../app/helpers/get-batch-schemes')

const { CS } = getSchemeIds()
const validSchemeIds = getBatchSchemes().map((scheme) => scheme.schemeId)
const invalidSchemeId = String(Math.max(...validSchemeIds.map(Number)) + 1)

describe('batch-generator schema', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('accepts a valid payload', () => {
    const payload = {
      schemeId: '6',
      sequence: '42',
      numberOfPR: '3',
      value: '100',
      prn: '1',
      invoiceNumber: '123456',
      frn: '1000000000',
      marketingYear: '2024',
      createChecksum: true,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeUndefined()
  })

  test('rejects a schemeId not in getBatchSchemes', () => {
    const payload = {
      schemeId: invalidSchemeId,
      sequence: '1',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '1000000000',
      marketingYear: '2024',
      createChecksum: true,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Select a valid scheme')
  })

  test('rejects sequence values above 9999 for non-CS scheme', () => {
    const payload = {
      schemeId: '6',
      sequence: '10000',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '1000000000',
      marketingYear: '2024',
      createChecksum: false,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Sequence must be between 1 and 9999')
  })

  test('allows sequence values up to 99999 for CS scheme', () => {
    const payload = {
      schemeId: String(CS),
      sequence: '99999',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '1000000000',
      marketingYear: '2024',
      createChecksum: false,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeUndefined()
  })

  test('rejects non-numeric invoiceNumber', () => {
    const payload = {
      schemeId: '6',
      sequence: '1',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: 'ABC',
      frn: '1000000000',
      marketingYear: '2024',
      createChecksum: false,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('First invoice number must contain numbers only')
  })

  test('requires invoiceNumber to be a positive integer', () => {
    const payload = {
      schemeId: '6',
      sequence: '1',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '0',
      frn: '1000000000',
      marketingYear: '2024',
      createChecksum: false,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Invoice number must be a positive integer')
  })

  test('rejects FRN below the minimum', () => {
    const payload = {
      schemeId: '6',
      sequence: '1',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '999999999',
      marketingYear: '2024',
      createChecksum: false,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('FRN must be 10 digits')
  })

  test('rejects FRN above the max based on numberOfPR', () => {
    const payload = {
      schemeId: '6',
      sequence: '1',
      numberOfPR: '50',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '9999999999',
      marketingYear: '2024',
      createChecksum: false,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('FRN must be between 1000000000 and 9999999950')
  })

  test('requires FRN to be exactly 10 digits', () => {
    const payload = {
      schemeId: '6',
      sequence: '1',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '123456789',
      marketingYear: '2024',
      createChecksum: false,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('FRN must be 10 digits')
  })

  test('rejects marketingYear outside the valid range', () => {
    const payload = {
      schemeId: '6',
      sequence: '1',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '1000000000',
      marketingYear: '1992',
      createChecksum: false,
      createControl: false
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Marketing year must be between 1993 and 2099')
  })

  test('accepts boolean strings for createChecksum and createControl', () => {
    const payload = {
      schemeId: '6',
      sequence: '1',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '1000000000',
      marketingYear: '2024',
      createChecksum: 'true',
      createControl: 'false'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeUndefined()
  })

  test('rejects non-boolean createChecksum and createControl values', () => {
    const payload = {
      schemeId: '6',
      sequence: '1',
      numberOfPR: '1',
      value: '100',
      prn: '1',
      invoiceNumber: '123',
      frn: '1000000000',
      marketingYear: '2024',
      createChecksum: 'maybe',
      createControl: 'no'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
  })
})
