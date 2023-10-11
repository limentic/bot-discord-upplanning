import { Response } from 'express';
import { RequestWithDiscordService } from '..';
import { fetchIcal } from '../services/icalService';
import { generateMarkdownCalendar } from '../services/calendarService'

export const generateCalendarController = async (req: RequestWithDiscordService, res: Response) => {
  try {
    const icalContent = await fetchIcal()

    const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)

    await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')

    await req.discordService.sendMessage(
      process.env.DISCORD_CHANNEL_ID!,
      `> Voici le nouvel emploi du temps @everyone: \n ${generateMarkdownCalendar(icalContent)}`,
    )
    res.json({
      "status": "OK"
    })
  } catch (error) {
    console.error('Error in calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
