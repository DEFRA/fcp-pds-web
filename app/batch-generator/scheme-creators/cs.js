const { buildBatch, pad, dateString } = require('./helpers')

const invoiceNumberPad = 9
const requestNumberPad = 3
const contractNumberPad = 7
const defaultPPAIndicator = 1
const ppaAdjustmentIndicator = 2
const agreementNumberPad = 11
const decemberMonth = 11
const firstDayOfMonth = 1

const createCS = (ctx) => {
  return buildBatch(ctx, 'SITICS', 'SITI AGRI CS SYS', ctx.sequence, 'SITI AGRI CS SYS', (r) => [
    `H^CS${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^A${pad(r.invoiceNumber, contractNumberPad)}^${r.requestNumber === defaultPPAIndicator ? defaultPPAIndicator : ppaAdjustmentIndicator}^${r.frn}^GBP^${String(r.invoiceValue)}^NE00^GBP`,
    `L^CS${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^5704A^${r.fundCode}^A${pad(r.frn, agreementNumberPad)}/MT^NE00^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^SOS273`
  ])
}

module.exports = {
  createCS
}
