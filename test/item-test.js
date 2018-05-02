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
})
