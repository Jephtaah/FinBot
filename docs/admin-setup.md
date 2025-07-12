# Admin Setup Guide

## 🚀 Role System Deployed Successfully

The role-based access control system has been deployed to your Supabase database. Here's how to set yourself up as an admin:

## 1. Grant Admin Access

To grant yourself admin access, you'll need to update your profile in the database. You can do this through the Supabase Dashboard:

### Option A: Via Supabase Dashboard SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Run this query (replace with your email):

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Option B: Via Database Table Editor
1. Go to **Table Editor** > **profiles**
2. Find your profile row
3. Edit the `role` column from `user` to `admin`
4. Save the changes

## 2. Verify Admin Access

Once you've updated your role:

1. **Log out** of the application
2. **Log back in** to refresh your session
3. Navigate to `/admin` - you should now have access
4. Non-admin users will be redirected to `/dashboard`

## 3. System Overview

### User Roles
- **`user`** (default): Can only access their own data
- **`admin`**: Full system access to all data

### Admin Features
- **Dashboard**: System-wide analytics and metrics
- **Users**: View and manage all user accounts
- **Transactions**: Access all user transactions
- **Receipts**: Manage all uploaded receipts
- **Protected Routes**: Only admins can access `/admin/*`

### Security Features
- ✅ RLS policies for admin access
- ✅ Regular authenticated client with admin policies
- ✅ Route-level authorization checks
- ✅ Automatic user role assignment on signup

## 4. No Additional Environment Variables Required

The system now works with your existing Supabase configuration:
- Uses regular authenticated Supabase client
- Admin access granted through RLS policies
- No service role key required

## 5. Database Schema Changes Applied

- Added `user_role` enum type
- Added `role` column to `profiles` table
- Updated signup trigger for default role assignment
- Created admin RLS policies for all tables
- Added helper functions: `is_admin()`, `get_user_role()`

## 6. How It Works

The admin system uses Row Level Security (RLS) policies that allow users with the 'admin' role to access all data:

- **Regular users**: Can only see their own data through existing user policies
- **Admin users**: Can see all data through additional admin policies
- **Route protection**: Admin layout checks user role before allowing access
- **Data access**: Admin pages use regular authenticated client with admin RLS policies

## 7. Troubleshooting

If you encounter errors like "Error fetching transactions" or "Error fetching chart data", this has been resolved with additional migrations that:

- ✅ Ensure all existing users have profile records with default 'user' role
- ✅ Fix RLS policy conflicts between user and admin policies
- ✅ Add automatic profile creation for new users
- ✅ Improve error logging for better debugging

The system will automatically create profiles for any users who don't have them yet.

Your admin dashboard is now ready! 🎉