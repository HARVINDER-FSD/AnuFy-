# Webpack Module Error Diagnostic Steps

## Current Status
Switched to minimal layout to isolate the issue.

## Test Steps

### 1. Test with Simple Layout (Current)
```bash
npm run dev
```

**If it works**: The issue is in one of the providers/components in the full layout.
**If it fails**: The issue is deeper - likely in Next.js config or a global import.

### 2. If Simple Layout Works

Gradually add back components to find the culprit:

#### Step A: Add ThemeProvider only
```tsx
<ThemeProvider storageKey="anufy-theme">
  {children}
</ThemeProvider>
```

#### Step B: Add AuthProvider
```tsx
<ThemeProvider storageKey="anufy-theme">
  <AuthProvider>
    {children}
  </AuthProvider>
</ThemeProvider>
```

#### Step C: Add SplashScreen
```tsx
<SplashScreen>
  <ThemeProvider storageKey="anufy-theme">
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
</SplashScreen>
```

#### Step D: Add LoadingBar
```tsx
<LoadingBar />
<SplashScreen>
  ...
</SplashScreen>
```

#### Step E: Add AppLayout
```tsx
<AuthProvider>
  <AppLayout>
    {children}
  </AppLayout>
</AuthProvider>
```

### 3. If Simple Layout Fails

The issue is in:
- `next.config.mjs` - Try removing all custom config
- `middleware.ts` - Try disabling middleware
- Global CSS imports
- Font loading

## Quick Fixes to Try

### Fix 1: Disable Middleware Temporarily
Rename `middleware.ts` to `middleware.ts.bak`

### Fix 2: Minimal Next Config
```javascript
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
}
```

### Fix 3: Remove All Optimizations
Comment out experimental features in next.config.mjs

### Fix 4: Check for Duplicate Packages
```bash
npm ls framer-motion
npm ls react
npm ls next
```

## Restore Full Layout

Once issue is found:
```bash
Move-Item app/layout-full.tsx.bak app/layout.tsx -Force
```

## Common Causes

1. **Circular Dependencies** - Component A imports B, B imports A
2. **Server/Client Mismatch** - Server component importing client component incorrectly
3. **Duplicate Modules** - Same package installed multiple times
4. **Framer Motion** - Known to cause issues with SSR if not handled correctly
5. **Dynamic Imports** - Incorrectly configured dynamic imports
6. **Webpack Cache Corruption** - Stale cache causing module resolution issues

## Nuclear Option

If nothing works:
```bash
rm -rf node_modules package-lock.json
npm install
rm -rf .next
npm run dev
```
