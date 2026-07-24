export async function listReference(db, table) {
  const allowed = new Set(["especes", "espaces", "comportements"]);
  if (!allowed.has(table)) throw new Error("Table non autorisée.");
  return (await db.prepare(`SELECT id, nom FROM ${table} ORDER BY nom COLLATE NOCASE`).all()).results;
}

export async function listObservations(db) {
  const query = `
    SELECT
      o.id, o.espece_id, o.espace_id, o.comportement_id,
      o.date_observation, o.heure_observation, o.latitude, o.longitude,
      o.sexe, o.age, o.nombre, o.commentaire, o.photo, o.date_creation,
      e.nom AS espece, es.nom AS espace, c.nom AS comportement
    FROM observations o
    INNER JOIN especes e ON e.id = o.espece_id
    INNER JOIN espaces es ON es.id = o.espace_id
    INNER JOIN comportements c ON c.id = o.comportement_id
    ORDER BY o.date_observation DESC, o.heure_observation DESC, o.id DESC
  `;
  return (await db.prepare(query).all()).results;
}

export async function insertObservation(db, item) {
  const references = await db.batch([
    db.prepare("SELECT id FROM especes WHERE id = ?").bind(item.espece_id),
    db.prepare("SELECT id FROM espaces WHERE id = ?").bind(item.espace_id),
    db.prepare("SELECT id FROM comportements WHERE id = ?").bind(item.comportement_id),
  ]);
  if (references.some((result) => !result.results.length)) throw new Error("Une valeur de référence n’existe pas.");

  const result = await db.prepare(`
    INSERT INTO observations (
      espece_id, espace_id, comportement_id, date_observation, heure_observation,
      latitude, longitude, sexe, age, nombre, commentaire, date_creation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    item.espece_id, item.espace_id, item.comportement_id,
    item.date_observation, item.heure_observation, item.latitude, item.longitude,
    item.sexe, item.age, item.nombre, item.commentaire,
  ).run();
  return result.meta.last_row_id;
}
