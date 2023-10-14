import { Router } from 'express';
import { icalController } from './controllers/icalController';
import { checkCalendarController } from './controllers/checkCalendarController';
import { generateCalendarController, generateImgCalendarController } from './controllers/generateCalendarController';
import { setNextWeekController, setPreviousWeekController } from './controllers/setWeekController'

const router = Router();

router.get('/ical', icalController);
router.get('/calendar/markdown', generateCalendarController as any) // I know this is not a good practice, but I don't have time to fix it. Feel free to do a PR.
router.get('/calendar/img', generateImgCalendarController as any)
router.get('/calendar/haschanged', checkCalendarController as any);
router.get('/weeks/next', setNextWeekController);
router.get('/weeks/previous', setPreviousWeekController)

export default router;
