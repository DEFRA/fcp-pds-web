const { buildBatch, pad, dateString } = require('./helpers')

const sequencePad = 4
const invoiceNumberPad = 7
const requestNumberPad = 2
const contractNumberPad = 7
const defaultPPAIndicator = 1
const ppaAdjustmentIndicator = 2
const agreementNumberPad = 12
const decemberMonth = 11
const firstDayOfMonth = 1

const createSFIP = (ctx) => {
  return buildBatch(ctx, 'SITIELM', 'SFIP', pad(ctx.sequence, sequencePad), 'SFIP', (r) => [
    `H^SFIP${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^S${pad(r.invoiceNumber, contractNumberPad)}^${r.requestNumber === defaultPPAIndicator ? defaultPPAIndicator : ppaAdjustmentIndicator}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SFIP^Q4`,
    `L^SFIP${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^80001^DRD10^S${pad(r.frn, agreementNumberPad)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}^SOS270`
  ])
}

module.exports = {
  createSFIP
}
