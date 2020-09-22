'use strict'

const Base = require('./base')
const Item = require('./item')
const Holding = require('./holding')
const db = require('../db')
const utils = require('../utils')
const sierraLocationMapping = require('@nypl/nypl-core-objects')('by-sierra-location')

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
    //  * its items are all electronic and its nypl:catalogBibLocation[s] include
    //    locations with collectionType "Research"

    const itemsCount = this.items().length
    const researchItemsCount = this.items().filter((item) => item.isResearch()).length
    const nonElectronicItemsCount = this.items().filter((item) => !item.isElectronic()).length

    return this.isPartner() ||
      itemsCount === 0 ||
      researchItemsCount > 0 ||
      (nonElectronicItemsCount === 0 && this.researchLocations().length > 0)
  }

  items() {
    return this._items || []
  }

  holdings() {
    return this._holdings || []
  }

  /**
   * Return array of bib locations mapped to nypl-core locations, which have
   * collectionType 'Research'
   */
  researchLocations () {
    return (this.objectIds('nypl:catalogBibLocation') || [])
      .map((locationId) => sierraLocationMapping[utils.stripNamespace(locationId)])
      .filter((location) => location && location.collectionTypes.indexOf('Research') >= 0)
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

  doc._holdings = []
  if (result.holding_statements) {
    doc._holdings = utils.groupBy(result.holding_statements, 's')
    doc._holdings = doc._holdings.map(Holding.fromStatements)
  }

  return doc
}

module.exports = Bib
