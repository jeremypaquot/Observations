let observationsMap;
let markersLayer;
let locationMap;
let locationMarker;

const FRANCE_CENTER = [46.6, 2.5];
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_OPTIONS = { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

export function initObservationsMap() {
  if (observationsMap) return;
  observationsMap = L.map("observations-map").setView(FRANCE_CENTER, 6);
  L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(observationsMap);
  markersLayer = L.featureGroup().addTo(observationsMap);
}

export function renderObservations(observations) {
  initObservationsMap();
  markersLayer.clearLayers();
  for (const item of observations) {
    if (!Number.isFinite(Number(item.latitude)) || !Number.isFinite(Number(item.longitude))) continue;
    const marker = L.marker([item.latitude, item.longitude]);
    marker.bindPopup(`
      <article class="observation-popup">
        <h2>${escapeHtml(item.espece)}</h2>
        <dl>
          <div><dt>Date</dt><dd>${escapeHtml(item.date_observation)}</dd></div>
          <div><dt>Heure</dt><dd>${escapeHtml(item.heure_observation || "—")}</dd></div>
          <div><dt>Sexe</dt><dd>${escapeHtml(item.sexe || "—")}</dd></div>
          <div><dt>Âge</dt><dd>${escapeHtml(item.age || "—")}</dd></div>
          <div><dt>Nombre</dt><dd>${escapeHtml(item.nombre ?? 1)}</dd></div>
          <div><dt>Comportement</dt><dd>${escapeHtml(item.comportement || "—")}</dd></div>
        </dl>
        ${item.commentaire ? `<p>${escapeHtml(item.commentaire)}</p>` : ""}
      </article>`);
    marker.addTo(markersLayer);
  }
  if (markersLayer.getLayers().length) observationsMap.fitBounds(markersLayer.getBounds().pad(0.15), { maxZoom: 15 });
  window.setTimeout(() => observationsMap.invalidateSize(), 0);
}

export function initLocationMap(onSelect) {
  if (!locationMap) {
    locationMap = L.map("location-map").setView(FRANCE_CENTER, 6);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(locationMap);
    locationMap.on("click", ({ latlng }) => setLocation(latlng.lat, latlng.lng, onSelect));
  }
  window.setTimeout(() => locationMap.invalidateSize(), 0);
}

export function setLocation(latitude, longitude, onSelect) {
  const position = [latitude, longitude];
  if (!locationMarker) locationMarker = L.marker(position).addTo(locationMap);
  else locationMarker.setLatLng(position);
  locationMap.setView(position, Math.max(locationMap.getZoom(), 14));
  onSelect(latitude, longitude);
}

export function resetLocation() {
  if (locationMarker) {
    locationMarker.remove();
    locationMarker = null;
  }
}
