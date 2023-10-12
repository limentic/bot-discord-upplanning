import { format, addDays } from 'date-fns'
import { sync, VEvent } from 'node-ical'
import { mondayOfWeek, sundayOfWeek } from './timeService'

interface EDTEvent {
  id?: string | number
  title: string
  start: string | Date
  end?: string | Date
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

export const generateMarkdownCalendar = (
  icalContent: string,
  referenceDate: Date,
): string => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const frenchDaysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  const markdownCalendar: string[] = []

  const events = sync.parseICS(icalContent)

  const dayTables: Record<string, VEvent[]> = {}
  daysOfWeek.forEach((day) => {
    dayTables[day] = []
  })

  Object.values(events).forEach((event) => {
    if (event.type === 'VEVENT') {
      const day = format(new Date(event.start), 'EEEE')
      if (daysOfWeek.includes(day)) {
        dayTables[day].push(event)
      }
    }
  })

  daysOfWeek.forEach((day, index) => {
    dayTables[day].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    const startOfCurrentWeek = mondayOfWeek(referenceDate)
    const currentDay = addDays(startOfCurrentWeek, index)

    markdownCalendar.push(`## ${frenchDaysOfWeek[index]} ${format(currentDay, 'dd/MM/yyyy')}\n\n`)
    for (const event of dayTables[day]) {
      markdownCalendar.push(
        `- ${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')} : ${event.summary} | ${
          event.location
        }\n`,
      )
    }
    markdownCalendar.push('\n')
  })

  return `# EDT du ${format(mondayOfWeek(referenceDate), 'dd/MM/yyyy')} au ${format(
    sundayOfWeek(referenceDate),
    'dd/MM/yyyy',
  )}\n\n${markdownCalendar.join('')}`
}

export const generateImgCalendar = (icalContent: string, referenceDate: Date): string => {
  const events = sync.parseICS(icalContent)

  const data: EDTEvent[] = []

  Object.values(events).forEach((event) => {
    if (event.type === 'VEVENT') {
      data.push({
        title: `${event.summary}\n${event.location}\n`,
        start: `${format(new Date(event.start), 'yyyy-MM-dd')}T${format(new Date(event.start), 'HH:mm')}:00`,
        end: `${format(new Date(event.end), 'yyyy-MM-dd')}T${format(new Date(event.end), 'HH:mm')}:00`,
        allDay: false,
      })
    }
  })

  const config = {
    events: data,
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: '',
      center: '',
      right: '',
    },
    locale: 'fr',
    firstDay: 1,
    weekends: false,
    slotMinTime: '07:00:00',
    slotDuration: '00:30:00',
    allDaySlot: false,
    initialDate: format(mondayOfWeek(referenceDate), 'yyyy-MM-dd'),
    nowIndicator: false
  }

  return `<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='utf-8' />
    <style>
    #calendar {
      --fc-today-bg-color: transparent !important;
    }
    </style>
    <script src='http://localhost:${process.env.PORT}/libs/fullcalendar.min.js'></script>
    <script>

      document.addEventListener('DOMContentLoaded', function() {
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, ${JSON.stringify(config, null, 2)});
        calendar.render();
      });

    </script>
  </head>
  <body>
    <div id='calendar'></div>
  </body>
</html>`
}

export const filterCalendarContent = (content: string, ignoreFields: string[]): string => {
  // Remove lines containing ignored fields
  const lines = content.split('\n').filter((line) => !ignoreFields.some((field) => line.includes(field)))
  return lines.join('\n')
}