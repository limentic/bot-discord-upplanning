import { Router } from 'express';
import { icalController } from './controllers/icalController';
import { checkCalendarController } from './controllers/checkCalendarController';
import { generateCalendarController } from './controllers/generateCalendarController';

const router = Router();

router.get('/ical', icalController);
router.get('/calendar', generateCalendarController as any);
router.get('/check-calendar', checkCalendarController as any);

export default router;
