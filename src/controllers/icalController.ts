import { Request, Response } from 'express';
import { fetchIcal } from '../services/icalService';

export const icalController = async (req: Request, res: Response) => {
  try {
    const icalContent = await fetchIcal();
    res.send(icalContent);
  } catch (error) {
    console.error('Error in iCal controller:', error);
    res.status(500).send('Internal Server Error');
  }
};
