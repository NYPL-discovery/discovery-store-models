global.expect = require('chai').expect

const originalCoreVersion = process.env.NYPL_CORE_VERSION

after(() => {
  process.env.NYPL_CORE_VERSION = originalCoreVersion
})
