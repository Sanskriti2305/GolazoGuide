SUPABASE_URL="https://vhbuxlmzecflwfpaqxfr.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYnV4bG16ZWNmbHdmcGFxeGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1OTI5OTcsImV4cCI6MjA5OTE2ODk5N30.0EUqWZxTh1RnVIbHDj_UDkiyvZvoyJDBGJZj7Fhu1TY"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.querySelectorAll('[role="link"], [role="button"]').forEach(item => {
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.click();
    }
  });
});

async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "auth.html";
  }
}
checkAuth();
// ---------- PAGE NAVIGATION ----------
function goToPage(pageName) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const navEl = document.querySelector(`.nav-item[data-page="${pageName}"]`);
  if (navEl) navEl.classList.add('active');

  document.getElementById('page-' + pageName).classList.add('active');

if (pageName === 'history') loadHistory();
if (pageName === 'sensory') loadSensoryMap();
if (pageName === 'navigator') loadLatestStadiumMap();
}

document.querySelectorAll('.nav-item, .module-card').forEach(item => {
  item.addEventListener('click', () => goToPage(item.dataset.page));
});

// ---------- GREETING ----------
function setGreeting() {
  const hour = new Date().getHours();
  let greeting = "Good morning.";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon.";
  else if (hour >= 17) greeting = "Good evening.";
  document.getElementById("greetingHeadline").innerText = greeting;
}
setGreeting();

// ---------- MOCK TICKETS ----------
const mockTickets = [
  { teams: "Argentina vs Brazil", venue: "MetLife Stadium", date: "JUL 14", time: "7:00 PM" },
  { teams: "France vs Germany", venue: "Seattle Stadium", date: "JUL 18", time: "3:30 PM" },
  { teams: "Spain vs Portugal", venue: "Estadio Azteca", date: "JUL 22", time: "6:00 PM" },
];

function renderTickets() {
  const col = document.getElementById("ticketColumn");
  const [main, ...rest] = mockTickets;

  col.innerHTML = `
    <div class="ticket-main">
      <div class="ticket-label">Your Next Match</div>
      <div class="ticket-teams">${main.teams}</div>
      <div class="ticket-meta">${main.venue} · ${main.date}, ${main.time}</div>
    </div>
    ${rest.map(t => `
      <div class="ticket-mini">
        <div>
          <div class="ticket-mini-loc">${t.venue}</div>
          <div class="ticket-mini-teams">${t.teams}</div>
        </div>
        <div class="ticket-mini-date">${t.date}</div>
      </div>
    `).join('')}
  `;
}
renderTickets();

// ---------- HERO SEARCH BAR ----------
function quickAsk(question) {
  document.getElementById("heroSearchInput").value = question;
  submitHeroSearch();
}

function submitHeroSearch() {
  const question = document.getElementById("heroSearchInput").value;
  if (!question) return;
  goToPage('copilot');
  document.getElementById("UserInput").value = question;
  sendChatMessage();
}

// ---------- CHAT (single source of truth) ----------
async function sendChatMessage() {
  const userText = document.getElementById("UserInput").value;
  if (!userText) return;

  showConversation();

  const messages = document.getElementById("chatMessages");
  messages.innerHTML += `<div class="msg-bubble msg-user">${userText}</div>`;
  document.getElementById("UserInput").value = "";
  messages.scrollTop = messages.scrollHeight;

  // Server now requires a valid session token (requireAuth middleware),
  // so we grab the current session and attach it as a Bearer token
  const { data: { session } } = await supabaseClient.auth.getSession();

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message: userText }),
  });

  const data = await response.json();
  messages.innerHTML += `<div class="msg-bubble msg-ai">${data.reply}</div>`;
  messages.scrollTop = messages.scrollHeight;
  loadHistory();
}

// ---------- HISTORY ----------
async function loadHistory() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  const response = await fetch("/api/chat/history", {
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
    },
  });
  const data = await response.json();

  const historyDiv = document.getElementById("historyL");
  historyDiv.innerHTML = "";

  data.forEach(row => {
    historyDiv.innerHTML += `
<div class="history-item">
    <div class="history-user">
        ${row.user_message}
    </div>
    <div class="history-ai">
        ${row.ai_reply}
    </div>
</div>
`;
  });
}

// ---------- SENSORY MAP ----------
async function loadSensoryMap() {
  const response = await authFetch("/api/sensory-map");
  const zones = await response.json();
  renderSensoryMap(zones);
}
function renderSensoryMap(zones) {

    const container = document.getElementById("sensoryMap");

    container.innerHTML = "";

    zones.forEach(zone => {

        const status =
            zone.noise > 75 ? "High" :
            zone.noise > 45 ? "Moderate" :
            "Low";

        const trend =
            zone.crowd > 75 ? "Crowded" :
            zone.crowd > 45 ? "Stable" :
            "Comfortable";

        const dotColor =
            zone.noise > 75
                ? "#ef4444"
                : zone.noise > 45
                    ? "#f59e0b"
                    : "#4ADE80";

        container.innerHTML += `

        <div class="zone-box">

            <div class="zone-top">

                <div class="zone-title">

                    <span
                        class="zone-dot"
                        style="background:${dotColor}">
                    </span>

                    <b>${zone.name}</b>

                </div>

                <span class="zone-status">

                    ${status}

                </span>

            </div>

            <div class="zone-stats">

                <div>

                    <label>Noise</label>

                    <strong>${zone.noise} dB</strong>

                </div>

                <div>

                    <label>Crowd</label>

                    <strong>${zone.crowd}%</strong>

                </div>

            </div>

            <div class="zone-footer">

                ${trend}

            </div>

        </div>

        `;

    });

}

// ---------- OPERATIONS ----------
async function resetContext() {
  await authFetch('/api/context/reset', { method: 'POST' });
  loadSensoryMap();
}

async function triggerEvent(event) {
  addTimelineEvent(event);
  await authFetch('/api/ops/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event })
  });
  loadSensoryMap();
}

async function getOpsSummary() {
  document.getElementById("opsSummary").innerText = "Generating...";
  const response = await authFetch('/api/ops/summary');
  const data = await response.json();
  document.getElementById("opsSummary").innerText = data.summary;
}

// ---------- AR NAVIGATOR ----------
async function getDirections() {
  const stadiumId = document.getElementById("stadiumIdInput").value;
  const from = document.getElementById("fromInput").value;
  const to = document.getElementById("toInput").value;

  document.getElementById("directionsOutput").innerText = "Generating route...";

  const response = await authFetch('/api/navigator/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stadiumId, from, to })
  });

  const data = await response.json();
  document.getElementById("directionsOutput").innerText = data.directions;

  const utterance = new SpeechSynthesisUtterance(data.directions);
  window.speechSynthesis.speak(utterance);
}

// ---------- VISION ASSIST ----------
async function startCamera() {
  const video = document.getElementById("cameraFeed");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = stream;
}

async function captureAndDescribe(mode) {
  const video = document.getElementById("cameraFeed");
  const canvas = document.getElementById("captureCanvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);

  const base64 = canvas.toDataURL("image/jpeg").split(",")[1];

  document.getElementById("visionOutput").innerText = "Analyzing...";

  const response = await authFetch('/api/vision/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg", mode })
  });

  const data = await response.json();
  document.getElementById("visionOutput").innerText = data.description;

  const utterance = new SpeechSynthesisUtterance(data.description);
  window.speechSynthesis.speak(utterance);
}

/* ==========================================
   Co-Pilot Landing → Conversation Transition
========================================== */

function showConversation() {

    const landing = document.getElementById("landingView");
    const conversation = document.getElementById("conversationView");

    if (!landing || !conversation) return;

    if (landing.classList.contains("hidden")) return;

    landing.classList.add("hidden");

    setTimeout(() => {

        landing.style.display = "none";

        conversation.style.display = "flex";

        requestAnimationFrame(() => {
            conversation.classList.add("show");
        });

    }, 350);

}

// ---------- MAP BUILDER (merged into Sensory page) ----------
const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas ? mapCanvas.getContext("2d") : null;

let mapNodes = [];
let mapEdges = [];
let mapMode = "place";
let selectedMapNode = null;
let mapImageObj = null;

document.getElementById("mapUploadButton")?.addEventListener("click", () => {
  document.getElementById("mapUpload").click();
});

document.getElementById("mapUpload")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    mapImageObj = new Image();
    mapImageObj.onload = () => {
      mapCanvas.width = mapImageObj.width;
      mapCanvas.height = mapImageObj.height;
      redrawMapCanvas();
    };
    mapImageObj.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function toggleMapMode() {
  mapMode = mapMode === "place" ? "connect" : "place";
  selectedMapNode = null;
  document.getElementById("mapModeBtn").innerText =
    mapMode === "place" ? "Mode: Place Node" : "Mode: Connect Nodes";
}

mapCanvas?.addEventListener("click", (e) => {
  const rect = mapCanvas.getBoundingClientRect();
  const scaleX = mapCanvas.width / rect.width;
  const scaleY = mapCanvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  if (mapMode === "place") {
    const name = prompt("Name this location (e.g. Gate A, Section 204):");
    if (!name) return;
    mapNodes.push({ name, x, y });
    redrawMapCanvas();
  } else {
    const clicked = findMapNodeNear(x, y);
    if (!clicked) return;

    if (!selectedMapNode) {
      selectedMapNode = clicked;
      document.getElementById("mapStatusMsg").innerText = `Selected: ${clicked.name}. Click another node to connect.`;
    } else {
      if (selectedMapNode.name === clicked.name) return;
      const distance = Math.round(Math.hypot(clicked.x - selectedMapNode.x, clicked.y - selectedMapNode.y));
      mapEdges.push({ from: selectedMapNode.name, to: clicked.name, distance });
      document.getElementById("mapStatusMsg").innerText = `Connected ${selectedMapNode.name} <-> ${clicked.name}`;
      selectedMapNode = null;
      redrawMapCanvas();
    }
  }
});

function findMapNodeNear(x, y) {
  return mapNodes.find(n => Math.hypot(n.x - x, n.y - y) < 15);
}

function redrawMapCanvas() {
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  if (mapImageObj) mapCtx.drawImage(mapImageObj, 0, 0);

  mapCtx.strokeStyle = "#4ADE80";
  mapCtx.lineWidth = 2;
  mapEdges.forEach(edge => {
    const fromNode = mapNodes.find(n => n.name === edge.from);
    const toNode = mapNodes.find(n => n.name === edge.to);
    if (!fromNode || !toNode) return;
    mapCtx.beginPath();
    mapCtx.moveTo(fromNode.x, fromNode.y);
    mapCtx.lineTo(toNode.x, toNode.y);
    mapCtx.stroke();
  });

  mapNodes.forEach(node => {
    mapCtx.fillStyle = "#E85D4B";
    mapCtx.beginPath();
    mapCtx.arc(node.x, node.y, 8, 0, Math.PI * 2);
    mapCtx.fill();
    mapCtx.fillStyle = "#fff";
    mapCtx.font = "16px Inter";
    mapCtx.fillText(node.name, node.x + 10, node.y);
  });
}

async function analyzeMap() {
  if (!mapImageObj) { alert("Upload a stadium map image first."); return; }
  document.getElementById("mapStatusMsg").innerText = "Analyzing map with AI...";

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = mapImageObj.width;
  tempCanvas.height = mapImageObj.height;
  tempCanvas.getContext("2d").drawImage(mapImageObj, 0, 0);
  const base64 = tempCanvas.toDataURL("image/png").split(",")[1];

  const response = await authFetch('/api/map/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: "image/png" })
  });

  const data = await response.json();
  if (!data.labels) {
    document.getElementById("mapStatusMsg").innerText = "AI analysis failed.";
    return;
  }

  mapNodes = data.labels.map(l => ({
    name: l.name,
    x: (l.xPercent / 100) * mapCanvas.width,
    y: (l.yPercent / 100) * mapCanvas.height,
  }));

  autoConnectMapNodes();
  redrawMapCanvas();
  document.getElementById("mapStatusMsg").innerText = `Found ${mapNodes.length} locations, auto-connected. Fix manually if needed.`;
}

function autoConnectMapNodes(k = 3) {
  mapEdges = [];
  mapNodes.forEach(node => {
    const nearest = mapNodes
      .filter(n => n.name !== node.name)
      .map(n => ({ name: n.name, dist: Math.hypot(n.x - node.x, n.y - node.y) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, k);

    nearest.forEach(n => {
      const exists = mapEdges.some(e => (e.from === node.name && e.to === n.name) || (e.from === n.name && e.to === node.name));
      if (!exists) mapEdges.push({ from: node.name, to: n.name, distance: Math.round(n.dist) });
    });
  });
}

async function saveMapToDatabase() {
  const name = document.getElementById("stadiumNameInput").value;
  if (!name) { alert("Enter a stadium name first."); return; }
  if (mapNodes.length === 0) { alert("Place or generate some nodes first."); return; }

  const cleanNodes = [...new Set(mapNodes.map(n => n.name))];
  const imageDataUrl = mapCanvas.toDataURL("image/png");

  const response = await authFetch('/api/map/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, nodes: cleanNodes, edges: mapEdges, image: imageDataUrl })
  });

  const data = await response.json();
  document.getElementById("mapStatusMsg").innerText = `Saved as "${name}" (Stadium ID: ${data.id}) — use this ID in AR Navigator.`;
  loadLatestStadiumMap();
}

async function loadLatestStadiumMap() {
  const response = await authFetch('/api/map/list');
  const stadiums = await response.json();
  if (!stadiums || stadiums.length === 0) return;

  const latest = stadiums[0];
  document.getElementById("stadiumIdInput").value = latest.id;
  loadStadiumMapImage(latest.id);
}

async function loadStadiumMapImage(stadiumId) {
  if (!stadiumId) return;
  const response = await authFetch(`/api/map/${stadiumId}`);
  if (!response.ok) return;
  const data = await response.json();
  const imgEl = document.getElementById("navigatorMapImage");
  if (imgEl && data.image) imgEl.src = data.image;
}

document.getElementById("stadiumIdInput")?.addEventListener("change", (e) => {
  loadStadiumMapImage(e.target.value);
});
function clearMapGraph() {
  mapNodes = [];
  mapEdges = [];
  selectedMapNode = null;
  redrawMapCanvas();
}

/* ============================================
        Operations Timeline
============================================ */

const timelineDescriptions = {

    goal: {
        title: "Goal Scored",
        description: "Crowd excitement increased. Volunteers should monitor movement near seating sections."
    },

    red_card: {
        title: "Red Card",
        description: "Crowd reaction expected. Security awareness level increased."
    },

    halftime: {
        title: "Half Time",
        description: "High pedestrian movement expected towards food courts and restrooms."
    }

};

function addTimelineEvent(type){

    const timeline=document.getElementById("eventTimeline");

    if(!timeline) return;

    if(timeline.querySelector(".timeline-empty")){

        timeline.innerHTML="";

    }

    const event=timelineDescriptions[type];

    if(!event) return;

    const now=new Date();

    const time=now.toLocaleTimeString([],{

        hour:"2-digit",

        minute:"2-digit"

    });

    timeline.insertAdjacentHTML("afterbegin",`

    <div class="timeline-item">

        <div class="timeline-time">

            ${time}

        </div>

        <div class="timeline-dot"></div>

        <div class="timeline-content">

            <strong>${event.title}</strong>

            <p>${event.description}</p>

        </div>

    </div>

    `);

}

async function loadProfile() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const email = session.user.email;
  const initial = email.charAt(0).toUpperCase();

  document.getElementById("navProfileInitial").innerText = initial;
  document.getElementById("navProfileEmail").innerText = email;
}
loadProfile();

document.getElementById("navProfile").addEventListener("click", (e) => {
  e.stopPropagation();
  const dropdown = document.getElementById("navProfileDropdown");
  dropdown.classList.toggle("open");
});

document.addEventListener("click", () => {
  document.getElementById("navProfileDropdown").classList.remove("open");
});

document.getElementById("logoutButton").addEventListener("click", async (e) => {
  e.stopPropagation();
  await supabaseClient.auth.signOut();
  window.location.href = "auth.html";
});
document.getElementById("navProfile").addEventListener("keydown", (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    document.getElementById("navProfileDropdown").classList.toggle("open");
  }
});
document.getElementById("logoutButton").addEventListener("keydown", (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();
    supabaseClient.auth.signOut().then(() => window.location.href = "auth.html");
  }
});
// Enter key submits the nearest button/action across the whole app
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const active = document.activeElement;
  if (active.tagName !== 'INPUT') return;

  // Skip inputs already inside a <form> — they submit natively
  if (active.closest('form')) return;

  // Find a "sibling" action button near this input and trigger it
  const container = active.closest('.route-input, .route-grid, div');
  const button = container?.parentElement?.querySelector('button');
  if (button) {
    e.preventDefault();
    button.click();
  }
});