const { buildBatch, pad, dateString, lastDigits } = require('./helpers')

const invoiceNumberPad = 7
const contractNumberPad = 6
const requestNumberPad = 3
const decemberMonth = 11
const firstDayOfMonth = 1

const createBPS = (ctx) => {
  return buildBatch(ctx, 'SITI_', ctx.sequence, 'SITI AGRI SYS', (r) => [
    `H^SITI${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^CT${lastDigits(r.uniqueContractNumber, contractNumberPad)}^${r.frn}^1^${String(r.invoiceValue)}^${r.deliveryBody}^GBP`,
    `L^SITI${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^10501^${r.fundCode}^${r.deliveryBody}^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, decemberMonth, firstDayOfMonth))}`
  ])
}

module.exports = {
  createBPS
}
