# 📤 Push to GitHub - Step by Step

## 🔐 Step 1: Secure Your Secrets (CRITICAL!)

### Check if `.env` is in `.gitignore`:

```bash
cat .gitignore | grep .env
```

Should show:
```
.env
.env.local
.env*.local
```

### If `.env` is NOT in `.gitignore`, add it:

```bash
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
```

### Verify `.env` is NOT tracked:

```bash
git status
```

If `.env` appears in red/green, remove it:

```bash
git rm --cached .env
git add .gitignore
git commit -m "Add .env to gitignore"
```

---

## 📦 Step 2: Initialize Git (if not done)

### Check if Git is initialized:

```bash
git status
```

If you see "not a git repository", initialize:

```bash
git init
git branch -M main
```

---

## 📝 Step 3: Stage Your Files

### Add all files:

```bash
git add .
```

### Check what will be committed:

```bash
git status
```

**IMPORTANT:** Make sure `.env` is NOT in the list!

---

## 💬 Step 4: Commit Your Changes

```bash
git commit -m "Add Firebase real-time chat and Capacitor notifications

Features:
- Firebase Firestore for real-time messaging
- Firebase Storage for chat media
- Capacitor push notifications
- Real-time chat popups
- Badge count on chat icon
- Message reactions and replies
- Image/video sharing in chat
- Notification sound and vibration
- Clean .env with only essential variables"
```

---

## 🌐 Step 5: Create GitHub Repository

### Option A: Via GitHub Website

1. Go to https://github.com/new
2. Repository name: `anufy` (or your preferred name)
3. Description: "Social media app with real-time chat"
4. Visibility: **Private** (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Option B: Via GitHub CLI

```bash
gh repo create anufy --private --source=. --remote=origin
```

---

## 🔗 Step 6: Connect to GitHub

### Copy the commands from GitHub (they look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/anufy.git
git branch -M main
git push -u origin main
```

### Or if using SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/anufy.git
git branch -M main
git push -u origin main
```

---

## 🚀 Step 7: Push to GitHub

```bash
git push -u origin main
```

You should see:
```
Enumerating objects: 100, done.
Counting objects: 100% (100/100), done.
Delta compression using up to 8 threads
Compressing objects: 100% (80/80), done.
Writing objects: 100% (100/100), 1.5 MiB | 2.0 MiB/s, done.
Total 100 (delta 20), reused 0 (delta 0)
To https://github.com/YOUR_USERNAME/anufy.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## ✅ Step 8: Verify on GitHub

1. Go to https://github.com/YOUR_USERNAME/anufy
2. You should see all your files
3. **Check:** `.env` should NOT be visible
4. **Check:** All other files are there

---

## 🔄 Future Updates

### When you make changes:

```bash
# 1. Stage changes
git add .

# 2. Commit with message
git commit -m "Add new feature"

# 3. Push to GitHub
git push
```

### Quick one-liner:

```bash
git add . && git commit -m "Update app" && git push
```

---

## 🌿 Working with Branches

### Create a new feature branch:

```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add new feature"
git push -u origin feature/new-feature
```

### Merge to main:

```bash
git checkout main
git merge feature/new-feature
git push
```

---

## 🐛 Troubleshooting

### "Permission denied (publickey)"

**Fix:** Set up SSH key or use HTTPS

```bash
# Use HTTPS instead
git remote set-url origin https://github.com/YOUR_USERNAME/anufy.git
```

### "Repository not found"

**Fix:** Check repository name and username

```bash
git remote -v
# Should show correct URL
```

### ".env file is tracked"

**Fix:** Remove from Git history

```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

### "Large files rejected"

**Fix:** Use Git LFS or remove large files

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.mp4"
git lfs track "*.mov"

# Commit and push
git add .gitattributes
git commit -m "Add Git LFS"
git push
```

---

## 📋 Pre-Push Checklist

Before pushing to GitHub:

- [ ] `.env` is in `.gitignore`
- [ ] No secrets in code
- [ ] No large files (>100MB)
- [ ] Code is tested locally
- [ ] No console errors
- [ ] Commit message is clear
- [ ] All files are staged

---

## 🔐 Security Checklist

Make sure these are NOT in your repo:

- [ ] `.env` file
- [ ] API keys in code
- [ ] Database passwords
- [ ] JWT secrets
- [ ] Firebase private keys
- [ ] Cloudinary secrets

---

## 📊 What Gets Pushed

### ✅ These files SHOULD be pushed:

- Source code (`.js`, `.ts`, `.tsx`)
- Components
- Pages
- API routes
- Configuration files (`next.config.mjs`, `tsconfig.json`)
- Package files (`package.json`, `package-lock.json`)
- Documentation (`.md` files)
- Public assets (`public/` folder)
- `.gitignore`

### ❌ These files should NOT be pushed:

- `.env` (secrets)
- `node_modules/` (dependencies)
- `.next/` (build output)
- `out/` (export output)
- `dist/` (distribution)
- `.DS_Store` (Mac files)
- `Thumbs.db` (Windows files)

---

## 🎯 Quick Commands

```bash
# Check status
git status

# See what changed
git diff

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# View remote URL
git remote -v

# Pull latest changes
git pull

# Clone repository
git clone https://github.com/YOUR_USERNAME/anufy.git
```

---

## 🎉 Success!

Your code is now on GitHub! 

**Next step:** Deploy to Vercel

See `DEPLOY_TO_VERCEL.md` for deployment instructions.

---

## 📱 GitHub Mobile

Download GitHub mobile app to:
- View code on the go
- Review pull requests
- Get notifications
- Manage issues

---

## 🆘 Need Help?

- **Git Docs:** https://git-scm.com/doc
- **GitHub Docs:** https://docs.github.com
- **Git Cheat Sheet:** https://education.github.com/git-cheat-sheet-education.pdf

---

## 💡 Pro Tips

1. **Commit Often**
   - Small, focused commits
   - Clear commit messages
   - Easy to revert if needed

2. **Use Branches**
   - `main` for production
   - `develop` for development
   - `feature/*` for new features

3. **Write Good Commit Messages**
   ```
   Good: "Add Firebase real-time chat"
   Bad: "Update files"
   ```

4. **Review Before Pushing**
   ```bash
   git diff
   git status
   ```

5. **Pull Before Push**
   ```bash
   git pull
   git push
   ```

---

## 🎊 You're Ready!

Your code is safely on GitHub and ready to deploy! 🚀
