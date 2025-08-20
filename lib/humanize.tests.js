/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import humanize from './humanize'

describe('humanize', function () {
  it('works', function () {
    expect(humanize('super_snake_case')).to.equal('Super snake case')
    expect(humanize('capitalizedCamelCase')).to.equal('Capitalized camel case')
    expect(humanize('hyphen-case')).to.equal('Hyphen case')
    expect(humanize('no-extensions-here.md')).to.equal('No extensions here')
    expect(humanize('lower cased phrase')).to.equal('Lower cased phrase')
    expect(humanize('  so many  spaces  ')).to.equal('So many spaces')
    expect(humanize(123)).to.equal('123')
    expect(humanize('')).to.equal('')
    expect(humanize(null)).to.equal('')
    expect(humanize(undefined)).to.equal('')
    expect(humanize('externalSource')).to.equal('External source')
    expect(humanize('externalSourceId')).to.equal('External source ID')
    expect(humanize('externalSource_id')).to.equal('External source ID')
    expect(humanize('_id')).to.equal('ID')
    // Make sure it does not mess with "id" in the middle of a word
    expect(humanize('overridden')).to.equal('Overridden')
  })
})
