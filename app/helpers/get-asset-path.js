const fs = require('node:fs')
const path = require('node:path')

function getAssetPath (assetName) {
  const distPath = path.join(__dirname, '../dist/css')

  if (!fs.existsSync(distPath)) {
    console.warn(`Asset directory not found: ${distPath}`)
    return `/static/css/${assetName}`
  }

  const files = fs.readdirSync(distPath)

  // Find the file matching the asset name (e.g., 'core' -> 'core.hash.css')
  const assetFile = files.find(f => f.startsWith(assetName + '.') && f.endsWith('.css'))

  if (assetFile) {
    return `/static/css/${assetFile}`
  }

  console.warn(`Asset file not found for: ${assetName}`)
  return `/static/css/${assetName}.css`
}

module.exports = {
  getAssetPath
}
