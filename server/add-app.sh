#!/bin/bash
# Script to add a new mini-app to the personal app store
# Usage: ./add-app.sh <app-id> <app-name> <description>
# The app files should be in a folder named <app-id> with index.html and app.json

APP_ID=$1
APP_NAME=$2
APP_DESC=$3

if [ -z "$APP_ID" ] || [ -z "$APP_NAME" ]; then
  echo "Usage: ./add-app.sh <app-id> <app-name> [description]"
  echo ""
  echo "Creates a new app folder in apps/ and adds it to the catalog."
  echo "You'll need to create apps/<app-id>/index.html manually."
  exit 1
fi

APPS_DIR="$(dirname "$0")/apps"
CATALOG="$(dirname "$0")/catalog.json"

mkdir -p "$APPS_DIR/$APP_ID"

if [ ! -f "$APPS_DIR/$APP_ID/app.json" ]; then
  cat > "$APPS_DIR/$APP_ID/app.json" << EOF
{
  "id": "$APP_ID",
  "name": "$APP_NAME",
  "description": "${APP_DESC:-A mini-app}",
  "version": "1.0.0"
}
EOF
  echo "Created app.json"
fi

if [ ! -f "$APPS_DIR/$APP_ID/index.html" ]; then
  cat > "$APPS_DIR/$APP_ID/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>APP_NAME</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a2e; color: #eee;
    display: flex; flex-direction: column; align-items: center; padding: 20px;
    min-height: 100vh;
  }
  h1 { margin: 20px 0; font-size: 24px; color: #e94560; }
  .card {
    background: #16213e; border-radius: 16px; padding: 20px; margin: 10px 0;
    width: 100%; max-width: 400px;
  }
  .card h2 { font-size: 18px; margin-bottom: 8px; color: #0f3460; }
  .card p, .card li { font-size: 14px; color: #aaa; line-height: 1.5; }
  button, .btn {
    background: #e94560; color: white; border: none; padding: 12px 24px;
    border-radius: 8px; font-size: 16px; margin: 5px 0; cursor: pointer;
  }
  input, select {
    background: #0f3460; color: #fff; border: none; padding: 10px;
    border-radius: 8px; font-size: 14px; width: 100%; margin: 5px 0;
  }
</style>
</head>
<body>
  <h1>APP_NAME</h1>
  <div class="card">
    <p>This app is under construction.</p>
  </div>
</body>
</html>
EOF
  sed -i "s/APP_NAME/$APP_NAME/g" "$APPS_DIR/$APP_ID/index.html"
  echo "Created index.html template"
fi

# Add to catalog
node -e "
const fs = require('fs');
const cat = JSON.parse(fs.readFileSync('$CATALOG', 'utf-8'));
if (!cat.find(a => a.id === '$APP_ID')) {
  cat.push({
    id: '$APP_ID',
    name: '$APP_NAME',
    description: '${APP_DESC:-A mini-app}',
    version: '1.0.0',
    addedAt: new Date().toISOString()
  });
  fs.writeFileSync('$CATALOG', JSON.stringify(cat, null, 2));
  console.log('Added to catalog');
}
"
echo ""
echo "App '$APP_NAME' created! Edit apps/$APP_ID/index.html to customize."
