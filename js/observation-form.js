import { api } from "./api.js";
import { initLocationMap, resetLocation, setLocation } from "./map.js";

const form = document.querySelector("#observation-form");
const message = document.querySelector("#form-message");

function fillSelect(name, items) {
  const select = form.elements[name];
  select.replaceChildren(new Option("Sélectionner…", ""));
  for (const item of items) select.add(new Option(item.nom, item.id));
}

function setCoordinates(latitude, longitude) {
  form.elements.latitude.value = latitude.toFixed(6);
  form.elements.longitude.value = longitude.toFixed(6);
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error-message", isError);
  message.classList.toggle("success-message", !isError);
  message.hidden = false;
}

export async function initializeObservationForm() {
  const now = new Date();
  form.elements.date_observation.value ||= now.toISOString().slice(0, 10);
  form.elements.heure_observation.value ||= now.toTimeString().slice(0, 5);
  initLocationMap(setCoordinates);
  const [especes, espaces, comportements] = await Promise.all([
    api("/especes"), api("/espaces"), api("/comportements"),
  ]);
  fillSelect("espece_id", especes);
  fillSelect("espace_id", espaces);
  fillSelect("comportement_id", comportements);
}

document.querySelector('[data-action="geolocate"]').addEventListener("click", () => {
  if (!navigator.geolocation) return showMessage("La géolocalisation n’est pas disponible.", true);
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => setLocation(coords.latitude, coords.longitude, setCoordinates),
    () => showMessage("Impossible d’obtenir votre position.", true),
    { enableHighAccuracy: true, timeout: 10000 },
  );
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.hidden = true;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const payload = Object.fromEntries(new FormData(form));
    payload.espece_id = Number(payload.espece_id);
    payload.espace_id = Number(payload.espace_id);
    payload.comportement_id = Number(payload.comportement_id);
    payload.nombre = Number(payload.nombre);
    payload.latitude = Number(payload.latitude);
    payload.longitude = Number(payload.longitude);
    await api("/observations", { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    const now = new Date();
    form.elements.date_observation.value = now.toISOString().slice(0, 10);
    form.elements.heure_observation.value = now.toTimeString().slice(0, 5);
    form.elements.nombre.value = 1;
    resetLocation();
    showMessage("Observation enregistrée.");
    document.dispatchEvent(new CustomEvent("observation:created"));
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    submit.disabled = false;
  }
});
