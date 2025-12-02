#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this after installing Vercel CLI: npm install -g vercel

echo "🚀 Setting up Vercel environment variables for production..."

# Make sure you're logged in to Vercel
echo "📝 Logging into Vercel..."
vercel login

# Link to your project (if not already linked)
echo "🔗 Linking to Vercel project..."
vercel link

# Set environment variables for production
echo "⚙️  Setting environment variables..."

vercel env add VITE_CLERK_PUBLISHABLE_KEY production << EOF
pk_live_Y2xlcmsubG9vdHZpYmUuY29tJA
EOF

vercel env add VITE_SUPABASE_URL production << EOF
https://cbjdasfnwzizfphnwxfd.supabase.co
EOF

vercel env add VITE_SUPABASE_ANON_KEY production << EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNTk1NzQsImV4cCI6MjA0NzkzNTU3NH0.9bLYe3Pu2gJGPqNqJYnFdqhLYLZDqLZhqLZhqLZhqLY
EOF

vercel env add VITE_BACKEND_URL production << EOF
https://lootvibe-backend-12913253d7a4.herokuapp.com
EOF

echo "✅ Environment variables set!"
echo ""
echo "🔄 Triggering production deployment..."
vercel --prod

echo ""
echo "✨ Done! Your app is deploying with the new environment variables."
