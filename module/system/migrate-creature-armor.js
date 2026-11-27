/**
 * One-off fix for creatures whose armor was entered as a stat-block penalty ("-d4", "–"), which rolls
 * negative and adds damage. Only creatures we shipped (or the pirate generator made) are touched, and
 * only while their armor is still the original wrong value, so deliberate custom armor is left alone.
 * See issue #258.
 */

// Creature id → [old formula, fixed formula], from Pirate Borg Premium, Down Among the Dead and Limithron adventures
const KNOWN_CREATURES = {
  // Pirate Borg Premium
  wt6XrxYFPNqSGChR: ["-d2", "1d2"], // Captain Davies
  mogXphsW1Ubhb5bu: ["-d4", "1d4"], // Claude Barlette
  gbe95yQVFESVKHEk: ["-d6", "1d6"], // Pedro De Balboa
  "9Y7YzSoTZ06K7XLq": ["-d2", "1d2"], // Tela Fafane
  kd7HTQDCGPNdl95u: ["-d6", "1d6"], // The Baron
  MOOF4NX7BSj3YRg8: ["-d2", "1d2"], // Xoth, Imp From the Dark Shore
  rHFOLCLa1ifuTt0X: ["–", "0"], // Hive Vines
  // Down Among the Dead
  SZRWTUJy65QIvqjP: ["-d6", "1d6"], // Albrecht the Tideborn
  C642iNVyY33UZAvf: ["-", "0"], // ASH Golem
  LsAotnK9u07hGljn: ["-d6", "1d6"], // Impish Gargoyles
  "1m2pwfz7BZ3QvwNe": ["-d2", "1d2"], // Mina, Weaver of Doom
  I8yxTbk9NkFeAiLL: ["-d2", "1d2"], // Sir Benjamin Murray
  FPDboeLqgr6oboDk: ["-d6", "1d6"], // Father Haydock
  HJSGSICu72Y2oYju: ["-d2", "1d2"], // O'Malley
  MkY6T1D5rX7blXGx: ["-d4", "1d4"], // "The Red Angel"
  "9z9e5BqZZxgydCBJ": ["-d6", "1d6"], // Bartholomew
  cy58hUlNQIXlBZYq: ["-d6", "1d6"], // Codrina
  DOmvXWM99p8JgmiD: ["-d6", "1d6"], // Euphemia
  BrMm7K6xBdFtl8CP: ["-d6", "1d6"], // Jean-Henri
  "6Vs0bQLj9DMtwVJu": ["-d6", "1d6"], // Mr. Eastley
  IJQu95C5YRhHKoGB: ["-d6", "1d6"], // Pelagic Vampyre
  qT3g80LbTG92VeJ4: ["-d6", "1d6"], // Plok
  "9QsPaeatx1Yzv4ya": ["-d6", "1d6"], // Thekla
  zO3C1npdHeoo2t2G: ["-d6", "1d6"], // Von Buren
  L1B3X5d3DklBga4V: ["-d2", "1d2"], // F'Kla'Grotu
  rlNpMF8BMjVOnMdt: ["-d6", "1d6"], // Fort Commander
  hZCeG7GW4kgBROla: ["-d6", "1d6"], // Fort Troop
  pMi1UBKTUywgNXVG: ["-d4", "1d4"], // Reef Ghoul (also in Lost to the Locker)
  // Buried in the Bahamas
  wDvkfZygK3Mx4J0I: ["-d2", "1d2"], // Shadow Starfish
  // Cavern of Cursed Tears
  CYDkxMhh0TD5j1Cv: ["-d2", "1d2"], // Captain Silverkey
  "02IqspUxQhXo4vmG": ["-d4", "1d4"], // Sir Edmund Barrington
  n4izq7KbXRoigJCk: ["-d6", "1d6"], // Spirit Skull
  // The Gold Bug
  FXKcqEooqF4SfmHY: ["-d2", "1d2"], // Pirate Lord Wight
  // Trapped in the Tropics
  FjuhKExfRHVqXeR0: ["-d4", "1d4"], // Antediluvian Crustacean
  "0D5meNuRSDHMABN1": ["-d4", "1d4"], // Ephyra
  RAG7wYrqit9UXIzG: ["-d4", "1d4"], // Ephyra (Orb Form)
  Yg5DxmSh3FUnepF9: ["-d4", "1d4"], // Merfolk Ghost
  B2tULygaKjBybzTM: ["-d2", "1d2"], // Redcoat Officer
  vNXWlcFsARWLkkL9: ["-d2", "1d2"], // Tube Worm
  gHl83d9zWh0umLwG: ["-d6", "1d6"], // Beltran de Ordaz
  ukDw6xg9140lxdJE: ["-d2", "1d2"], // Pire
  "7ZrdzQURCs4y3gkY": ["-d2", "1d2"], // Paul Exton
};

// Armor written by the Premium pirate generator: armor description → [old formula, fixed formula, fixed description]
const GENERATED_PIRATE_ARMOR = {
  "Leather armor": ["-d2", "1d2", "Leather armor"],
  "Chain shit": ["-d4", "1d4", "Chain shirt"],
};

/**
 * The id at the end of a document UUID, e.g. "Compendium.x.y.Actor.abc" → "abc".
 * @param {String} [uuid]
 * @returns {String|undefined}
 */
const lastId = (uuid) => uuid?.split(".").pop();

/**
 * Work out the armor fix for one actor.
 * @param {Object} actor  An Actor, or its data: type, _id/id, _stats, flags and system
 * @returns {Object|null}  Update data, or null when the actor should be left alone
 */
export const creatureArmorUpdate = (actor) => {
  if (actor.type !== "creature") return null;
  const armor = actor.system?.attributes?.armor ?? {};
  const formula = String(armor.formula ?? "").trim();

  // Shipped creatures: adventure imports keep the id and compendium imports record where they came from
  const sourceIds = [actor.id ?? actor._id, lastId(actor._stats?.compendiumSource), lastId(actor.flags?.core?.sourceId)];
  for (const id of sourceIds) {
    const known = id && KNOWN_CREATURES[id];
    if (known && formula === known[0]) return { "system.attributes.armor.formula": known[1] };
  }

  // Generated pirates: recognised by the generator's description layout and its exact armor
  const generated = GENERATED_PIRATE_ARMOR[armor.description];
  if (generated && formula === generated[0] && actor.system?.description?.includes("<strong>Nickname:</strong>")) {
    return { "system.attributes.armor.formula": generated[1], "system.attributes.armor.description": generated[2] };
  }

  return null;
};

/**
 * Fix armor on world creatures and on unlinked tokens whose own data overrides it.
 */
export const migrateCreatureArmor = async () => {
  let fixed = 0;
  const fix = async (actor, label) => {
    const update = creatureArmorUpdate(actor);
    if (!update) return;
    try {
      await actor.update(update);
      fixed++;
      console.log(`Pirate Borg | Fixed armor for ${label}`, update);
    } catch (err) {
      console.error(`Pirate Borg | Failed to fix armor for ${label}`, err);
    }
  };

  for (const actor of game.actors) await fix(actor, `Actor ${actor.name}`);
  // Unlinked tokens follow their base actor, unless their own data overrides the armor
  for (const scene of game.scenes) {
    for (const token of scene.tokens) {
      if (!token.actorLink && token.actor) await fix(token.actor, `Token ${token.name} in ${scene.name}`);
    }
  }

  if (fixed) ui.notifications.info(game.i18n.format("PB.MigrationCreatureArmor", { count: fixed }), { permanent: true });
};
