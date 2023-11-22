const mongoose = require('mongoose')

const countrySchema = new mongoose.Schema({
  date: Date,
  currencyExchange: Object
})

const CountryModel = mongoose.model('CountryCurrency', countrySchema)

module.exports = CountryModel
