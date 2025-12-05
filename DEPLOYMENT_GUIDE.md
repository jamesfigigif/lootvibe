# 🚀 LootVibe Deployment Guide

**Quick reference for deploying changes to production**

---

## 📁 Project Structure

```
lootvibe/
├── backend/                    # Backend Express server (Heroku)
│   ├── server.js              # Main API server
│   ├── services/              # Backend services
│   ├── routes/                # API routes
│   └── middleware/            # Auth & validation
├── components/                # React components (Vercel)
├── supabase/
│   └── functions/             # Edge Functions (Supabase)
│       ├── battle-claim/
│       ├── battle-join/
│       ├── box-open/
│       └── item-exchange/
└── App.tsx                    # Main React app (Vercel)
```

---

## 🎯 What Gets Deployed Where

| Component | Platform | Auto-Deploy | Manual Command |
|-----------|----------|-------------|----------------|
| **Frontend** | Vercel | ✅ On git push | N/A |
| **Backend API** | Heroku | ✅ On git push | `./deploy-backend.sh` |
| **Edge Functions** | Supabase | ❌ Manual only | `./deploy-functions.sh` |

---

## 🚀 Quick Deploy Commands

### **Deploy Everything (Recommended)**
```bash
# From project root: /Users/luke/Downloads/lootvibe
./deploy-all.sh
```

### **Deploy Backend Only**
```bash
cd backend
git add .
git commit -m "your commit message"
git push github main
git push heroku main
```

### **Deploy Edge Functions Only**
```bash
# From project root
supabase functions deploy battle-claim
supabase functions deploy battle-join
supabase functions deploy box-open
supabase functions deploy item-exchange
supabase functions deploy claim-free-box
```

### **Deploy Frontend Only**
```bash
# From project root
git add .
git commit -m "your commit message"
git push origin main
# Vercel auto-deploys
```

---

## 📝 Step-by-Step Deployment

### **Scenario 1: Changed Backend API (`backend/server.js`)**

1. Navigate to backend directory:
   ```bash
   cd /Users/luke/Downloads/lootvibe/backend
   ```

2. Check what changed:
   ```bash
   git status
   git diff server.js
   ```

3. Commit changes:
   ```bash
   git add server.js
   git commit -m "fix: your change description"
   ```

4. Push to GitHub (for backup):
   ```bash
   git push github main
   ```

5. Deploy to Heroku (live production):
   ```bash
   git push heroku main
   ```

6. Verify deployment:
   ```bash
   heroku logs --tail
   ```

---

### **Scenario 2: Changed Edge Function**

1. Navigate to project root:
   ```bash
   cd /Users/luke/Downloads/lootvibe
   ```

2. Deploy specific function:
   ```bash
   supabase functions deploy battle-claim
   # or
   supabase functions deploy item-exchange
   # or
   supabase functions deploy box-open
   ```

3. Test the function:
   ```bash
   # Check Supabase logs at:
   # https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/functions
   ```

---

### **Scenario 3: Changed Frontend Component**

1. Navigate to project root:
   ```bash
   cd /Users/luke/Downloads/lootvibe
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "fix: your change description"
   git push origin main
   ```

3. Vercel automatically deploys!
   - Check: https://vercel.com/dashboard

---

### **Scenario 4: Changed Multiple Things (Security Fix Example)**

**From project root (`/Users/luke/Downloads/lootvibe`):**

```bash
# 1. Commit frontend changes
git add components/ supabase/functions/
git commit -m "security: fix vulnerabilities"
git push origin main

# 2. Deploy edge functions
supabase functions deploy battle-claim
supabase functions deploy item-exchange

# 3. Go to backend and deploy
cd backend
git add server.js
git commit -m "security: add authentication"
git push github main
git push heroku main
```

---

## ⚠️ Common Gotchas

### **Issue: "fatal: in unpopulated submodule 'backend'"**
**Solution:** You're in the wrong directory. Use absolute paths:
```bash
cd /Users/luke/Downloads/lootvibe/backend
```

### **Issue: "Updates were rejected"**
**Solution:** Remote has changes you don't have locally:
```bash
git pull github main --no-rebase
# Resolve any conflicts
git push github main
```

### **Issue: "Docker is not running"**
**Solution:** This is just a warning. Deployment still works! Ignore it.

### **Issue: Edge function not updating**
**Solution:** Hard refresh or clear cache:
1. Check Supabase dashboard for latest version
2. Wait 30 seconds for propagation
3. Test with fresh incognito window

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Backend API responding: `curl https://lootvibe-backend-12913253d7a4.herokuapp.com/health`
- [ ] Frontend loading: `https://lootvibe.com`
- [ ] Edge functions working: Check Supabase dashboard logs
- [ ] No errors in browser console
- [ ] Test critical flows (deposit, withdraw, battle, box opening)

---

## 🔐 Environment Variables

### **Heroku (Backend)**
```bash
heroku config:set VARIABLE_NAME=value
```

### **Vercel (Frontend)**
```bash
vercel env add VARIABLE_NAME production
```

### **Supabase (Edge Functions)**
```bash
supabase secrets set VARIABLE_NAME=value
```

---

## 🆘 Rollback Procedures

### **Rollback Backend**
```bash
cd backend
heroku releases
heroku rollback v28  # Replace with previous version
```

### **Rollback Frontend**
Go to Vercel dashboard → Select previous deployment → "Promote to Production"

### **Rollback Edge Function**
No native rollback - redeploy previous version from git:
```bash
git checkout <previous-commit> -- supabase/functions/battle-claim/
supabase functions deploy battle-claim
```

---

## 📊 Monitoring

- **Backend Logs:** `heroku logs --tail`
- **Edge Function Logs:** https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/logs
- **Frontend Errors:** Vercel dashboard → Analytics

---

## 🎓 Pro Tips

1. **Always test in development first:**
   ```bash
   npm run dev  # Frontend
   npm run server  # Backend
   ```

2. **Use descriptive commit messages:**
   ```bash
   git commit -m "fix: prevent double item exchange"
   git commit -m "feat: add deposit authentication"
   git commit -m "security: verify battle winners"
   ```

3. **Check status before pushing:**
   ```bash
   git status
   git diff
   ```

4. **Keep backend and frontend in sync:**
   - If you change an API endpoint, update both backend AND frontend
   - Test the integration before deploying

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Check backend status | `cd backend && git status` |
| Deploy backend | `cd backend && git push heroku main` |
| Deploy edge function | `supabase functions deploy <name>` |
| Deploy frontend | `git push origin main` |
| View backend logs | `heroku logs --tail` |
| Backend directory | `/Users/luke/Downloads/lootvibe/backend` |
| Project root | `/Users/luke/Downloads/lootvibe` |

---

**Last Updated:** 2025-12-05
**By:** Claude Code Security Audit
