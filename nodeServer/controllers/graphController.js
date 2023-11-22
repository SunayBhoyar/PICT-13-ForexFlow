const axios = require('axios')
const FormData = require('form-data')

exports.getData = async (req, res, next) => {
  try {
    console.log('Making request to Flask API')
    const response = await axios.get(
      'http://127.0.0.1:5000/get-process-csv-response'
    )
    console.log(response.data)
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
