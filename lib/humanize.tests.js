/* eslint-env mocha */
import expect from 'expect'
import humanize from './humanize'

describe('humanize', function () {
  it('works', function () {
    expect(humanize('super_snake_case')).toBe('Super snake case')
    expect(humanize('capitalizedCamelCase')).toBe('Capitalized camel case')
    expect(humanize('hyphen-case')).toBe('Hyphen case')
    expect(humanize('no-extensions-here.md')).toBe('No extensions here')
    expect(humanize('lower cased phrase')).toBe('Lower cased phrase')
    expect(humanize('  so many  spaces  ')).toBe('So many spaces')
    expect(humanize(123)).toBe('123')
    expect(humanize('')).toBe('')
    expect(humanize(null)).toBe('')
    expect(humanize(undefined)).toBe('')
    expect(humanize('externalSource')).toBe('External source')
    expect(humanize('externalSourceId')).toBe('External source ID')
    expect(humanize('externalSource_id')).toBe('External source ID')
    expect(humanize('_id')).toBe('ID')
    // Make sure it does not mess with "id" in the middle of a word
    expect(humanize('overridden')).toBe('Overridden')
  })
})
