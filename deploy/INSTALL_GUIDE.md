# M.A.R.S Installation Guide for Windows Server 2016

## Overview

This guide will help you install the **M.A.R.S (Maintenance, Analytics, & Recording System)** on a Windows Server 2016 machine using Laragon as the web server stack.

**Time Required:** ~30 minutes

**What You'll Install:**
- Laragon (includes PHP, Apache, Node.js)
- M.A.R.S application
- SQLite database (no separate installation needed)

---

## Prerequisites

- Windows Server 2016 (or Windows 10/11)
- Administrator access
- Internet connection (for initial setup only)
- Static IP address assigned to the server (for LAN access)

---

## Step 1: Install Laragon

1. Download **Laragon Full** from: https://laragon.org/download/
   - Direct link: https://github.com/leokhoa/laragon/releases/download/6.0/laragon-wamp.exe

2. Run the installer and install to `C:\laragon`

3. **Important Settings during installation:**
   - Installation folder: `C:\laragon`
   - Check "Run Laragon when Windows starts"
   - Check "Auto virtual hosts"

4. Launch Laragon after installation

---

## Step 2: Verify Laragon Components

Open Laragon and verify these components are available:

| Component | Minimum Version | How to Check |
|-----------|-----------------|--------------|
| PHP | 8.1+ | Menu > PHP > Version |
| Apache | 2.4+ | Menu > Apache > Version |
| Node.js | 18+ | Menu > Node.js > Version |

If Node.js is missing:
1. Menu > Tools > Quick add
2. Select "nodejs" and install

---

## Step 3: Install M.A.R.S

1. Copy the entire `web-app` project folder to: `C:\laragon\www\mars`

2. Open **Command Prompt as Administrator**

3. Navigate to the deploy folder:
   ```cmd
   cd C:\laragon\www\mars\deploy
   ```

4. Run the installation script:
   ```cmd
   install.bat
   ```

5. Wait for the installation to complete (5-10 minutes)

---

## Step 4: Configure for LAN Access

### Get Your Server's IP Address

1. Open Command Prompt
2. Run: `ipconfig`
3. Note the **IPv4 Address** (e.g., `192.168.1.100`)

### Update Environment Files

1. Edit `C:\laragon\www\mars\backend\.env`:
   ```
   APP_URL=http://192.168.1.100
   ```

2. Edit `C:\laragon\www\mars\frontend\.env`:
   ```
   VITE_API_URL=http://192.168.1.100:8000/api
   ```

3. Rebuild the frontend:
   ```cmd
   cd C:\laragon\www\mars\frontend
   npm run build
   ```

---

## Step 5: Configure Windows Firewall

The install script should have configured the firewall automatically. If not:

1. Open **Windows Defender Firewall with Advanced Security**

2. Click **Inbound Rules** > **New Rule**

3. Create rules for:
   - Port **80** (HTTP - Frontend)
   - Port **8000** (API - Backend)

4. Allow the connection for all profiles (Domain, Private, Public)

---

## Step 6: Start the System

### Method 1: Manual Start (Recommended for Testing)

1. Start Laragon (click "Start All")
2. Open Command Prompt
3. Run:
   ```cmd
   cd C:\laragon\www\mars\deploy
   start.bat
   ```

### Method 2: Auto-Start on Boot

1. In Laragon: Menu > Preferences
2. Check "Run Laragon when Windows starts"
3. Create a Windows Task Scheduler task to run `start.bat` at startup

---

## Step 7: Access the System

| Access From | URL |
|-------------|-----|
| Server itself | http://localhost |
| Other LAN computers | http://192.168.1.100 (use your server IP) |

---

## Maintenance

### Daily Database Backup (Recommended)

1. Open Task Scheduler
2. Create a new task:
   - Trigger: Daily at 11:00 PM
   - Action: Run `C:\laragon\www\mars\deploy\backup-db.bat`
3. Backups are saved to `C:\laragon\www\mars\backups\`

### Manual Backup

Double-click `backup-db.bat` in the deploy folder.

### Restore from Backup

1. Stop the backend server (`stop.bat`)
2. Copy backup file to: `C:\laragon\www\mars\backend\database\database.sqlite`
3. Start the server (`start.bat`)

---

## Troubleshooting

### "PHP not found" Error
- Ensure Laragon is installed at `C:\laragon`
- Check PHP version in Laragon menu matches the path in scripts

### "Cannot access from other computers"
- Verify Windows Firewall rules for ports 80 and 8000
- Ensure server has a static IP
- Check that antivirus is not blocking connections

### "Database connection error"
- Ensure `database.sqlite` exists in `backend\database\`
- Run: `php artisan migrate` from the backend folder

### "Page not found" on frontend
- Ensure Laragon Apache is running (green indicator)
- Check that frontend build completed successfully

---

## Support

For technical issues:
1. Check the Laravel logs: `C:\laragon\www\mars\backend\storage\logs\`
2. Contact your system administrator

---

## Quick Reference

| Task | Command |
|------|---------|
| Start services | `deploy\start.bat` |
| Stop services | `deploy\stop.bat` |
| Backup database | `deploy\backup-db.bat` |
| View logs | `backend\storage\logs\laravel.log` |
| Database location | `backend\database\database.sqlite` |
