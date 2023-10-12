import { Request, Response } from 'express';
import { fetchIcal } from '../services/icalService';
import { format } from 'date-fns'
import { mondayOfCurrentWeek, sundayOfCurrentWeek } from '../services/timeService'

export const icalController = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date()

    const firstDate = format(mondayOfCurrentWeek(currentDate), 'yyyy-MM-dd')
    const lastDate = format(sundayOfCurrentWeek(currentDate), 'yyyy-MM-dd')

    const icalContent = await fetchIcal(firstDate, lastDate)
    res.send(icalContent);
  } catch (error) {
    console.error('Error in iCal controller:', error);
    res.status(500).send('Internal Server Error');
  }
};
