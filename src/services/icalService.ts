import { icalEvent } from '../types'
import axios from 'axios'
import { sync, VEvent } from 'node-ical'
import { utcToZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

export async function fetchIcal(workingMonday: Date, workingFriday: Date): Promise<icalEvent[]> {
  try {
    const requestBuffer = await axios.get(
      `https://upplanning.appli.univ-poitiers.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=${process.env.UPPLANNING_RESOURCES}&projectId=${process.env.UPPLANNING_PROJECT_ID}&calType=ical&firstDate=${format(workingMonday, 'yyyy-MM-dd')}&lastDate=${format(workingFriday, 'yyyy-MM-dd')}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        },
        timeout: 10000,
      },
    )

    if (!requestBuffer.data.includes('BEGIN:VCALENDAR')) {
      throw new Error('The request did not return a valid ical file')
    }

    const rawIcal = sync.parseICS(requestBuffer.data)

    let icalContent: icalEvent[] = []

    Object.keys(rawIcal).forEach((key) => {
      if (rawIcal[key].type === 'VEVENT') {
        const event: VEvent = rawIcal[key] as VEvent

        let startDate = new Date(JSON.parse(JSON.stringify(event.start)))
        let endDate = new Date(JSON.parse(JSON.stringify(event.end)))

        startDate = utcToZonedTime(startDate, 'Europe/Paris')
        endDate = utcToZonedTime(endDate, 'Europe/Paris')

        icalContent.push({
          uid: event.uid,
          start: startDate,
          end: endDate,
          summary: event.summary,
          description: event.description,
          location: event.location,
        })
      }
    })

    return icalContent
  } catch {
    throw new Error('Something went wrong while fetching the ical file')
  }
}

export const fetchRawIcal = async (firstDate: string, lastDate: string): Promise<string> => {
  try {
    const icalUrl = `https://upplanning.appli.univ-poitiers.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=${process.env.UPPLANNING_RESOURCES}&projectId=${process.env.UPPLANNING_PROJECT_ID}&calType=ical&firstDate=${firstDate}&lastDate=${lastDate}`

    const response = await fetch(icalUrl)
    const icalContent = await response.text()

    return icalContent
  } catch (error) {
    console.error('Error fetching iCal:', error)
    throw new Error('Error fetching iCal')
  }
}
