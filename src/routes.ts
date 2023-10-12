import { Router } from 'express';
import { icalController } from './controllers/icalController';
import { checkCalendarController } from './controllers/checkCalendarController';
import { generateCalendarController, generateImgCalendarController } from './controllers/generateCalendarController';
import { setNextWeekController, setPreviousWeekController } from './controllers/setWeekController'

const router = Router();

// I know I've not respected the REST principles here, but I don't care. It's a private API.
router.get('/ical', icalController);
router.get('/calendar', generateCalendarController as any);
router.get('/calendarimg', generateImgCalendarController as any)
router.get('/check-calendar', checkCalendarController as any);
router.get('/set-next-week', setNextWeekController);
router.get('/set-previous-week', setPreviousWeekController);

// Serve libs locally
router.get('/libs/fullcalendar.min.js', (req, res) => {
    res.sendFile('./libs/fullcalendar-6.1.9/dist/index.global.min.js', { root: __dirname })
})

export default router;
