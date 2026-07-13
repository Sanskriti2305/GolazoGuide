const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

let nodes = [];       // { name, x, y }
let edges = [];       // { from, to, distance }
let mode = "place";   // "place" or "connect"
let selectedNode = null;
let mapImage = null;

// Load uploaded image onto canvas
document.getElementById("mapUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    mapImage = new Image();
    mapImage.onload = () => {
      canvas.width = mapImage.width;
      canvas.height = mapImage.height;
      redraw();
    };
    mapImage.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

function toggleMode() {
  mode = mode === "place" ? "connect" : "place";
  selectedNode = null;
  document.getElementById("modeBtn").innerText = 
    mode === "place" ? "Mode: Place Node" : "Mode: Connect Nodes";
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (mode === "place") {
    const name = prompt("Name this location (e.g. Gate A, Restroom B):");
    if (!name) return;
    nodes.push({ name, x, y });
    redraw();
  } else {
    const clickedNode = findNodeNear(x, y);
    if (!clickedNode) return;

    if (!selectedNode) {
      selectedNode = clickedNode;
      document.getElementById("statusMsg").innerText = `Selected: ${clickedNode.name}. Click another node to connect.`;
    } else {
      if (selectedNode.name === clickedNode.name) return;
      const distance = Math.round(
        Math.hypot(clickedNode.x - selectedNode.x, clickedNode.y - selectedNode.y)
      );
      edges.push({ from: selectedNode.name, to: clickedNode.name, distance });
      document.getElementById("statusMsg").innerText = `Connected ${selectedNode.name} <-> ${clickedNode.name} (${distance}px)`;
      selectedNode = null;
      redraw();
    }
  }
});

function findNodeNear(x, y) {
  return nodes.find(n => Math.hypot(n.x - x, n.y - y) < 15);
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (mapImage) ctx.drawImage(mapImage, 0, 0);

  // draw edges first (so nodes appear on top)
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  edges.forEach(edge => {
    const fromNode = nodes.find(n => n.name === edge.from);
    const toNode = nodes.find(n => n.name === edge.to);
    if (!fromNode || !toNode) return;
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.stroke();
  });

  // draw nodes
  nodes.forEach(node => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillText(node.name, node.x + 10, node.y);
  });
}

function exportGraph() {
  const graph = {
    nodes: nodes.map(n => n.name),
    edges: edges,
  };
  document.getElementById("jsonOutput").value = JSON.stringify(graph, null, 2);
}

function clearGraph() {
  nodes = [];
  edges = [];
  selectedNode = null;
  redraw();
}

async function analyzeMap() {
  if (!mapImage) { alert("Upload a map image first."); return; }
  document.getElementById("statusMsg").innerText = "Analyzing map with AI...";

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = mapImage.width;
  tempCanvas.height = mapImage.height;
  tempCanvas.getContext("2d").drawImage(mapImage, 0, 0);
  const base64 = tempCanvas.toDataURL("image/png").split(",")[1];

  const response = await fetch('/api/map/analyze', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ imageBase64: base64, mimeType: "image/png" })
  });

  const data = await response.json();
  if (!data.labels) {
    document.getElementById("statusMsg").innerText = "AI analysis failed.";
    return;
  }

  nodes = data.labels.map(l => ({
    name: l.name,
    x: (l.xPercent / 100) * canvas.width,
    y: (l.yPercent / 100) * canvas.height,
  }));

  autoConnectNearestNeighbors();
  redraw();
  document.getElementById("statusMsg").innerText = `Found ${nodes.length} locations, auto-connected. Fix manually if needed.`;
}

function autoConnectNearestNeighbors(k =4) {
  edges = [];
  nodes.forEach(node => {
    const nearest = nodes
      .filter(n => n.name !== node.name)
      .map(n => ({ name: n.name, dist: Math.hypot(n.x - node.x, n.y - node.y) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, k);

    nearest.forEach(n => {
      const exists = edges.some(e => (e.from === node.name && e.to === n.name) || (e.from === n.name && e.to === node.name));
      if (!exists) edges.push({ from: node.name, to: n.name, distance: Math.round(n.dist) });
    });
  });
}

async function saveMap() {
  const name = document.getElementById("stadiumName").value;
  if (!name) { alert("Enter a stadium name first."); return; }

  const response = await fetch('/api/map/save', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name, nodes: nodes.map(n => n.name), edges })
  });

  const data = await response.json();
  document.getElementById("statusMsg").innerText = `Saved as "${name}" (id: ${data.id})`;
}