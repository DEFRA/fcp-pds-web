const moment = require('moment')
const { getRetentionData } = require('../api')
const { DEFAULT_PAGE, DEFAULT_PER_PAGE } = require('../constants/default-pagination-values')

const getClosures = async ({
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PER_PAGE,
  frnAgreement = null,
  schemeId = null
} = {}) => {
  const params = new URLSearchParams()

  if (frnAgreement || schemeId) {
    if (frnAgreement) {
      params.append('frnAgreement', frnAgreement)
    }

    if (schemeId) {
      params.append('schemeId', schemeId)
    }
  } else {
    params.append('page', page)
    params.append('pageSize', pageSize)
  }

  const queryString = params.toString()
  const queryUrl = '/closure' + (queryString ? '?' + queryString : '')
  try {
    const { payload } = await getRetentionData(queryUrl)

    const closures = payload.closures?.map(closure => {
      closure.endDate = moment(closure.endDate).format('DD/MM/YYYY')
      return closure
    }) ?? []

    return {
      closures,
      count: payload.count ?? 0
    }
  } catch (err) {
    console.error('An error occurred getting retention data', err.message)
    return {
      closures: [],
      count: 0
    }
  }
}

module.exports = {
  getClosures
}
