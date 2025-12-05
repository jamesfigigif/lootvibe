#!/bin/bash

# 🚀 Deploy Backend Only - Quick Script

set -e  # Exit on any error

echo "🚀 Deploying backend to Heroku..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to backend
cd /Users/luke/Downloads/lootvibe/backend

# Check for changes
if [[ -z $(git status -s) ]]; then
    echo "${YELLOW}⚠️  No changes to deploy${NC}"
    exit 0
fi

# Get commit message
read -p "Enter commit message: " commit_message
if [ -z "$commit_message" ]; then
    commit_message="backend: Update server"
fi

echo "📝 Committing changes..."
git add .
git commit -m "$commit_message"

echo "📤 Pushing to GitHub..."
git push github main || echo "${YELLOW}⚠️  GitHub push failed${NC}"

echo "🚀 Deploying to Heroku..."
git push heroku main

echo ""
echo "${GREEN}✅ Backend deployed successfully!${NC}"
echo ""
echo "📊 View logs: heroku logs --tail"
echo "🌐 URL: https://lootvibe-backend-12913253d7a4.herokuapp.com"
