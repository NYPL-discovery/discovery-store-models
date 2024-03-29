# Archived 10/27/2023

This app's role has been made redundant with the retirement of the Discovery Hybrid Indexer. The new indexer can be found [here](https://github.com/NYPL/research-catalog-indexer).

# Discovery Store Models

## Purpose

This repo centralizes access to the discovery-store, a Postgres database organized like a triple store storing all of the statements we've collected about bibliographic records ("bibs"), their physical/electronic children ("items"), and other connected entities.

### Current Version

v1.5.0

# Usage

Include this module as a dependency in your `package.json` as follows:

```
"discovery-store-models": "git+https://github.com/NYPL-discovery/discovery-store-models.git#v1.4.0",
```

Initialize as follows:

```
const DiscoveryModels = require('discovery-store-models')
DiscoveryModels.connect(process.env.DISCOVERY_STORE_CONNECTION_URI)
```

## Get a bib

```
DiscoveryModels.Bib.byId('b1234').then((bib) => {
  console.log(`Got bib: ${bib.literal('title')} (${bib.items().length} items)`)
})
```

## Get multiple bibs:

```
DiscoveryModels.Bib.byIds([ 'b1234', 'b5678' ]).then((bibs) => {
  console.log('Got : ' + bibs.length)
  bibs.forEach((bib) => { 
    console.log(`  ${bib.literal('title')} (${bib.items().length} items)`)
  })
})
```

## Get an item

Items for a given bib are pre-fetched via `DiscoveryModels.Bib.byId[s]`. However, if you just want a single item all on its own, you can retrieve it sans parent via `DiscoveryModels.Item.byId` as follows:

```
DiscoveryModels.Item.byId('i1234').then((item) => {
  console.log(`Got single item: ${item.literal('shelfMark')}`)
})
```

## Common model methods

All models (bibs, items, and blank-nodes) implement the following baseline api:

 * `blankNode[s] (pred)`: Returns first/all blank-nodes matching predicate
 * `booleanLiteral (pred)`: Returns first statement literal matching predicate, cast as a boolean
 * `has (pred)`: Returns true if the predicate exists on the object
 * `literal[s] (pred)`: Returns first/all statement literal matching predicate
 * `objectId[s] (pred)`: Returns first/all statement object_ids matching predicate
 * `statement[s] (pred)`: Returns first/all *raw* statements matching given predicate (useful if you need other columns besides object_literal/object_id)

## Config

The following environmental variables are examined:

 * `DB_APPLICATION_NAME`: Tags db connections with the given string (useful for identifying connected clients on the db side)

## Utils

Decompose a DiscoveryStore id using `NyplSourceMapper`:

```
const NyplSourceMapper = require('discovery-store-models/lib/nypl-source-mapper')
const { nyplSource, id, type } = NyplSourceMapper.instance()
  .splitIdentifier('b12082323')
// `nyplSource` === 'sierra-nypl'
// `id` === '12082323'
// `type` === 'bib'
```

# Contributing

This repo has a single primary branch: `main`. The procedure for promoting code is:

 - Create feature branch off `main`
 - Compute next logical version and update `README.md`, `package.json`, etc.
 - Create PR against `main`
 - After review, merge
 - Git tag `main` with new version number

# Future Work

This currently satisfies the API needs of the DiscoveryStoreUpdater and DiscoveryApiIndexer as far as reading bibs/items from the database goes. It does not implement *writing* concerns. The following will need to be written in some form to completely isolate access to the database in this module:

 * `db.upsertStatements(type = 'resource', statements = [])`
 * `db.deleteStaleStatements(type = 'resource', statements = [], subtype = 'bib')`


## Testing

```
npm test
```

A script is provided for adding/updating test fixtures.

This will update all fixtures against configured db:
```
node scripts/update-test-fixtures --profile [profile] --envfile [creds file]
```

Use `--id` to update a single bib. For example, this updates fixture for 'b10781594' using qa creds
```
node scripts/update-test-fixtures --id b10781594 --profile nypl-sandbox --envfile config/qa.env
```
