export const fetchIcal = async (firstDate: string, lastDate: string): Promise<string> => {
  try {
    const icalUrl = `https://upplanning.appli.univ-poitiers.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=${process.env.UPPLANNING_RESOURCES}&projectId=${process.env.UPPLANNING_PROJECT_ID}&calType=ical&firstDate=${firstDate}&lastDate=${lastDate}`

    const response = await fetch(icalUrl);
    const icalContent = await response.text();

    return icalContent;
  } catch (error) {
    console.error('Error fetching iCal:', error);
    throw new Error('Error fetching iCal');
  }
};
