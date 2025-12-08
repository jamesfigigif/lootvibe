# 📊 Vercel Usage Monitoring Guide

## 🎯 Quick Answer

**You won't have the same bandwidth problem on Vercel** because:
1. Your **images are served from Supabase Storage**, not Vercel
2. Vercel only serves your HTML/CSS/JS files (~300 KB total)
3. The 5GB issue was Supabase Storage egress (images), not hosting

---

## 📈 Vercel Free Tier Limits

| Resource | Free Tier Limit | Your Usage (Est.) |
|----------|----------------|-------------------|
| **Bandwidth** | 100 GB/month | ~10-20 GB/month |
| **Build Minutes** | 6,000 min/month | ~5-10 min/month |
| **Serverless Executions** | 1 million/month | N/A (not using) |
| **Edge Requests** | Unlimited | Unlimited ✅ |

### What Uses Bandwidth on Vercel?
- **HTML/CSS/JS files**: ~300 KB per page load (after code splitting)
- **NOT images**: Images come from Supabase Storage
- **NOT API calls**: API calls go to Supabase, not Vercel

### Estimated Vercel Bandwidth:
- **Per page load**: ~300 KB
- **1,000 page loads**: 300 MB
- **10,000 page loads**: 3 GB
- **100 GB limit** = ~330,000 page loads per month!

**Verdict**: You're safe! 100 GB is massive for static assets.

---

## 🔍 How to Check Vercel Usage

### Method 1: Web Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Select your project** (lootvibe)

3. **Click "Usage" tab** (left sidebar)
   - You'll see current month's usage
   - Bandwidth graph
   - Build minutes used
   - Function executions (if any)

4. **View detailed analytics**
   - Click "Analytics" tab for page views, performance, etc.

### Method 2: Vercel CLI

```bash
# Check account usage (requires login)
vercel teams switch

# View project info
cd /Users/luke/Downloads/lootvibe
vercel inspect
```

Note: Vercel CLI doesn't show detailed usage metrics. Use the web dashboard.

---

## 📧 Set Up Usage Alerts

### Enable Email Notifications:

1. Go to **Vercel Dashboard** → **Settings** → **Notifications**
2. Enable:
   - ✅ **Usage threshold alerts** (80% of limit)
   - ✅ **Failed deployments**
   - ✅ **Domain changes**

3. Vercel will email you at:
   - 80% of bandwidth limit (~80 GB)
   - 90% of bandwidth limit (~90 GB)
   - 100% of bandwidth limit

---

## 🚀 Vercel vs Supabase Bandwidth

### Where Your 5 GB Went:

```
User visits site → Vercel serves HTML/JS (300 KB)
                ↓
User's browser fetches images from Supabase Storage (5 MB)
                ↓
Total Vercel bandwidth: 300 KB ✅
Total Supabase egress: 5 MB ⚠️
```

### After 1,000 Page Loads:
- **Vercel bandwidth**: 300 MB (1% of 100 GB limit)
- **Supabase egress**: 5 GB (100% of 5 GB limit) ❌

**The problem was Supabase images, not Vercel hosting!**

---

## 📊 Monitor Your Bandwidth Usage

### Option 1: Manual Check (Weekly)
```bash
# Add to your notes or calendar:
# Every Monday: Check Vercel usage at https://vercel.com/dashboard/usage
```

### Option 2: Browser Bookmark
1. Bookmark this URL:
   ```
   https://vercel.com/[YOUR_USERNAME]/lootvibe/usage
   ```
2. Check it once a week

### Option 3: Vercel Analytics (Recommended)
Vercel Analytics shows page views, which correlates to bandwidth:
```
100,000 page views × 300 KB = 30 GB bandwidth
```

Enable at: **Dashboard → Analytics** (Free tier: 100k data points/month)

---

## 🎯 What the Optimizations Do for Vercel

### Before Optimizations:
- **Bundle size**: 885 KB (uncompressed)
- **First load**: 885 KB from Vercel
- **Repeat loads**: 885 KB from Vercel (no caching)
- **1,000 loads** = 885 MB from Vercel

### After Optimizations:
- **Bundle size**: ~300 KB (code split + compressed)
- **First load**: 300 KB from Vercel
- **Repeat loads**: ~50 KB (service worker + browser cache)
- **1,000 loads** = 300 KB + (999 × 50 KB) = **~50 MB from Vercel**

**Savings**: 885 MB → 50 MB = **94% reduction**

---

## ⚠️ When to Worry About Vercel Limits

### You'll hit Vercel limits if:
1. **100,000+ monthly active users** (unlikely for now)
2. **Serving large files from Vercel** (you're not, images are on Supabase)
3. **High-traffic viral moment** (good problem to have!)

### Current Safety Margin:
With optimizations:
- **100 GB limit** ÷ 50 KB per repeat load = **2 million page loads/month**
- Even with 10,000 monthly users: 2M ÷ 10k = 200 loads per user/month
- That's **6-7 page loads per day per user** - plenty of headroom!

---

## 🔔 Real-Time Monitoring Script

Want to check usage without opening browser? Create a script:

```bash
# Create monitoring script
cat > ~/check-vercel-usage.sh << 'EOF'
#!/bin/bash
echo "🚀 Opening Vercel Usage Dashboard..."
open "https://vercel.com/dashboard/usage"
echo "✅ Check your bandwidth, builds, and executions!"
EOF

chmod +x ~/check-vercel-usage.sh

# Run anytime with:
# ~/check-vercel-usage.sh
```

---

## 📋 Monthly Checklist

Add to your calendar or reminders:

**1st of Every Month**:
- [ ] Check Vercel usage: https://vercel.com/dashboard/usage
- [ ] Check Supabase egress: https://supabase.com/dashboard/project/_/settings/billing
- [ ] Review analytics: page views, load times
- [ ] Verify service worker is working (DevTools → Application)

**Expected usage**:
- Vercel: 5-20 GB/month (safe, 100 GB limit)
- Supabase: 200 MB - 2 GB/month (safe, 5 GB limit with optimizations)

---

## 🎉 Summary

### The Good News:
1. ✅ **Vercel limit is 20x higher** than Supabase (100 GB vs 5 GB)
2. ✅ **Your Vercel usage is ~100x smaller** than Supabase (300 KB vs 5 MB per load)
3. ✅ **Service worker reduces repeat load bandwidth by 94%**
4. ✅ **You won't have bandwidth issues on Vercel** with current traffic

### Quick Check:
- **Web**: https://vercel.com/dashboard/usage
- **Frequency**: Once per week (or monthly)
- **Alert**: Vercel emails at 80% usage automatically

### Bottom Line:
**You're safe!** The 5 GB problem was Supabase images, not Vercel hosting. With optimizations, you can handle 100,000+ monthly users before hitting Vercel limits.

---

## 🆘 If You Ever Hit Limits

### Vercel Limit (Unlikely):
- Upgrade to Pro: $20/month = 1 TB bandwidth
- Contact Vercel support (they're generous with limits)

### Supabase Limit (More likely):
- Upgrade to Pro: $25/month = 250 GB egress
- With optimizations: 250 GB = ~50,000 page loads/month
- Can support ~5,000-10,000 active users
