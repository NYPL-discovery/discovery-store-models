const { expect } = require('chai')
const fixtures = require('./fixtures')
const Bib = require('../index').Bib

describe('Holding Model', () => {
  before(fixtures.enable)

  after(fixtures.disable)

  it('should set core fields', () => {
    return Bib.byId('b11254422').then((bib) => {
      expect(bib.holdings()).to.be.a('array')
      expect(bib.holdings()).to.have.lengthOf(1)

      const holding = bib.holdings()[0]

      expect(holding).to.be.a('object')
      expect(holding).to.have.property('id', 'h1000993')

      expect(holding.literal('nypl:suppressed')).to.equal('false')

      expect(holding.literal('nypl:shelfMark')).to.equal('MFWA+ 89-1277')

      expect(holding.objectId('rdfs:type')).to.equal('nypl:Holding')
    })
  })

  it('should get an array of holding statements', () => {
    return Bib.byId('b11254422').then((bib) => {
      const holding = bib.holdings()[0]

      expect(holding.literals('dcterms:coverage')).to.have.lengthOf(2)
      expect(holding.literals('dcterms:coverage')[0]).to.equal('27(1988)-40:156(2020)-')
      expect(holding.literals('dcterms:coverage')[1]).to.equal('no. 3840 (2018/2020)')
    })
  })

  it('should contain a location code and label', () => {
    return Bib.byId('b11254422').then((bib) => {
      const holding = bib.holdings()[0]

      expect(holding.objectId('nypl:holdingLocation')).to.equal('loc:rc2ma')
      expect(holding.statement('nypl:holdingLocation').object_label).to.equal('Offsite')
    })
  })

  it('should contain an array of check in cards as blanknodes', () => {
    return Bib.byId('b11254422').then((bib) => {
      const holding = bib.holdings()[0]

      expect(holding.blankNodes('dcterms:hasPart')).to.have.lengthOf(15)

      const firstBlankNode = holding.blankNodes('dcterms:hasPart')[1]
      expect(firstBlankNode.objectId('rdf:type')).to.equal('nypl:CheckInBox')
      expect(firstBlankNode.literal('dcterms:coverage')).to.equal('40:156 (2020--)')
      expect(firstBlankNode.literal('bf:status')).to.equal('Arrived')
      expect(firstBlankNode.literal('bf:count')).to.equal(null)
      expect(firstBlankNode.literal('bf:part')).to.equal('14')

      const secondBlankNode = holding.blankNodes('dcterms:hasPart')[9]
      expect(secondBlankNode.objectId('rdf:type')).to.equal('nypl:CheckInBox')
      expect(secondBlankNode.literal('dcterms:coverage')).to.equal('38:147 (2018--)')
      expect(secondBlankNode.literal('bf:status')).to.equal('Arrived')
      expect(secondBlankNode.literal('bf:count')).to.equal(null)
      expect(secondBlankNode.literal('bf:part')).to.equal('5')
    })
  })
})
