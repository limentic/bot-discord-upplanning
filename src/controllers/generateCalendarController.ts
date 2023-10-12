import { Response } from 'express';
import { RequestWithDiscordService } from '..';
import { fetchIcal } from '../services/icalService';
import { generateMarkdownCalendar, generateImgCalendar } from '../services/calendarService'
import { format } from 'date-fns'
import { mondayOfWeek, sundayOfWeek } from '../services/timeService'
import { readFromFile } from '../services/fileService';
import puppeteer from 'puppeteer';

export const generateCalendarController = async (req: RequestWithDiscordService, res: Response) => {
  try {
    const referenceWeek = readFromFile(process.env.CURRENT_WEEK_PATH!)
    const referenceDate = new Date(referenceWeek!)

    const firstDate = format(mondayOfWeek(referenceDate), 'yyyy-MM-dd')
    const lastDate = format(sundayOfWeek(referenceDate), 'yyyy-MM-dd')

    const icalContent = await fetchIcal(firstDate, lastDate)

    const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)

    await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')

    await req.discordService.sendMessage(
      process.env.DISCORD_CHANNEL_ID!,
      `> Voici le nouvel emploi du temps @everyone: \n ${generateMarkdownCalendar(icalContent, referenceDate)}`,
    )
    res.json({
      "status": "OK"
    })
  } catch (error) {
    console.error('Error in calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export const generateImgCalendarController = async (req: RequestWithDiscordService, res: Response) => {
  try {
    const referenceWeek = readFromFile(process.env.CURRENT_WEEK_PATH!)
    const referenceDate = new Date(referenceWeek!)

    const firstDate = format(mondayOfWeek(referenceDate), 'yyyy-MM-dd')
    const lastDate = format(sundayOfWeek(referenceDate), 'yyyy-MM-dd')

    const icalContent = await fetchIcal(firstDate, lastDate)
    
    const browser = await puppeteer.launch({
      headless: "new",
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 810 });
    await page.setContent(generateImgCalendar(icalContent, referenceDate))
    const buffer = await page.screenshot({ fullPage: true });
    await browser.close();

    const message = await req.discordService.getLastMessage(process.env.DISCORD_CHANNEL_ID!)

    await req.discordService.deleteMessage(process.env.DISCORD_CHANNEL_ID!, message?.id || '')

    await req.discordService.sendMessage(
      process.env.DISCORD_CHANNEL_ID!,
      `@everyPASone\n# Voici le nouvel EDT pour la semaine du ${format(
        mondayOfWeek(referenceDate),
        'dd/MM/yyyy',
      )} au ${format(sundayOfWeek(referenceDate), 'dd/MM/yyyy')}: \n`,

      buffer,
    )

    res.json({
      status: "OK"
    });

  } catch (error) {
    console.error('Error in calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}