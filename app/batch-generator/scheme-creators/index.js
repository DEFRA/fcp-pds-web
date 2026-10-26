const { createBPS } = require('./bps')
const { createCOHTC } = require('./coht-capital')
const { createCOHTR } = require('./coht-revenue')
const { createCS } = require('./cs')
const { createDelinked } = require('./delinked')
const { createESFIO } = require('./sfi-expanded')
const { createLS } = require('./lump-sums')
const { createSFIP } = require('./sfi-pilot')
const { createSFI22 } = require('./sfi22')
const { createSFI23 } = require('./sfi23')
const { createSFI26 } = require('./sfi26')

module.exports = {
  createBPS,
  createCOHTC,
  createCOHTR,
  createCS,
  createDelinked,
  createESFIO,
  createLS,
  createSFIP,
  createSFI22,
  createSFI23,
  createSFI26
}
