# Fix Database Connection Error

## Problem
```
password authentication failed for user "postgres"
```

Your PostgreSQL password is incorrect in the `.env` file.

---

## Solutions

### Option 1: Use Correct Password

1. Find your PostgreSQL password (the one you set during installation)
2. Update `.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/postgres
   ```

### Option 2: Reset PostgreSQL Password (Windows)

1. **Open Command Prompt as Administrator**

2. **Stop PostgreSQL service:**
   ```cmd
   net stop postgresql-x64-16
   ```
   (Replace `16` with your PostgreSQL version)

3. **Reset password using psql:**
   ```cmd
   psql -U postgres
   ```
   
4. **In psql, run:**
   ```sql
   ALTER USER postgres PASSWORD 'newpassword123';
   \q
   ```

5. **Update your `.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:newpassword123@localhost:5432/postgres
   ```

### Option 3: Use Neon (Recommended - Easiest)

Instead of local PostgreSQL, use Neon (free cloud PostgreSQL):

1. **Go to https://neon.tech**
2. **Sign up for free**
3. **Create a new project**
4. **Copy the connection string** (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```
5. **Update `.env` file:**
   ```env
   DATABASE_URL=your_neon_connection_string_here
   ```
6. **Run the database schema:**
   - Go to Neon dashboard
   - Click "SQL Editor"
   - Copy contents of `database-schema.sql`
   - Paste and run

### Option 4: Create New PostgreSQL User

1. **Open psql as postgres:**
   ```cmd
   psql -U postgres
   ```

2. **Create new user and database:**
   ```sql
   CREATE USER myappuser WITH PASSWORD 'mypassword123';
   CREATE DATABASE socialmedia OWNER myappuser;
   GRANT ALL PRIVILEGES ON DATABASE socialmedia TO myappuser;
   \q
   ```

3. **Run the schema:**
   ```cmd
   psql -U myappuser -d socialmedia -f database-schema.sql
   ```

4. **Update `.env` file:**
   ```env
   DATABASE_URL=postgresql://myappuser:mypassword123@localhost:5432/socialmedia
   ```

---

## Quick Test

After updating your `.env` file, test the connection:

```bash
# Restart your dev server
npm run dev
```

Then try to register a new user at http://localhost:3000/register

---

## Recommended: Use Neon

For the easiest setup with no local PostgreSQL hassles:

✅ No password issues
✅ No local installation needed
✅ Free tier available
✅ Automatic backups
✅ Better for deployment

**Get started:** https://neon.tech

---

## Still Having Issues?

1. Make sure PostgreSQL is running:
   ```cmd
   # Windows
   net start postgresql-x64-16
   ```

2. Check if you can connect manually:
   ```cmd
   psql -U postgres -h localhost -p 5432
   ```

3. Verify the database exists:
   ```sql
   \l
   ```

4. Check the `.env` file is named exactly `.env` (not `.env.txt`)

---

## After Fixing

1. Restart the dev server: `npm run dev`
2. Go to http://localhost:3000/register
3. Create a new account
4. You should be able to login successfully!
