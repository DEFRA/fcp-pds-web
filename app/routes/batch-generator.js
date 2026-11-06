const JSZip = require('jszip')
const path = require('node:path')
const crypto = require('node:crypto')
const { applicationAdmin, batchViewer } = require('../auth/permissions')
const { generateBatch } = require('../batch-generator')
const { getBatchSchemes } = require('../helpers/get-batch-schemes')
const schema = require('./schemas/batch-generator')

const auth = {
  scope: [applicationAdmin, batchViewer]
}
const BATCH_GENERATOR_ROUTE = '/batch-generator'

const pendingDownloads = new Map()
const downloadedTokens = new Set()

module.exports = [
  {
    method: 'GET',
    path: BATCH_GENERATOR_ROUTE,
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
    path: BATCH_GENERATOR_ROUTE,
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

        const payload = {
          ...request.payload,
          createChecksum: request.payload.createChecksum === true || request.payload.createChecksum === 'true',
          createControl: request.payload.createControl === true || request.payload.createControl === 'true'
        }

        const token = crypto.randomUUID()
        pendingDownloads.set(token, payload)

        return h.redirect(`${BATCH_GENERATOR_ROUTE}/confirm?token=${token}`)
      }
    }
  },
  {
    method: 'GET',
    path: `${BATCH_GENERATOR_ROUTE}/confirm`,
    options: {
      auth,
      handler: async (request, h) => {
        const { token } = request.query
        const payload = pendingDownloads.get(token)

        if (!payload) {
          return h.redirect(BATCH_GENERATOR_ROUTE)
        }

        return h.view('batch-generator-confirm', {
          token,
          payload,
          alreadyDownloaded: downloadedTokens.has(token)
        })
      }
    }
  },
  {
    method: 'GET',
    path: `${BATCH_GENERATOR_ROUTE}/download`,
    options: {
      auth,
      handler: async (request, h) => {
        const { token } = request.query
        const payload = pendingDownloads.get(token)

        if (!payload || downloadedTokens.has(token)) {
          return h.redirect(`${BATCH_GENERATOR_ROUTE}/confirm?token=${token}`)
        }

        const files = generateBatch(payload)
        const zip = new JSZip()

        for (const file of files) {
          zip.file(file.filename, file.content)
        }

        const archive = await zip.generateAsync({ type: 'nodebuffer' })
        const zipFilename = `${path.parse(files[0].filename).name}.zip`

        downloadedTokens.add(token)
        pendingDownloads.delete(token)

        return h.response(archive)
          .type('application/zip')
          .header('Content-Disposition', `attachment; filename="${zipFilename}"`)
      }
    }
  }
]
