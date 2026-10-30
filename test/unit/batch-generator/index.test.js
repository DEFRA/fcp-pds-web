const crypto = require('node:crypto')
const { getSchemeIds } = require('ffc-pay-schemes')

jest.mock('../../../app/batch-generator/create-batch-content', () => ({
  createBatchContent: jest.fn()
}))

const { createBatchContent } = require('../../../app/batch-generator/create-batch-content')
const { generateBatch } = require('../../../app/batch-generator')

const { BPS, CS } = getSchemeIds()

describe('generateBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('builds the default batch context and returns the generated file list', () => {
    const now = new Date()
    const result = {
      filename: 'batch-001.csv',
      content: 'batch-content'
    }

    createBatchContent.mockReturnValue(result)

    const files = generateBatch({
      schemeId: BPS,
      createChecksum: false,
      createControl: false
    })

    expect(files).toEqual([
      { filename: 'batch-001.csv', content: 'batch-content' }
    ])

    expect(createBatchContent).toHaveBeenCalledTimes(1)
    expect(createBatchContent.mock.calls[0][0]).toMatchObject({
      schemeId: BPS,
      now: expect.any(Date),
      batchSize: 1,
      invoiceValue: 100,
      sequence: 1,
      requestNumber: 1,
      invoiceNumber: 1,
      frn: 1000000001,
      schemeYear: now.getFullYear(),
      deliveryBody: 'RP00'
    })
  })

  test('adds a checksum file when createChecksum is true', () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockReturnValue(result)

    const files = generateBatch({
      schemeId: CS,
      createChecksum: true
    })

    const expectedChecksum = crypto
      .createHash('sha256')
      .update('hello world', 'utf8')
      .digest('hex')

    expect(files).toEqual([
      { filename: 'batch-001.csv', content: 'hello world' },
      { filename: 'batch-001.txt', content: expectedChecksum }
    ])
  })

  test('adds control files when createControl is true', () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockReturnValue(result)

    const files = generateBatch({
      schemeId: CS,
      createControl: true
    })

    expect(files).toEqual([
      { filename: 'batch-001.csv', content: 'hello world' },
      { filename: 'CTL_batch-001.csv', content: '' }
    ])
  })

  test('adds checksum and control files together when both options are true', () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockReturnValue(result)

    const files = generateBatch({
      schemeId: CS,
      createChecksum: true,
      createControl: true
    })

    const expectedChecksum = crypto
      .createHash('sha256')
      .update('hello world', 'utf8')
      .digest('hex')

    expect(files).toEqual([
      { filename: 'batch-001.csv', content: 'hello world' },
      { filename: 'batch-001.txt', content: expectedChecksum },
      { filename: 'CTL_batch-001.csv', content: '' },
      { filename: 'CTL_batch-001.txt', content: '' }
    ])
  })

  test('uses the CS default delivery body when the scheme is CS', () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockReturnValue(result)

    generateBatch({
      schemeId: CS
    })

    expect(createBatchContent).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryBody: 'NE00'
      })
    )
  })

  test('throws when batchSize is not a positive integer', () => {
    expect(() => generateBatch({ batchSize: 0 })).toThrow('batchSize must be a positive integer')
    expect(() => generateBatch({ batchSize: -1 })).toThrow('batchSize must be a positive integer')
    expect(() => generateBatch({ batchSize: 1.5 })).toThrow('batchSize must be a positive integer')
  })
})
