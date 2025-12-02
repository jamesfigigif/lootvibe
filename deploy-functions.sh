#!/bin/bash

# Deploy Supabase Edge Functions using Management API
# This script deploys the functions without requiring CLI authentication

PROJECT_REF="cbjdasfnwzizfphnwxfd"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go"

echo "📦 Deploying battle-spin function..."

# Create a tarball of the battle-spin function
cd supabase/functions/battle-spin
tar -czf /tmp/battle-spin.tar.gz index.ts
cd ../../..

# Deploy battle-spin
curl -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/battle-spin" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/x-tar" \
  --data-binary @/tmp/battle-spin.tar.gz

echo ""
echo "📦 Deploying battle-claim function..."

# Create a tarball of the battle-claim function
cd supabase/functions/battle-claim
tar -czf /tmp/battle-claim.tar.gz index.ts
cd ../../..

# Deploy battle-claim
curl -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/battle-claim" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/x-tar" \
  --data-binary @/tmp/battle-claim.tar.gz

echo ""
echo "✅ Deployment complete!"
