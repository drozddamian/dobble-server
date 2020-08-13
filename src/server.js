import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import AppConfig from './config/index.ts'


const app = express()

app.use(cors())
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));


mongoose.connect(process.env.MONGO_URI, AppConfig.mongoose)
  .then(() => console.log('Connection with database have been established'))
  .catch((error) => console.log('Database connection error: ' + error));

app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.use((req,res,next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

app.use((error, req, res) =>{
  res.status(error.status || 500)
  res.json({
    error: {
      message: error.message,
    }
  })
})

app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`),
)
