import { Response } from 'express';
import { RequestWithDiscordService } from '..';
import { fetchIcal } from '../services/icalService';
import { generateMarkdownCalendar } from '../services/calendarService'
import { format } from 'date-fns'
import { mondayOfCurrentWeek, sundayOfCurrentWeek } from '../services/timeService'
import { readFromFile } from '../services/fileService';

export const generateCalendarController = async (req: RequestWithDiscordService, res: Response) => {
  try {
    const currentweek = readFromFile(process.env.CURRENT_WEEK_FILE_PATH!)
    const currentDate = new Date(currentweek!)

    const firstDate = format(mondayOfCurrentWeek(currentDate), 'yyyy-MM-dd')
    const lastDate = format(sundayOfCurrentWeek(currentDate), 'yyyy-MM-dd')

    const icalContent = await fetchIcal(firstDate, lastDate)

    const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)

    await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')

    await req.discordService.sendMessage(
      process.env.DISCORD_CHANNEL_ID!,
      `> Voici le nouvel emploi du temps @everyone: \n ${generateMarkdownCalendar(icalContent, currentDate)}`,
    )
    res.json({
      "status": "OK"
    })
  } catch (error) {
    console.error('Error in calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
