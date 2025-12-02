# Auto-Withdrawal System with Manual Approval Threshold

## Overview

The withdrawal system now supports **automatic approval** with a **manual approval threshold** to prevent large fraudulent withdrawals from hackers or cheaters.

## How It Works

### Auto-Approval Toggle
- **Location**: Admin Dashboard → Platform Settings → Security & Compliance
- When **enabled**: Small withdrawals are automatically approved
- When **disabled**: All withdrawals require manual admin approval

### Manual Approval Threshold
- **Purpose**: Even with auto-approve enabled, withdrawals above this amount require manual review
- **Default**: $1,000 USD
- **Configurable**: Admins can set any threshold amount
- **Security**: Prevents large fraudulent withdrawals from being auto-approved

### Logic Flow

```
User Requests Withdrawal
    ↓
Is auto-approve enabled?
    ↓ YES
Is withdrawal amount < threshold?
    ↓ YES
✅ AUTO-APPROVED
    ↓ NO
⏸️ REQUIRES MANUAL APPROVAL
    ↓ NO (auto-approve disabled)
⏸️ REQUIRES MANUAL APPROVAL
```

## Setup Instructions

### 1. Run Database Migration

**Option A: SQL Migration (Recommended)**
```sql
-- Run this in your Supabase SQL editor
-- File: supabase/add_withdrawal_threshold.sql
```

**Option B: Migration Script**
```bash
node scripts/migrate-withdrawal-threshold.js
```

**Option C: Manual Column Addition**
```sql
ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS manual_approval_threshold DECIMAL(10, 2) DEFAULT 1000.00;
```

### 2. Configure Settings

1. Go to **Admin Dashboard** → **Platform Settings**
2. Scroll to **Security & Compliance** section
3. Toggle **"Auto-Approve Withdrawals"** ON
4. Set **"Manual Approval Threshold"** (e.g., $1,000)
5. Click **"Save Settings"**

## Configuration Examples

### Example 1: Conservative (Recommended for New Platforms)
- **Auto-Approve**: ✅ Enabled
- **Threshold**: $500
- **Result**: Withdrawals under $500 auto-approved, above $500 require review

### Example 2: Moderate
- **Auto-Approve**: ✅ Enabled
- **Threshold**: $1,000
- **Result**: Withdrawals under $1,000 auto-approved, above $1,000 require review

### Example 3: Aggressive (High Trust)
- **Auto-Approve**: ✅ Enabled
- **Threshold**: $5,000
- **Result**: Withdrawals under $5,000 auto-approved, above $5,000 require review

### Example 4: Manual Only
- **Auto-Approve**: ❌ Disabled
- **Threshold**: N/A
- **Result**: All withdrawals require manual approval

## Security Benefits

1. **Prevents Large Fraud**: Hackers can't auto-withdraw large amounts
2. **Reduces Admin Workload**: Small legitimate withdrawals are processed automatically
3. **Flexible Control**: Adjust threshold based on your risk tolerance
4. **Audit Trail**: All withdrawals (auto or manual) are logged

## User Experience

### Auto-Approved Withdrawal
- User submits withdrawal request
- If amount < threshold → Status: **APPROVED**
- Message: "Withdrawal approved automatically (below $X threshold) and will be processed shortly"
- Balance deducted immediately
- Withdrawal processed automatically

### Manual Approval Required
- User submits withdrawal request
- If amount >= threshold → Status: **PENDING**
- Message: "Withdrawal request submitted. Amount exceeds $X threshold and requires manual approval."
- Balance deducted (held until approval)
- Admin must approve/reject in Withdrawal Management

## API Changes

### Backend Logic (`backend_legacy/server.js`)

The withdrawal endpoint now checks:
1. `auto_approve_withdrawals` setting
2. `manual_approval_threshold` setting
3. Withdrawal amount

```javascript
if (autoApproveEnabled && amount < threshold) {
    status = 'APPROVED'; // Auto-approve
} else {
    status = 'PENDING'; // Manual review required
}
```

## Database Schema

```sql
platform_settings (
    id: 'default',
    auto_approve_withdrawals: BOOLEAN,
    manual_approval_threshold: DECIMAL(10, 2), -- NEW COLUMN
    min_withdrawal_amount: DECIMAL(10, 2),
    max_withdrawal_amount: DECIMAL(10, 2),
    ...
)
```

## Testing

1. **Test Auto-Approval**:
   - Enable auto-approve
   - Set threshold to $1,000
   - Request withdrawal of $500 → Should auto-approve

2. **Test Manual Approval**:
   - Enable auto-approve
   - Set threshold to $1,000
   - Request withdrawal of $1,500 → Should require manual approval

3. **Test Disabled Auto-Approve**:
   - Disable auto-approve
   - Request any withdrawal → Should require manual approval

## Troubleshooting

### Settings Not Saving
- Check browser console for errors
- Verify admin token is valid
- Check Supabase connection

### Threshold Not Working
- Verify `manual_approval_threshold` column exists in database
- Check that value is numeric (not string)
- Restart backend server

### All Withdrawals Still Require Approval
- Check `auto_approve_withdrawals` is set to `true`
- Verify threshold is set correctly
- Check backend logs for errors

## Future Enhancements

Potential improvements:
- Per-user withdrawal limits
- Time-based thresholds (e.g., higher threshold for verified users)
- Automatic fraud detection integration
- Email notifications for large withdrawal requests


