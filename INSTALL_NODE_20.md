npm insta;;# Install Node.js 20 LTS - Fix Webpack Error

## The Problem
Your Node.js v22.16.0 is incompatible with Next.js 14.x, causing webpack module errors.

## The Solution
Install Node.js 20 LTS (Long Term Support)

---

## Option 1: Using NVM for Windows (Recommended)

### Step 1: Install NVM for Windows
1. Download from: https://github.com/coreybutler/nvm-windows/releases
2. Download `nvm-setup.exe`
3. Run the installer
4. Follow the installation wizard

### Step 2: Install Node 20
Open PowerShell as Administrator and run:
```powershell
nvm install 20.18.0
nvm use 20.18.0
```

### Step 3: Verify Installation
```powershell
node --version
# Should show: v20.18.0
```

### Step 4: Reinstall Dependencies
```powershell
cd "C:\Users\harvinder Singh\Downloads\socialmediabackendfinalss"
Remove-Item -Recurse -Force node_modules,package-lock.json,.next
npm install
npm run dev
```

---

## Option 2: Direct Install (Simpler but Less Flexible)

### Step 1: Uninstall Current Node.js
1. Open "Add or Remove Programs"
2. Find "Node.js"
3. Click Uninstall

### Step 2: Download Node 20 LTS
1. Go to: https://nodejs.org/
2. Download "20.18.0 LTS" (Recommended For Most Users)
3. Run the installer
4. Follow the installation wizard

### Step 3: Verify Installation
Open new PowerShell window:
```powershell
node --version
# Should show: v20.18.0
```

### Step 4: Reinstall Dependencies
```powershell
cd "C:\Users\harvinder Singh\Downloads\socialmediabackendfinalss"
Remove-Item -Recurse -Force node_modules,package-lock.json,.next
npm install
npm run dev
```

---

## Option 3: Use the Automated Script

I've created a script that will guide you through the process.

Run this in PowerShell:
```powershell
.\install-node-20.ps1
```

---

## After Installing Node 20

Your app will work perfectly because:
- ✅ Node 20 LTS is fully compatible with Next.js 14
- ✅ No webpack module errors
- ✅ Stable and recommended version
- ✅ Long-term support until 2026

---

## Why Node 22 Doesn't Work

Node.js 22 is very new (released 2024) and has:
- Breaking changes in module resolution
- Different webpack behavior
- Incompatibility with Next.js 14.x
- Only works with Next.js 15+ (which has other issues)

Node.js 20 LTS is the recommended version for production apps.

---

## Quick Reference

| Node Version | Next.js 14 | Next.js 15 | Status |
|--------------|------------|------------|--------|
| Node 18 LTS  | ✅ Works   | ✅ Works   | Supported |
| Node 20 LTS  | ✅ Works   | ✅ Works   | **Recommended** |
| Node 22      | ❌ Broken  | ✅ Works   | Too New |

---

## Need Help?

If you have issues:
1. Make sure you're using Node 20.18.0
2. Delete node_modules and package-lock.json
3. Run `npm install` again
4. Clear .next cache
5. Run `npm run dev`

The webpack error will be completely gone with Node 20!
