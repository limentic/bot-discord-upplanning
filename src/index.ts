import * as dotenv from 'dotenv'
import express, { Request, Response, NextFunction } from 'express'
import routes from './routes'
import { DiscordService } from './services/discordService'

export interface RequestWithDiscordService extends Request {
  discordService: DiscordService
}

dotenv.config()

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