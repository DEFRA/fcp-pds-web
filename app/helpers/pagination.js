const { DEFAULT_PAGE, DEFAULT_PER_PAGE, DEFAULT_PAGES_BEFORE_ABBREVIATING } = require('../constants/default-pagination-values')

const buildExtraQuery = extraParams =>
  Object.entries(extraParams)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `&${key}=${encodeURIComponent(value)}`)
    .join('')

const createPageItem = (pageNumber, hrefFor, current = false) => ({
  number: pageNumber,
  href: hrefFor(pageNumber),
  current
})

const buildAllPages = (totalPages, page, hrefFor) =>
  Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = index + 1

    return createPageItem(pageNumber, hrefFor, pageNumber === page)
  })

const buildStartPages = (page, totalPages, hrefFor) =>
  Array.from(
    { length: Math.min(page + 1, totalPages - 1) - 1 },
    (_, index) => {
      const pageNumber = index + 2

      return createPageItem(pageNumber, hrefFor, pageNumber === page)
    }
  )

const buildMiddlePages = (page, totalPages, hrefFor) => [
  { ellipsis: true },
  createPageItem(page - 1, hrefFor),
  ...(page !== totalPages
    ? [createPageItem(page, hrefFor, true)]
    : [])
]

const buildPaginationItems = (
  page,
  totalPages,
  perPage,
  extraParams = {}
) => {
  const extraQuery = buildExtraQuery(extraParams)

  const hrefFor = pageNumber =>
        `?page=${pageNumber}&perPage=${perPage}${extraQuery}`

  if (totalPages <= DEFAULT_PAGES_BEFORE_ABBREVIATING) {
    return buildAllPages(totalPages, page, hrefFor)
  }

  let items = [
    createPageItem(1, hrefFor, page === 1)
  ]

  if (page <= DEFAULT_PAGES_BEFORE_ABBREVIATING) {
    items = items.concat(
      buildStartPages(page, totalPages, hrefFor)
    )
  } else {
    items = items.concat(
      buildMiddlePages(page, totalPages, hrefFor)
    )
  }

  if (page > DEFAULT_PAGES_BEFORE_ABBREVIATING && page < totalPages - 1) {
    items = items.concat([
      createPageItem(page + 1, hrefFor)
    ])
  }

  if (page < totalPages - 2) {
    items = items.concat([{ ellipsis: true }])
  }

  items = items.concat([
    createPageItem(
      totalPages,
      hrefFor,
      page === totalPages
    )
  ])

  return items
}

const parsePaginationParams = (query, defaultPerPage) => ({
  page: Number.parseInt(query.page) > 0 ? Number.parseInt(query.page) : DEFAULT_PAGE,
  perPage: Number.parseInt(query.perPage) > 0 ? Number.parseInt(query.perPage) : defaultPerPage
})

// Wraps a fetch+shape function with the pagination bookkeeping every list view needs.
// fetchAndShape receives { page, perPage, ...filters } and must return { data, count }.
const withPagination = (fetchAndShape) => async ({ page, perPage, ...filters }) => {
  const { data, count } = await fetchAndShape({ page, perPage, ...filters })
  const totalPages = Math.ceil(count / perPage)
  const paginationItems = buildPaginationItems(page, totalPages, perPage, filters)
  return { data, totalPages, paginationItems }
}

// POST/redirect/GET so the search filters become part of the URL - this means pagination
// on the results, and reloading/bookmarking the page, both keep working with the filters
// applied, instead of only ever showing an unpaginated in-memory-filtered result for the
// single POST that triggered the search.
const redirectWithFilters = (h, path, defaultPerPage, filters = {}) => {
  const params = new URLSearchParams({ page: DEFAULT_PAGE, perPage: defaultPerPage })
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })
  return h.redirect(`${path}?${params.toString()}`)
}

const filterAndPaginateHolds = (paymentHolds, { frn, schemeName, page = DEFAULT_PAGE, perPage = DEFAULT_PER_PAGE } = {}) => {
  let filteredHolds = paymentHolds
  if (frn) {
    filteredHolds = filteredHolds.filter(x => x.frn === String(frn))
  }
  if (schemeName) {
    filteredHolds = filteredHolds.filter(x => x.holdCategorySchemeName === schemeName)
  }

  const numberOfHolds = filteredHolds.length
  const start = (page - 1) * perPage

  return {
    paymentHolds: filteredHolds.slice(start, start + perPage),
    numberOfHolds,
    page,
    perPage
  }
}

module.exports = {
  buildPaginationItems,
  filterAndPaginateHolds,
  parsePaginationParams,
  redirectWithFilters,
  withPagination
}
