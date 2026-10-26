const { getSitiAgriSchemeIds } = require('ffc-pay-schemes')
const { createBPS, createCS, createSFIP, createSFI22, createSFI23, createESFIO, createLS, createDelinked, createCOHTC, createCOHTR, createSFI26 } = require('./scheme-creators')

const { SFI, SFI_PILOT, LUMP_SUMS, CS, BPS, SFI23, DELINKED, SFI_EXPANDED, COHT_REVENUE, COHT_CAPITAL, SFI26 } = getSitiAgriSchemeIds()

const createBatchContent = (ctx) => {
  switch (ctx.schemeId) {
    case BPS:
      return createBPS(ctx)
    case CS:
      return createCS(ctx)
    case SFI_PILOT:
      return createSFIP(ctx)
    case SFI:
      return createSFI22(ctx)
    case SFI23:
      return createSFI23(ctx)
    case SFI_EXPANDED:
      return createESFIO(ctx)
    case LUMP_SUMS:
      return createLS(ctx)
    case DELINKED:
      return createDelinked(ctx)
    case COHT_CAPITAL:
      return createCOHTC(ctx)
    case COHT_REVENUE:
      return createCOHTR(ctx)
    case SFI26:
      return createSFI26(ctx)
    default:
      throw new Error(`Invalid schemeId: ${ctx.schemeId}`)
  }
}

module.exports = {
  createBatchContent
}
