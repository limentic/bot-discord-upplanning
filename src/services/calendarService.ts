import { format } from 'date-fns'
import { DateWithTimeZone } from 'node-ical'
import { readFromFile, saveToFile } from './fileService'
import { fr } from 'date-fns/locale'
import { icalEvent } from '../types'

export const generateImgCalendar = (icalContent: icalEvent[], palette: string[]): string => {
  const summaryColors: { [key: string]: string } = JSON.parse(readFromFile(process.env.SUMMARY_COLORS_PATH!)!) || {}

  const dayLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
  const hours = Array.from({ length: 15 }, (_, index) => index + 7) // 7 AM to 21 PM

  const cellWidth = 200
  const cellHeight = 50
  const calendarWidth = dayLabels.length * cellWidth
  const calendarHeight = hours.length * cellHeight

  const sideBarWidth = 50 // Adjust the side bar width as needed
  const topBarHeight = 30 // Adjust the top bar height as needed
  const rightMargin = 20 // Adjust the right margin as needed
  const bottomMargin = 20 // Adjust the bottom margin as needed

  // Generate SVG header with white background and margins
  let svgContent = `<svg width="${calendarWidth + sideBarWidth + rightMargin}" height="${
    calendarHeight + topBarHeight + bottomMargin
  }" xmlns="http://www.w3.org/2000/svg">`

  // Draw white background
  svgContent += `<rect width="100%" height="100%" fill="white"/>`

  svgContent += `
    <style>
      <![CDATA[
        text {
          font-family: 'Open-sans', 'Arial', sans-serif; // Use a generic font family
        }
      ]]>
    </style>
  `

  // Draw top bar with centered day labels
  dayLabels.forEach((day, index) => {
    const x = index * cellWidth + sideBarWidth + cellWidth / 2 // Adjusted for centering

    // Draw centered day label
    svgContent += `<text x="${x}" y="${
      topBarHeight / 2 + 4
    }" text-anchor="middle" dominant-baseline="middle" font-size="14px" font-weight="400">${day}</text>`
  })

  // Array to store the start and end coordinates of each hour
  const hoursCoordinates: { hour: number; start: number; end: number }[] = []
  const daysCoordinates: { day: number; start: number; end: number }[] = []

  // Draw time slots and events
  hours.forEach((hour, rowIndex) => {
    const y = rowIndex * cellHeight + topBarHeight
    // Draw cells for each day
    dayLabels.forEach((_, columnIndex) => {
      const x = columnIndex * cellWidth + sideBarWidth

      // Draw cell borders
      svgContent += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" stroke="#e1e1e1" fill="none"/>`

      // Draw a dotted line to indicate the half hour
      svgContent += `<line x1="${x}" y1="${y + cellHeight / 2}" x2="${x + cellWidth}" y2="${
        y + cellHeight / 2
      }" stroke="#e8e8e8" stroke-dasharray="5"/>`

      // Draw time labels in the side bar
      if (columnIndex === 0) {
        // draw a bar at the y coordinates of the length of the image (for debug purposes)
        // svgContent += `<rect x="0" y="${y}" width="${sideBarWidth}" height="1" stroke="red" fill="none"/>`

        svgContent += `<text dominant-baseline="hanging" text-anchor="middle" font-size="14px" font-weight="400" x="${sideBarWidth / 2}" y="${
          y + 12
        }">${hour}:00</text>`

        // Store the start and end coordinates of the hour remove the side bar width as well as the cell width to get the correct coordinates
        // hourCoordinates[hour] = { start: y, end: y + cellHeight }
        hoursCoordinates[rowIndex] = { hour, start: y, end: y + cellHeight }
      }

      // Store the start and end coordinates of the day
      if (rowIndex === 0) {
        daysCoordinates[columnIndex] = { day: columnIndex, start: x, end: x + cellWidth }
      }
    })
  })

  // Draw events
  icalContent.forEach((event) => {
    const summary = event.summary.trim()
    let color = summaryColors[summary]

    if (!color) {
      event.backgroundColor = getRandomColorFromPalette(palette)
      event.borderColor = darkenColor(event.backgroundColor)
      summaryColors[summary] = event.backgroundColor
    } else {
      event.backgroundColor = color
      event.borderColor = darkenColor(color)
    }

    // Start Y ==============================
    const startHourObject = hoursCoordinates.find(
      (item) => item.hour === Number(format(event.start, 'H', { locale: fr })),
    )!
    let pixelsPerMinutes = (startHourObject.end - startHourObject.start) / 60
    let pixelsToAdd = Math.round(pixelsPerMinutes * Number(format(event.start, 'm', { locale: fr })))
    const startYCoordinate = startHourObject.start + pixelsToAdd
    // ======================================

    // Start X ==============================
    const dayCoordinate = daysCoordinates.find(
      (item) => item.day == Number(format(event.start, 'c', { locale: fr })) - 1,
    )!
    const startXCoordinate = dayCoordinate.start
    // ======================================

    // Height ===============================
    const endHourObject = hoursCoordinates.find(
      (item) => item.hour === Number(format(event.end, 'H', { locale: fr })),
    )!
    pixelsPerMinutes = (endHourObject.end - endHourObject.start) / 60
    pixelsToAdd = Math.round(pixelsPerMinutes * Number(format(event.end, 'm', { locale: fr })))
    const height = endHourObject.start + pixelsToAdd - startYCoordinate
    // ======================================

    // Width ================================
    const width = dayCoordinate.end - dayCoordinate.start
    // ======================================

    svgContent += `<rect x="${startXCoordinate + 0.5}" y="${startYCoordinate + 0.5}" width="${width - 1 - 5}" height="${
      height - 1
    }" stroke="${event.borderColor}" stroke-width="2" fill="${event.backgroundColor}" rx="4" ry="4"/>`

    // Draw start and end time
    svgContent += `<text x="${startXCoordinate + 10}" y="${
      startYCoordinate + 18
    }" fill="white" font-weight="bold">${format(event.start, 'HH:mm', { locale: fr })} - ${format(
      event.end,
      'HH:mm',
      {
        locale: fr,
      },
    )}</text>`

    let text = escapeHtml(`${event.summary}\n${event.location}\n${extractProfessorName(event.description) || ''}`)

    const stringWidth = 180
    const spaceBetweenLines = 15

    const words = text.split(/\s+/)
    let currentLine = ''
    let currentY = startYCoordinate + 38

    words.forEach((word, index) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testLineLength = testLine.length * 8

      if (testLineLength > stringWidth) {
        // Draw the current line
        svgContent += `<text x="${startXCoordinate + 10}" y="${currentY}" fill="white">${currentLine}</text>`
        currentLine = word
        currentY += spaceBetweenLines
      } else {
        currentLine = testLine
      }

      // Draw the last line
      if (index === words.length - 1) {
        svgContent += `<text x="${startXCoordinate + 10}" y="${currentY}" fill="white">${currentLine}</text>`
      }
    })
  })

  // Close the SVG tag
  svgContent += '</svg>'

  // Make the SVG content output one line
  svgContent = svgContent.replace(/\n/g, '').trim()

  saveToFile(process.env.SUMMARY_COLORS_PATH!, JSON.stringify(summaryColors, null, 2))
  return svgContent
}

export const filterCalendarContent = (content: string, ignoreFields: string[]): string => {
  // Remove lines containing ignored fields
  const lines = content.split('\n').filter((line) => !ignoreFields.some((field) => line.includes(field)))
  return lines.join('\n')
}

export const getRandomColorFromPalette = (palette: string[]): string => {
  if (palette.length === 0) {
    return '' // Return an empty string if the palette is empty
  }

  const randomIndex = Math.floor(Math.random() * palette.length)
  return palette[randomIndex]
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

export const fakeUTCDate = (date: DateWithTimeZone, offset: number): Date => {
  console.log(date)
  const tempDate = new Date(date)
  console.log(tempDate)
  if (offset < 0 || offset > 0) {
    tempDate.setHours(tempDate.getHours() + offset)
  }
  console.log(tempDate)
  return new Date(tempDate)
}

const escapeHtml = (inputString: string): string => {
  const htmlEntities: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  const htmlEscapeRegex: RegExp = new RegExp(`[${Object.keys(htmlEntities).join('')}]`, 'g')

  return inputString.replace(htmlEscapeRegex, (match) => htmlEntities[match])
}

function extractProfessorName(description: string): string | null {
  const regex1 = /\n\n([\w-]+)\n(.+?)\n\n/
  const match = description.match(regex1)
  if (match) {
    return match[2]
  }

  const regex2 = /\n\n([\w-]+)\n([\w-]+)\n(.+?)\n\n/
  const match2 = description.match(regex2)

  if (match2) {
    return match2[3]
  }
  return null
}
