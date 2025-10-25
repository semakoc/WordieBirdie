# app.py
# ------------------------------
# ReadTogether Flask backend
# ------------------------------

import os
import re
import difflib
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import httpx

# 1️⃣ Load environment variables (like your OpenAI API key)
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# 2️⃣ Initialize Flask app
app = Flask(__name__)


# ----------------------------------------------------------
# HELPER FUNCTIONS
# ----------------------------------------------------------

def normalize_words(s: str):
    """
    Cleans text by:
      - making everything lowercase,
      - removing punctuation,
      - splitting into a list of words.
    Example:
      "The cat sat!" -> ["the","cat","sat"]
    """
    clean = re.sub(r"[^\w\s]", "", s.lower())
    return clean.split()


def align_words(target_text: str, transcript_text: str):
    """
    Compares the target passage and the child's transcript.
    Returns which words were read correctly vs. misread, plus accuracy %.
    """
    t_words = normalize_words(target_text)
    r_words = normalize_words(transcript_text)

    sm = difflib.SequenceMatcher(a=t_words, b=r_words)
    result = []

    # go through every "edit step"
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            # equal means the words match
            for w in t_words[i1:i2]:
                result.append({"word": w, "status": "ok"})
        else:
            # replace / delete = misread (insert = skipped automatically)
            for w in t_words[i1:i2]:
                result.append({"word": w, "status": "misread"})

    correct = sum(1 for w in result if w["status"] == "ok")
    acc = round(100.0 * correct / max(1, len(result)), 1)

    return {"words": result, "accuracy": acc}


# ----------------------------------------------------------
# ROUTES
# ----------------------------------------------------------

@app.get("/")
def index():
    """
    Serves the main web page (index.html).
    """
    return render_template("index.html")


@app.post("/api/transcribe")
def transcribe():
    """
    Receives audio from the frontend, sends it to OpenAI Whisper API,
    and returns the transcribed text.
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file received"}), 400

    audio_file = request.files["audio"]
    url = "https://api.openai.com/v1/audio/transcriptions"

    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
    files = {
        "file": (
            audio_file.filename or "audio.webm",
            audio_file.stream,
            audio_file.mimetype or "audio/webm"
        )
    }
    data = {"model": "whisper-1"}

    with httpx.Client(timeout=60.0) as client:
        r = client.post(url, headers=headers, files=files, data=data)

    if r.status_code >= 400:
        return jsonify({"error": r.text}), 500

    out = r.json()
    return jsonify({"text": out.get("text", "")})


@app.post("/api/evaluate")
def evaluate():
    """
    Compares target passage vs. transcript and labels each word.
    """
    body = request.get_json(force=True)
    target = body.get("target", "")
    transcript = body.get("transcript", "")

    aligned = align_words(target, transcript)
    return jsonify(aligned)


@app.post("/api/coach")
def coach():
    import json
    body = request.get_json(force=True)
    target = body.get("target", "")
    transcript = body.get("transcript", "")
    misreads = body.get("misreads", [])

    prompt = (
        "You are a kind reading tutor for a 7–9 year old child.\n"
        "Always respond ONLY with a valid JSON object that has these exact keys:\n"
        "encouragement (string),\n"
        "tips (list of objects {word, tip}),\n"
        "questions (list of 2 short comprehension questions).\n"
        f"TARGET PASSAGE: {target}\n"
        f"CHILD'S TRANSCRIPT: {transcript}\n"
        f"MISREAD WORDS: {', '.join(misreads) if misreads else 'none'}"
    )

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You speak simply and kindly to children."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.6,
        "response_format": {"type": "json_object"},
    }

    with httpx.Client(timeout=60.0) as client:
        r = client.post(url, headers=headers, json=payload)

    if r.status_code >= 400:
        print("COACH ERROR:", r.status_code, r.text)
        return jsonify({"error": "OpenAI API error"}), 500

    try:
        data = r.json()
        content = data["choices"][0]["message"]["content"]
        # parse JSON if it's a string
        parsed = json.loads(content) if isinstance(content, str) else content

        # ensure all keys exist even if empty
        parsed.setdefault("encouragement", "Nice reading!")
        parsed.setdefault("tips", [])
        parsed.setdefault("questions", [])

        print("COACH RESPONSE:", parsed)
        return jsonify(parsed)

    except Exception as e:
        print("Error parsing coach response:", e, r.text)
        fallback = {
            "encouragement": "Nice reading! Keep it up.",
            "tips": [],
            "questions": [],
        }
        return jsonify(fallback)




# ----------------------------------------------------------
# RUN THE APP
# ----------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
