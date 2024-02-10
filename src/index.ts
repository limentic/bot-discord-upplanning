import * as dotenv from 'dotenv'
import express, { Request, Response, NextFunction } from 'express'
import routes from './routes'
import { DiscordService } from './services/discordService'
import { saveToFile } from './services/fileService'
import { join } from 'path'
import * as fs from 'fs'
import { format, nextMonday } from 'date-fns'

export interface CustomRequest extends Request {
  discordService: DiscordService
  palette: string[]
}

dotenv.config()

process.env.TEMP_FOLDER = join(__dirname, '../', 'temp')
process.env.LOGS_FOLDER = join(__dirname, '../', 'logs')
process.env.CALENDAR_FILE_PATH = join(process.env.TEMP_FOLDER, 'calendar.ical')
process.env.CURRENT_WEEK_PATH = join(process.env.TEMP_FOLDER, 'currentweek')
process.env.PREVIOUS_DATA_PATH = join(process.env.TEMP_FOLDER, 'previousdata.json')
process.env.SUMMARY_COLORS_PATH = join(process.env.TEMP_FOLDER, 'summarycolors.json')

const palette = fs.readFileSync(join(__dirname, '../', 'palette.json'), 'utf8') || '[]'

if (fs.existsSync(process.env.CURRENT_WEEK_PATH!) == false) saveToFile(process.env.CURRENT_WEEK_PATH!, format(nextMonday(new Date()), 'yyyy-MM-dd'))

const discordService = new DiscordService()

async function startServer() {
  await discordService.isReady()

  const app = express()
  const port = process.env.PORT || 3000

  function addCustomMiddleware(req: CustomRequest, res: Response, next: NextFunction) {
    req.discordService = discordService
    req.palette = JSON.parse(palette)
    next()
  }

  app.use(addCustomMiddleware as express.RequestHandler)
  app.use('/', routes)

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

startServer()
