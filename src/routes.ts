import { Router } from 'express';
import { icalController } from './controllers/icalController';
import { checkCalendarController } from './controllers/checkCalendarController';
import { generateImgCalendarController } from './controllers/generateCalendarController';
import { setNextWeekController, setPreviousWeekController } from './controllers/setWeekController'

const router = Router();

router.get('/ical', icalController);
router.get('/calendar/img', generateImgCalendarController as any)
router.get('/calendar/haschanged', checkCalendarController as any);
router.get('/weeks/next', setNextWeekController);
router.get('/weeks/previous', setPreviousWeekController)

export default router;
