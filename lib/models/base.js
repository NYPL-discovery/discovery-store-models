const NyplSourceMapper = require('../nypl-source-mapper')

class Base {
  constructor (stmts) {
    this._statements = stmts
    if (this._statements && this._statements.length > 0) this.id = this._statements[0].subject_id
  }

  each (pred, cb) {
    return this.statements(pred)
      .sort((p1, p2) => {
        if (p1.object_id && p2.object_id) return p1.object_id > p2.object_id ? 1 : -1
        else if (p1.object_literal && p2.object_literal) return p1.object_literal > p2.object_literal ? 1 : -1
      })
      .map((trip) => cb(trip))
  }

  has (pred) {
    return this.statements(pred).length > 0
  }

  statements (pred = null) {
    return this._statements
      .filter((s) => !pred || s.predicate === pred)
  }

  statement (pred) {
    return this.statements(pred)[0]
  }

  literals (pred) {
    return this.statements(pred).map((s) => s.object_literal)
  }

  literal (pred) {
    return this.literals(pred)[0]
  }

  booleanLiteral (pred) {
    return this.literal(pred) === 'true'
  }

  objectIds (pred) {
    return this.statements(pred).map((s) => s.object_id)
  }

  objectId (pred) {
    return this.objectIds(pred)[0]
  }

  blankNodes (pred, cb) {
    const nodes = this.statements(pred)
      .filter((statement) => statement.blanknode)
      .map((statement) => statement.blanknode)
    if (cb) return nodes.map(cb)
    else return nodes
  }

  blankNode (pred) {
    return this.blankNodes(pred)[0]
  }

  label () {
    return this.literal('skos:prefLabel')
  }

  /**
   * Partner bibs & items are those records whose id is prefixed with a partner prefix.
   * At writing, those prefixes are p for PUL/Princeton and c for CUL/Columbia.
   */
  isPartner () {
    const { nyplSource } = NyplSourceMapper.instance().splitIdentifier(this.uri)

    return nyplSource !== 'sierra-nypl'
  }
}

/**
 *  Given a single json db result, returns a copy with un-shortened keys
 *  (This reverses the effect of the json_agg select, which aliases columns
 *  with shortened names like 'pr' for 'predicate' to conserve bandwidth)
 */
Base.parseStatementFromJsonDbResult = (result) => {
  let statement = {
    subject_id: result.s,
    predicate: result.pr,
    index: result.index,
    object_id: result.id,
    object_type: result.ty,
    object_literal: result.li,
    object_label: result.la
  }
  // If statement includes a `bn` (blank-node) property storing an array of
  // serialized statements, un-shorten them and instantiate a Base instance:
  if (result.bn) {
    const blankNodeStatements = result.bn.map(Base.parseStatementFromJsonDbResult)
    statement.blanknode = new Base(blankNodeStatements)
  }
  return statement
}

module.exports = Base
