describe('database module', () => {
  let mockConnectReturn
  let MockDatabase

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockConnectReturn = { client: jest.fn(), transaction: jest.fn(), close: jest.fn() }

    MockDatabase = jest.fn(function (opts) {
      this._opts = opts
      this.connect = jest.fn().mockReturnValue(mockConnectReturn)
    })

    jest.doMock('ffc-database', () => ({ Database: MockDatabase }))
    jest.doMock('../../app/config/database', () => ({ host: 'localhost', port: 1234 }))
  })

  afterEach(() => {
    jest.dontMock('ffc-database')
    jest.dontMock('../../app/config/database')
  })

  test('constructs Database with the config and the table map, then connects', () => {
    const db = require('../../app/database')
    const TABLES = require('../../app/constants/tables')

    expect(MockDatabase).toHaveBeenCalledTimes(1)
    expect(MockDatabase).toHaveBeenCalledWith({ host: 'localhost', port: 1234, tables: TABLES })
    expect(MockDatabase.mock.instances[0].connect).toHaveBeenCalledTimes(1)
    expect(db).toBe(mockConnectReturn)
  })

  test('maps every table in the changelog', () => {
    expect(require('../../app/constants/tables')).toEqual({
      category: 'category',
      debtData: 'debtData',
      invoiceLine: 'invoiceLines',
      manualLedgerPaymentRequest: 'manualLedgerPaymentRequest',
      paymentRequest: 'paymentRequests',
      qualityCheck: 'qualityChecks',
      scheme: 'schemes'
    })
  })
})
