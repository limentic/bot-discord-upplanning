import { parse, startOfWeek, lastDayOfWeek, format, addDays } from 'date-fns';
import { sync, VEvent } from 'node-ical'

export const generateMarkdownCalendar = (icalContent: string): string => {
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

    const startOfCurrentWeek = startOfWeek(new Date())
    const currentDate = addDays(startOfCurrentWeek, index)

    markdownCalendar.push(`## ${frenchDaysOfWeek[index]} ${format(currentDate, 'dd/MM/yyyy')}\n\n`)
    for (const event of dayTables[day]) {
      markdownCalendar.push(
        `- ${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')} : ${event.summary} | ${
          event.location
        }\n`,
      )
    }
    markdownCalendar.push('\n')
  })

  return `# EDT du ${format(startOfWeek(new Date()), 'dd/MM/yyyy')} au ${format(
    lastDayOfWeek(new Date()),
    'dd/MM/yyyy',
  )}\n\n${markdownCalendar.join('')}`
}

export const filterCalendarContent = (content: string, ignoreFields: string[]): string => {
  // Remove lines containing ignored fields
  const lines = content.split('\n').filter((line) => !ignoreFields.some((field) => line.includes(field)))
  return lines.join('\n')
}