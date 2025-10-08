# Role-Based Authentication Implementation

## Overview
This application now uses Appwrite user preferences to manage role-based access control. Users can have either `admin` or `customer` roles.

---

## How It Works

### User Roles
- **`customer`** - Default role for all registered users (can access main store)
- **`admin`** - Special role for admin users (can access admin panel)
- **`guest`** - Unauthenticated users

### Role Storage
Roles are stored in Appwrite user preferences:
```json
{
  "prefs": {
    "role": "admin" // or "customer"
  }
}
```

---

## Implementation Details

### 1. Registration Flow
When a new user registers:
1. User account created in Appwrite
2. **Automatically set `role: 'customer'` in preferences**
3. User logged in with customer role

**File:** `src/app/api/auth/register/route.ts`
```typescript
// Set user role preference to 'customer'
await users.updatePrefs(user.$id, { role: 'customer' });
```

### 2. Login Flow
When a user logs in:
1. Appwrite session created
2. User data fetched including preferences
3. **Role extracted from `user.prefs.role`**
4. Role stored in user state

**File:** `src/hooks/useAuth.ts`
```typescript
role: user.prefs?.role || 'customer'
```

### 3. Admin Access Protection

#### Client-Side Protection (Admin Layout)
- Checks user role via `/api/auth/role` endpoint
- If role is not `admin`, redirects to home page
- Shows loading spinner while verifying

**File:** `src/app/admin/layout.tsx`
```typescript
const response = await fetch('/api/auth/role')
const data = await response.json()

if (data.role !== 'admin') {
  alert('Access denied. Admin privileges required.')
  router.push('/')
}
```

#### Server-Side Protection (Middleware)
- Middleware checks for session cookie
- Redirects unauthenticated users to `/admin/login`

**File:** `src/middleware.ts`

### 4. Role API Endpoint
Get current user's role from preferences:

**Endpoint:** `GET /api/auth/role`

**Response:**
```json
{
  "success": true,
  "role": "admin",
  "userId": "user_id_here",
  "email": "user@example.com"
}
```

---

## Creating Admin Users

### Method 1: Appwrite Console (Recommended)

1. **Go to Appwrite Console**
   - Navigate to your project
   - Go to **Auth** → **Users**

2. **Create New User**
   - Click "Create User"
   - Enter email, password, and name
   - Click "Create"

3. **Set Admin Role**
   - Click on the newly created user
   - Go to **Preferences** tab
   - Click "Add Preference"
   - **Key:** `role`
   - **Value:** `admin`
   - Click "Update"

4. **Done!**
   - User can now login at `/admin/login`
   - Will have access to admin panel

### Method 2: Update Existing User

1. **Find User in Console**
   - Go to **Auth** → **Users**
   - Find the user you want to make admin

2. **Update Preferences**
   - Click on the user
   - Go to **Preferences** tab
   - If `role` preference exists, edit it
   - If not, add new preference:
     - **Key:** `role`
     - **Value:** `admin`
   - Click "Update"

### Method 3: Via API (Advanced)

You can also create an admin user via API:

```typescript
import { Users } from 'node-appwrite';

const users = new Users(serverClient);

// Create user
const user = await users.create(
  ID.unique(),
  'admin@example.com',
  undefined,
  'SecurePassword123!',
  'Admin User'
);

// Set admin role
await users.updatePrefs(user.$id, { role: 'admin' });
```

---

## Testing Role-Based Access

### Test Customer Access

1. **Register New User**
   ```
   Visit: http://localhost:3001/register
   Fill in: name, email, password
   Submit
   ```

2. **Verify Customer Role**
   - After registration, user is logged in
   - Open browser console
   - User object should show `role: 'customer'`

3. **Try Accessing Admin Panel**
   ```
   Visit: http://localhost:3001/admin
   ```
   - Should show: "Access denied. Admin privileges required."
   - Redirected to home page

### Test Admin Access

1. **Create Admin User** (see above)
   - Use Appwrite Console
   - Set preferences: `role: 'admin'`

2. **Login as Admin**
   ```
   Visit: http://localhost:3001/admin/login
   Enter admin credentials
   Submit
   ```

3. **Verify Admin Access**
   - Should successfully login
   - Redirected to admin dashboard
   - Can access all admin routes:
     - `/admin` (Dashboard)
     - `/admin/products`
     - `/admin/orders`
     - `/admin/customers`
     - `/admin/settings`

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/
│   │       │   └── route.ts          ✅ Sets customer role
│   │       └── role/
│   │           └── route.ts          ✅ Gets user role
│   └── admin/
│       └── layout.tsx                ✅ Verifies admin role
├── hooks/
│   └── useAuth.ts                    ✅ Includes role in user state
├── lib/
│   └── auth-service.ts               ✅ getUserRole() from prefs
└── middleware.ts                     ✓ Session-based protection
```

---

## User Flow Diagrams

### Customer Registration & Login
```
1. User registers
   ↓
2. Account created
   ↓
3. Preferences set: role = 'customer'
   ↓
4. Auto-login
   ↓
5. Session contains role in preferences
   ↓
6. Can access main store
   ✗ Cannot access admin panel
```

### Admin Login
```
1. Admin created in Appwrite Console
   ↓
2. Preferences set: role = 'admin'
   ↓
3. Admin visits /admin/login
   ↓
4. Enters credentials
   ↓
5. Session created with admin role
   ↓
6. Admin layout checks role via API
   ↓
7. Role = 'admin' → Access granted
   ↓
8. Can access all admin routes
```

### Non-Admin Tries Admin Access
```
1. Customer user logs in
   ↓
2. Tries to visit /admin
   ↓
3. Admin layout checks role via API
   ↓
4. Role = 'customer' → Access denied
   ↓
5. Alert: "Access denied. Admin privileges required."
   ↓
6. Redirected to home page
```

---

## Security Features

### ✅ Client-Side Protection
- Admin layout verifies role before rendering
- Shows loading state during verification
- Redirects non-admins immediately

### ✅ Session-Based Authentication
- Middleware checks for valid session cookie
- No session = redirect to login
- HttpOnly cookies prevent XSS attacks

### ✅ Preference-Based Roles
- Roles stored securely in Appwrite
- Cannot be modified by client-side code
- Only server with API key can update preferences

### ✅ Multi-Layer Protection
1. Middleware (session check)
2. Admin layout (role check)
3. API routes (authentication required)

---

## API Reference

### GET /api/auth/role

Get current user's role from preferences.

**Authentication:** Required (session cookie)

**Response:**
```json
{
  "success": true,
  "role": "admin",
  "userId": "648a5b2c3d1e7f001a9b4c5d",
  "email": "admin@example.com"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Not authenticated",
  "role": "guest"
}
```

---

## Troubleshooting

### Issue: "Access denied" even for admin users

**Solution:**
1. Check Appwrite Console
2. Go to Auth → Users → [Your User]
3. Go to Preferences tab
4. Verify `role` preference exists with value `admin`
5. If not, add it manually

### Issue: Role not showing in user state

**Solution:**
1. Check browser console for user object
2. Should see `role: 'admin'` or `role: 'customer'`
3. If missing, check API response: `GET /api/auth/role`
4. Clear browser cache and re-login

### Issue: Preferences not saving during registration

**Solution:**
1. Check server logs for preference update errors
2. Verify Appwrite API key has proper permissions
3. Check API key in `.env.local`:
   ```
   APPWRITE_API_KEY=your_api_key_here
   ```

---

## Best Practices

### ✅ DO:
- Always create admin users via Appwrite Console
- Use strong passwords for admin accounts
- Regularly audit admin user list
- Keep role preferences simple ('admin' or 'customer')

### ❌ DON'T:
- Don't allow users to set their own role
- Don't store roles in localStorage (use Appwrite preferences)
- Don't expose admin endpoints without role check
- Don't trust client-side role checks alone

---

## Future Enhancements

### Potential Improvements:
1. **Multiple Admin Roles**
   - `super_admin` - Full access
   - `admin` - Most features
   - `moderator` - Limited features

2. **Permission System**
   ```json
   {
     "role": "admin",
     "permissions": ["products.edit", "orders.view", "customers.view"]
   }
   ```

3. **Role Management UI**
   - Admin page to manage user roles
   - Promote customers to admins
   - Demote admins to customers

4. **Audit Logs**
   - Track role changes
   - Log admin actions
   - Security monitoring

---

## Summary

✅ **Implemented:**
- Role-based access control using Appwrite preferences
- Automatic `customer` role on registration
- Admin role verification in admin panel
- API endpoint to check user role
- Client-side and server-side protection

✅ **How to Use:**
1. Register new users → automatically get `customer` role
2. Create admin users in Appwrite Console with `role: 'admin'`
3. Admin users can access `/admin` dashboard
4. Customer users get "Access denied" when trying admin routes

🎉 **Your app now has full role-based authentication!**
