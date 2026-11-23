const convertToCSV = (data) => {
  let csv = ''
  csv = data.map(row => Object.values(row))
  csv.unshift(Object.keys(data[0]))
  return `"${csv.join('"\n"').replaceAll(',', '","')}"`
}

module.exports = {
  convertToCSV
}
