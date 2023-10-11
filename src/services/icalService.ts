import { startOfWeek, lastDayOfWeek, format } from 'date-fns';

export const fetchIcal = async (): Promise<string> => {
  try {
    const currentDate = new Date();
    const mondayOfCurrentWeek = startOfWeek(currentDate);
    const fridayOfLastWeek = lastDayOfWeek(currentDate, { weekStartsOn: 1 }); // Monday is the start of the week

    const firstDate = format(mondayOfCurrentWeek, 'yyyy-MM-dd');
    const lastDate = format(fridayOfLastWeek, 'yyyy-MM-dd');

    const icalUrl = `https://upplanning.appli.univ-poitiers.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=${process.env.UPPLANNING_RESOURCES}&projectId=${process.env.UPPLANNING_PROJECT_ID}&calType=ical&firstDate=${firstDate}&lastDate=${lastDate}`

    const response = await fetch(icalUrl);
    const icalContent = await response.text();

    return icalContent;
  } catch (error) {
    console.error('Error fetching iCal:', error);
    throw new Error('Error fetching iCal');
  }
};
