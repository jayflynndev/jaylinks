import fs from "node:fs";
import path from "node:path";

const PUZZLES_PATH = path.join(process.cwd(), "data", "puzzles.json");

function isISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parseISODate(iso) {
  // Treat as UTC midnight for safe day iteration
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISODate(dt) {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dt, days) {
  const next = new Date(dt);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function makePlaceholderPuzzle(id, dateISO) {
  const optionIds = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
  ];
  return {
    id,
    dateISO,
    options: optionIds.map((oid) => ({
      id: oid,
      label: `Option ${oid.toUpperCase()}`,
    })),
    answerOptionId: "a",
    clues: [
      `(${dateISO}) Placeholder clue 1 (replace).`,
      `(${dateISO}) Placeholder clue 2 (replace).`,
      `(${dateISO}) Placeholder clue 3 (replace).`,
      `(${dateISO}) Placeholder clue 4 (replace).`,
      `(${dateISO}) Placeholder clue 5 (replace).`,
    ],
    explanation: `(${dateISO}) Placeholder explanation (replace).`,
  };
}

function main() {
  const [startISO, endISO] = process.argv.slice(2);

  if (!isISODate(startISO) || !isISODate(endISO)) {
    console.error(
      "Usage: node scripts/add-placeholders.mjs YYYY-MM-DD YYYY-MM-DD"
    );
    process.exit(1);
  }

  if (!fs.existsSync(PUZZLES_PATH)) {
    console.error(`❌ Missing ${PUZZLES_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(PUZZLES_PATH, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("❌ data/puzzles.json must be a JSON array");
    process.exit(1);
  }

  const existingByDate = new Set(raw.map((p) => p?.dateISO).filter(Boolean));
  const maxId = raw.reduce(
    (acc, p) => (typeof p?.id === "number" ? Math.max(acc, p.id) : acc),
    0
  );

  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (start.getTime() > end.getTime()) {
    console.error("❌ Start date must be <= end date");
    process.exit(1);
  }

  let nextId = maxId + 1;
  const added = [];

  for (let dt = start; dt.getTime() <= end.getTime(); dt = addDays(dt, 1)) {
    const dateISO = toISODate(dt);
    if (existingByDate.has(dateISO)) continue;

    const puzzle = makePlaceholderPuzzle(nextId++, dateISO);
    raw.push(puzzle);
    existingByDate.add(dateISO);
    added.push(dateISO);
  }

  // Keep file tidy: sort by dateISO ascending
  raw.sort((a, b) =>
    a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0
  );

  fs.writeFileSync(PUZZLES_PATH, JSON.stringify(raw, null, 2) + "\n", "utf8");

  console.log(`✅ Added ${added.length} placeholder puzzle(s).`);
  if (added.length) {
    console.log(`First: ${added[0]}  Last: ${added[added.length - 1]}`);
    console.log(`Next id will be: ${nextId}`);
  } else {
    console.log("Nothing to add (all dates already exist).");
  }
}

main();
