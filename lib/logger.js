const winston = require('winston')
winston.emitErrs = false

const level = 'info'

let loggerTransports = []

// Don't log anything when running tests
if (process.env.NODE_ENV !== 'test') {
  loggerTransports.push(new winston.transports.Console({
    level,
    handleExceptions: true,
    // json: true,
    stringify: true,
    colorize: true,
    filters: [(level, msg, meta) => `discovery-store-models: ${msg}`]
  }))
}

const logger = new winston.Logger({
  transports: loggerTransports,
  exitOnError: false
})

module.exports = logger
