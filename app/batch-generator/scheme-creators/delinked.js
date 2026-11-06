const { buildBatch, pad, dateString, lastDigits } = require('./helpers')

const sequencePad = 4
const invoiceNumberPad = 7
const requestNumberPad = 2
const contractNumberPad = 8
const defaultPPAIndicator = 1
const ppaAdjustmentIndicator = 2
const decemberMonth = 11
const firstDayOfMonth = 1

const createDelinked = (ctx) => {
  return buildBatch(ctx, 'SITIDP', pad(ctx.sequence, sequencePad), 'DP', (r) => [
    `H^DP${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^Z${lastDigits(r.frn, contractNumberPad)}^${r.requestNumber === defaultPPAIndicator ? defaultPPAIndicator : ppaAdjustmentIndicator}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^DP^Q4`,
    `L^DP${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^80101^${r.fundCode}^Z${lastDigits(r.frn, contractNumberPad)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^SOS210`
  ])
}

module.exports = {
  createDelinked
}
