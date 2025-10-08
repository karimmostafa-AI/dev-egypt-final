# Fix: User Registration Not Creating Users in Appwrite Console

## Problem
Users registering through `/register` route are not appearing in the Appwrite Console's Authentication page.

## Root Cause
The server-side registration API route was missing the **Appwrite API Key**, which is required for server-side user creation operations.

## Solution Applied
Updated `src/lib/appwrite.ts` to configure the server client with the API key from environment variables.

## Setup Steps

### 0. Install Server SDK (if not already installed)

The server SDK (`node-appwrite`) is required for server-side user creation:

```bash
npm install node-appwrite@17.0.0
```

### 1. Create an Appwrite API Key

1. **Open Appwrite Console**
   - Navigate to your Appwrite Console at `https://cloud.appwrite.io` (or your self-hosted URL)
   - Select your project

2. **Go to Settings**
   - Click on "Settings" in the left sidebar
   - Select "API Keys"

3. **Create New API Key**
   - Click "Create API Key" button
   - Give it a name like: `Server API Key` or `User Registration Key`

4. **Set Expiration**
   - Choose "Never" for no expiration (recommended for development)
   - Or set a future date for production

5. **Configure Scopes/Permissions**
   
   **IMPORTANT:** Enable the following scopes for user registration to work:
   
   **Users Service:**
   - ✅ `users.read` - Read user data
   - ✅ `users.write` - Create and update users
   
   **Sessions Service:**
   - ✅ `sessions.write` - Create user sessions
   
   **Databases Service (if using custom users collection):**
   - ✅ `databases.read`
   - ✅ `databases.write`
   
   **Minimal Required Scopes:**
   ```
   users.read
   users.write
   sessions.write
   ```

6. **Generate and Copy the Key**
   - Click "Create" or "Generate"
   - **IMPORTANT:** Copy the API key immediately - it will only be shown once!
   - The key will look something like: `standard_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...`

### 2. Add API Key to Environment Variables

1. **Open your `.env.local` file** (create it if it doesn't exist by copying `.env.example`)

2. **Add or update the APPWRITE_API_KEY:**
   ```env
   # Appwrite Configuration
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id-here
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id-here
   
   # CRITICAL: Add this line with your actual API key
   APPWRITE_API_KEY=standard_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
   
   # Collection IDs
   NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
   ```

3. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

### 3. Verify the Fix

1. **Check Server Logs**
   - When the server starts, you should see: `Server client configured with API key`
   - If you see `APPWRITE_API_KEY not set - server operations may fail`, the API key is missing

2. **Test Registration**
   - Navigate to `http://localhost:3000/register`
   - Fill out the registration form with:
     - Full Name: Test User
     - Email: test@example.com
     - Password: TestPassword123!
     - Confirm Password: TestPassword123!
   - Click "CREATE ACCOUNT"

3. **Check Appwrite Console**
   - Go to Appwrite Console
   - Navigate to "Auth" in the left sidebar
   - You should now see the newly registered user in the list!

### 4. Troubleshooting

#### Still not seeing users?

**Check 1: Verify API Key Scope**
```bash
# In browser console or server logs, look for errors like:
# "Error: Missing scope: users.write"
```
→ Go back to Appwrite Console → Settings → API Keys → Edit your key → Add missing scopes

**Check 2: Verify Environment Variable**
```bash
# Create a temporary test endpoint to check
# Add to src/app/api/test/route.ts:
export async function GET() {
  return Response.json({
    hasApiKey: !!process.env.APPWRITE_API_KEY,
    apiKeyPreview: process.env.APPWRITE_API_KEY?.substring(0, 20) + '...'
  });
}
# Visit http://localhost:3000/api/test
```

**Check 3: Review Server Logs**
- Check terminal/console for errors during registration
- Common errors:
  - `401 Unauthorized` → API key invalid or missing
  - `Missing scope` → API key doesn't have required permissions
  - `Invalid credentials` → API key expired

**Check 4: Browser Network Tab**
- Open DevTools → Network tab
- Attempt registration
- Look at the `/api/auth/register` request
- Check response for specific error messages

#### Error: "User with this email already exists"
This means the user WAS created successfully! Check:
1. Appwrite Console → Auth → Users list
2. If you see the user there, registration is working
3. The error occurs on duplicate registration attempts

## API Key Security Best Practices

### Development
- Use a separate API key for development
- Store in `.env.local` (never commit to git)
- `.env.local` is already in `.gitignore`

### Production
- Use a different API key with minimal required scopes
- Store in secure environment variable management (Vercel, Railway, AWS Secrets Manager, etc.)
- Rotate keys periodically
- Monitor API key usage in Appwrite Console

### Environment Variables Checklist
```env
# Required for registration to work
✅ NEXT_PUBLIC_APPWRITE_ENDPOINT
✅ NEXT_PUBLIC_APPWRITE_PROJECT_ID
✅ APPWRITE_API_KEY  # ← THIS WAS MISSING

# Optional (for custom user data)
NEXT_PUBLIC_APPWRITE_DATABASE_ID
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID
```

## Code Changes Made

### Modified: `src/lib/appwrite.ts`
```typescript
// Before (missing API key)
export const createServerClient = () => {
  const serverClient = new Client();
  if (endpoint && projectId) {
    serverClient
      .setEndpoint(endpoint)
      .setProject(projectId);
  }
  return serverClient;
};

// After (with API key)
export const createServerClient = () => {
  const serverClient = new Client();
  const apiKey = process.env.APPWRITE_API_KEY;
  
  if (endpoint && projectId) {
    serverClient
      .setEndpoint(endpoint)
      .setProject(projectId);
    
    if (apiKey) {
      serverClient.setKey(apiKey);
      console.log('Server client configured with API key');
    } else {
      console.warn('APPWRITE_API_KEY not set - server operations may fail');
    }
  }
  return serverClient;
};
```

## Additional Resources

- [Appwrite API Keys Documentation](https://appwrite.io/docs/keys)
- [Appwrite Authentication Documentation](https://appwrite.io/docs/products/auth/quick-start)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)

## Summary

✅ **Fixed:** Added API key configuration to server client
✅ **Fixed:** Installed `node-appwrite` server SDK (required for `setKey()` method)
✅ **Required:** Create API key in Appwrite Console with `users.read`, `users.write`, and `sessions.write` scopes
✅ **Required:** Add `APPWRITE_API_KEY` to `.env.local`
✅ **Required:** Restart development server

After completing these steps, user registration should work correctly and users will appear in the Appwrite Console Authentication page.
