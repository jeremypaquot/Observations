import { api, ApiError } from "./api.js";
import { initObservationsMap, renderObservations } from "./map.js";
import { initializeObservationForm } from "./observation-form.js";

const loginView = document.querySelector("#login-view");
const appView = document.querySelector("#app-view");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const views = [...document.querySelectorAll(".view")];
const links = [...document.querySelectorAll(".nav-link")];
const count = document.querySelector("#observation-count");
const mapMessage = document.querySelector("#map-message");
let formInitialized = false;

function setAuthenticated(authenticated) {
  loginView.hidden = authenticated;
  appView.hidden = !authenticated;
  if (authenticated) navigate();
}

async function loadObservations() {
  mapMessage.hidden = true;
  try {
    const observations = await api("/observations");
    renderObservations(observations);
    count.textContent = `${observations.length} observation${observations.length > 1 ? "s" : ""}`;
  } catch (error) {
    mapMessage.textContent = error.message;
    mapMessage.classList.add("error-message");
    mapMessage.hidden = false;
    if (error instanceof ApiError && error.status === 401) setAuthenticated(false);
  }
}

async function navigate() {
  const requested = location.hash.slice(1) || "carte";
  const id = views.some((view) => view.id === requested) ? requested : "carte";
  views.forEach((view) => { view.hidden = view.id !== id; });
  links.forEach((link) => {
    const active = link.hash === `#${id}`;
    link.classList.toggle("is-active", active);
    active ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
  });
  if (id === "carte") {
    initObservationsMap();
    await loadObservations();
  } else if (!formInitialized) {
    try {
      await initializeObservationForm();
      formInitialized = true;
    } catch (error) {
      document.querySelector("#form-message").textContent = error.message;
      document.querySelector("#form-message").hidden = false;
    }
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button");
  button.disabled = true;
  loginError.hidden = true;
  try {
    await api("/login", { method: "POST", body: JSON.stringify({ password: loginForm.elements.password.value }) });
    loginForm.reset();
    setAuthenticated(true);
  } catch (error) {
    loginError.textContent = error.message;
    loginError.hidden = false;
  } finally {
    button.disabled = false;
  }
});

document.querySelector('[data-action="logout"]').addEventListener("click", async () => {
  try { await api("/logout", { method: "POST" }); } finally { setAuthenticated(false); }
});

window.addEventListener("hashchange", navigate);
document.addEventListener("observation:created", loadObservations);

try {
  await api("/session");
  setAuthenticated(true);
} catch {
  setAuthenticated(false);
}
