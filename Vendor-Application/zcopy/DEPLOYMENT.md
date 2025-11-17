# ABC Vendor Portal - Deployment Guide

## 🚀 Quick Deploy

This guide covers deploying the ABC Vendor Portal frontend to various platforms.

---

## 📋 Pre-Deployment Checklist

- [ ] Backend API is deployed and accessible
- [ ] Supabase databases are set up (db1 & db2)
- [ ] Environment variables are configured
- [ ] SSL certificates are ready (for HTTPS)
- [ ] Domain name is configured (if using custom domain)
- [ ] All dependencies are up to date
- [ ] Production build tested locally

---

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Built by Next.js creators
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Automatic scaling
- Free tier available

**Steps:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from project directory
cd /app
vercel

# Follow prompts:
# - Set project name
# - Set environment variables
# - Confirm deployment
```

**Environment Variables in Vercel:**

Go to Project Settings → Environment Variables and add:

```
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
NEXT_PUBLIC_APP_NAME=ABC Vendor Portal
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Custom Domain:**

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL automatically configured

---

### Option 2: Netlify

**Steps:**

```bash
# 1. Install Netlify CLI
npm i -g netlify-cli

# 2. Login to Netlify
netlify login

# 3. Initialize site
netlify init

# 4. Build and deploy
netlify deploy --prod
```

**netlify.toml:**

```toml
[build]
  command = "yarn build"
  publish = ".next"

[build.environment]
  NEXT_PUBLIC_API_URL = "https://your-backend-api.com/api"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 3: AWS Amplify

**Steps:**

1. Go to AWS Amplify Console
2. Connect your Git repository
3. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - yarn install
    build:
      commands:
        - yarn build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

4. Add environment variables
5. Deploy

---

### Option 4: Docker + Cloud Provider

**Dockerfile:**

```dockerfile
# Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**Build and Run:**

```bash
# Build image
docker build -t abc-vendor-portal .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-api.com/api \
  abc-vendor-portal
```

**Docker Compose:**

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
      - NEXT_PUBLIC_APP_NAME=ABC Vendor Portal
      - NEXT_PUBLIC_APP_URL=https://your-domain.com
    restart: unless-stopped
```

---

### Option 5: Traditional VPS (DigitalOcean, Linode, etc.)

**Steps:**

1. **Setup Server:**

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
npm install -g yarn

# Install PM2 (process manager)
npm install -g pm2
```

2. **Deploy Application:**

```bash
# Clone or upload your code
git clone your-repo.git /var/www/abc-vendor-portal
cd /var/www/abc-vendor-portal

# Install dependencies
yarn install

# Build
yarn build

# Start with PM2
pm2 start yarn --name "abc-vendor" -- start
pm2 save
pm2 startup
```

3. **Setup Nginx:**

```nginx
# /etc/nginx/sites-available/abc-vendor-portal
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable site and SSL:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/abc-vendor-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔐 Security Considerations

### 1. Environment Variables

**Never commit sensitive data!**

```bash
# .gitignore should include:
.env.local
.env.production.local
.env*.local
```

### 2. HTTPS Only

Always use HTTPS in production. Configure CSP headers:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

### 3. API Security

- Use CORS properly on backend
- Rate limit API endpoints
- Validate JWT tokens
- Sanitize all inputs

---

## 📊 Monitoring & Analytics

### 1. Error Tracking (Sentry)

```bash
yarn add @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Analytics (Google Analytics)

```javascript
// lib/gtag.js
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};
```

### 3. Performance Monitoring

Use Vercel Analytics or:

```bash
yarn add web-vitals
```

```javascript
// pages/_app.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: Build
        run: yarn build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🧪 Pre-Deployment Testing

### 1. Build Locally

```bash
yarn build
yarn start

# Test on http://localhost:3000
```

### 2. Run Lighthouse

```bash
npx lighthouse http://localhost:3000 --view
```

### 3. Check Bundle Size

```bash
yarn build
# Check output size in .next folder
```

### 4. Test on Different Devices

- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

---

## 📝 Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] API integration working
- [ ] Authentication flow functional
- [ ] FacePay working (with backend)
- [ ] Responsive on all devices
- [ ] SSL certificate valid
- [ ] Custom domain working
- [ ] Error tracking configured
- [ ] Analytics configured
- [ ] Performance metrics acceptable
- [ ] SEO meta tags present
- [ ] Favicon displaying
- [ ] 404 page working

---

## 🚨 Rollback Plan

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### PM2 (VPS)

```bash
# Restart with previous version
pm2 restart abc-vendor
pm2 logs abc-vendor
```

### Docker

```bash
# Roll back to previous image
docker ps
docker stop [container-id]
docker run -d -p 3000:3000 abc-vendor-portal:previous-tag
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue 1: Build fails with module not found**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next
yarn install
yarn build
```

**Issue 2: Environment variables not loading**
```bash
# Solution: Check prefix NEXT_PUBLIC_ for client-side variables
# Restart dev server after adding new variables
```

**Issue 3: API CORS errors**
```bash
# Solution: Configure CORS on backend to allow your domain
# Check NEXT_PUBLIC_API_URL is correct
```

---

## 📊 Performance Optimization

### 1. Image Optimization

Use Next.js Image component:
```javascript
import Image from 'next/image';
<Image src="/logo.png" width={100} height={100} alt="Logo" />
```

### 2. Code Splitting

Next.js automatically splits code. For dynamic imports:
```javascript
const Component = dynamic(() => import('./Component'));
```

### 3. Caching Strategy

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

---

## 🎯 Production Checklist

### Essential
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] API endpoint configured
- [ ] Error tracking active
- [ ] Backup strategy in place

### Recommended
- [ ] CDN configured
- [ ] Analytics setup
- [ ] Performance monitoring
- [ ] SEO optimized
- [ ] PWA features (optional)

### Advanced
- [ ] A/B testing framework
- [ ] Feature flags
- [ ] Automated testing
- [ ] Load balancing
- [ ] Auto-scaling

---

## 📖 Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Last Updated**: June 2025
**Deployment Version**: 1.0.0
