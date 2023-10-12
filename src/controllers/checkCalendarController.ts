import { Response } from 'express'
import { filterCalendarContent } from '../services/calendarService'
import { fetchIcal } from '../services/icalService'
import { readFromFile, saveToFile } from '../services/fileService'
import { RequestWithDiscordService } from '..'
import { generateMarkdownCalendar } from '../services/calendarService'
import { format } from 'date-fns'
import { mondayOfWeek, sundayOfWeek } from '../services/timeService'

const ignoreFields = ['DTSTAMP', 'SEQUENCE']

export const checkCalendarController = async (req: RequestWithDiscordService, res: Response) => {
  try {
    const referenceWeek = readFromFile(process.env.CURRENT_WEEK_PATH!)
    const referenceDate = new Date(referenceWeek!)

    const firstDate = format(mondayOfWeek(referenceDate), 'yyyy-MM-dd')
    const lastDate = format(sundayOfWeek(referenceDate), 'yyyy-MM-dd')

    const icalContent = await fetchIcal(firstDate, lastDate)
    const previousCalendar = readFromFile(process.env.CALENDAR_FILE_PATH!)

    const filteredIcalContent = filterCalendarContent(icalContent, ignoreFields)
    const filteredPreviousCalendar = filterCalendarContent(previousCalendar || '', ignoreFields)

    const isChanged = filteredIcalContent !== filteredPreviousCalendar

    res.json({ isChanged })

    if (isChanged) {
      saveToFile(process.env.CALENDAR_FILE_PATH!, icalContent)

      const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)

      await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')

      await req.discordService.sendMessage(
        process.env.DISCORD_CHANNEL_ID!,
        `> Attention, l'emploi du temps à été modifié ! @everyone: \n ${generateMarkdownCalendar(
          icalContent,
          referenceDate,
        )}`,
      )
    }
  } catch (error) {
    console.error('Error in check calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
