import { Router } from 'express';
import { icalController } from './controllers/icalController';
import { calendarController } from './controllers/calendarController';

const router = Router();

router.get('/ical', icalController);
router.get('/calendar', calendarController as any)

export default router;
