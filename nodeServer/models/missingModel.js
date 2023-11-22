const mongoose = require('mongoose')

const missingSchema = new mongoose.Schema({
  dates: [String]
})

const MissingModel = mongoose.model('MissingDates', missingSchema)

module.exports = MissingModel
