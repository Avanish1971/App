#!/bin/bash
set -e
git pull origin main
npm install --legacy-peer-deps
npm run build
if pm2 describe geoattend-web > /dev/null 2>&1; then
  pm2 restart geoattend-web
else
  pm2 serve dist 3000 --spa --name geoattend-web
  pm2 save
fi
echo "Done. Web update live ho gaya."