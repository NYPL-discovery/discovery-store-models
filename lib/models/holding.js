const Base = require('./base')
const db = require('../db')

// Holding records have no special methods at the moment
// so this can directly subclass Base with no additional methods. Obviously it
// can be extended in the future
class Holding extends Base {}

Holding.byId = (id) => {
  return db.getStatements('resource', id).then((s) => new Holding(s))
}

Holding.fromStatements = (stmts) => {
  var doc = new Holding(stmts.map((s) => {
    const stmt = {
      subject_id: s.s,
      predicate: s.pr,
      object_id: s.id,
      object_literal: s.li,
      object_label: s.la,
      object_type: s.ty
    }

    if (s.bn) {
      const bnStmt = s.bn.map(Base.parseStatementFromJsonDbResult)
      stmt.blanknode = new Base(bnStmt)
    }

    return stmt
  }))

  doc.uri = stmts[0].s
  return doc
}

module.exports = Holding
