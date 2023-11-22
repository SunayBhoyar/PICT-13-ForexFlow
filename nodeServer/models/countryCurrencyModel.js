const mongoose = require('mongoose')

const countrySchema = new mongoose.Schema({
  country: String,
  currencyExchange: Object
})

const CountryModel = mongoose.model('CountryCurrency', countrySchema)

module.exports = CountryModel
