const crypto = require('node:crypto')

jest.mock('ffc-pay-schemes', () => {
  const actual = jest.requireActual('ffc-pay-schemes')
  return {
    ...actual,
    getDeliveryBodyFromSchemeId: jest.fn(),
    getFundCodeFromSchemeId: jest.fn()
  }
})

jest.mock('../../../app/batch-generator/create-batch-content', () => ({
  createBatchContent: jest.fn()
}))

const {
  getSchemeIds,
  getDeliveryBodyFromSchemeId,
  getFundCodeFromSchemeId
} = require('ffc-pay-schemes')
const { createBatchContent } = require('../../../app/batch-generator/create-batch-content')
const { generateBatch } = require('../../../app/batch-generator')

const { BPS, CS } = getSchemeIds()

describe('generateBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getDeliveryBodyFromSchemeId.mockReturnValue(undefined)
    getFundCodeFromSchemeId.mockReturnValue(undefined)
  })

  test('builds the default batch context and returns the generated file list', async () => {
    const now = new Date()
    const result = {
      filename: 'batch-001.csv',
      content: 'batch-content'
    }

    createBatchContent.mockResolvedValue(result)

    const files = await generateBatch({
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
      deliveryBody: 'RP00',
      fundCode: 'DRD10'
    })
  })

  test('uses an explicit deliveryBody when provided', async () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockResolvedValue(result)

    await generateBatch({
      schemeId: BPS,
      deliveryBody: 'ZZ99',
      createChecksum: false,
      createControl: false
    })

    expect(createBatchContent).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryBody: 'ZZ99'
      })
    )
  })

  test('uses the scheme deliveryBody and fundCode when available', async () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockResolvedValue(result)
    getDeliveryBodyFromSchemeId.mockReturnValue('AB12')
    getFundCodeFromSchemeId.mockReturnValue('FUND99')

    await generateBatch({
      schemeId: BPS
    })

    expect(createBatchContent).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryBody: 'AB12',
        fundCode: 'FUND99'
      })
    )
  })

  test('defaults fundCode to DRD10 when no scheme helper is set', async () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockResolvedValue(result)

    await generateBatch({
      schemeId: BPS
    })

    expect(createBatchContent).toHaveBeenCalledWith(
      expect.objectContaining({
        fundCode: 'DRD10'
      })
    )
  })

  test('adds a checksum file when createChecksum is true', async () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockResolvedValue(result)

    const files = await generateBatch({
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

  test('adds control files when createControl is true', async () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockResolvedValue(result)

    const files = await generateBatch({
      schemeId: CS,
      createControl: true
    })

    expect(files).toEqual([
      { filename: 'batch-001.csv', content: 'hello world' },
      { filename: 'CTL_batch-001.csv', content: '' }
    ])
  })

  test('adds checksum and control files together when both options are true', async () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockResolvedValue(result)

    const files = await generateBatch({
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

  test('uses the CS default delivery body when the scheme is CS', async () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockResolvedValue(result)

    await generateBatch({
      schemeId: CS
    })

    expect(createBatchContent).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryBody: 'NE00'
      })
    )
  })

  test('uses the non-CS default delivery body when no scheme helper is set', async () => {
    const result = {
      filename: 'batch-001.csv',
      content: 'hello world'
    }

    createBatchContent.mockResolvedValue(result)

    await generateBatch({
      schemeId: BPS
    })

    expect(createBatchContent).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryBody: 'RP00'
      })
    )
  })

  test('rejects when numberOfPR is not a positive integer', async () => {
    await expect(generateBatch({ numberOfPR: 0 }))
      .rejects.toThrow('batchSize must be a positive integer')
    await expect(generateBatch({ numberOfPR: -1 }))
      .rejects.toThrow('batchSize must be a positive integer')
    await expect(generateBatch({ numberOfPR: 1.5 }))
      .rejects.toThrow('batchSize must be a positive integer')
  })
})
