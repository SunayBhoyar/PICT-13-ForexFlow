const express = require('express')
const graphController = require('../controllers/graphController')

const router = express.Router()

router.get('/getData', graphController.getData)
router.get('/getDetails', graphController.getDetails)
router.get('/getCountryList', graphController.getCountryList)
router.get('/getAllCountriesExchange', graphController.getAllCountryExchange)

router.post('/postFile', graphController.postFile)

module.exports = router