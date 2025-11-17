# ABC Vendor Portal - Frontend Documentation

## 🎨 Premium Purple & Violet Banking Theme

A modern, secure vendor portal for ABC Secure Bank with advanced FacePay technology. Built with Next.js, React, Tailwind CSS, and Shadcn UI.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Components](#components)
- [API Integration](#api-integration)
- [FacePay Flow](#facepay-flow)
- [Styling & Theme](#styling--theme)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### 🔐 Authentication
- **Vendor Registration** with OTP verification
- **Secure Login** with PIN authentication
- **JWT-based** session management
- **Protected Routes** for authenticated users only

### 💰 Financial Operations
- **Deposit Funds** - Add money to vendor account
- **Transfer Money** - Send funds to other accounts
- **Transaction History** - View all past transactions
- **Real-time Balance** - Live balance updates

### 🎭 FacePay Technology
A revolutionary 5-step payment system:
1. **Enter Amount** - Vendor initiates transaction
2. **Confirm Amount** - Double verification to prevent errors
3. **Enter Customer Phone** - Verify customer eligibility
4. **Capture Face** - Live webcam face recognition with ViT model
5. **Enter PIN** - RSA-encrypted 6-digit PIN verification

### 🎨 UI/UX Features
- **Premium Purple/Violet Theme** with gradient accents
- **Responsive Design** - Mobile, tablet, and desktop optimized
- **Dark Mode Support** - Automatic theme switching
- **Loading States** - Smooth user feedback
- **Toast Notifications** - Real-time alerts
- **Sidebar Navigation** - Intuitive menu structure

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14.2.3 |
| **UI Library** | React 18 |
| **Styling** | Tailwind CSS 3.4.1 |
| **Component Library** | Shadcn UI (Radix UI) |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Notifications** | Sonner (Toast) |
| **Webcam** | react-webcam 7.2.0 |
| **Form Validation** | React Hook Form + Zod |
| **Date Handling** | date-fns |

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **Yarn** 1.22.x or higher
- **FastAPI Backend** running on `http://localhost:8000`
- **Supabase** accounts for db1 (bank) and db2 (vendor)
- **Environment Variables** configured (see below)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
cd /app
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Configure Environment Variables
Create or update `.env.local`:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# App Configuration
NEXT_PUBLIC_APP_NAME=ABC Vendor Portal
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Development Server
```bash
yarn dev
```

The application will be available at `http://localhost:3000`

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | FastAPI backend endpoint | `http://localhost:8000/api` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `ABC Vendor Portal` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | `http://localhost:3000` |

### Backend Requirements

Ensure your FastAPI backend has these endpoints configured:

**Authentication:**
- `POST /vendor/register` - Vendor registration
- `POST /vendor/verify-otp` - OTP verification
- `POST /vendor/login` - Vendor login

**Dashboard:**
- `GET /vendor/dashboard` - Fetch vendor info and transactions
- `GET /vendor/transactions` - Get all transactions

**Operations:**
- `POST /vendor/deposit` - Deposit funds
- `POST /vendor/transfer` - Transfer funds

**FacePay:**
- `POST /facepay/initiate` - Start FacePay session
- `POST /facepay/confirm-amount` - Confirm transaction amount
- `POST /facepay/verify-phone` - Verify customer phone
- `POST /facepay/verify-face` - Face recognition verification
- `POST /facepay/verify-pin` - PIN verification

---

## 📁 Project Structure

```
/app/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout with Toaster
│   ├── page.js                   # Landing page (redirects)
│   ├── globals.css               # Global styles with theme
│   ├── login/
│   │   └── page.js              # Login page
│   ├── register/
│   │   └── page.js              # Registration page
│   ├── verify-otp/
│   │   └── page.js              # OTP verification
│   ├── dashboard/
│   │   └── page.js              # Main dashboard
│   ├── deposit/
│   │   └── page.js              # Deposit funds
│   ├── transfer/
│   │   └── page.js              # Transfer money
│   ├── transactions/
│   │   └── page.js              # Transaction history
│   └── facepay/
│       └── page.js              # FacePay multi-step flow
│
├── components/                   # Reusable components
│   ├── ProtectedRoute.js        # Auth wrapper
│   ├── Sidebar.js               # Navigation sidebar
│   ├── DashboardCard.js         # Stat cards
│   ├── TransactionTable.js      # Transaction display
│   ├── WebcamCapture.js         # Face capture component
│   └── ui/                      # Shadcn UI components
│       ├── button.jsx
│       ├── input.jsx
│       ├── card.jsx
│       ├── badge.jsx
│       ├── alert.jsx
│       ├── progress.jsx
│       ├── textarea.jsx
│       └── ... (30+ components)
│
├── lib/                          # Utilities
│   ├── api.js                   # Axios client with interceptors
│   ├── auth.js                  # Auth helper functions
│   └── utils.js                 # Tailwind merge utility
│
├── .env.local                    # Environment variables
├── tailwind.config.js           # Tailwind + theme config
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## 🗺 Pages & Routes

### Public Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Auto-redirects to login/dashboard |
| `/login` | Login | Vendor login with mobile + PIN |
| `/register` | Registration | New vendor signup |
| `/verify-otp` | OTP Verify | Email OTP verification |

### Protected Routes (Require Authentication)
| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Overview, stats, recent transactions |
| `/deposit` | Deposit | Add funds to account |
| `/transfer` | Transfer | Send money to other accounts |
| `/transactions` | Transactions | Full transaction history |
| `/facepay` | FacePay | 5-step face recognition payment |

---

## 🧩 Components

### Core Components

#### `ProtectedRoute.js`
Wrapper component that checks authentication and redirects to login if needed.

```jsx
<ProtectedRoute>
  <YourProtectedContent />
</ProtectedRoute>
```

#### `Sidebar.js`
Main navigation sidebar with:
- Logo and branding
- Navigation links
- Active route highlighting
- Logout button

#### `DashboardCard.js`
Reusable stat card component:
```jsx
<DashboardCard
  title="Current Balance"
  value="₹1,25,000.00"
  icon={Wallet}
  subtitle="Available funds"
  className="border-l-4 border-l-purple-600"
/>
```

#### `TransactionTable.js`
Displays transactions with:
- Transaction ID
- Type badges (deposit, transfer, facepay)
- Amount formatting
- Status indicators
- Relative timestamps

#### `WebcamCapture.js`
Face capture component with:
- Live webcam feed
- Capture/Retake/Confirm actions
- Base64 JPEG output
- 640x480 resolution

---

## 🔌 API Integration

### API Client (`lib/api.js`)

The Axios client includes:
- **Base URL** configuration from environment
- **Request Interceptor** - Adds JWT token to headers
- **Response Interceptor** - Handles 401 (unauthorized) errors

```javascript
import api from '@/lib/api';

// All requests automatically include Authorization header
const response = await api.get('/vendor/dashboard');
const result = await api.post('/vendor/deposit', { amount: 1000 });
```

### Auth Helpers (`lib/auth.js`)

```javascript
import { setAuth, getAuth, clearAuth, isAuthenticated } from '@/lib/auth';

// After login
setAuth(token, vendorData);

// Get current vendor
const { token, vendor } = getAuth();

// Check if logged in
if (isAuthenticated()) {
  // User is logged in
}

// Logout
clearAuth();
```

---

## 🎭 FacePay Flow

### Step-by-Step Process

#### Step 1: Enter Amount
- Vendor enters transaction amount
- Backend creates payment session
- Returns `session_id`

#### Step 2: Confirm Amount
- Display amount for verification
- Prevents typing errors
- User can confirm or cancel

#### Step 3: Enter Customer Phone
- Vendor enters customer's mobile number
- Backend verifies:
  - Customer exists in bank system
  - FacePay is enabled
  - Returns customer name

#### Step 4: Capture Face
- Live webcam capture
- Backend processes:
  - Fetches encrypted embedding from db
  - Decrypts using AES-256
  - Generates new embedding using ViT model
  - Compares using cosine similarity
  - Checks amount against FacePay limit
- Returns similarity score

#### Step 5: Enter PIN
- Customer enters 6-digit PIN
- Backend verifies:
  - Decrypts stored PIN using RSA
  - Compares with entered PIN
  - Processes transaction
  - Updates balances
  - Records on blockchain
  - Sends verification email

#### Step 6: Success
- Display transaction details
- Show transaction ID
- Offer "New Transaction" or "Dashboard" options

### Security Features

- **AES-256** encryption for face embeddings
- **RSA** encryption for PIN storage/transmission
- **ViT (Vision Transformer)** for face recognition
- **Cosine similarity** threshold (0.65)
- **Email verification** after each transaction
- **Auto-disable** if customer reports "Not Me"
- **Blockchain** recording for immutability

---

## 🎨 Styling & Theme

### Color Palette

```javascript
// Primary - Purple
purple: {
  600: '#9333ea',  // Main brand color
  500: '#a855f7',  // Lighter variant
  ...
}

// Secondary - Violet
violet: {
  600: '#7c3aed',  // Accent color
  500: '#8b5cf6',  // Lighter variant
  ...
}
```

### Design System

- **Gradient Accents** - Purple to Violet gradients for buttons, icons
- **Border Accents** - Colored left borders on cards
- **Smooth Transitions** - Hover effects and animations
- **Consistent Spacing** - Using Tailwind spacing scale
- **Typography** - Inter font family throughout

### Dark Mode

Automatic dark mode support with:
```css
:root { /* Light theme variables */ }
.dark { /* Dark theme variables */ }
```

### Custom Scrollbar

Styled scrollbar matching the theme:
```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { @apply bg-primary/50; }
```

---

## 💻 Development

### Running Development Server

```bash
# Standard mode (hot reload enabled)
yarn dev

# No hot reload (for debugging)
yarn dev:no-reload

# Webpack mode
yarn dev:webpack
```

### Building for Production

```bash
yarn build
yarn start
```

### Code Quality

This project uses:
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** (JSDoc) - Type safety via comments

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication Flow
- [ ] Register new vendor with valid data
- [ ] Receive OTP email
- [ ] Verify OTP and login
- [ ] Login with existing credentials
- [ ] Logout and re-login

#### Financial Operations
- [ ] Deposit funds
- [ ] Transfer to valid account
- [ ] Transfer with insufficient balance (should fail)
- [ ] View transaction history

#### FacePay Flow
- [ ] Initiate FacePay with valid amount
- [ ] Confirm amount
- [ ] Enter valid customer phone
- [ ] Enter invalid phone (should fail)
- [ ] Capture face successfully
- [ ] Enter correct PIN
- [ ] Enter wrong PIN (should fail)
- [ ] View success screen

### Automated Testing

```bash
# Run frontend tests (to be implemented)
yarn test

# Run E2E tests
yarn test:e2e
```

---

## 🚢 Deployment

### Environment Setup

1. **Configure Production Environment Variables**
```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend.com
```

2. **Build the Application**
```bash
yarn build
```

3. **Deploy to Hosting Platform**

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
CMD ["yarn", "start"]
```

**Manual Deployment**
```bash
# Build
yarn build

# Copy .next, public, package.json to server
# Run on server
yarn start
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Cannot connect to backend API"
**Solution:**
1. Check `NEXT_PUBLIC_API_URL` in `.env.local`
2. Ensure FastAPI backend is running
3. Verify CORS is enabled on backend
4. Check browser console for CORS errors

#### Issue: "Webcam not working"
**Solution:**
1. Grant camera permissions in browser
2. Ensure HTTPS in production (camera requires secure context)
3. Check browser compatibility (Chrome/Edge recommended)
4. Try different browser if issue persists

#### Issue: "Token expired" errors
**Solution:**
1. Login again to get fresh token
2. Check JWT expiry time on backend
3. Clear localStorage and re-login

#### Issue: "Face verification fails repeatedly"
**Solution:**
1. Ensure good lighting
2. Face should be clearly visible
3. Remove glasses/hats if possible
4. Customer's face should be registered in bank system

#### Issue: "Styles not loading correctly"
**Solution:**
1. Clear browser cache
2. Restart dev server
3. Check if `globals.css` is imported in `layout.js`
4. Verify Tailwind config is correct

### Debug Mode

Enable debug logging:
```javascript
// In lib/api.js, add:
api.interceptors.request.use((config) => {
  console.log('API Request:', config);
  return config;
});

api.interceptors.response.use((response) => {
  console.log('API Response:', response);
  return response;
});
```

---

## 📞 Support

### Getting Help

- **Documentation Issues**: Check this README
- **Bug Reports**: Create GitHub issue (if applicable)
- **Feature Requests**: Contact development team
- **Security Concerns**: Email security@abcbank.com

---

## 🎯 Roadmap

### Upcoming Features
- [ ] Multi-language support (i18n)
- [ ] Advanced transaction filters
- [ ] PDF invoice generation
- [ ] QR code payment integration
- [ ] Biometric authentication (fingerprint)
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Bulk payment processing
- [ ] Recurring payments
- [ ] Mobile app (React Native)

---

## 📝 Notes

### Security Best Practices
1. **Never expose** JWT tokens in URLs
2. **Always use HTTPS** in production
3. **Validate** all user inputs on frontend and backend
4. **Encrypt** sensitive data (PINs, face embeddings)
5. **Rate limit** API calls to prevent abuse
6. **Log** all security-critical operations
7. **Implement** CSRF protection
8. **Use** Content Security Policy (CSP)

### Performance Tips
1. **Optimize images** - Use next/image for automatic optimization
2. **Code splitting** - Next.js does this automatically
3. **Lazy load** components when possible
4. **Minimize bundle size** - Remove unused dependencies
5. **Use CDN** for static assets in production
6. **Enable caching** - Configure proper cache headers
7. **Monitor performance** - Use Lighthouse/WebPageTest

---

## 📄 License

Copyright © 2025 ABC Secure Bank. All rights reserved.

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing framework
- **Shadcn** - Beautiful UI components
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Team** - Core library

---

## 📧 Contact

**Development Team:**
- Email: dev@abcbank.com
- Website: https://abcbank.com
- Support: support@abcbank.com

---

**Built with ❤️ using Next.js, React, and Tailwind CSS**

**Version:** 1.0.0  
**Last Updated:** June 2025
