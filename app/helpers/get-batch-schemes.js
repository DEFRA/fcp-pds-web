const { getSitiAgriSchemes } = require('ffc-pay-schemes')

const getBatchSchemes = () => {
  const schemes = getSitiAgriSchemes()
  console.log(schemes)
  return schemes.sort((a, b) => a.schemeName.localeCompare(b.schemeName))
}

module.exports = {
  getBatchSchemes
}
