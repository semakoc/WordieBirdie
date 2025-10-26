# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Note your project URL and API key (anon/public key)

## 2. Create the Database Tables

In the Supabase SQL Editor, run this query:

```sql
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
  student_name TEXT NOT NULL,
  accuracy DECIMAL(5,2),
  submitted BOOLEAN DEFAULT FALSE,
  words_missed JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (you can make this more restrictive later)
CREATE POLICY "Allow all operations" ON assignments
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations" ON submissions
FOR ALL
USING (true)
WITH CHECK (true);
```

**If you already have the submissions table, run this to add the student_name column:**

```sql
-- First, add the column (allowing NULLs)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_name TEXT;

-- Update any existing NULL values to a default value
UPDATE submissions SET student_name = 'Unknown Student' WHERE student_name IS NULL;

-- Now we can set it to NOT NULL
ALTER TABLE submissions ALTER COLUMN student_name SET NOT NULL;
```

## 3. Update Your .env File

Add these two lines to your `/server/.env` file:

```
SUPABASE_URL=your_project_url_here
SUPABASE_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from your Supabase project settings.

## 4. Install Dependencies

Run this in your terminal:

```bash
cd /Users/semakoc/Desktop/readTogether/server
source venv/bin/activate
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- Supabase (database client)
- httpx (HTTP requests for OpenAI API)
- PyPDF2 (PDF text extraction)

## 5. Run the App

```bash
python app.py
```

Now you can:
- Visit `http://localhost:5000` to see the home page
- Go to Teacher view to create assignments
- Go to Student view to see and start assignments

## What Works Now

- **Teacher page**: Create assignments with title, grade level, and PDF upload
  - ✅ **PDF text extraction**: Text is automatically extracted from uploaded PDFs using PyPDF2
  - Loading state shown while PDF is being processed
- **Student page**: View all assignments and click to start them
  - Shows assignment title and grade level
  - One-click access to start reading
- **Assignment page**: Loads assignment text dynamically when accessed from student page
  - Displays the extracted PDF text for students to read
  - All existing reading evaluation features work with the extracted text
- All assignment data is stored in Supabase

## How the Full Flow Works

1. **Teacher uploads PDF**: Teacher fills out form with title, grade level, and PDF
2. **PDF text extraction**: Backend extracts all text from the PDF automatically
3. **Storage**: Text is stored in Supabase along with assignment metadata
4. **Student access**: Students see the assignment in their dashboard
5. **Reading practice**: When student clicks the assignment, the extracted text loads into the reading interface
6. **Evaluation**: Student reads the text and gets real-time feedback using your existing logic

## Next Steps (for you to implement later)

- Breaking text into sentences (by period, question mark, exclamation point) for sentence-by-sentence reading
- User authentication to distinguish between teachers and students
- Associating assignments with specific students (instead of showing all to everyone)
- Progress tracking for each student
- File storage in Supabase Storage for the actual PDF files (currently only text is stored)

