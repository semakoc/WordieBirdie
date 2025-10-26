# Supabase Setup Instructions for WordyBirdy Login System

## Overview
Your app now has a complete login and account system. Users must sign up or log in before accessing the student or teacher dashboards. Students' names are automatically used for assignment submissions.

## Required Supabase Database Changes

### 1. Create Users Table

You need to create a new `users` table in your Supabase database with the following structure:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
```

### 2. Update Submissions Table

You need to add a `user_id` column to your existing `submissions` table to link submissions to user accounts:

```sql
-- Add user_id column
ALTER TABLE submissions ADD COLUMN user_id BIGINT;

-- Add foreign key constraint (optional but recommended)
ALTER TABLE submissions 
ADD CONSTRAINT fk_submissions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create index on user_id for faster lookups
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
```

**Note:** The `student_name` column is kept for backwards compatibility and to display names in the teacher dashboard.

### 3. Add SECRET_KEY to Environment Variables

Add a secret key to your `.env` file for Flask session management:

```
SECRET_KEY=your-very-secret-random-key-here-change-this
```

**Important:** Generate a strong random secret key for production. You can generate one using:
```python
import secrets
print(secrets.token_hex(32))
```

## Changes Made to Your App

### 1. **Login/Signup Page (index.html)**
   - Replaced the "Select Role" buttons with a login/signup form
   - Users can toggle between login and signup
   - Signup requires: Full Name, Email, Password, and Role (Student/Teacher)
   - Auto-redirects to appropriate dashboard after login

### 2. **Backend Authentication (app.py)**
   - Added session management with Flask
   - Password hashing using werkzeug's security functions
   - New API endpoints:
     - `POST /api/signup` - Create new account
     - `POST /api/login` - Login to existing account
     - `POST /api/logout` - Logout current user
     - `GET /api/current-user` - Get logged-in user info
   - Authentication decorators protect student and teacher routes
   - Submissions now automatically use the logged-in user's data

### 3. **Student Dashboard (student.html)**
   - Shows "Welcome, [Name]!" message
   - Added logout button
   - Redirects to login if not authenticated

### 4. **Teacher Dashboard (teacher.html)**
   - Shows "Welcome, [Name]!" message
   - Added logout button
   - Redirects to login if not authenticated

### 5. **Assignment Page (assignment.html)**
   - **Removed** the "Enter your name" input field
   - Automatically uses logged-in student's name
   - Shows "Student: [Name]" in header
   - Added logout button

### 6. **Submission Logic (app.js)**
   - No longer requires manual name input
   - Uses authenticated user's data automatically

## How the System Works

1. **User Registration:**
   - User visits the app and sees the login page
   - They click "Sign up" and enter their details
   - Password is hashed before storage
   - User is automatically logged in and redirected to their dashboard

2. **User Login:**
   - User enters email and password
   - System verifies credentials
   - Creates session with user data
   - Redirects to appropriate dashboard (student or teacher)

3. **Session Management:**
   - User data is stored in Flask session (server-side)
   - All protected routes check for valid session
   - Users are redirected to login if not authenticated

4. **Assignment Submissions:**
   - When a logged-in student does an assignment, their `user_id` and `full_name` are automatically attached to submissions
   - Teachers can still see student names in the dashboard
   - Submissions are now tied to user accounts (more secure)

## Security Features

- Passwords are hashed using werkzeug's `generate_password_hash` (uses pbkdf2:sha256)
- Session data is stored server-side (not in cookies)
- Protected routes require authentication
- Role-based access control (students can't access teacher pages)
- Email uniqueness enforced in database

## Testing the System

1. Start your Flask server
2. Visit the homepage - you should see the login page
3. Click "Sign up" and create a student account
4. You should be redirected to the student dashboard
5. Try doing an assignment - no name field should appear
6. Click logout and try logging in again
7. Create a teacher account and verify the teacher dashboard works

## Migration Notes

- Existing submissions in your database will have `NULL` for `user_id`
- The `student_name` field is still used to display names
- New submissions will have both `user_id` and `student_name`
- Consider migrating old submissions if needed (manual process)

## Next Steps (Optional Enhancements)

1. **Email Verification:** Add email verification on signup
2. **Password Reset:** Add "Forgot Password" functionality
3. **Profile Management:** Allow users to update their profile
4. **Admin Panel:** Add admin role for managing users
5. **OAuth:** Add Google/Microsoft sign-in
6. **Remember Me:** Add persistent login option

