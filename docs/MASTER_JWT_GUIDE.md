# Master JWT System Guide

This guide explains how to use the centralized JWT manager throughout the application.

## Overview

The `jwt-manager.ts` file provides a centralized system for JWT token management across the entire application. Using this system ensures consistent authentication and prevents issues with profile updates not reflecting across components.

## Key Functions

### Authentication

```typescript
// Check if user is authenticated
if (JWTManager.isAuthenticated()) {
  // User is logged in
}

// Login user and store token
await JWTManager.setToken(token);

// Logout user
JWTManager.logout();
```

### User Data

```typescript
// Get fresh user data
const userData = await JWTManager.fetchUserData();

// Refresh user data (with cache invalidation)
await JWTManager.refreshUserData();

// Get cached user data (faster)
const cachedData = JWTManager.getCachedUserData();
```

### Profile Updates

When updating user profile, always:

1. Call the API to update the profile
2. Refresh the JWT manager data
3. Dispatch the profile-updated event

```typescript
// After successful API call to update profile
await JWTManager.refreshUserData();

// Dispatch event to notify components
const event = new CustomEvent('profile-updated', { 
  detail: { 
    ...updatedData,
    timestamp: Date.now() 
  }
});
window.dispatchEvent(event);
```

## Best Practices

1. **Always use the JWT manager** for authentication operations
2. **Never implement custom JWT handling** in components
3. **Listen for profile update events** in components that display user data
4. **Refresh user data** after profile changes
5. **Use cache busting** for avatar URLs

By following these guidelines, you'll ensure consistent authentication and profile data across your application.