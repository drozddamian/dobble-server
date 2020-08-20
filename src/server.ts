import 'dotenv/config'
import express, { Application } from 'express';
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import AppConfig from './config'
import auth from './routes/auth'
import player from './routes/player'
import room from './routes/room'

const app: Application = express()

app.use(cors())
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

mongoose.connect(process.env.MONGO_URI as string, AppConfig.mongoose)
  .then(() => console.log('Connection with database have been established'))
  .catch((error) => console.log('Database connection error: ' + error));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/auth', auth)
app.use('/api/player', player)
app.use('/api/room', room)

app.use((req, res, next) =>{
  res.status(500).end()
})

const port = process.env.PORT || 3000
app.listen(port, () =>
  console.log(`Server listening on port ${process.env.PORT}!`),
)
