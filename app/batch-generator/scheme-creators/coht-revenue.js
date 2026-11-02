const { buildBatch, pad, lastDigits, dateString } = require('./helpers')

const sequencePad = 4
const invoiceNumberPad = 7
const requestNumberPad = 2
const contractNumberPad = 8
const defaultPPAIndicator = 1
const ppaAdjustmentIndicator = 2
const decemberMonth = 11
const firstDayOfMonth = 1

const createCOHTR = (ctx) => {
  return buildBatch(ctx, 'ESFIO', 'COHTR', pad(ctx.sequence, sequencePad), 'COHTR', (r) => [
    `H^ESFIO${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^Z${lastDigits(r.frn, contractNumberPad)}^${r.requestNumber === defaultPPAIndicator ? defaultPPAIndicator : ppaAdjustmentIndicator}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^COHTR^Q4`,
    `L^ESFIO${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^80201^DRD10^Z${lastDigits(r.frn, contractNumberPad)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^SOS270`
  ])
}

module.exports = {
  createCOHTR
}
