const {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
  DEFAULT_PAGES_BEFORE_ABBREVIATING
} = require('../../../app/constants/default-pagination-values')
const {
  buildPaginationItems,
  filterAndPaginateHolds,
  parsePaginationParams,
  redirectWithFilters,
  withPagination
} = require('../../../app/helpers/pagination')

describe('pagination helpers', () => {
  describe('buildPaginationItems', () => {
    test('returns an item for every page when pagination is not abbreviated', () => {
      const items = buildPaginationItems(2, DEFAULT_PAGES_BEFORE_ABBREVIATING, 10)

      expect(items).toHaveLength(DEFAULT_PAGES_BEFORE_ABBREVIATING)
      expect(items.find(item => item.current)).toMatchObject({
        number: 2,
        current: true,
        href: '?page=2&perPage=10'
      })
      expect(items.every(item => !item.ellipsis)).toBe(true)
    })

    test('returns no items when there are no pages', () => {
      expect(buildPaginationItems(1, 0, 10)).toEqual([])
    })

    test('abbreviates pages near the beginning and includes the final page', () => {
      const totalPages = DEFAULT_PAGES_BEFORE_ABBREVIATING + 4
      const items = buildPaginationItems(1, totalPages, 10)

      expect(items[0]).toMatchObject({ number: 1, current: true })
      expect(items.some(item => item.ellipsis)).toBe(true)
      expect(items.at(-1)).toMatchObject({ number: totalPages, current: false })
    })

    test('includes surrounding pages and preserves filter query parameters', () => {
      const page = DEFAULT_PAGES_BEFORE_ABBREVIATING + 1
      const totalPages = page + 4
      const items = buildPaginationItems(page, totalPages, 25, {
        frn: '123 456',
        schemeName: 'SFI'
      })

      expect(items).toEqual(expect.arrayContaining([
        { number: page - 1, current: false, href: `?page=${page - 1}&perPage=25&frn=123%20456&schemeName=SFI` },
        { number: page, current: true, href: `?page=${page}&perPage=25&frn=123%20456&schemeName=SFI` },
        { number: page + 1, current: false, href: `?page=${page + 1}&perPage=25&frn=123%20456&schemeName=SFI` }
      ]))
      expect(items.filter(item => item.ellipsis)).toHaveLength(2)
    })
  })

  describe('parsePaginationParams', () => {
    test('parses positive page and perPage values', () => {
      expect(parsePaginationParams({ page: '3', perPage: '50' }, 20))
        .toEqual({ page: 3, perPage: 50 })
    })

    test('uses defaults for missing, invalid, or non-positive values', () => {
      expect(parsePaginationParams({ page: '0', perPage: 'not-a-number' }, 20))
        .toEqual({ page: DEFAULT_PAGE, perPage: 20 })
      expect(parsePaginationParams({}, 20))
        .toEqual({ page: DEFAULT_PAGE, perPage: 20 })
    })
  })

  describe('withPagination', () => {
    test('passes arguments through and adds page count and pagination items', async () => {
      const fetchAndShape = jest.fn().mockResolvedValue({
        data: ['a', 'b'],
        count: 21
      })
      const fetchPaginated = withPagination(fetchAndShape)

      const result = await fetchPaginated({
        page: 2,
        perPage: 10,
        frn: '123'
      })

      expect(fetchAndShape).toHaveBeenCalledWith({
        page: 2,
        perPage: 10,
        frn: '123'
      })
      expect(result.data).toEqual(['a', 'b'])
      expect(result.totalPages).toBe(3)
      expect(result.paginationItems.find(item => item.current).number).toBe(2)
    })

    test('returns zero pages when count is zero', async () => {
      const fetchPaginated = withPagination(
        jest.fn().mockResolvedValue({ data: [], count: 0 })
      )

      await expect(fetchPaginated({ page: 1, perPage: 10 }))
        .resolves.toEqual({ data: [], totalPages: 0, paginationItems: [] })
    })
  })

  describe('redirectWithFilters', () => {
    test('redirects with default pagination and non-empty filters', () => {
      const h = { redirect: jest.fn().mockReturnValue('redirect-response') }

      const result = redirectWithFilters(h, '/closures', 25, {
        frn: '123 456',
        schemeName: 'SFI',
        empty: '',
        missing: undefined
      })

      expect(result).toBe('redirect-response')
      expect(h.redirect).toHaveBeenCalledWith(
        `/closures?page=${DEFAULT_PAGE}&perPage=25&frn=123+456&schemeName=SFI`
      )
    })
  })

  describe('filterAndPaginateHolds', () => {
    const holds = [
      { frn: '111', holdCategorySchemeName: 'SFI', id: 1 },
      { frn: '222', holdCategorySchemeName: 'SFI', id: 2 },
      { frn: '111', holdCategorySchemeName: 'BPS', id: 3 },
      { frn: '111', holdCategorySchemeName: 'SFI', id: 4 }
    ]

    test('filters by FRN and scheme, then returns the requested page', () => {
      const result = filterAndPaginateHolds(holds, {
        frn: 111,
        schemeName: 'SFI',
        page: 2,
        perPage: 1
      })

      expect(result).toEqual({
        paymentHolds: [holds[3]],
        numberOfHolds: 2,
        page: 2,
        perPage: 1
      })
    })

    test('returns all holds with default pagination when filters are omitted', () => {
      const result = filterAndPaginateHolds(holds)

      expect(result).toEqual({
        paymentHolds: holds.slice(0, DEFAULT_PER_PAGE),
        numberOfHolds: holds.length,
        page: DEFAULT_PAGE,
        perPage: DEFAULT_PER_PAGE
      })
    })

    test('returns an empty page when the requested page is beyond the results', () => {
      const result = filterAndPaginateHolds(holds, { page: 10, perPage: 2 })

      expect(result.paymentHolds).toEqual([])
      expect(result.numberOfHolds).toBe(holds.length)
    })
  })
})
