const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const upload = require('express-fileupload')
const graphRoutes = require('./routes/graphRoutes')

const app = express()

app.use(upload())
app.use(express.static('public'))
app.use(express.json({ limit: '30mb' }))
app.use(express.urlencoded({ limit: '30mb', extended: true }))
app.use(cors())

const database = "CSV"
const CONNECTION_URL =
`mongodb+srv://awadhootk6:Jnpppllfb83@cluster0.l36eigo.mongodb.net/${database}?retryWrites=true&w=majority`
const PORT = process.env.PORT || 3000

mongoose
  .connect(CONNECTION_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(e => console.log(e))

app.use('/', graphRoutes)
// app.get('/upload', (req, res) => {
//     res.sendFile(__dirname+'/form.html')
// })

app.get('/ping', (req, res) => res.send('pong'))
