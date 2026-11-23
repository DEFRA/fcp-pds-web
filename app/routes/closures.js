const { postRetention, getRetentionData } = require('../api')
const { handleBulkClosureError } = require('../closure/handle-bulk-closure-error')
const { handleBulkClosure } = require('../closure/handle-bulk-closure')
const { getClosures } = require('../closure')
const { getRetentionExtractDownloadStreamAndDeleteAfter } = require('../storage')
const { addDateErrorIfRequired, buildPaginationItems, getSchemesForClosures, parsePaginationParams } = require('../helpers')

const { CLOSURE_PATHS } = require('../constants/paths')
const { AGREEMENT_CLOSURES_LINKS } = require('../constants/section-links')
const { CLOSURE_VIEWS } = require('../constants/views')

const { applicationAdmin, closureViewer } = require('../auth/permissions')
const { closure, bulkClosure, removeConfirm } = require('./schemas/closure')
const { DEFAULT_PER_PAGE } = require('../constants/default-pagination-values')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const { MAX_BYTES } = require('../constants/payload-sizes')
const { CLOSURE_EXISTS_ERROR, FILE_TOO_LARGE_ERROR } = require('../constants/validation-errors')
const { GET } = require('../constants/api-methods')

const AUTH_SCOPE = { scope: [applicationAdmin, closureViewer] }

const buildClosuresViewModel = ({
  closures,
  count,
  schemes,
  page,
  perPage,
  frnAgreement,
  schemeId,
  closureRemoved
}) => {
  const totalPages = Math.ceil(count / perPage)
  const paginationItems = buildPaginationItems(page, totalPages, perPage, {
    frnAgreement,
    schemeId
  })
  const extraQuery = [
    frnAgreement ? `&frnAgreement=${encodeURIComponent(frnAgreement)}` : '',
    schemeId ? `&schemeId=${encodeURIComponent(schemeId)}` : ''
  ].join('')

  return {
    closures,
    schemes,
    page,
    perPage,
    frnAgreement,
    schemeId,
    count,
    totalPages,
    paginationItems,
    extraQuery,
    closureRemoved,
    isSearch: Boolean(frnAgreement || schemeId)
  }
}

module.exports = [
  {
    method: GET,
    path: CLOSURE_PATHS.MANAGE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const cards = [...AGREEMENT_CLOSURES_LINKS]
        cards.shift()
        const closureAdded = request.query?.closureAdded
        return h.view(CLOSURE_VIEWS.MANAGE, { cards, closureAdded })
      }
    }
  },
  {
    method: GET,
    path: CLOSURE_PATHS.SEARCH,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const { page, perPage } = parsePaginationParams(request.query, DEFAULT_PER_PAGE)
        const frnAgreement = request.query.frnAgreement || null
        const schemeId = request.query.schemeId || null
        const [{ closures, count }, schemes] = await Promise.all([
          getClosures({
            page,
            pageSize: perPage,
            frnAgreement,
            schemeId
          }),
          getSchemesForClosures()
        ])

        return h.view(CLOSURE_VIEWS.SEARCH, buildClosuresViewModel({
          closures,
          count,
          schemes,
          page,
          perPage,
          frnAgreement,
          schemeId,
          closureRemoved: request.query?.closureRemoved
        }))
      }
    }
  },
  {
    method: GET,
    path: CLOSURE_PATHS.ADD,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const schemes = await getSchemesForClosures()
        return h.view(CLOSURE_VIEWS.ADD, {
          schemes,
          frn: request.query?.frn,
          agreement: request.query?.agreement,
          schemeId: request.query?.schemeId,
          day: request.query?.day,
          month: request.query?.month,
          year: request.query?.year
        })
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURE_PATHS.ADD_CONFIRM,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: closure,
        failAction: async (request, h, error) => {
          const errors = addDateErrorIfRequired(error, request.payload)
          const schemes = await getSchemesForClosures()
          return h
            .view(CLOSURE_VIEWS.ADD, {
              errors,
              schemes,
              frn: request.payload.frn,
              agreement: request.payload.agreement,
              schemeId: request.payload.schemeId,
              day: request.payload.day,
              month: request.payload.month,
              year: request.payload.year
            })
            .code(BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const {
          frn,
          agreement,
          schemeId,
          day,
          month,
          year
        } = request.payload
        const schemes = await getSchemesForClosures()
        const query = new URLSearchParams({
          frn,
          agreementNumber: agreement,
          schemeId
        })
        const response = await getRetentionData(`${CLOSURE_PATHS.EXISTS}?${query}`)
        const closureExists = response.payload.exists
        if (closureExists) {
          return h
            .view(CLOSURE_VIEWS.ADD, {
              errors: {
                details: [{
                  message: CLOSURE_EXISTS_ERROR
                }]
              },
              schemes,
              frn,
              agreement,
              schemeId,
              day,
              month,
              year
            })
            .code(BAD_REQUEST)
            .takeover()
        }
        const selectedScheme = schemes.find(scheme => String(scheme.schemeId) === String(schemeId))
        return h.view(CLOSURE_VIEWS.ADD_CONFIRM, {
          frn,
          agreement,
          schemeId,
          schemeName: selectedScheme?.schemeName,
          day,
          month,
          year
        })
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURE_PATHS.ADD,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: closure,
        failAction: async (request, h, error) => {
          const errors = addDateErrorIfRequired(error, request.payload)
          return h
            .view(CLOSURE_VIEWS.ADD, {
              errors,
              frn: request.payload.frn,
              agreement: request.payload.agreement,
              schemeId: request.payload.schemeId,
              day: request.payload.day,
              month: request.payload.month,
              year: request.payload.year
            })
            .code(BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        let day = request.payload.day.toString()
        if (day.length !== 2) {
          day = `0${request.payload.day}`
        }
        let month = request.payload.month.toString()
        if (month.length !== 2) {
          month = `0${request.payload.month}`
        }
        const date = `${request.payload.year}-${month}-${day}T00:00:00`
        const user = request.auth?.credentials.account
        const addedBy = user?.name || user?.username || user?.email
        await postRetention(
          CLOSURE_PATHS.ADD,
          {
            frn: request.payload.frn,
            agreementNumber: request.payload.agreement,
            schemeId: request.payload.schemeId,
            endDate: date,
            addedBy
          },
          null
        )
        return h.redirect(`${CLOSURE_PATHS.MANAGE}?closureAdded=single`)
      }
    }
  },
  {
    method: GET,
    path: CLOSURE_PATHS.BULK,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        return h.view(CLOSURE_VIEWS.BULK)
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURE_PATHS.BULK,
    handler: handleBulkClosure,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: bulkClosure,
        failAction: async (request, h, error) => {
          const crumb = request.payload?.crumb ?? request.state.crumb
          return handleBulkClosureError(h, error, crumb)
        }
      },
      payload: {
        output: 'file',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: MAX_BYTES,
        multipart: true,
        failAction: async (request, h, _error) => {
          const crumb = request.payload?.crumb ?? request.state.crumb
          return handleBulkClosureError(h, FILE_TOO_LARGE_ERROR, crumb)
        }
      }
    }
  },
  {
    method: GET,
    path: CLOSURE_PATHS.REMOVE_CONFIRM,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        query: removeConfirm,
        failAction: (_request, _h, error) => {
          throw error
        }
      },
      handler: async (request, h) => {
        const {
          retentionDataId,
          frn,
          agreementNumber,
          schemeName,
          page,
          perPage,
          frnAgreement,
          schemeId
        } = request.query
        return h.view(CLOSURE_VIEWS.REMOVE_CONFIRM, {
          retentionDataId,
          frn,
          agreementNumber,
          schemeName,
          page,
          perPage,
          frnAgreement,
          schemeId
        })
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURE_PATHS.REMOVE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        await postRetention('/closure/remove', { retentionDataId: request.payload.retentionDataId })

        const { page, perPage } = parsePaginationParams(request.payload, DEFAULT_PER_PAGE)
        const frnAgreement = request.payload?.frnAgreement || null
        const schemeId = request.payload?.schemeId || null

        let [{ closures, count }, schemes] = await Promise.all([
          getClosures({
            page,
            pageSize: perPage,
            frnAgreement,
            schemeId
          }),
          getSchemesForClosures()
        ])

        const totalPages = Math.ceil(count / perPage)
        const selectedPage = totalPages > 0 && page > totalPages ? totalPages : page

        if (selectedPage !== page) {
          const results = await getClosures({
            page: selectedPage,
            pageSize: perPage,
            frnAgreement,
            schemeId
          })
          closures = results.closures
          count = results.count
        }

        return h.view(CLOSURE_VIEWS.SEARCH, buildClosuresViewModel({
          closures,
          count,
          schemes,
          page: selectedPage,
          perPage,
          frnAgreement,
          schemeId,
          closureRemoved: true
        }))
      }
    }
  },
  {
    method: GET,
    path: CLOSURE_PATHS.EXTRACT,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        const response = await getRetentionData(CLOSURE_PATHS.EXTRACT)
        const { filename } = response.payload
        const { stream } = await getRetentionExtractDownloadStreamAndDeleteAfter(filename)
        return h.response(stream)
          .type('text/csv')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .header('Cache-Control', 'no-store')
      }
    }
  }
]
