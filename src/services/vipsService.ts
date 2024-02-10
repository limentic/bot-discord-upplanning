import { execSync } from 'child_process'
import * as tmp from 'tmp'
import * as fs from 'fs'

export function convertSvgToPng(svgString: string): Buffer {
  try {
    console.log(`Converting svg to png...`)

    tmp.setGracefulCleanup()

    const svgFile = tmp.fileSync({ postfix: '.svg' })
    fs.appendFileSync(svgFile.name, svgString)

    const pngFile = tmp.tmpNameSync({ postfix: '.png' })

    const command = `vips svgload ${svgFile.name} ${pngFile} --dpi 600`
    execSync(command)

    console.log(`Converted svg to png!`)

    const buffer = fs.readFileSync(pngFile)
    svgFile.removeCallback()
    fs.unlinkSync(pngFile)

    return buffer
  } catch (error) {
    console.error('Error in convertSvgToPng:', error)
    throw error
  }
}
