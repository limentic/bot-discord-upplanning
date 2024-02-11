import { Response } from 'express'
import { CustomRequest } from '..'
import { nextMonday, nextFriday, isFriday, isSaturday, isSunday, format, formatISO } from 'date-fns'
import { fridayOfWeek, mondayOfWeek } from '../services/timeService'
import { fetchIcal } from '../services/icalService'
import { readFromFile, saveToFile } from '../services/fileService'
import { generateImgCalendar} from '../services/calendarService'
import { convertSvgToPng } from '../services/vipsService'
import { icalEvent } from '../types'

export const calendarController = async (req: CustomRequest, res: Response) => {
  try {
    const currentDate = new Date()

    let workingMonday: Date
    let workingFriday: Date

    if ((isFriday(currentDate) && currentDate.getHours() >= 20) || isSaturday(currentDate) || isSunday(currentDate)) {
      workingMonday = nextMonday(currentDate)
      workingFriday = nextFriday(workingMonday)
    } else {
      workingMonday = mondayOfWeek(currentDate)
      workingFriday = fridayOfWeek(currentDate)
    }

    const icalContent = await fetchIcal(workingMonday, workingFriday)
    const previousData = readFromFile(process.env.PREVIOUS_DATA_PATH!)
    const previousIcalContent: icalEvent[] = previousData ? JSON.parse(previousData) : []

    let differenceFlag = 0

    // Compare previousIcalContent with icalContent
    icalContent.forEach((event) => {
      if (icalContent.length !== previousIcalContent.length) {
        differenceFlag = 1
      } else {
        let found = 0
        previousIcalContent.forEach((previousEvent) => {
          if (event.uid === previousEvent.uid) {
            let previousData = previousEvent
            if (JSON.stringify(event) !== JSON.stringify(previousData)) {
              differenceFlag = 1
            }
            found = 1
          }
        })
        if (found === 0) {
          differenceFlag = 1
        }
      }
    })

    let hasChanged = false

    if (differenceFlag === 1) {
      saveToFile(process.env.PREVIOUS_DATA_PATH!, JSON.stringify(icalContent, null, 2))

      const previousIcalLogPath = `${process.env.LOGS_FOLDER}/previous-ical-${format(workingMonday, 'ddMMyyyy')}-to-${format(workingFriday, 'ddMMyyyy')}-at-${formatISO(new Date(), { format: 'basic' })}.json`
      const currentIcalLogPath = `${process.env.LOGS_FOLDER}/current-ical-${format(workingMonday, 'ddMMyyyy')}-to-${format(workingFriday, 'ddMMyyyy')}-at-${formatISO(new Date(), { format: 'basic' })}.json`

      // Write to logs the old and new icalContent
      saveToFile(previousIcalLogPath, JSON.stringify(previousIcalContent, null, 2))
      saveToFile(currentIcalLogPath, JSON.stringify(icalContent, null, 2))

      // log the changes
      console.log('The planning has changed!')
      console.log('Old planning:', previousIcalLogPath)
      console.log('New planning:', currentIcalLogPath)

      const buffer = convertSvgToPng(generateImgCalendar(icalContent, req.palette))

      const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)
      await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')

      await req.discordService.sendMessage(
        process.env.DISCORD_CHANNEL_ID!,
        `@everyone\n# L'emploi du temps pour la semaine du ${format(
          workingMonday,
          'dd/MM/yyyy',
        )} au ${format(workingFriday, 'dd/MM/yyyy')} à été modifié: \n`,

        buffer,
      )

      hasChanged = true
    }
    res.status(200).json({ hasChanged })
  } catch (error) {
    console.error('Error while generating the new planning: ', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
