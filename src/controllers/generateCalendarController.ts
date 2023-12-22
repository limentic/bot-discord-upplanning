import { Response } from 'express';
import { CustomRequest } from '..'
import { fetchIcal } from '../services/icalService';
import { generateImgv2Calendar as generateImgCalendar } from '../services/calendarService'
import { format } from 'date-fns'
import { mondayOfWeek, sundayOfWeek, fridayOfWeek } from '../services/timeService'
import { readFromFile } from '../services/fileService';

import { puppeteerRender } from '../services/puppeteerService';

export const generateImgCalendarController = async (req: CustomRequest, res: Response) => {
  try {
    const referenceWeek = readFromFile(process.env.CURRENT_WEEK_PATH!)
    const referenceDate = new Date(referenceWeek!)

    const firstDate = format(mondayOfWeek(referenceDate), 'yyyy-MM-dd')
    const lastDate = format(sundayOfWeek(referenceDate), 'yyyy-MM-dd')

    const icalContent = await fetchIcal(firstDate, lastDate)
    const buffer = await puppeteerRender(generateImgCalendar(icalContent, referenceDate, req.palette))

    const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)
    await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')
    await req.discordService.sendMessage(
      process.env.DISCORD_CHANNEL_ID!,
      `@everyone\n# Voici le nouvel EDT pour la semaine du ${format(
        mondayOfWeek(referenceDate),
        'dd/MM/yyyy',
      )} au ${format(fridayOfWeek(referenceDate), 'dd/MM/yyyy')}: \n`,

      buffer,
    )

    res.json({
      status: 'OK',
    })
  } catch (error) {
    console.error('Error in calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
