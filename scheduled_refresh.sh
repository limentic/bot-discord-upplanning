# Get the current day and hour
current_day=$(date +%u)  # 1-7, Monday-Sunday
current_hour=$(date +%H) # 00-23

# Check if it's Sunday at 6 PM
if [ "$current_day" -eq 7 ] && [ "$current_hour" -eq 18 ]; then
  # Execute the Sunday commands
  curl http://localhost:3000/weeks/next && curl http://localhost:3000/calendar/img
else
  # Execute the hourly command
  curl http://localhost:3000/calendar/haschanged
fi
