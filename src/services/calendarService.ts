import { format, addDays } from 'date-fns'
import { getTimezoneOffset } from 'date-fns-tz'
import { sync, VEvent, DateWithTimeZone } from 'node-ical'
import { mondayOfWeek, sundayOfWeek } from './timeService'
import { readFromFile, saveToFile } from './fileService'

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

export const generateImgCalendar = (icalContent: string, referenceDate: Date, palette: string[]): string => {
  
  const offset = getTimezoneOffset('Europe/Paris', new Date()) / 1000 / 60 / 60

  const events = sync.parseICS(icalContent)

  const data: EDTEvent[] = []
  const summaryColors: { [key: string]: string } = JSON.parse(readFromFile(process.env.SUMMARY_COLORS_PATH!)!) || {}

  Object.values(events).forEach((event) => {
    if (event.type === 'VEVENT') {
      const summary = event.summary.trim()
      let color = summaryColors[summary]

      if (!color) {
        color = getRandomColorFromPalette(palette)
        summaryColors[summary] = color
      }

      data.push({
        title: `${summary}\n${event.location}`,
        start: `${fakeUTCDate(event.start, offset)}`,
        end: `${fakeUTCDate(event.end, offset)}`,
        allDay: false,
        backgroundColor: color,
        borderColor: darkenColor(color),
      })
    }
  })

  saveToFile(process.env.SUMMARY_COLORS_PATH!, JSON.stringify(summaryColors, null, 2))

  const config = {
    events: data,
    timeZone: 'UTC',
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
    nowIndicator: false,
    themeSystem: 'bootstrap5',
  }

  return `<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='utf-8' />
    <style>
    #calendar {
      --fc-today-bg-color: transparent !important;
    }
    .fc-direction-ltr .fc-daygrid-event.fc-event-end,
    .fc-event-main-frame {
        flex-direction: column;
        text-align: left;
    }

    .fc-event-desc,
    .fc-event-title {
        white-space: break-spaces;
    }
    </style>
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.9/index.global.min.js'></script>
    <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css' rel='stylesheet'>
    <link href='https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css' rel='stylesheet'>
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

export const getRandomColorFromPalette = (palette: string[]): string => {
  if (palette.length === 0) {
    return '';  // Return an empty string if the palette is empty
  }

  const randomIndex = Math.floor(Math.random() * palette.length);
  return palette[randomIndex];
}

export const darkenColor = (color: string): string => {
  // Convert hex to RGB
  const hexToRgb = (hex: string): number[] => {
    // Remove the hash if it exists
    const cleanedHex = hex.replace(/^#/, '')

    // Parse the hex values to integers
    const bigint = parseInt(cleanedHex, 16)

    // Extract RGB components
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255

    return [r, g, b]
  }

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number): number[] => {
    // Normalize RGB values
    const normalizedR = r / 255
    const normalizedG = g / 255
    const normalizedB = b / 255

    // Find the maximum and minimum values
    const max = Math.max(normalizedR, normalizedG, normalizedB)
    const min = Math.min(normalizedR, normalizedG, normalizedB)

    // Calculate lightness
    const lightness = (max + min) / 2

    // Calculate saturation
    let saturation = 0
    if (max !== min) {
      saturation = lightness > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
    }

    // Calculate hue
    let hue = 0
    if (max !== min) {
      if (max === normalizedR) {
        hue = ((normalizedG - normalizedB) / (max - min)) * 60
      } else if (max === normalizedG) {
        hue = (2 + (normalizedB - normalizedR) / (max - min)) * 60
      } else {
        hue = (4 + (normalizedR - normalizedG) / (max - min)) * 60
      }
    }

    // Ensure hue is positive
    hue = hue < 0 ? hue + 360 : hue

    return [hue, saturation, lightness]
  }

  // Convert HSL to RGB
  const hslToRgb = (hue: number, saturation: number, lightness: number): number[] => {
    // Ensure hue is between 0 and 360
    hue = hue % 360

    // Convert degrees to 0-1 range
    const normalizedHue = hue / 360
    const normalizedSaturation = saturation
    const normalizedLightness = lightness

    // Calculate intermediate values
    const q =
      normalizedLightness < 0.5
        ? normalizedLightness * (1 + normalizedSaturation)
        : normalizedLightness + normalizedSaturation - normalizedLightness * normalizedSaturation
    const p = 2 * normalizedLightness - q

    // Calculate RGB components
    const normalizedR = hueToRgb(p, q, normalizedHue + 1 / 3)
    const normalizedG = hueToRgb(p, q, normalizedHue)
    const normalizedB = hueToRgb(p, q, normalizedHue - 1 / 3)

    // Convert to 0-255 range
    const r = Math.round(normalizedR * 255)
    const g = Math.round(normalizedG * 255)
    const b = Math.round(normalizedB * 255)

    return [r, g, b]
  }

  // Helper function for HSL to RGB conversion
  const hueToRgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  // Darken the color by reducing lightness by 10%
  const rgb = hexToRgb(color)
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2])
  hsl[2] = Math.max(0, hsl[2] - 0.1) // Reduce lightness by 10%
  const darkerRgb = hslToRgb(hsl[0], hsl[1], hsl[2])

  // Convert RGB back to hex
  const darkerHex = `#${darkerRgb[0].toString(16).padStart(2, '0')}${darkerRgb[1]
    .toString(16)
    .padStart(2, '0')}${darkerRgb[2].toString(16).padStart(2, '0')}`

  return darkerHex
}

export const fakeUTCDate = (date: DateWithTimeZone, offset: number): string => {
  const tempDate = new Date(date)
  if (offset < 0 || offset > 0) {
    tempDate.setHours(tempDate.getHours() + offset)
  }
  return tempDate.toISOString()
}