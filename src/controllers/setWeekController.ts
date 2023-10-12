import { Request, Response } from 'express'
import { nextMonday, format, previousMonday } from 'date-fns'
import { saveToFile } from '../services/fileService'

export const setNextWeekController = async (req: Request, res: Response) => {
  try {
    saveToFile(process.env.CURRENT_WEEK_PATH!, format(nextMonday(new Date()), 'yyyy-MM-dd'))
    
    res.json({
      status: 'OK',
    })
  } catch (error) {
    console.error('Error in calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export const setPreviousWeekController = async (req: Request, res: Response) => {
  try {
    saveToFile(process.env.CURRENT_WEEK_PATH!, format(previousMonday(new Date()), 'yyyy-MM-dd'))

    res.json({
      status: 'OK',
    })
  } catch (error) {
    console.error('Error in calendar controller:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}