jest.mock('../../../app/batch-generator/scheme-creators', () => ({
  createBPS: jest.fn(),
  createCS: jest.fn(),
  createSFIP: jest.fn(),
  createSFI22: jest.fn(),
  createSFI23: jest.fn(),
  createESFIO: jest.fn(),
  createLS: jest.fn(),
  createDelinked: jest.fn(),
  createCOHTC: jest.fn(),
  createCOHTR: jest.fn(),
  createSFI26: jest.fn()
}))

jest.mock('../../../app/database', () => ({
  generatorContractNumbers: jest.fn()
}))

const { getSchemeIds } = require('ffc-pay-schemes')
const { createBatchContent } = require('../../../app/batch-generator/create-batch-content')
const { generatorContractNumbers } = require('../../../app/database')
const {
  createBPS,
  createCS,
  createSFIP,
  createSFI22,
  createSFI23,
  createESFIO,
  createLS,
  createDelinked,
  createCOHTC,
  createCOHTR,
  createSFI26
} = require('../../../app/batch-generator/scheme-creators')

const {
  SFI,
  SFI_PILOT,
  LUMP_SUMS,
  CS,
  BPS,
  SFI23,
  DELINKED,
  SFI_EXPANDED,
  COHT_REVENUE,
  COHT_CAPITAL,
  SFI26
} = getSchemeIds()

const mockContractNumberInsert = (rows = [{ contractId: 'contract-1' }]) => {
  const returning = jest.fn().mockResolvedValue(rows)
  const insert = jest.fn().mockReturnValue({ returning })

  generatorContractNumbers.mockReturnValue({ insert })

  return { insert, returning }
}

describe('createBatchContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    [BPS, createBPS],
    [CS, createCS],
    [SFI_PILOT, createSFIP],
    [SFI, createSFI22],
    [SFI23, createSFI23],
    [SFI_EXPANDED, createESFIO],
    [LUMP_SUMS, createLS],
    [DELINKED, createDelinked],
    [COHT_CAPITAL, createCOHTC],
    [COHT_REVENUE, createCOHTR],
    [SFI26, createSFI26]
  ])('routes scheme id %s to its creator', async (schemeId, creator) => {
    mockContractNumberInsert()
    const ctx = { schemeId, frn: '1234567890', batchSize: 1 }
    const expectedResult = { schemeId }
    creator.mockResolvedValue(expectedResult)

    const result = await createBatchContent(ctx)

    expect(result).toBe(expectedResult)
    expect(creator).toHaveBeenCalledTimes(1)
    expect(creator).toHaveBeenCalledWith({
      ...ctx,
      uniqueContractNumber: ['contract-1']
    })
  })

  test('inserts contract rows and assigns returned contract numbers to the context', async () => {
    const returnedRows = [{ contractId: 'contract-1' }, { contractId: 'contract-2' }]
    const { insert, returning } = mockContractNumberInsert(returnedRows)
    const ctx = { schemeId: BPS, frn: '1234567890', batchSize: 2 }

    await createBatchContent(ctx)

    expect(generatorContractNumbers).toHaveBeenCalledTimes(1)
    expect(insert).toHaveBeenCalledTimes(1)

    const insertedRows = insert.mock.calls[0][0]
    expect(insertedRows).toHaveLength(2)
    expect(insertedRows).toEqual([
      { schemeId: BPS, frn: ctx.frn, created: expect.any(Date) },
      { schemeId: BPS, frn: ctx.frn, created: expect.any(Date) }
    ])
    expect(insertedRows[0].created).toBe(insertedRows[1].created)

    expect(returning).toHaveBeenCalledWith('contractId')
    expect(ctx.uniqueContractNumber).toEqual(['contract-1', 'contract-2'])
  })

  test('rejects for an invalid scheme id without calling the database', async () => {
    await expect(
      createBatchContent({ schemeId: Number.MAX_SAFE_INTEGER })
    ).rejects.toThrow(`Invalid schemeId: ${Number.MAX_SAFE_INTEGER}`)

    expect(generatorContractNumbers).not.toHaveBeenCalled()
  })
})
