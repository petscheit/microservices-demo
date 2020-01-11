'use strict';

const config = require(`./${process.env.NODE_ENV || 'production'}`)

module.exports = config;