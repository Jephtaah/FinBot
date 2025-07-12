# Smart Back Navigation System

## Overview
A complete smart navigation system that remembers where users came from and provides contextual back navigation throughout the FinBot application.

## Features
- **Context-aware back buttons** - Show appropriate text based on origin
- **Automatic source tracking** - Remembers the page users came from
- **Receipt processing integration** - Properly handles receipt-to-transaction flow
- **Fallback navigation** - Graceful degradation when no context available
- **Browser navigation handling** - Clears state on browser back/forward

## Components

### Core Hook: `useNavigationHistory`
- **Location**: `hooks/use-navigation-history.ts`
- **Purpose**: Manages navigation state using sessionStorage
- **Key Methods**:
  - `goBack()` - Navigate to previous page
  - `getBackButtonText()` - Get contextual button text
  - `setNavigationSource(path)` - Explicitly set navigation source

### Smart Back Button: `SmartBackButton`
- **Location**: `components/ui/smart-back-button.tsx`
- **Purpose**: Reusable button with intelligent back text
- **Props**: `size`, `variant`, `fallbackHref`, `fallbackText`

## Navigation Flow

### Dashboard Pages (Source Pages)
- `/dashboard` (Overview)
- `/dashboard/transactions` 
- `/dashboard/receipts`

These pages automatically store themselves as navigation sources.

### CRUD Pages (Destination Pages)
- `/dashboard/transactions/new`
- `/dashboard/transactions/[slug]/edit`
- `/dashboard/transactions/[slug]` (detail)

These pages read the stored navigation source and show appropriate back buttons.

## User Flows

### 1. Overview → Transaction
```
Overview → "Add Transaction" → Transaction Form
                               ↓ "Back to Overview"
```

### 2. Transactions → Edit
```
Transactions → Edit Transaction → Transaction Form
                                  ↓ "Back to Transactions"
```

### 3. Receipts → Process → Transaction
```
Receipts → Upload Receipt → Process → Transaction Form
                                      ↓ "Back to Receipts"
```

## Implementation Details

### Receipt Processing Integration
When users upload receipts on the receipts page:
1. Receipt is processed with OpenAI Vision API
2. Navigation source is explicitly set to `/dashboard/receipts`
3. User is redirected to transaction form with pre-filled data
4. Back button shows "Back to Receipts"
5. After saving, user returns to receipts page

### Error Handling
- Graceful fallback to "Back to Transactions" if no source
- Browser navigation clears stored state to prevent confusion
- Try-catch blocks in navigation functions

### SessionStorage Usage
- Key: `previousPath`
- Values: Dashboard page paths only
- Cleared on browser navigation events
- Survives page refreshes

## Files Modified

### New Files
- `hooks/use-navigation-history.ts`
- `components/ui/smart-back-button.tsx`

### Updated Files
- `components/forms/transaction-form.tsx` - Smart cancel button and redirect
- `app/dashboard/receipts/page.tsx` - Navigation source setting
- `app/dashboard/transactions/new/page.tsx` - Smart back button
- `app/dashboard/transactions/[slug]/edit/page.tsx` - Smart back button  
- `app/dashboard/transactions/[slug]/page.tsx` - Smart back button

## Testing
Navigate between pages and verify:
1. ✅ Overview → Transaction → "Back to Overview"
2. ✅ Transactions → Transaction → "Back to Transactions"
3. ✅ Receipts → Upload → Transaction → "Back to Receipts"
4. ✅ Direct URL access shows fallback behavior
5. ✅ Browser back/forward doesn't break navigation

## Maintenance Notes
- Navigation sources are defined in `DASHBOARD_PAGES` constant
- Adding new dashboard pages requires updating this array
- CRUD page detection uses URL pattern matching
- SessionStorage ensures state persists across page refreshes