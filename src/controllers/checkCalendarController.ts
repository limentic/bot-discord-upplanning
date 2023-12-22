import { Response } from 'express'
import sharp from 'sharp'
import { filterCalendarContent } from '../services/calendarService'
import { fetchIcal } from '../services/icalService'
import { readFromFile, saveToFile } from '../services/fileService'
import { CustomRequest } from '..'
import { generateImgv2Calendar } from '../services/calendarService'
import { format } from 'date-fns'
import { fridayOfWeek, mondayOfWeek, sundayOfWeek } from '../services/timeService'
// import { puppeteerRender } from '../services/puppeteerService'

const ignoreFields = ['DTSTAMP', 'SEQUENCE']

export const checkCalendarController = async (req: CustomRequest, res: Response) => {
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
      saveToFile(`${process.env.LOGS_FOLDER!}/calendar-${new Date().toISOString()}-previous.ical`, previousCalendar!)
      saveToFile(`${process.env.LOGS_FOLDER!}/calendar-${new Date().toISOString()}-current.ical`, icalContent)

      const buffer = await sharp(Buffer.from(generateImgv2Calendar(icalContent, referenceDate, req.palette)), {density: 600}).png().toBuffer()

      const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)
      await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')

      await req.discordService.sendMessage(
        process.env.DISCORD_CHANNEL_ID!,
        `THIS IS A TEST ${format(
          mondayOfWeek(referenceDate),
          'dd/MM/yyyy',
        )} au ${format(fridayOfWeek(referenceDate), 'dd/MM/yyyy')} à été modifié: \n`,

        buffer,
      )
    }
  } catch (error) {
    console.error('Error in check calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
