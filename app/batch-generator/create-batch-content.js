const { getSchemeIds } = require('ffc-pay-schemes')
const { createBPS, createCS, createSFIP, createSFI22, createSFI23, createESFIO, createLS, createDelinked, createCOHTC, createCOHTR, createSFI26 } = require('./scheme-creators')

const { SFI, SFI_PILOT, LUMP_SUMS, CS, BPS, SFI23, DELINKED, SFI_EXPANDED, COHT_REVENUE, COHT_CAPITAL, SFI26 } = getSchemeIds()

const createBatchContent = (ctx) => {
  const creators = {
    [BPS]: createBPS,
    [CS]: createCS,
    [SFI_PILOT]: createSFIP,
    [SFI]: createSFI22,
    [SFI23]: createSFI23,
    [SFI_EXPANDED]: createESFIO,
    [LUMP_SUMS]: createLS,
    [DELINKED]: createDelinked,
    [COHT_CAPITAL]: createCOHTC,
    [COHT_REVENUE]: createCOHTR,
    [SFI26]: createSFI26
  }

  const creator = creators[Number(ctx.schemeId)]

  if (!creator) {
    throw new Error(`Invalid schemeId: ${ctx.schemeId}`)
  }

  return creator(ctx)
}

module.exports = {
  createBatchContent
}
