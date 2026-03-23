# 🚀 Full-Stack Deployment Guide: Free GitHub + Netlify + Render

Your project is now configured for **completely free deployment** with automatic CI/CD!

## 📋 What's Been Set Up

✅ **GitHub Actions Workflows** (`.github/workflows/`)
- Frontend: Auto-builds and deploys to Netlify on push
- Backend: Runs tests and notifies Render on push

✅ **Environment Configuration**
- Frontend environment template: `frontend/.env.production.example`
- Backend environment template: `backend/.env.production.example`
- Deployment guide: `DEPLOYMENT.md`
- Quick reference: `DEPLOYMENT_QUICKSTART.md`

## 🎯 Next Steps to Launch

### **Step 1: Push to GitHub** (5 minutes)
```bash
git add .github DEPLOYMENT* .env.production.example
git commit -m "Add GitHub Actions and deployment config"
git push origin main
```

### **Step 2: Set Up Netlify** (10 minutes)
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Configure:
   - Build command: `cd frontend && npm run build`
   - Publish dir: `frontend/dist/spa`
6. Go to **Site settings → Build & deploy → Environment**
   - Add: `VITE_API_URL = https://your-backend.onrender.com` (update later)

### **Step 3: Set Up Render Backend** (15 minutes)
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New+" → "Web Service"
4. Select your repository
5. Configure:
   - **Name**: `your-app-backend`
   - **Root Directory**: `backend`
   - **Build Command**:
     ```
     composer install && php artisan migrate --force && php artisan config:cache
     ```
   - **Start Command**:
     ```
     php -S 0.0.0.0:${PORT} -t public
     ```
6. Go to **Environment → Add Environment Variable**:
   - `DB_CONNECTION`: pgsql
   - `DB_HOST`: [from Neon]
   - `DB_PORT`: 5432
   - `DB_DATABASE`: [from Neon]
   - `DB_USERNAME`: [from Neon]
   - `DB_PASSWORD`: [from Neon]
   - `CACHE_DRIVER`: database
   - `SESSION_DRIVER`: cookie
   - `QUEUE_CONNECTION`: sync

### **Step 4: Set Up Database** (10 minutes)
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project
4. Copy connection string
5. Extract credentials and add to Render service

### **Step 5: Connect Services** (5 minutes)

**Get Netlify Auth Token:**
1. Go to Netlify → **User settings → Applications → Tokens**
2. Create personal access token
3. Copy the token

**Get Render Deploy Hook:**
1. Go to Render → Your backend service
2. Navigate to **Deploy → Deploy hooks**
3. Copy the hook URL

**Set GitHub Secrets:**
1. Go to your repo → **Settings → Secrets and variables → Actions**
2. Click "New repository secret" and add:
   - `NETLIFY_AUTH_TOKEN`: [paste from step 5]
   - `NETLIFY_SITE_ID`: [from Netlify site settings → API ID]
   - `RENDER_DEPLOY_HOOK`: [paste from step 5]
   - `VITE_API_URL`: `https://your-backend.onrender.com`

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Push a commit to main branch
- [ ] GitHub Actions tab shows workflows running
- [ ] Netlify deploys successfully (check deployment log)
- [ ] Render backend deploys successfully
- [ ] Visit Netlify URL in browser → should load
- [ ] Check browser console (F12) → no CORS/API errors
- [ ] Visit `https://your-backend.onrender.com/api/dashboard/stats` → should return JSON

## 📊 Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Netlify | 100 GB/mo bandwidth | **$0** |
| Render | Free tier with limits | **$0** |
| Neon PostgreSQL | 3 projects, 512MB RAM | **$0** |
| GitHub Actions | 2000 min/month | **$0** |
| **Total** | | **$0/month** |

**Everything is completely free!** Upgrade only when you exceed free tier limits.

## ⚡ Important Notes

### Render Free Tier Limitations
- Backend spins down after 15 minutes of inactivity
- First request after spin-down takes 10-30 seconds
- Upgrade to paid ($7/month) to prevent this

### GitHub Actions Limits
- 2000 free minutes/month
- Your workflows use ~2 min per run
- Unlimited for public repositories

### What These Limits Mean
- For a hobby/side project: **Zero cost**
- For production: Consider upgrading to ~$26/month

## 🔗 Useful Links

- Frontend repo deployed to: `https://YOUR_SITE.netlify.app`
- Backend API at: `https://your-app-backend.onrender.com`
- Logs: GitHub Actions → Workflows
- Monitoring: Render dashboard & Netlify analytics

## ❓ Common Issues

**Issue: Backend spinning down**
- Normal for free tier
- Solution: Upgrade to paid, or accept slower first request

**Issue: CORS errors**
- Check `config/cors.php` in Laravel
- Add Netlify URL to allowed origins

**Issue: Database not connecting**
- Verify credentials in Render environment variables
- Check Neon IP allowlist if needed

**Issue: Deployment failed in GitHub Actions**
- Check workflow logs: Actions tab → workflow run → logs
- Most common: npm/composer install failed

## 📚 Learn More

- [Netlify Docs](https://docs.netlify.com/)
- [Render Docs](https://render.com/docs)
- [Neon Documentation](https://neon.tech/docs/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Laravel Deployment](https://laravel.com/docs/deployment)

## 🎉 You're All Set!

Your full-stack application is now configured for free deployment with automatic CI/CD. 

**Next time you push to main:**
1. GitHub Actions automatically runs tests
2. Frontend builds and deploys to Netlify
3. Backend tests run, then notifies Render to deploy
4. Your app updates live!

Enjoy your serverless, free deployment! 🚀
