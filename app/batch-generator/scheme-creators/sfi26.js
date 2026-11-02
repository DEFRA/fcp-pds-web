const { buildBatch, pad, dateString, lastDigits } = require('./helpers')

const sequencePad = 4
const invoiceNumberPad = 7
const requestNumberPad = 2
const contractNumberPad = 8
const defaultPPAIndicator = 1
const ppaAdjustmentIndicator = 2
const decemberMonth = 11
const firstDayOfMonth = 1

const createSFI26 = (ctx) => {
  return buildBatch(ctx, 'SITISFI26', 'SFI26', pad(ctx.sequence, sequencePad), 'SFI26', (r) => [
    `H^SFI26${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^G${lastDigits(r.frn, contractNumberPad)}^${r.requestNumber === defaultPPAIndicator ? defaultPPAIndicator : ppaAdjustmentIndicator}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SFI26^Q4`,
    `L^SFI26${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^80201^DRD10^G${lastDigits(r.frn, contractNumberPad)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^SOS270`,
  ])
}

module.exports = {
  createSFI26
}
