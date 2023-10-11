import { Response } from 'express'
import { filterCalendarContent } from '../services/calendarService'
import { fetchIcal } from '../services/icalService'
import { readFromFile, saveToFile } from '../services/fileService'
import { join } from 'path'
import { RequestWithDiscordService } from '..'
import { generateMarkdownCalendar } from '../services/calendarService'

const TEMP_FOLDER = join(__dirname, '../..', 'temp')
const CALENDAR_FILE_PATH = join(TEMP_FOLDER, 'calendar.ical')

const ignoreFields = ['DTSTAMP', 'SEQUENCE']

export const checkCalendarController = async (req: RequestWithDiscordService, res: Response) => {
  try {
    const icalContent = await fetchIcal()
    const previousCalendar = readFromFile(CALENDAR_FILE_PATH)

    const filteredIcalContent = filterCalendarContent(icalContent, ignoreFields)
    const filteredPreviousCalendar = filterCalendarContent(previousCalendar || '', ignoreFields)

    const isChanged = filteredIcalContent !== filteredPreviousCalendar

    res.json({ isChanged })

    if (isChanged) {
      saveToFile(CALENDAR_FILE_PATH, icalContent)

      const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)

      await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')

      await req.discordService.sendMessage(
        process.env.DISCORD_CHANNEL_ID!,
        `> Attention, l'emploi du temps à été modifié ! @everyone: \n ${generateMarkdownCalendar(icalContent)}`,
      )
    }
  } catch (error) {
    console.error('Error in check calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
