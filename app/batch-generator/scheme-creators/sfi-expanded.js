const { buildBatch, pad, dateString, lastDigits } = require('./helpers')

const createESFIO = (ctx) => {
  return buildBatch(ctx, 'ESFIO', 'ESFIO', pad(ctx.sequence, 4), 'ESFIO', (r) => [
    `H^ESFIO${pad(r.invoiceNumber, 7)}^${pad(r.requestNumber, 2)}^E${lastDigits(r.frn, 8)}^${r.requestNumber === 1 ? 1 : 2}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^ESFIO^Q4`,
    `L^ESFIO${pad(r.invoiceNumber, 7)}^${String(r.invoiceValue)}^${r.schemeYear}^80101^DRD10^E${lastDigits(r.frn, 8)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 11, 1))}^${dateString(new Date(r.schemeYear, 11, 1))}^SOS210`,
  ])
}

module.exports = {
  createESFIO
}
