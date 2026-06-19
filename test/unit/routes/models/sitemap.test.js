const ViewModel = require('../../../../app/routes/models/sitemap')

describe('sitemap ViewModel', () => {
  test('builds model with sections', () => {
    const sections = [
      { title: 'Section 1', links: [{ href: '/link1', text: 'Link 1' }] },
      { title: 'Section 2', links: ['/link2'] }
    ]
    const model = new ViewModel(sections)
    expect(model.model.title.text).toBe('Sitemap')
    expect(model.model.sections).toHaveLength(2)
    expect(model.model.sections[0].title).toBe('Section 1')
    expect(model.model.sections[1].links[0]).toEqual({ href: '/link2', text: '/link2' })
  })

  test('handles empty sections array', () => {
    const model = new ViewModel([])
    expect(model.model.sections).toEqual([])
  })

  test('handles missing sections (default)', () => {
    const model = new ViewModel()
    expect(model.model.sections).toEqual([])
  })

  test('handles sections with no links', () => {
    const model = new ViewModel([{ title: 'Empty' }])
    expect(model.model.sections[0].links).toEqual([])
  })

  test('handles sections with no title', () => {
    const model = new ViewModel([{ links: [] }])
    expect(model.model.sections[0].title).toBe('')
  })
})
