# 🚨 CRITICAL: Exchange/Inventory Security Vulnerability

## ⚠️ Current Vulnerabilities

### 1. **Exchange for Cash (handleSellItem)** - INSECURE ❌

**Location**: `App.tsx` line 538-558

**Vulnerabilities**:
```typescript
// Client-side code - HACKABLE!
await addTransaction(user.id, 'WIN', rollResult.item.value, ...);
```

**Attack Scenarios**:
1. **Manipulate Item Value**: Change `rollResult.item.value` to $10,000 before selling
2. **Sell Non-Existent Items**: Create fake items and sell them
3. **Replay Attacks**: Sell the same item multiple times
4. **No Ownership Validation**: No check that user actually owns the item

### 2. **Add to Inventory (handleKeepItem)** - INSECURE ❌

**Location**: `App.tsx` line 560-575

**Vulnerabilities**:
```typescript
// Client-side code - HACKABLE!
const updatedInventory = [...user.inventory, rollResult.item];
await updateUserState(user.id, { inventory: updatedInventory });
```

**Attack Scenarios**:
1. **Add Fake Items**: Inject high-value items into inventory
2. **Duplicate Items**: Add the same item multiple times
3. **No Validation**: No check that item was legitimately won

---

## ✅ Good News

The `box-open` edge function **already adds items to inventory** (line 201-216), so:
- ✅ Items are added server-side when box is opened
- ✅ "Collect" button might be redundant (item already in inventory)
- ❌ But "Exchange" is still vulnerable

---

## 🛡️ Required Fixes

### Fix 1: Create `item-exchange` Edge Function

**Purpose**: Securely exchange items for cash

**Security Checks**:
- ✅ Verify item exists in user's inventory
- ✅ Verify item value from database (not client)
- ✅ Remove item from inventory atomically
- ✅ Add cash to balance atomically
- ✅ Create transaction record
- ✅ Update `box_openings.outcome` to 'SOLD'

### Fix 2: Remove Client-Side Inventory Management

- Remove `handleKeepItem` (item already in inventory from edge function)
- Update `handleSellItem` to call edge function instead

---

## 📊 Security Comparison

| Operation | Current | After Fix |
|-----------|---------|-----------|
| Box Opening | ✅ Secure (edge function) | ✅ Secure |
| Add to Inventory | ❌ Client-side | ✅ Already in edge function |
| Exchange for Cash | ❌ Client-side | ✅ Needs edge function |
| Remove from Inventory | ❌ Client-side | ✅ Needs edge function |

---

**Status**: 🔴 **CRITICAL - IMMEDIATE FIX REQUIRED**

