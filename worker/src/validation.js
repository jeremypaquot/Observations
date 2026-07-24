const SEXES = new Set(["Mâle", "Femelle", "Indéterminé"]);
const AGES = new Set(["Adulte", "Subadulte", "Juvénile", "Jeune", "Indéterminé"]);

function positiveInteger(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${field} est invalide.`);
  return parsed;
}

export function validateObservation(input) {
  if (!input || typeof input !== "object") throw new Error("Données invalides.");
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  const date = String(input.date_observation || "");
  const time = String(input.heure_observation || "");
  const commentaire = String(input.commentaire || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("La date est invalide.");
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) throw new Error("L’heure est invalide.");
  if (!SEXES.has(input.sexe)) throw new Error("Le sexe est invalide.");
  if (!AGES.has(input.age)) throw new Error("L’âge est invalide.");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("La latitude est invalide.");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("La longitude est invalide.");
  if (commentaire.length > 2000) throw new Error("Le commentaire est trop long.");

  return {
    espece_id: positiveInteger(input.espece_id, "L’espèce"),
    espace_id: positiveInteger(input.espace_id, "L’espace"),
    comportement_id: positiveInteger(input.comportement_id, "Le comportement"),
    date_observation: date,
    heure_observation: time,
    latitude,
    longitude,
    sexe: input.sexe,
    age: input.age,
    nombre: positiveInteger(input.nombre, "Le nombre"),
    commentaire,
  };
}
