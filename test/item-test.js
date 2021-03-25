const fixtures = require('./fixtures')

const Bib = require('../index').Bib

describe('Item model', function () {
  before(fixtures.enable)

  after(fixtures.disable)

  it('should surface common predicates', function () {
    return Bib.byId('b17655587').then((bib) => {
      expect(bib.items()).to.be.a('array')
      expect(bib.items()).to.have.lengthOf(6)

      // Grab first nested item:
      let firstItem = bib.items().pop()

      // Verify item has .id:
      expect(firstItem).to.be.a('object')
      expect(firstItem).to.have.property('id', 'i17906171')

      // Verify `suppressed`
      expect(firstItem.literal('nypl:suppressed')).to.be.a('string')
      expect(firstItem.literal('nypl:suppressed')).to.equal('true')
      expect(firstItem.booleanLiteral('nypl:suppressed')).to.be.a('boolean')
      expect(firstItem.booleanLiteral('nypl:suppressed')).to.equal(true)

      // Verify `catalogItemType`
      expect(firstItem.objectId('nypl:catalogItemType')).to.be.a('string')
      expect(firstItem.objectId('nypl:catalogItemType')).to.equal('catalogItemType:133')
      expect(firstItem.statement('nypl:catalogItemType')).to.be.a('object')

      // Check alternate raw statement interface (for checking label, etc)
      expect(firstItem.statement('nypl:catalogItemType')).to.be.have.property('subject_id', 'i17906171')
      expect(firstItem.statement('nypl:catalogItemType')).to.be.have.property('object_id', 'catalogItemType:133')
      expect(firstItem.statement('nypl:catalogItemType')).to.be.have.property('object_label', 'RFVC - FILM PRESERVATION')
    })
  })

  it('should identify itype 132 as research', function () {
    return Bib.byId('b17655587').then((bib) => {
      // This bib has 6 items at writing. Four are suppressed by icode2 rules.
      // Two have itype 132 and should not be suppressed. Those two should be
      // considered 'Research' because itype 132 has collectionType 'Research' in
      // https://github.com/NYPL/nypl-core/blob/master/vocabularies/json-ld/catalogItemTypes.json

      // Grab the two items with itype 132:
      let itemsWithHighItype = bib.items().filter((item) => item.objectId('nypl:catalogItemType') === 'catalogItemType:132')

      // Confirm there are two:
      expect(itemsWithHighItype).to.be.a('array')
      expect(itemsWithHighItype).to.have.lengthOf(2)

      // Confirm each of them self reports as research:
      itemsWithHighItype.forEach((item) => {
        expect(item.isResearch()).to.be.a('boolean')
        expect(item.isResearch()).to.equal(true)
      })
    })
  })

  describe('identifier representations in store', function () {
    it('should pass (older) urn prefixed identifier values through without modification', function () {
      return Bib.byId('b17655587').then((bib) => {
        // Check a specific known item:
        let item = bib.items().filter((i) => i.id === 'i17906175').pop()

        // Check the only dcterms:identifier statement:
        expect(item.statement('dcterms:identifier')).to.be.a('object')
        expect(item.statement('dcterms:identifier')).to.have.property('object_id', 'urn:barcode:33333205133792')
        expect(item.statement('dcterms:identifier')).to.have.property('object_type', undefined)
      })
    })

    it('should pass (newer) non-urn-prefixed values through with object_type when avaiable', function () {
      return Bib.byId('b10781594').then((bib) => {
        // Check the only item:
        let firstItem = bib.items().pop()

        // Check the only dcterms:identifier statement:
        expect(firstItem.statement('dcterms:identifier')).to.be.a('object')
        expect(firstItem.statement('dcterms:identifier')).to.have.property('object_id', '33433057085312')
        expect(firstItem.statement('dcterms:identifier')).to.have.property('object_type', 'bf:Barcode')
      })
    })
  })

  describe('Partner items', function () {
    it('should handle partner bib with single item', function () {
      return Bib.byId('pb1941480').then((bib) => {
        expect(bib.items()).to.be.a('array')
        expect(bib.items().length).to.equal(1)

        expect(bib.items()[0]).to.be.a('object')
        expect(bib.items()[0].isResearch()).to.equal(true)
        expect(bib.items()[0].isElectronic()).to.equal(false)
        expect(bib.items()[0].statement('rdfs:type').object_id).to.equal('bf:Item')
        expect(bib.items()[0].statement('nypl:suppressed').object_literal).to.equal('false')
        expect(bib.items()[0].statement('nypl:shelfMark').object_literal).to.equal('8176.612')
        expect(bib.items()[0].statement('nypl:owner').object_id).to.equal('orgs:0003')
        expect(bib.items()[0].statement('nypl:owner').object_label).to.equal('Princeton University Library')
        expect(bib.items()[0].statement('nypl:accessMessage').object_id).to.equal('accessMessage:1')
        expect(bib.items()[0].statement('dcterms:identifier').object_id).to.equal('32101058934488')
      })
    })

    it('should handle partner bib with 3 items', function () {
      return Bib.byId('pb2833949').then((bib) => {
        expect(bib.items()).to.be.a('array')
        expect(bib.items().length).to.equal(3)

        expect(bib.items()[0]).to.be.a('object')
        expect(bib.items()[0].statement('nypl:shelfMark').object_literal).to.equal('2559.1833')
        expect(bib.items()[0].statement('dcterms:identifier').object_id).to.equal('urn:barcode:32101056291717')

        expect(bib.items()[1]).to.be.a('object')
        expect(bib.items()[1].statement('nypl:shelfMark').object_literal).to.equal('2559.1833')
        // This one is a more recently updated record, so has entity- rather
        // than urn-style barcode statement (both should be supported):
        expect(bib.items()[1].statement('dcterms:identifier').object_id).to.equal('32101056291709')
        expect(bib.items()[1].statement('dcterms:identifier').object_type).to.equal('bf:Barcode')

        expect(bib.items()[2]).to.be.a('object')
        expect(bib.items()[2].statement('nypl:shelfMark').object_literal).to.equal('2559.1833')
        expect(bib.items()[2].statement('dcterms:identifier').object_id).to.equal('urn:barcode:32101055636631')
      })
    })
  })
})
