const JSZip = require('jszip')
const path = require('node:path')
const { applicationAdmin, batchViewer } = require('../auth/permissions')
const { generateBatch } = require('../batch-generator')
const { getBatchSchemes } = require('../helpers/get-batch-schemes')
const schema = require('./schemas/batch-generator')

const auth = {
  scope: [applicationAdmin, batchViewer]
}

module.exports = [
  {
    method: 'GET',
    path: '/batch-generator',
    options: {
      auth,
      handler: (_request, h) => {
        const schemes = getBatchSchemes()
        return h.view('batch-generator', {
          schemes,
          createChecksum: false,
          createControl: false
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/batch-generator',
    options: {
      auth,
      handler: async (request, h) => {
        const { error } = schema.validate(request.payload, {
          abortEarly: false
        })

        if (error) {
          return h.view('batch-generator', {
            ...request.payload,
            schemes: getBatchSchemes(),
            errors: error
          })
        }

        const files = generateBatch(request.payload)
        const zip = new JSZip()

        for (const file of files) {
          zip.file(file.filename, file.content)
        }

        const archive = await zip.generateAsync({ type: 'nodebuffer' })
        const zipFilename = `${path.parse(files[0].filename).name}.zip`

        return h.response(archive)
          .type('application/zip')
          .header('Content-Disposition', `attachment; filename="${zipFilename}"`)
      }
    }
  }
]
