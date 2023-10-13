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

// Serve libs locally
router.get('/libs/fullcalendar.min.js', (req, res) => {
    res.sendFile('./libs/fullcalendar-6.1.9/dist/index.global.min.js', { root: __dirname })
})
router.get('/libs/bootstrap.min.css', (req, res) => {
  res.sendFile('./libs/bootstrap-5.1.3/bootstrap.min.css', { root: __dirname })
})
router.get('/libs/bootstrap-icons.css', (req, res) => {
  res.sendFile('./libs/bootstrap-icons-1.8.1/bootstrap-icons.css', { root: __dirname })
})

export default router;
