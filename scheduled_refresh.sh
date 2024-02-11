#!/bin/bash
log_tag="bdu-refresh"

# Function to perform curl with retries
perform_curl_with_retry() {
  local url="$1"
  local max_retries=5
  local retry_interval=600  # 10 minutes in seconds

  for ((i = 1; i <= max_retries; i++)); do
    response=$(curl -sS "$url" 2>&1)

    if [[ "$url" == *"calendar"* && ($response == *"\"hasChanged\":false"* || $response == *"\"hasChanged\":true"*) ]]; then
      logger -t "$log_tag" "Curl successful for $url"
      return 0  # Success
    else
      logger -t "$log_tag" "Curl failed for $url. Retrying in 10 minutes (attempt $i of $max_retries)..."
      sleep $retry_interval
    fi
  done

  logger -t "$log_tag" "Exceeded maximum retry attempts. Curl failed for $url."
  return 1  # Failure
}

perform_curl_with_retry "http://localhost:3000/calendar"
