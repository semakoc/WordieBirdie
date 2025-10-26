# WordieBirdie

WordieBirdie is a reading practice application designed to help students improve their reading accuracy through real-time feedback and AI-powered coaching. Teachers can create assignments with custom reading passages, and students can practice reading aloud while receiving personalized feedback based on their accuracy.

## Features

- **Teacher Dashboard**: Create assignments by uploading PDF files, setting grade levels, and defining minimum accuracy thresholds
- **Student Dashboard**: View assignments and track progress with real-time reading evaluation
- **PDF Text Extraction**: Automatically extract and normalize text from uploaded PDF files for reading practice
- **Real-time Recording**: Record and transcribe student reading using OpenAI Whisper
- **Accuracy Evaluation**: Compare student reading against target text with detailed word-level feedback
- **AI Coaching**: Receive personalized encouragement, pronunciation tips, and comprehension questions based on grade level
- **Text-to-Speech**: Listen to correct pronunciation or feedback playback
- **Submission Tracking**: Teachers can view student submissions with accuracy scores and missed words
- **Dynamic Filtering**: Filter submissions by student or by assignment

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

-- Enable Row Level Security
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations
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
```

Replace the placeholder values with your actual API keys.

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

### Teacher Workflow

1. Click "Teacher" on the home page
2. Click "Create New Assignment" to reveal the form
3. Enter assignment details:
   - Title
   - Grade level (K-8)
   - Minimum accuracy threshold
   - Upload a PDF file
4. Click "Create Assignment" to save
5. View student submissions in the dashboard
6. Filter submissions by student or by assignment

### Student Workflow

1. Click "Student" on the home page
2. View available assignments
3. Click on an assignment to begin
4. Enter your name when prompted
5. Click "Start Recording" to begin reading
6. Read the passage aloud
7. Click "Stop Recording" to submit
8. Review feedback (encouragement, tips, and questions)
9. Listen to correct pronunciation or feedback using the TTS buttons
10. Submit the assignment when accuracy meets the minimum threshold

## API Endpoints

- `POST /api/transcribe` - Transcribe audio using Whisper
- `POST /api/evaluate` - Evaluate reading accuracy
- `POST /api/coach` - Get AI-generated coaching feedback
- `POST /api/tts` - Convert text to speech
- `POST /api/assignments` - Create a new assignment
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/<id>` - Get a specific assignment
- `GET /api/submissions` - Get all submissions
- `POST /api/submissions` - Create or update a submission
- `POST /api/submit-assignment` - Mark assignment as submitted

## File Structure

```
readTogether/
├── server/
│   ├── app.py                 # Flask backend
│   ├── requirements.txt       # Python dependencies
│   ├── templates/             # HTML templates
│   │   ├── index.html        # Home page
│   │   ├── teacher.html      # Teacher dashboard
│   │   ├── student.html      # Student dashboard
│   │   └── assignment.html   # Reading practice page
│   └── static/
│       ├── style.css         # Global stylesheet
│       ├── app.js           # Frontend JavaScript
│       └── WordieBirdieLogo.png
└── README.md
```

## License

This project is open source and available for educational purposes.
