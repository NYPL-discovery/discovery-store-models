'use strict'

const Base = require('./base')
const Item = require('./item')
const db = require('../db')
const utils = require('../utils')

class Bib extends Base {
  // Helper to check a bib's suppressed flag:
  isSuppressed () {
    return this.booleanLiteral('nypl:suppressed')
  }

  // Helper to determine if a bib's items make the bib research or circulating
  isResearch () {
    // It's a research item if:
    //  * it's PUL/CUL OR
    //  * it has 0 items OR
    //  * at least one research item
    return /^[pc]/.test(this.uri) ||
      this.items().length === 0 ||
      this.items().filter((item) => item.isResearch()).length > 0
  }

  items () {
    return this._items || []
  }
}

Bib.byId = (id) => {
  return db.resources.bib(id).then(Bib.fromDbJsonResult)
}

Bib.byIds = (ids) => {
  return db.resources.bibs(ids).then((results) => results.map(Bib.fromDbJsonResult))
}

Bib.fromDbJsonResult = (result) => {
  let bibStatements = result.bib_statements.map(Base.parseStatementFromJsonDbResult)
  var doc = new Bib(bibStatements)
  doc.uri = result.subject_id
  doc._items = []
  if (result.item_statements) {
    utils.groupBy(result.item_statements, 's')
    doc._items = utils.groupBy(result.item_statements, 's')
    doc._items = doc._items.map(Item.fromStatements)
  }
  return doc
}

module.exports = Bib
