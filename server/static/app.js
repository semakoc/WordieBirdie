const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const passageEl = document.getElementById("passage");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const wordFeedbackEl = document.getElementById("wordFeedback");
const accuracyEl = document.getElementById("accuracy");
const encouragementEl = document.getElementById("encouragement");

let mediaRecorder;
let chunks = [];

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
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = "Processing…";
};

async function onStopRecording() {
  const blob = new Blob(chunks, { type: "audio/webm" });
  const fd = new FormData();
  fd.append("audio", blob, "audio.webm");

  // 1️⃣ Send to Flask to transcribe
  const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
  const tJson = await tRes.json();
  const transcript = tJson.text || "";
  transcriptEl.textContent = transcript;

  // 2️⃣ Evaluate reading
  const target = passageEl.value;
  const eRes = await fetch("/api/evaluate", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ target, transcript })
  });
  const evalJson = await eRes.json();
  renderWordFeedback(evalJson);

  // 3️⃣ Ask GPT for encouragement + questions
  const misreads = evalJson.words.filter(w => w.status === "misread").map(w => w.word);
  const cRes = await fetch("/api/coach", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ target, transcript, misreads })
  });
  const coach = await cRes.json();
  encouragementEl.textContent = coach.encouragement || "";
  statusEl.textContent = "Done!";
}

function renderWordFeedback(data) {
  const words = data.words || [];
  accuracyEl.textContent = `Accuracy: ${data.accuracy || 0}%`;
  wordFeedbackEl.innerHTML = words.map(w => 
    `<span class="${w.status}">${w.word}</span>`
  ).join(" ");
}
