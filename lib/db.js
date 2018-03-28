const url = require('url')

const logger = require('./logger')
const errors = require('./errors')

const pgp = require('pg-promise')()
let db = null

const QueryStream = require('pg-query-stream')

var stream = (query, values, options) => {
  logger.debug('DB: Stream SQL: ', query)
  var qs = new QueryStream(query, values)

  return new Promise((resolve, reject) => {
    db.stream(qs, (s) => {
      resolve(s)
    }).catch((e) => {
      console.log('stream error: ', e)
    })
  })
}

// Returns a stream of bibs (i.e. for bulk processing)
function bibsStream (options) {
  var query = _bibSqlQueryString(options)
  return stream(query.sql, query.values, query.options)
}

// Returns bibs matching bnums
function bibs (bnums) {
  var query = _bibSqlQueryString({ subject_ids: bnums, offset: 0, limit: bnums.length })
  return db.many(query.sql, query.values, query.options).then((resources) => {
    if (resources) logger.debug('DB: Retrieved ' + resources.length + ' resources for ' + bnums.length + ' bnums')
    else logger.debug('DB: Retrieved NO bibs for ' + bnums)

    return resources
  })
}

// Return single bib matching uri (bnum)
function bib (id) {
  if (!connected()) throw new errors.DbNotConnectedError('Attempt to fetch record when not connected')

  var query = _bibSqlQueryString({ offset: 0, limit: 1, subject_id: id })
  logger.debug('DB: db.one(' + query.sql + ')')
  return db.one(query.sql, query.values, query.options).then((resource) => {
    logger.debug('DB: Got rec: ', resource)
    if (resource && resource.bib_statements) logger.debug('DB: Retrieved ' + resource.bib_statements.length + ' bib statements, ' + (resource.item_statements && resource.item_statements.length ? resource.item_statements.length + ' item statements' : ''))
    else logger.debug('DB: Retrieved null bib for ' + id)

    return resource
  })
}

/**
 *  This internal utility function returns a sql string calling json_agg on a series of standard columns
 *
 *  @example
 *  // This returns something like the following:
 *  //   "json_agg(json_build_object('pr', _BS.predicate, 'id', _BS.object_id, 'ty', _BS.object_type, 'li', _BS.object_literal, ...))::jsonb"
 *  _jsonAggSelectString('_BS')
 */
function _jsonAggSelectString (tableAlias, opts) {
  opts = Object.assign({ additionalColumns: {} }, opts)

  // Establish the default columns selected as a map consisting of:
  //  - Keys: The json properties we want in the resulting json doc
  //  - Values: The sql columns we're selecting:
  let colAliasMap = { pr: 'predicate', id: 'object_id', ty: 'object_type', li: 'object_literal', la: 'object_label' }

  // If we're adding additional column selects, add them:
  // e.g. If we're building an aggregate select statement for a top-level bib
  // or item, we probably want to select blank nodes as well:
  if (opts.additionalColumns) {
    Object.keys(opts.additionalColumns).forEach((alias) => {
      colAliasMap[alias] = opts.additionalColumns[alias]
    })
  }

  // This generates a string like:
  //   "json_agg(json_build_object('pr', _BS.predicate, 'id', _BS.object_id, 'li', _BS.object_literal, ...))::jsonb"
  return 'json_agg(json_build_object(' +
    Object.keys(colAliasMap)
      .map((alias) => `'${alias}', ${tableAlias}.${colAliasMap[alias]}`)
      .join(', ') +
    '))::jsonb'
}

function _bibSqlQueryString (options) {
  var ret = {
    sql: null,
    values: null,
    options: options || {}
  }

  var whereClauses = [
    "B.predicate='rdfs:type'",
    "B.object_id IN ('nypl:Item', 'nypl:Collection')"
  ]
  // Match one subject:
  if (options.subject_id) {
    whereClauses.push('B.subject_id=${subject_id}') // eslint-disable-line no-template-curly-in-string
    ret.values = { subject_id: options.subject_id }

    // TODO
    // I do not know why, but adding a LIMIT completely changes the sql plan.
    // Grinds to a halt.
    delete options.limit
  }
  // Match multiple subjects:
  if (options.subject_ids) {
    whereClauses.push('B.subject_id IN (${subject_ids:csv})') // eslint-disable-line no-template-curly-in-string
    ret.values = { subject_ids: options.subject_ids }

    // Since we're fetching finite bibs, no need for limit. (See above)
    delete options.limit
  }

  ret.sql = `
    SELECT B.subject_id,
    (
      SELECT ${_jsonAggSelectString('_BS', { additionalColumns: { bn: 'blanknode' } })} AS statements
        FROM (
        SELECT __BS.predicate, __BS.object_id, __BS.object_type, __BS.object_literal, __BS.object_label,
          (
            SELECT ${_jsonAggSelectString('__BS_blanknode')} AS statements
            FROM resource_statement __BS_blanknode
            WHERE __BS_blanknode.subject_id=__BS.object_id
          ) AS blankNode
          FROM resource_statement __BS
          WHERE __BS.subject_id=B.subject_id
        ) _BS
    ) as bib_statements,
    (
      SELECT ${_jsonAggSelectString('_IS', { additionalColumns: { s: 'subject_id', bn: 'blanknode' } })} AS statements
      FROM (
        SELECT __IS.subject_id, __IS.predicate, __IS.object_id, __IS.object_type, __IS.object_literal, __IS.object_label,
        (
          SELECT ${_jsonAggSelectString('__IS_blanknode')} AS statements
          FROM resource_statement __IS_blanknode
          WHERE __IS_blanknode.subject_id=__IS.object_id
        ) AS blankNode
        FROM resource_statement __I
        INNER JOIN resource_statement __IS ON __IS.subject_id=__I.subject_id
        WHERE __I.predicate='nypl:bnum' AND __I.object_id = CONCAT('urn:bnum:', B.subject_id)
      ) _IS
    ) AS item_statements
    FROM resource_statement B
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY B.subject_id
    OFFSET ${options.offset}`

  if (options.limit) ret.sql += ` LIMIT ${options.limit}`

  logger.debug('SQL: ' + ret.sql, options.query)
  return ret
}

var getStatements = (tableName, subjectId) => {
  return db.any(`SELECT * FROM ${tableName} WHERE subject_id = $1`, [subjectId])
}

var _connectionUri = null

const setConnectionUri = (uri) => {
  logger.debug('DB: Set connection URI: ' + uri.replace(/:[^@]+@/, ':...@'))
  _connectionUri = uri

  // Set connection creds by URI:
  const params = url.parse(uri)
  const auth = params.auth.split(':')

  let connectionConfig = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1]
  }
  // For tagging queries, e.g. 'discovery-index-poster#v0.0.1'
  if (process.env.DB_APPLICATION_NAME) connectionConfig.application_name = process.env.DB_APPLICATION_NAME

  db = pgp(connectionConfig)
}

var disconnect = () => {
  return pgp.end()
}

var connected = () => {
  return Boolean(_connectionUri)
}

module.exports = {
  connected,
  getStatements,
  resources: {
    bib,
    bibs,
    bibsStream
  },
  setConnectionUri,
  disconnect
}
