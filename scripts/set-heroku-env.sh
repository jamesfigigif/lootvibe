#!/bin/bash
# Set Heroku environment variables for withdrawal system
# Usage: ./scripts/set-heroku-env.sh YOUR_HEROKU_APP_NAME

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
    echo "Usage: ./scripts/set-heroku-env.sh YOUR_HEROKU_APP_NAME"
    exit 1
fi

echo "Setting environment variables for $APP_NAME..."

heroku config:set \
  BTC_MASTER_SEED="lobster palace obey fence blossom beyond fitness taxi lend detect taste book" \
  ETH_MASTER_SEED="width hour front castle trick police render possible upset true cinnamon exchange" \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZmxjdXl4bXd6cmtueGpnYXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUxMjk3MywiZXhwIjoyMDgwMDg4OTczfQ.WABEBO72ZoO1pFHrcJCnAlGMmfujAiyVoiOUAWfkhRc" \
  VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZmxjdXl4bXd6cmtueGpnYXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTI5NzMsImV4cCI6MjA4MDA4ODk3M30.BEa5PXEfBd1A2yaeRGr287UCdQ2YHGWtWjYGxvfFhjk" \
  NODE_ENV="production" \
  EMAIL_ENABLED="false" \
  --app $APP_NAME

echo "✅ Environment variables set!"
echo "The app will automatically restart."
