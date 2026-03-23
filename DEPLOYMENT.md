# Free Deployment Guide: Full-Stack Web App

This guide walks you through deploying your full-stack application (React frontend + Laravel backend) using free services.

## Architecture Overview

- **Frontend**: React + Express/Node server → Deployed to **Netlify** (free tier)
- **Backend**: Laravel API → Deployed to **Render** (free tier) or **Railway**
- **Database**: PostgreSQL on **Neon** (free tier) or similar free provider
- **CI/CD**: GitHub Actions (free)

## Prerequisites

- GitHub account (used for this guide)
- Git installed and configured
- Netlify account (free)
- Render account (free)
- Neon account (free PostgreSQL database)

## Step-by-Step Setup

### 1. GitHub Repository Setup

First, push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Frontend Deployment (Netlify) ✅

#### 2a. Connect to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Configure build settings:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist/spa`
   - **Node version**: `22.x`

#### 2b. Add Environment Variables

In Netlify dashboard → Site settings → Build & deploy → Environment:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

#### 2c. GitHub Actions Secrets

Go to GitHub → Your repo → Settings → Secrets and variables → Actions

Add these secrets:
```
NETLIFY_AUTH_TOKEN: [Get from Netlify → User settings → Applications → Personal access tokens]
NETLIFY_SITE_ID: [Get from Netlify → Site settings → General → API ID]
VITE_API_URL: https://your-backend-url.onrender.com
```

### 3. Backend Deployment (Render) ✅

#### 3a. Prepare Laravel App

Create `.env.production` in backend folder:

```env
APP_NAME="Your App"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-backend-url.onrender.com

DB_CONNECTION=pgsql
DB_HOST=your-neon-db-host.neon.tech
DB_PORT=5432
DB_DATABASE=neon_db
DB_USERNAME=neon_user
DB_PASSWORD=your_password

CACHE_DRIVER=database
SESSION_DRIVER=cookie
QUEUE_CONNECTION=sync
```

#### 3b. Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: your-app-backend
   - **Root Directory**: `backend`
   - **Runtime**: `PHP 8.3`
   - **Build Command**:
     ```bash
     composer install && php artisan migrate --force && php artisan config:cache && php artisan route:cache
     ```
   - **Start Command**:
     ```bash
     php -S 0.0.0.0:${PORT} -t public
     ```
   - **Environment Variables**: (from .prod file or add manually)

#### 3c. Add Deployment Hook

In your Render service:
- Settings → Deploy hooks
- Copy the hook URL
- Add to GitHub Secrets: `RENDER_DEPLOY_HOOK`

### 4. Database Setup (Neon Free PostgreSQL) ✅

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create a new project
4. Copy connection string:
   ```
   postgresql://user:password@host.neon.tech:5432/dbname
   ```
5. Add to Render environment variables:
   - `DB_HOST`: neon host
   - `DB_PORT`: 5432
   - `DB_USERNAME`: neon user
   - `DB_PASSWORD`: password
   - `DB_DATABASE`: database name

### 5. GitHub Actions CI/CD ✅

The workflows are already created. They will:
- Run tests on pull requests
- Automatically deploy on pushes to `main`
- Trigger Render deployment after backend tests pass

To enable:
1. Go to GitHub → Your repo → Actions
2. Workflows should be ready to run automatically

## Testing Your Deployment

### Frontend
1. Visit your Netlify URL (e.g., `https://your-app.netlify.app`)
2. Check browser console for any API errors (F12)
3. Verify API calls are going to the backend URL

### Backend
1. Visit `https://your-backend-url.onrender.com/api/dashboard/stats`
2. Should return JSON data
3. Check Render logs for any errors

### Full Integration Test

```bash
# Frontend should load
curl https://your-app.netlify.app

# API should respond
curl https://your-backend-url.onrender.com/api/ping
```

## Cost Breakdown (All Free Tier)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Netlify | ✅ Included | 100 GB bandwidth/month |
| Render | ✅ Included | Spins down after 15 min inactivity |
| Neon | ✅ Included | 3 projects, 5GB storage |
| GitHub | ✅ Included | Unlimited public repos |
| GitHub Actions | ✅ Included | 2000 minutes/month |

## Troubleshooting

### Backend not responding
- Check Render logs: Services → Your service → Logs
- Verify database connection string
- Run migrations manually in Render shell

### Frontend not connecting to API
- Check `VITE_API_URL` environment variable in Netlify
- Open DevTools → Network tab → check API requests
- Verify CORS is enabled in Laravel (check `config/cors.php`)

### Cold starts on Render
- Free tier spins down after inactivity (15 min)
- First request takes 10-30 seconds, then fast
- Consider upgrading to paid tier ($7/month) to prevent this

### Database connection issues
- Add your Render IP to Neon allowlist if needed
- Test connection: `pg_isready -h host -U user`
- Check database credentials are correct

## Monitoring & Maintenance

1. **GitHub Actions**
   - Monitor deployment status in Actions tab
   - Get notifications on failed deployments

2. **Error Tracking**
   - Check Render logs regularly
   - Monitor Netlify analytics and error reports

3. **Database**
   - Monitor Neon storage usage
   - Set up auto-backups (Neon does this for free)

## Next Steps & Upgrades

### When to upgrade (costs):
- **Render backend**: $7/month (prevents cold starts)
- **Netlify**: $19/month (Pro features)
- **Neon**: Pay-as-you-go if exceeding free tier

### Optional additions:
- Add Sentry for error tracking
- Use GitHub Releases for versioning
- Set up automated backups

## Security Best Practices

✅ Never commit `.env` files
✅ Use GitHub Secrets for all sensitive data
✅ Enable branch protection on `main`
✅ Add status checks for passing tests before merge
✅ Keep `.env.production` out of repo
✅ Use strong database passwords
✅ Enable HTTPS (automatic on Netlify & Render)

## Support Resources

- Netlify Docs: https://docs.netlify.com/
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs/
- Laravel Docs: https://laravel.com/docs
- GitHub Actions: https://docs.github.com/en/actions
