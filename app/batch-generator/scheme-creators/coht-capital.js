const { buildBatch, pad, lastDigits } = require('./helpers')

const sequencePad = 4
const invoiceNumberPad = 7
const requestNumberPad = 2
const contractNumberPad = 7
const defaultPPAIndicator = 1
const ppaAdjustmentIndicator = 2

const createCOHTC = (ctx) => {
  return buildBatch(ctx, 'SITICOHTC', pad(ctx.sequence, sequencePad), 'SITICOHTC', (r) => [
    `H^SITICOHTC${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^ZT${lastDigits(r.uniqueContractNumber, contractNumberPad)}^${r.requestNumber === defaultPPAIndicator ? defaultPPAIndicator : ppaAdjustmentIndicator}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SITICOHTC^`,
    `L^SITICOHTC${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^80201^${r.fundCode}^ZT${lastDigits(r.uniqueContractNumber, contractNumberPad)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^SOS270`
  ])
}

module.exports = {
  createCOHTC
}
