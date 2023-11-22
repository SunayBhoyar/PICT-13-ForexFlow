const axios = require('axios')
const FormData = require('form-data')
const mongoose = require('mongoose')

const CountryModel = require('../models/countryCurrencyModel')
const MissingModel = require('../models/missingModel')

exports.getData = async (req, res, next) => {
  try {
    console.log('Making request to Flask API')
    const response = await axios.get(
      'http://127.0.0.1:5000/get-process-csv-response'
    )
    const data = response.data
    const dates = data.missing_dates

    const missing = new MissingModel({
      dates: Object.values(dates)
    })
    await missing.save()

    var maxLimit = 100
    data.result.forEach(async countryData => {
      maxLimit -= 1
      if (maxLimit < 0) {
        return
      }
      var index = countryData.index
      delete countryData.index
      var countryExchangeObject = countryData

      const newDocument = new CountryModel({
        date: new Date(convertDate(index)),
        currencyExchange: countryExchangeObject
      })

      await newDocument.save()
    })
    return res.status(200).json({ message: 'Success!!', data: response.data })
  } catch (error) {
    return res.status(404).json({ message: error.message })
  }
}

exports.postFile = async (req, res, next) => {
  try {
    if (req.files && req.files.file) {
      const file = req.files.file
      const apiUrl = 'http://127.0.0.1:5000/process_csv'
      const formData = new FormData()
      formData.append('file', file.data, { filename: file.name })
      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('File sent successfully:', response.data)
      return res
        .status(200)
        .json({ message: 'File sent successfully', data: response.data })
    } else {
      console.log('Files missing!')
      return res.status(400).json({ message: 'Files missing!' })
    }
  } catch (error) {
    console.error('Error sending file:', error.message)
    return res
      .status(500)
      .json({ message: 'Error sending file', error: error.message })
  }
}

const convertDate = dateString => {
  const dateObj = new Date(dateString)

  const year = dateObj.getUTCFullYear()
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0') // Months are zero-based, so adding 1
  const day = String(dateObj.getUTCDate()).padStart(2, '0')

  const formattedDate = `${year}-${month}-${day}`
  return formattedDate
}

exports.getDetails = async (req, res, next) => {
  try {
    var sourceCountry = req.body.sourceCountry
    var destinationCountry = req.body.destinationCountry
    var startDate = new Date(req.body.startDate)
    var endDate = new Date(req.body.endDate)

    if (!sourceCountry) {
      sourceCountry = 'U.S. dollar   (USD)'
    }
    const countryData = await CountryModel.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          sourceCountry: 1,
          destinationCountry: 1,
          exchangeRate: {
            $filter: {
              input: {
                $objectToArray: '$currencyExchange'
              },
              as: 'item',
              cond: {
                $eq: ['$$item.k', destinationCountry]
              }
            }
          }
        }
      },
      {
        $addFields: {
          exchangeRateValue: { $arrayElemAt: ['$exchangeRate.v', 0] },
          lastCharacter: {
            $substr: [
              { $toString: { $arrayElemAt: ['$exchangeRate.v', 0] } },
              {
                $subtract: [
                  {
                    $strLenCP: {
                      $toString: { $arrayElemAt: ['$exchangeRate.v', 0] }
                    }
                  },
                  1
                ]
              },
              -1
            ]
          }
        }
      },
      {
        $project: {
          date: 1,
          exchangeRate: {
            $cond: {
              if: { $eq: ['$lastCharacter', '*'] },
              then: {
                $substrCP: [
                  '$exchangeRateValue',
                  0,
                  { $subtract: [{ $strLenCP: '$exchangeRateValue' }, 1] }
                ]
              },
              else: '$exchangeRateValue'
            }
          },
          accurate: {
            $cond: {
              if: { $eq: ['$lastCharacter', '*'] },
              then: false,
              else: true
            }
          }
        }
      },
      {
        $addFields: {
          exchangeRate: {
            $cond: {
              if: { $eq: [{ $type: '$exchangeRate' }, 'string'] },
              then: { $toDouble: '$exchangeRate' },
              else: '$exchangeRate'
            }
          }
        }
      }
    ])

    if (!countryData) {
      return res.status(404).json({ message: 'Country not found!' })
    }
    console.log(countryData)
    return res.status(200).json({ message: 'Documents fetched successfully', data: countryData })
  } catch (error) {
    return res.status(404).json({ message: error.message })
  }
}
