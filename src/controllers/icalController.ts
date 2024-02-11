import { Request, Response } from 'express';
import { fetchRawIcal } from '../services/icalService';
import { format } from 'date-fns'
import { mondayOfWeek, sundayOfWeek } from '../services/timeService'

export const icalController = async (req: Request, res: Response) => {
  try {
    const referenceDate = new Date()

    const firstDate = format(mondayOfWeek(referenceDate), 'yyyy-MM-dd')
    const lastDate = format(sundayOfWeek(referenceDate), 'yyyy-MM-dd')

    const icalContent = await fetchRawIcal(firstDate, lastDate)

    res.setHeader('Content-Type', 'text/calendar')
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"')
    res.send(icalContent)
  } catch (error) {
    console.error('Error in iCal controller:', error);
    res.status(500).send('Internal Server Error');
  }
};
