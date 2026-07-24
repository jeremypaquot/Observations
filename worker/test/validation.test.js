import test from "node:test";
import assert from "node:assert/strict";
import { validateObservation } from "../src/validation.js";

const valid = {
  espece_id: 1, espace_id: 1, comportement_id: 1,
  date_observation: "2026-07-24", heure_observation: "10:30",
  latitude: 48.8, longitude: 2.3, sexe: "Indéterminé",
  age: "Adulte", nombre: 1, commentaire: "Test",
};

test("accepte une observation valide", () => {
  assert.equal(validateObservation(valid).nombre, 1);
});

test("refuse des coordonnées invalides", () => {
  assert.throws(() => validateObservation({ ...valid, latitude: 120 }), /latitude/);
});

test("refuse une valeur de liste arbitraire", () => {
  assert.throws(() => validateObservation({ ...valid, sexe: "inconnu" }), /sexe/);
});
