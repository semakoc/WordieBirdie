// static/app.js
// --------------------------------------
// ReadTogether frontend logic
// --------------------------------------

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const passageEl = document.getElementById("passage");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const wordFeedbackEl = document.getElementById("wordFeedback");
const accuracyEl = document.getElementById("accuracy");
const encouragementEl = document.getElementById("encouragement");
const ttsBtn = document.getElementById("ttsBtn"); // 👈 NEW

let mediaRecorder;
let chunks = [];

// 🎙️ Start recording
startBtn.onclick = async () => {
  chunks = [];
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = e => chunks.push(e.data);
  mediaRecorder.onstop = onStopRecording;
  mediaRecorder.start();
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusEl.textContent = "Recording…";
  ttsBtn.style.display = "none"; // Hide TTS button until done 👈 NEW
};

// ⏹️ Stop recording
stopBtn.onclick = () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = "Processing…";
};

// 🧠 Process after recording stops
async function onStopRecording() {
  const blob = new Blob(chunks, { type: "audio/webm" });
  const fd = new FormData();
  fd.append("audio", blob, "audio.webm");

  // 1️⃣ Transcribe
  const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
  const tJson = await tRes.json();
  const transcript = tJson.text || "";
  transcriptEl.textContent = transcript;

  // 2️⃣ Evaluate reading accuracy
  const target = passageEl.value;
  const eRes = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, transcript })
  });
  const evalJson = await eRes.json();
  renderWordFeedback(evalJson);
  
  // Save submission data
  await saveSubmissionData(evalJson);

  // 3️⃣ Ask GPT for encouragement, tips, and questions
  const misreads = evalJson.words
    .filter(w => w.status === "misread")
    .map(w => w.word);

  // Get grade level from assignment
  let gradeLevel = null;
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = urlParams.get('id');
  
  if (assignmentId) {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (response.ok) {
        const assignment = await response.json();
        gradeLevel = assignment.grade_level;
      }
    } catch (err) {
      console.error('Error loading assignment for grade level:', err);
    }
  }
  
  const cRes = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, transcript, misreads, grade_level: gradeLevel })
  });

  const coach = await cRes.json();
  console.log("Coach reply:", coach);

  // 4️⃣ Display encouragement, tips, and questions
  let output = "";
  if (coach.encouragement) {
    output += `🌟 ${coach.encouragement}\n\n`;
  }

  if (coach.tips && coach.tips.length) {
    output += "💡 Tips:\n";
    output += coach.tips.map(t => `• ${t.word}: ${t.tip}`).join("\n") + "\n\n";
  }

  if (coach.questions && coach.questions.length) {
    output += "🧩 Questions:\n";
    output += coach.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  }

  encouragementEl.textContent = output.trim();
  statusEl.textContent = "Done!";

  // ✅ Show TTS button once everything processed
  ttsBtn.style.display = "inline-block";
  
  // Show feedback TTS button
  const feedbackTtsBtn = document.getElementById('feedbackTtsBtn');
  if (feedbackTtsBtn) {
    feedbackTtsBtn.style.display = "inline-block";
  }
}

// 🔊 Read the correct passage aloud
async function speakCorrectText() {
  const text = passageEl.value;

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    console.error("TTS request failed");
    return;
  }

  const audioBlob = await res.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
}

ttsBtn.onclick = speakCorrectText; // 👈 NEW BINDING

// 🔊 Read the feedback aloud
async function speakFeedback() {
  const feedbackText = encouragementEl.textContent;
  
  if (!feedbackText || feedbackText.trim() === '') {
    console.log('No feedback to read');
    return;
  }

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: feedbackText })
  });

  if (!res.ok) {
    console.error("TTS request failed");
    return;
  }

  const audioBlob = await res.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
}

// Add click handler for feedback TTS button
const feedbackTtsBtn = document.getElementById('feedbackTtsBtn');
if (feedbackTtsBtn) {
  feedbackTtsBtn.onclick = speakFeedback;
}

// 🧾 Highlight words and show accuracy results
function renderWordFeedback(data) {
  const words = data.words || [];
  accuracyEl.textContent = `Accuracy: ${data.accuracy || 0}%`;
  wordFeedbackEl.innerHTML = words
    .map(w => `<span class="${w.status}">${w.word}</span>`)
    .join(" ");
}

// 💾 Save submission data to backend
async function saveSubmissionData(evalJson) {
  // Get assignment ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = urlParams.get('id');
  
  if (!assignmentId) return; // Skip if not on assignment page
  
  const misreads = evalJson.words
    .filter(w => w.status === "misread")
    .map(w => w.word);
  
  const studentNameEl = document.getElementById('studentName');
  const studentName = studentNameEl ? studentNameEl.value.trim() : '';
  
  if (!studentName) {
    console.log('Student name not provided, skipping submission save');
    return;
  }
  
  try {
    await fetch('/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignment_id: parseInt(assignmentId),
        student_name: studentName,
        accuracy: evalJson.accuracy,
        words_missed: misreads,
        submitted: false
      })
    });
  } catch (err) {
    console.error('Error saving submission data:', err);
  }
}
