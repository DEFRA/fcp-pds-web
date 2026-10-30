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

const { getSchemeIds } = require('ffc-pay-schemes')
const { createBatchContent } = require('../../../app/batch-generator/create-batch-content')
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

describe('createBatchContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('routes valid scheme ids to the correct creator functions', () => {
    const cases = [
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
    ]

    cases.forEach(([schemeId, creator]) => {
      const ctx = { schemeId }
      const expectedResult = { schemeId }

      creator.mockReturnValue(expectedResult)

      const result = createBatchContent(ctx)

      expect(result).toBe(expectedResult)
      expect(creator).toHaveBeenCalledTimes(1)
      expect(creator).toHaveBeenCalledWith(ctx)
    })
  })

  test('throws for an invalid scheme id', () => {
    expect(() => createBatchContent({ schemeId: Number.MAX_SAFE_INTEGER })).toThrow(
      `Invalid schemeId: ${Number.MAX_SAFE_INTEGER}`
    )
  })
})
