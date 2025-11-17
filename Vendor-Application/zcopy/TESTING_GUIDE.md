# ABC Vendor Portal - Testing Guide

## 📋 Pre-Testing Checklist

### Backend Requirements
Before testing the frontend, ensure your FastAPI backend is:
- ✅ Running on `http://localhost:8000`
- ✅ Supabase databases configured (db1 for bank, db2 for vendor)
- ✅ Environment variables set (.env file)
- ✅ All required tables created in both databases
- ✅ Email SMTP configured for OTP and notifications

### Frontend Requirements
- ✅ Next.js dev server running on `http://localhost:3000`
- ✅ `.env.local` configured with `NEXT_PUBLIC_API_URL`
- ✅ All dependencies installed (`yarn install`)
- ✅ Webcam available for FacePay testing

---

## 🧪 Manual Testing Scenarios

### 1. Vendor Registration Flow

**Test Case 1.1: Successful Registration**

1. Navigate to `http://localhost:3000/register`
2. Fill in all required fields:
   - Name: `John Doe`
   - Mobile: `9876543210`
   - Email: `john@example.com`
   - Account Number: `1234567890`
   - Branch: `Main Branch`
   - Initial Balance: `50000`
   - PIN: `123456`
   - Confirm PIN: `123456`
3. Click "Register"
4. **Expected**: Success toast, redirect to OTP verification page
5. Check email for OTP code
6. Enter OTP on verification page
7. **Expected**: Success toast, redirect to dashboard

**Test Case 1.2: Duplicate Registration**

1. Try registering with same mobile/email
2. **Expected**: Error toast "Vendor already exists" or "Email already registered"

**Test Case 1.3: PIN Mismatch**

1. Enter different PINs in PIN and Confirm PIN fields
2. **Expected**: Error toast "PINs do not match"

---

### 2. Login Flow

**Test Case 2.1: Successful Login**

1. Navigate to `http://localhost:3000/login`
2. Enter registered mobile and PIN
3. Click "Sign In"
4. **Expected**: Success toast, redirect to dashboard

**Test Case 2.2: Invalid Credentials**

1. Enter wrong mobile or PIN
2. **Expected**: Error toast "Invalid credentials"

**Test Case 2.3: Unverified Account**

1. Try logging in with unverified account
2. **Expected**: Error toast "Please verify your account first"

---

### 3. Dashboard

**Test Case 3.1: View Dashboard**

1. After login, should land on dashboard
2. **Verify**:
   - Current balance displayed correctly
   - Account number and branch shown
   - Vendor name displayed in header
   - Recent transactions (if any) shown in table

**Test Case 3.2: Navigation**

1. Click each menu item in sidebar:
   - Dashboard ✓
   - Deposit ✓
   - Transfer ✓
   - FacePay ✓
   - Transactions ✓
2. **Expected**: Each page loads correctly with active state highlight

**Test Case 3.3: Logout**

1. Click "Logout" button in sidebar
2. **Expected**: Redirect to login page, token cleared

---

### 4. Deposit Funds

**Test Case 4.1: Successful Deposit**

1. Navigate to Deposit page
2. Enter amount: `5000`
3. Click "Deposit Now"
4. **Expected**: 
   - Success toast with amount
   - New balance shown
   - Auto-redirect to dashboard after 2 seconds

**Test Case 4.2: Invalid Amount**

1. Enter negative or zero amount
2. **Expected**: Error toast "Please enter a valid amount"

**Test Case 4.3: Large Amount Formatting**

1. Enter amount: `123456.78`
2. **Verify**: Amount formatted correctly as ₹1,23,456.78

---

### 5. Transfer Funds

**Test Case 5.1: Successful Transfer**

1. Navigate to Transfer page
2. Fill in:
   - Beneficiary Account: `9876543210`
   - Amount: `1000`
   - Remarks: `Test transfer`
3. Click "Transfer Now"
4. **Expected**: 
   - Success toast
   - New balance shown
   - Auto-redirect to dashboard

**Test Case 5.2: Insufficient Balance**

1. Try transferring more than available balance
2. **Expected**: Error toast "Insufficient balance"

**Test Case 5.3: Empty Remarks**

1. Leave remarks field empty
2. **Expected**: Transfer should succeed (remarks optional)

---

### 6. FacePay - Complete Flow

**Prerequisites:**
- Customer exists in bank system (db1)
- Customer has FacePay enabled
- Customer's face registered with embeddings
- Customer's 6-digit PIN set and encrypted

**Test Case 6.1: Successful FacePay Transaction**

**Step 1: Enter Amount**
1. Navigate to FacePay page
2. Enter amount: `350`
3. Click "Continue"
4. **Expected**: Session initiated, move to Step 2

**Step 2: Confirm Amount**
1. Verify amount shown: ₹350.00
2. Click "Confirm"
3. **Expected**: Move to Step 3

**Step 3: Enter Customer Phone**
1. Enter customer's registered mobile: `9123456789`
2. Click "Verify Customer"
3. **Expected**: 
   - Success toast with customer name
   - Move to Step 4

**Step 4: Capture Face**
1. Allow webcam access
2. Position customer's face in camera
3. Click "Capture Photo"
4. Review captured image
5. Click "Confirm"
6. **Expected**: 
   - Face verification in progress
   - Success toast with similarity score
   - Move to Step 5

**Step 5: Enter PIN**
1. Customer enters 6-digit PIN
2. Click "Complete Payment"
3. **Expected**: 
   - Payment processing
   - Success screen displayed
   - Transaction ID shown
   - Customer name and amount confirmed

**Step 6: Success**
1. View transaction details
2. Options: "View Dashboard" or "New Transaction"
3. **Expected**: 
   - Transaction recorded in vendor system
   - Balances updated (customer debit, vendor credit)
   - Email sent to customer for verification

**Test Case 6.2: Invalid Customer Phone**

1. Enter non-existent phone number
2. **Expected**: Error toast "Customer not found. Please use manual payment."

**Test Case 6.3: FacePay Disabled**

1. Enter phone of customer with FacePay disabled
2. **Expected**: Error toast "FacePay not enabled for this customer"

**Test Case 6.4: Amount Exceeds Limit**

1. Enter amount greater than customer's FacePay limit (e.g., ₹10,000 if limit is ₹5,000)
2. Proceed through steps
3. **Expected**: Error after face verification "Amount exceeds FacePay limit of ₹5,000.00"

**Test Case 6.5: Face Verification Fails**

1. Capture wrong person's face
2. **Expected**: Error toast "Face verification failed"

**Test Case 6.6: Wrong PIN**

1. Complete all steps successfully until PIN
2. Enter incorrect PIN
3. **Expected**: Error toast "Invalid PIN"

**Test Case 6.7: Cancel Transaction**

1. Start FacePay flow
2. At "Confirm Amount" step, click "Cancel"
3. **Expected**: Reset to Step 1

---

### 7. Transaction History

**Test Case 7.1: View Transactions**

1. Navigate to Transactions page
2. **Verify**:
   - All transactions displayed in table
   - Correct transaction types (badges colored)
   - Amounts formatted correctly
   - Timestamps shown as relative time
   - Status badges displayed

**Test Case 7.2: Empty State**

1. With new vendor (no transactions)
2. **Expected**: "No transactions found" message

**Test Case 7.3: Export (Coming Soon)**

1. Click "Export" button
2. **Expected**: Toast "Export feature coming soon!"

---

### 8. Responsive Design

**Test Case 8.1: Mobile View**

1. Open DevTools, switch to mobile view (375px)
2. Navigate through all pages
3. **Verify**:
   - Sidebar collapses or becomes hamburger menu
   - Forms stack vertically
   - Cards are full-width
   - Text is readable
   - Buttons are thumb-friendly

**Test Case 8.2: Tablet View**

1. Set viewport to 768px
2. Test all pages
3. **Verify**: Layout adjusts appropriately

**Test Case 8.3: Large Desktop**

1. Set viewport to 1920px or 2560px
2. **Verify**: Content is centered, max-width applied

---

### 9. Dark Mode

**Test Case 9.1: Theme Toggle**

1. Change system theme to dark mode
2. Refresh application
3. **Verify**:
   - Background colors inverted
   - Text remains readable
   - Purple/Violet theme still visible
   - No contrast issues

**Test Case 9.2: Dark Mode Components**

1. Check all components in dark mode:
   - Cards
   - Buttons
   - Forms
   - Sidebar
   - Modals
2. **Verify**: All look professional and readable

---

### 10. Security Testing

**Test Case 10.1: Protected Routes**

1. Without logging in, try accessing:
   - `/dashboard`
   - `/deposit`
   - `/transfer`
   - `/facepay`
   - `/transactions`
2. **Expected**: All redirect to `/login`

**Test Case 10.2: Token Expiry**

1. Login and get token
2. Manually expire token or wait for expiry
3. Try making API call
4. **Expected**: Redirect to login with error

**Test Case 10.3: XSS Prevention**

1. Try entering script tags in forms:
   - `<script>alert('XSS')</script>`
2. **Expected**: Sanitized or rejected

---

## 🤖 Automated Testing

### Setup Testing Environment

```bash
# Install testing dependencies (if not already)
yarn add -D @playwright/test
yarn add -D jest @testing-library/react @testing-library/jest-dom
```

### Run Tests

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Coverage report
yarn test:coverage
```

### Automated Test Scripts

**Example: Login Flow Test**

```javascript
// tests/login.spec.js
import { test, expect } from '@playwright/test';

test('successful login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input#mobile', '9876543210');
  await page.fill('input#pin', '123456');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

---

## 📊 Performance Testing

### Metrics to Check

1. **Page Load Time**: Should be < 2 seconds
2. **Time to Interactive**: Should be < 3 seconds
3. **First Contentful Paint**: Should be < 1.5 seconds
4. **Bundle Size**: Main bundle < 500KB
5. **Lighthouse Score**: 
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: > 90

### Tools

```bash
# Lighthouse
npx lighthouse http://localhost:3000 --view

# Bundle analyzer
npx @next/bundle-analyzer
```

---

## 🐛 Bug Reporting Template

When you find a bug, report it with:

```markdown
## Bug Report

**Title**: [Brief description]

**Priority**: Critical / High / Medium / Low

**Environment**:
- Browser: Chrome 120.0
- OS: Windows 11
- Screen: 1920x1080

**Steps to Reproduce**:
1. Go to login page
2. Enter credentials
3. Click submit
4. Error appears

**Expected Behavior**:
Should redirect to dashboard

**Actual Behavior**:
Error toast appears with "Invalid token"

**Screenshots**:
[Attach screenshots]

**Console Errors**:
```
Error: Token verification failed
```

**Additional Context**:
Happens only on first login attempt
```

---

## ✅ Test Coverage Checklist

### Authentication
- [ ] Vendor registration
- [ ] OTP verification
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Token expiry handling

### Financial Operations
- [ ] Deposit funds
- [ ] Transfer funds
- [ ] Insufficient balance handling
- [ ] Transaction history display

### FacePay
- [ ] All 5 steps complete successfully
- [ ] Invalid customer phone
- [ ] FacePay disabled customer
- [ ] Amount exceeds limit
- [ ] Face verification fails
- [ ] Wrong PIN
- [ ] Cancel transaction

### UI/UX
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Dark mode
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Navigation

### Security
- [ ] Protected routes
- [ ] Token management
- [ ] XSS prevention
- [ ] CSRF protection

### Performance
- [ ] Page load times
- [ ] Bundle size
- [ ] Lighthouse scores
- [ ] Network requests

---

## 📝 Testing Notes

### Known Issues
- [ ] None currently

### Test Environment
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Database**: Supabase (db1 & db2)

### Test Data
Create test vendors with:
- Mobile: 9876543210
- PIN: 123456
- Email: test@vendor.com

### Browser Compatibility
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

---

## 🎯 Testing Priorities

### High Priority
1. Authentication flow
2. FacePay complete transaction
3. Deposit and transfer
4. Security (protected routes)

### Medium Priority
1. Transaction history
2. Responsive design
3. Dark mode
4. Error handling

### Low Priority
1. Export functionality
2. Advanced filters
3. Performance optimization

---

## 📞 Support

For testing issues or questions:
- Email: qa@abcbank.com
- Slack: #vendor-portal-testing

---

**Last Updated**: June 2025
**Version**: 1.0.0
