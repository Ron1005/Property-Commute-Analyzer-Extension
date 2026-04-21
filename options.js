document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("saveBtn").addEventListener("click", saveOptions);
document.getElementById("addPointBtn").addEventListener("click", () => addPointRow("", "", "transit", "fixed"));

function addPointRow(name, addressOrQuery, mode, type, sortBy) {
  const list = document.getElementById("pointsList");
  const row = document.createElement("div");
  row.className = "point-row";
  
  if (!mode) mode = "transit";
  if (!type) type = "fixed";
  if (!sortBy) sortBy = "rating";
  
  row.innerHTML = `
    <div class="point-header">
      <div class="point-header-title">Location Configuration</div>
      <button class="btn-remove">Remove</button>
    </div>
    <div class="point-grid">
      <div>
        <label>Search Type</label>
        <select class="type-input">
          <option value="fixed">📍 Fixed Address</option>
          <option value="dynamic">🔍 Find Best Nearby</option>
        </select>
      </div>
      <div>
        <label>Transport Mode</label>
        <select class="mode-input">
          <option value="transit">Transit</option>
          <option value="driving">Driving</option>
          <option value="walking">Walking</option>
          <option value="bicycling">Cycling</option>
        </select>
      </div>
      <div>
        <label>Label</label>
        <input type="text" class="name-input" placeholder="e.g. Work or Gym">
      </div>
      <div class="sort-by-container">
        <label>Sort Preference</label>
        <select class="sort-input">
          <option value="rating">⭐ Top Rated</option>
          <option value="distance">📍 Nearest</option>
        </select>
      </div>
      <div class="addr-container" style="grid-column: span 2;">
        <label class="addr-label">Destination Address</label>
        <input type="text" class="addr-query-input" placeholder="Full exact address">
      </div>
    </div>
  `;

  // Safe attribution
  row.querySelector(".type-input").value = type;
  row.querySelector(".mode-input").value = mode;
  row.querySelector(".name-input").value = name;
  row.querySelector(".sort-input").value = sortBy;
  row.querySelector(".addr-query-input").value = addressOrQuery;
  
  const sortByContainer = row.querySelector(".sort-by-container");
  sortByContainer.style.display = (type === 'dynamic' ? 'block' : 'none');
  
  const typeSelect = row.querySelector(".type-input");
  const addrQueryInput = row.querySelector(".addr-query-input");
  const addrLabel = row.querySelector(".addr-label");
  
  typeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'dynamic') {
      addrLabel.textContent = "Search Term";
      addrQueryInput.placeholder = "e.g. 'Gym' or 'Pizza'";
      sortByContainer.style.display = "block";
    } else {
      addrLabel.textContent = "Destination Address";
      addrQueryInput.placeholder = "Full exact address";
      sortByContainer.style.display = "none";
    }
  });
  
  row.querySelector(".btn-remove").addEventListener("click", () => row.remove());
  list.appendChild(row);
}

function saveOptions() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const statusEl = document.getElementById("status");
  if (!apiKey) {
    statusEl.textContent = "API Key is required.";
    statusEl.className = "status-error";
    return;
  }
  const rows = document.querySelectorAll(".point-row");
  const points = [];
  rows.forEach(row => {
    const type = row.querySelector(".type-input").value;
    const name = row.querySelector(".name-input").value.trim();
    const mode = row.querySelector(".mode-input").value;
    const sortBy = row.querySelector(".sort-input").value;
    const addressOrQuery = row.querySelector(".addr-query-input").value.trim();
    if (name && addressOrQuery) points.push({ name, type, mode, addressOrQuery, sortBy });
  });
  chrome.storage.sync.set({ apiKey, points }, () => {
    statusEl.textContent = "✓ Settings saved!";
    statusEl.className = "status-success";
    setTimeout(() => { statusEl.textContent = ""; statusEl.className = ""; }, 3000);
  });
}

function restoreOptions() {
  chrome.storage.sync.get({ apiKey: "", points: [] }, (items) => {
    document.getElementById("apiKey").value = items.apiKey;
    if (items.points.length === 0) {
      addPointRow("", "", "transit", "fixed", "rating");
    } else {
      items.points.forEach(p => addPointRow(p.name, p.addressOrQuery || p.address, p.mode, p.type, p.sortBy));
    }
  });
}
