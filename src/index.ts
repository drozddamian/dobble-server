import 'dotenv/config'
import express, { Application } from 'express';
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import AppConfig from './config'
import auth from './routes/auth'
import player from './routes/player'
import room from './routes/room'
import gameSession from './routes/gameSession'
import game from './routes/game'
import { API } from './constants/apiEndpoints'


const app: Application = express()
const PORT : string|number = process.env.PORT || 5000
const MONGO_DB_URI: string = process.env.MONGODB_URI

app.use(cors())
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

mongoose.connect(MONGO_DB_URI, AppConfig.mongoose)
  .then(() => console.log('Connection with database have been established'))
  .catch((error) => console.log('Database connection error: ' + error));

app.use(API.AUTHENTICATION, auth)
app.use(API.PLAYERS, player)
app.use(API.ROOMS, room)
app.use(API.GAME_SESSIONS, gameSession)
app.use(API.GAMES, game)

app.use((req, res, next) =>{
  res.status(500).end()
})

app.listen(PORT, () =>
  console.log(`Server listening on port ${process.env.PORT}!`),
)
