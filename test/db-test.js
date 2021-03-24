const db = require('../lib/db')

describe('DB', function () {
  describe('_separateItemAndHoldingRecords', function () {
    it('should separate item statements from holding statements', function () {
      const dbJsonResult = require('./data/db-raw-pb2833949.json')

      const resource = db._internal._separateItemAndHoldingRecords(dbJsonResult)

      expect(resource).to.be.a('object')

      expect(resource.bib_statements).to.be.a('array')
      expect(resource.bib_statements.length).to.eq(28)

      expect(resource.holding_statements).to.be.a('array')
      expect(resource.holding_statements.length).to.eq(0)

      expect(resource.item_statements).to.be.a('array')
      expect(resource.item_statements.length).to.eq(33)
    })
  })
})
