const { buildBatch, pad, dateString, lastDigits } = require('./helpers')

const sequencePad = 4
const invoiceNumberPad = 8
const requestNumberPad = 2
const contractNumberPad = 8
const defaultPPAIndicator = 1
const ppaAdjustmentIndicator = 2
const decemberMonth = 11
const firstDayOfMonth = 1

const createSFI22 = (ctx) => {
  return buildBatch(ctx, 'SITISFI', 'SFI', pad(ctx.sequence, sequencePad), 'SFI', (r) => [
    `H^SFI${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^${lastDigits(r.frn, contractNumberPad)}^${r.requestNumber === defaultPPAIndicator ? defaultPPAIndicator : ppaAdjustmentIndicator}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SFI^Q4`,
    `L^SFI${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^80101^DRD10^${lastDigits(r.frn, contractNumberPad)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^SOS270`
  ])
}

module.exports = {
  createSFI22
}
