import 'dotenv/config'
import express, { Application } from 'express';
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import AppConfig from './config'
import GameSocket from './socket'
import auth from './routes/auth'
import player from './routes/player'
import room from './routes/room'
import gameTable from './routes/gameTable'
import game from './routes/game'
import { API } from './constants/apiEndpoints'
import { handleError } from './helpers/error'


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
app.use(API.GAMES, game)

app.use((err, req, res, next) => {
  handleError(err, res)
})

const server = app.listen(PORT, () =>
  console.log(`Server listening on port ${process.env.PORT}!`),
)

const gameSocket = new GameSocket(server)
app.use(API.GAME_TABLE, gameTable(gameSocket))

