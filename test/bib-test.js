const fixtures = require('./fixtures')

const Bib = require('../index').Bib

describe('Bib model', function () {
  before(fixtures.enable)

  after(fixtures.disable)

  it('should identify type', function () {
    return Bib.byId('b17655587').then((bib) => {
      expect(bib.objectId('rdfs:type')).to.be.a('string')
      expect(bib.objectId('rdfs:type')).to.equal('nypl:Item')
    })
  })

  it('should identify startDate literal', function () {
    return Bib.byId('b17655587').then((bib) => {
      expect(bib.literal('dbo:startDate')).to.be.a('string')
      expect(bib.literal('dbo:startDate')).to.equal('1964')
    })
  })

  it('should identify multiple subject literals', function () {
    return Bib.byId('b17655587').then((bib) => {
      expect(bib.literal('dc:subject')).to.be.a('string')
      expect(bib.literal('dc:subject')).to.equal('Films by teenagers.')

      expect(bib.literals('dc:subject')).to.be.a('array')
      expect(bib.literals('dc:subject')).to.have.lengthOf(2)
      expect(bib.literals('dc:subject')[1]).to.be.a('string')
      expect(bib.literals('dc:subject')[1]).to.equal('Comedy films.')
    })
  })

  it('should identify identifiers with types', function () {
    return Bib.byId('b10781594').then((bib) => {
      expect(bib.statement('dcterms:identifier')).to.be.a('object')
      expect(bib.statement('dcterms:identifier').object_id).to.equal('10781594')
      expect(bib.statement('dcterms:identifier').object_type).to.equal('nypl:Bnumber')
      expect(bib.statements('dcterms:identifier')[1]).to.be.a('object')
      expect(bib.statements('dcterms:identifier')[1].object_id).to.equal('0815751621')
      expect(bib.statements('dcterms:identifier')[1].object_type).to.equal('bf:Isbn')
      expect(bib.statements('dcterms:identifier')[2]).to.be.a('object')
      expect(bib.statements('dcterms:identifier')[2].object_id).to.equal('81007685')
      expect(bib.statements('dcterms:identifier')[2].object_type).to.equal('bf:Lccn')
    })
  })

  it('should identify blank nodes', function () {
    return Bib.byId('b18064236').then((bib) => {
      expect(bib.blankNode('skos:note')).to.be.a('object')
      expect(bib.blankNode('skos:note').statements()).to.be.a('array')
      expect(bib.blankNode('skos:note').statements().length).to.equal(3)
      expect(bib.blankNode('skos:note').literal('rdfs:label')).to.be.a('string')
      expect(bib.blankNode('skos:note').literal('rdfs:label')).to.equal('Dolby 2.0; anamorphic widescreen format.')
      expect(bib.blankNode('skos:note').literal('bf:noteType')).to.equal('General Note')
      expect(bib.blankNode('skos:note').objectId('rdfs:type')).to.equal('bf:Note')
    })
  })

  it('should identify Research locations', function () {
    return Bib.byId('b16369525').then((bib) => {
      expect(bib.researchLocations()).to.be.a('array')
      expect(bib.researchLocations()).to.have.lengthOf(1)
      expect(bib.researchLocations()[0]).to.be.a('object')
      expect(bib.researchLocations()[0].collectionTypes).to.be.a('array')
      expect(bib.researchLocations()[0].collectionTypes).to.have.lengthOf(2)
      expect(bib.researchLocations()[0].collectionTypes).to.have.members(['Research', 'Branch'])
    })
  })

  describe('Bib.isResearch', function () {
    it('should identify b16369525 as research because it has 1 electronic item and a Research location', function () {
      return Bib.byId('b16369525').then((bib) => {
        expect(bib.isResearch()).to.equal(true)
      })
    })
  })

  describe('Bib.isPartner', function () {
    it('should identify non-partner bib', function () {
      return Bib.byId('b18064236').then((bib) => {
        expect(bib.isPartner()).to.be.a('boolean')
        expect(bib.isPartner()).to.equal(false)
      })
    })

    it('should identify partner bib', function () {
      return Bib.byId('cb6240214').then((bib) => {
        expect(bib.isPartner()).to.be.a('boolean')
        expect(bib.isPartner()).to.equal(true)
      })
    })
  })
})
