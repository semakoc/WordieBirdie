# WordyBirdy

WordyBirdy is a reading practice application designed to help students improve their reading accuracy through real-time feedback and AI-powered coaching. Teachers can create assignments with custom reading passages, and students can practice reading aloud while receiving personalized feedback based on their accuracy.

## Features

### Authentication & User Management
- **Secure Login System**: Email and password-based authentication with encrypted password storage
- **User Roles**: Separate student and teacher accounts with role-based access control
- **Session Management**: Secure server-side session handling with automatic authentication checks
- **User Profiles**: Automatic user information display on dashboards

### Teacher Features
- **Teacher Dashboard**: Create assignments by uploading PDF files, setting grade levels, and defining minimum accuracy thresholds
- **Submission Tracking**: View student submissions with accuracy scores and missed words
- **Dynamic Filtering**: Filter submissions by student or by assignment
- **User-Linked Submissions**: Track which students submitted which assignments

### Student Features
- **Student Dashboard**: View available assignments and track your progress
- **Automatic Name Entry**: Your account name is automatically used for submissions (no manual entry needed)
- **Real-time Recording**: Record and transcribe your reading using OpenAI Whisper
- **Accuracy Evaluation**: Compare your reading against the target text with detailed word-level feedback
- **AI Coaching**: Receive personalized encouragement, pronunciation tips, and comprehension questions based on grade level
- **Text-to-Speech**: Listen to correct pronunciation or feedback playback

### Core Reading Features
- **PDF Text Extraction**: Automatically extract and normalize text from uploaded PDF files for reading practice
- **Word-Level Feedback**: See exactly which words were read correctly (green) or incorrectly (red)
- **Minimum Accuracy Threshold**: Teachers set required accuracy levels before students can submit
- **Progress Tracking**: Monitor reading accuracy over time

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: Supabase (PostgreSQL)
- **AI Services**: OpenAI (Whisper for transcription, GPT for coaching, TTS for speech)
- **PDF Processing**: PyPDF2
- **Frontend**: HTML, CSS, JavaScript

## Prerequisites

- Python 3.13 or higher
- A Supabase account and project
- An OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd readTogether
```

2. Navigate to the server directory and create a virtual environment:
```bash
cd server
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. In the SQL Editor, run the following to create the database tables:

```sql
-- Users table (for authentication)
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

-- Assignments table
CREATE TABLE assignments (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  text TEXT,
  pdf_filename TEXT,
  min_accuracy DECIMAL(5,2) DEFAULT 80.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student submissions table
CREATE TABLE submissions (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT REFERENCES assignments(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  accuracy DECIMAL(5,2),
  submitted BOOLEAN DEFAULT FALSE,
  words_missed JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations
CREATE POLICY "Allow all operations" ON users
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations" ON assignments
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations" ON submissions
FOR ALL
USING (true)
WITH CHECK (true);
```

3. Note your Supabase project URL and API key from the project settings

### Environment Variables

Create a `.env` file in the `server` directory:

```
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_api_key
SECRET_KEY=your_secret_key_for_sessions
```

**Important**: Generate a secure SECRET_KEY for Flask session encryption:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Replace the placeholder values with your actual API keys and generated secret key.

## Running the Application

1. Ensure you're in the server directory with the virtual environment activated:
```bash
cd server
source venv/bin/activate
```

2. Start the Flask development server:
```bash
python app.py
```

3. Open your browser and navigate to `http://localhost:5000`

## Usage

### Getting Started

1. **Sign Up**: On the home page, click "Sign up" to create an account
   - Enter your full name, email, and password
   - Select your role: Student or Teacher
   - You'll be automatically logged in and redirected to your dashboard

2. **Log In**: If you already have an account, enter your email and password

### Teacher Workflow

1. After logging in, you'll see the Teacher Dashboard with a welcome message
2. Click "Create New Assignment" to reveal the form
3. Enter assignment details:
   - Title
   - Grade level (K-8)
   - Minimum accuracy threshold (default: 80%)
   - Upload a PDF file (text will be automatically extracted)
4. Click "Create Assignment" to save
5. View student submissions in the dashboard:
   - Filter by student to see all of one student's submissions
   - Filter by assignment to see all submissions for one assignment
6. Review accuracy scores and words missed for each submission
7. Click "Logout" when finished

### Student Workflow

1. After logging in, you'll see the Student Dashboard with available assignments
2. Your name is displayed automatically - no need to enter it manually
3. Click "Start Assignment" on any assignment to begin
4. Read the passage displayed on screen
5. Click "Start" to begin recording your reading
6. Read the passage aloud
7. Click "Stop" when finished
8. Review your feedback:
   - **Accuracy score**: Overall percentage of words read correctly
   - **Word-by-word feedback**: Green = correct, Red = misread
   - **Encouragement**: Personalized praise from the AI coach
   - **Tips**: Pronunciation guidance for misread words
   - **Questions**: Comprehension questions about the passage
9. Use the TTS buttons to:
   - Hear the passage read correctly
   - Hear your feedback read aloud
10. Submit the assignment when your accuracy meets the minimum threshold
11. Click "Logout" when finished

## API Endpoints

### Authentication
- `POST /api/signup` - Create a new user account
- `POST /api/login` - Log in with email and password
- `POST /api/logout` - Log out current user
- `GET /api/current-user` - Get current logged-in user info

### Reading & Evaluation
- `POST /api/transcribe` - Transcribe audio using Whisper
- `POST /api/evaluate` - Evaluate reading accuracy
- `POST /api/coach` - Get AI-generated coaching feedback
- `POST /api/tts` - Convert text to speech

### Assignments & Submissions
- `POST /api/assignments` - Create a new assignment (teacher only)
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/<id>` - Get a specific assignment
- `GET /api/submissions` - Get all submissions (teacher only)
- `POST /api/submissions` - Create or update a submission (authenticated users)
- `POST /api/submit-assignment` - Mark assignment as submitted (authenticated users)

## File Structure

```
WordyBirdy/
├── server/
│   ├── app.py                 # Flask backend with authentication
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (not in git)
│   ├── templates/             # HTML templates
│   │   ├── index.html        # Login/Signup page
│   │   ├── teacher.html      # Teacher dashboard
│   │   ├── student.html      # Student dashboard
│   │   └── assignment.html   # Reading practice page
│   └── static/
│       ├── style.css         # Global stylesheet
│       ├── app.js           # Frontend JavaScript
│       └── WordyBirdyLogo.png
├── SUPABASE_SETUP.md         # Detailed database setup guide
└── README.md
```

## Security Features

- **Password Hashing**: Passwords are hashed using `pbkdf2:sha256` before storage
- **Session Management**: Server-side sessions with cryptographic signatures
- **Role-Based Access Control**: Students can only access student pages, teachers can only access teacher pages
- **Protected Routes**: All dashboards require authentication
- **Email Uniqueness**: Each email can only be registered once

## Database Schema

### Users Table
- `id` - Unique user identifier
- `full_name` - User's full name
- `email` - Unique email address for login
- `password_hash` - Securely hashed password
- `role` - Either 'student' or 'teacher'
- `created_at` - Account creation timestamp

### Assignments Table
- `id` - Unique assignment identifier
- `title` - Assignment name
- `grade_level` - Target grade level (K-8)
- `text` - Extracted passage text
- `pdf_filename` - Original PDF filename
- `min_accuracy` - Required accuracy percentage
- `created_at` - Assignment creation timestamp

### Submissions Table
- `id` - Unique submission identifier
- `assignment_id` - Links to assignment
- `user_id` - Links to user account (NEW)
- `student_name` - Student's name for display
- `accuracy` - Reading accuracy percentage
- `submitted` - Whether assignment was officially submitted
- `words_missed` - JSON array of misread words
- `created_at` - Submission timestamp

## Troubleshooting

### "Not logged in" errors
- Make sure you've set a `SECRET_KEY` in your `.env` file
- Clear your browser cookies and try logging in again

### Can't create assignments
- Ensure you're logged in as a teacher (not a student)
- Check that your PDF file is valid and readable

### Session expires quickly
- This is normal in development mode
- Sessions persist as long as the Flask server is running

### Database connection errors
- Verify your `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check that all tables were created successfully in Supabase

## Recent Updates

### Authentication System (Latest)
- Added secure login/signup system
- User accounts with email and password
- Role-based access control
- Removed manual name entry for students (now automatic)
- Sessions tied to user accounts
- Submissions linked to user IDs

### Previous Features
- PDF text extraction and normalization
- OpenAI Whisper transcription
- GPT-powered coaching with grade-level customization
- Text-to-speech feedback
- Teacher submission tracking

## Contributing

This project is designed for educational purposes. Feel free to fork and modify for your own use.

## License

This project is open source and available for educational purposes.
