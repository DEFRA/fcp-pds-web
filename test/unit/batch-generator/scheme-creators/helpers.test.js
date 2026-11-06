const os = require('node:os')
const {
  pad,
  lastDigits,
  dateString,
  timestampString,
  buildBatch
} = require('../../../../app/batch-generator/scheme-creators/helpers')

describe('batch generation helpers', () => {
  describe('pad', () => {
    test('pads a value to the required width', () => {
      expect(pad(7, 2)).toBe('07')
      expect(pad(42, 5)).toBe('00042')
      expect(pad(1234, 3)).toBe('1234')
    })
  })

  describe('lastDigits', () => {
    test('pads then keeps the trailing digits', () => {
      expect(lastDigits(7, 2)).toBe('07')
      expect(lastDigits(1234, 3)).toBe('234')
      expect(lastDigits(42, 5)).toBe('00042')
    })
  })

  describe('dateString', () => {
    test('formats a date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 5, 12, 34, 56, 789)
      expect(dateString(date)).toBe('2024-01-05')
    })
  })

  describe('timestampString', () => {
    test('builds a compact timestamp', () => {
      const date = new Date(2024, 0, 5, 9, 7, 3, 42)
      expect(timestampString(date)).toBe('20240105090703042')
    })
  })

  describe('buildBatch', () => {
    test('creates the batch header and filename using the supplied values', () => {
      const now = new Date(2024, 0, 5, 9, 7, 3, 42)
      const ctx = {
        now,
        batchSize: 2,
        invoiceValue: 10,
        invoiceNumber: 100,
        frn: 200,
        requestNumber: 'REQ-1',
        deliveryBody: 'DB-1',
        schemeYear: 2024,
        fundCode: 'FUND-7',
        sequence: 3
      }

      const rowBuilder = ({ invoiceNumber, frn, invoiceValue, deliveryBody, schemeYear, fundCode }) => [
        `ROW^${invoiceNumber}^${frn}^${invoiceValue}^${deliveryBody}^${schemeYear}^${fundCode}`
      ]

      const result = buildBatch(ctx, 'PREFIX_', 42, 'HEADER', rowBuilder)

      expect(result.filename).toBe('PREFIX_0003_AP_20240105090703042.dat')
      expect(result.content).toBe(
        [
          'B^2024-01-05^2^20^42^HEADER^AP',
          'ROW^100^200^10^DB-1^2024^FUND-7',
          'ROW^101^201^10^DB-1^2024^FUND-7'
        ].join(os.EOL) + os.EOL
      )
    })

    test('passes the expected row context into the row builder', () => {
      const now = new Date(2024, 1, 2, 3, 4, 5, 6)
      const ctx = {
        now,
        batchSize: 1,
        invoiceValue: 25,
        invoiceNumber: 500,
        frn: 600,
        requestNumber: 'REQ-2',
        deliveryBody: 'DB-2',
        schemeYear: 2025,
        fundCode: 'FUND-9',
        sequence: 7
      }

      const rowBuilder = jest.fn(({ invoiceNumber, frn, requestNumber, invoiceValue, deliveryBody, schemeYear, fundCode }) => {
        expect(invoiceNumber).toBe(500)
        expect(frn).toBe(600)
        expect(requestNumber).toBe('REQ-2')
        expect(invoiceValue).toBe(25)
        expect(deliveryBody).toBe('DB-2')
        expect(schemeYear).toBe(2025)
        expect(fundCode).toBe('FUND-9')

        return ['ROW^OK']
      })

      const result = buildBatch(ctx, 'X_', 11, 'LABEL', rowBuilder)

      expect(rowBuilder).toHaveBeenCalledTimes(1)
      expect(result.filename).toBe('X_0007_AP_20240202030405006.dat')
      expect(result.content).toBe(
        [
          'B^2024-02-02^1^25^11^LABEL^AP',
          'ROW^OK'
        ].join(os.EOL) + os.EOL
      )
    })
  })
})
