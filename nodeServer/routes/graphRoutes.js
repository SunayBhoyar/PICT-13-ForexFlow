const express = require('express')
const graphController = require('../controllers/graphController')

const router = express.Router()

router.get('/getDetails', graphController.getData)
router.post('/postFile', graphController.postFile)

module.exports = router

