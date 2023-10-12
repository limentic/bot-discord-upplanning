import * as dotenv from 'dotenv'
import express, { Request, Response, NextFunction } from 'express'
import routes from './routes'
import { DiscordService } from './services/discordService'
import { saveToFile } from './services/fileService'
import { join } from 'path'
import * as fs from 'fs'
import { format, nextMonday } from 'date-fns'

export interface RequestWithDiscordService extends Request {
  discordService: DiscordService
}

dotenv.config()

process.env.TEMP_FOLDER = join(__dirname, '../', 'temp')
process.env.CALENDAR_FILE_PATH = join(process.env.TEMP_FOLDER, 'calendar.ical')
process.env.CURRENT_WEEK_PATH = join(process.env.TEMP_FOLDER, 'currentweek')

if (fs.existsSync(process.env.CURRENT_WEEK_PATH!) == false) saveToFile(process.env.CURRENT_WEEK_PATH!, format(nextMonday(new Date()), 'yyyy-MM-dd'))

const discordService = new DiscordService()

async function startServer() {
  await discordService.isReady()

  const app = express()
  const port = process.env.PORT || 3000

  function addDiscordService(req: RequestWithDiscordService, res: Response, next: NextFunction) {
    req.discordService = discordService
    next()
  }

  app.use(addDiscordService as express.RequestHandler)
  app.use('/', routes)

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

startServer()
