import fs from "node:fs";
import path from "node:path";

const PUZZLES_PATH = path.join(process.cwd(), "data", "puzzles.json");

function isISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function normLabel(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

function validatePuzzle(p) {
  const errors = [];

  if (typeof p.id !== "number" || !Number.isFinite(p.id))
    errors.push("id must be a number");
  if (!isISODate(p.dateISO)) errors.push("dateISO must be YYYY-MM-DD");

  if (!Array.isArray(p.options)) errors.push("options must be an array");
  else {
    if (p.options.length < 9 || p.options.length > 16) {
      errors.push(`options must be 9–16 items (got ${p.options.length})`);
    }

    const ids = new Set();
    const labels = new Set();

    for (const o of p.options) {
      if (!o || typeof o !== "object") {
        errors.push("option must be an object");
        continue;
      }
      if (typeof o.id !== "string" || !o.id.trim())
        errors.push("option.id must be a non-empty string");
      if (typeof o.label !== "string" || !o.label.trim())
        errors.push("option.label must be a non-empty string");

      const id = String(o.id ?? "").trim();
      const label = normLabel(o.label);

      if (id) {
        if (ids.has(id)) errors.push(`duplicate option.id "${id}"`);
        ids.add(id);
      }
      if (label) {
        if (labels.has(label))
          errors.push(`duplicate option.label "${o.label}" (case-insensitive)`);
        labels.add(label);
      }
    }

    if (typeof p.answerOptionId !== "string" || !p.answerOptionId.trim()) {
      errors.push("answerOptionId must be a non-empty string");
    } else {
      const answerExists = p.options.some(
        (o) => String(o.id).trim() === String(p.answerOptionId).trim()
      );
      if (!answerExists)
        errors.push(
          `answerOptionId "${p.answerOptionId}" not found in options`
        );
    }
  }

  if (!Array.isArray(p.clues)) errors.push("clues must be an array");
  else {
    if (p.clues.length < 3 || p.clues.length > 5)
      errors.push(`clues must be 3–5 (got ${p.clues.length})`);
    for (let i = 0; i < p.clues.length; i++) {
      const c = p.clues[i];
      if (typeof c !== "string" || !c.trim())
        errors.push(`clue ${i + 1} must be a non-empty string`);
    }
  }

  if (typeof p.explanation !== "string" || !p.explanation.trim())
    errors.push("explanation must be a non-empty string");

  return errors;
}

function main() {
  if (!fs.existsSync(PUZZLES_PATH)) {
    console.error(`❌ Missing ${PUZZLES_PATH}`);
    process.exit(1);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(PUZZLES_PATH, "utf8"));
  } catch (e) {
    console.error("❌ puzzles.json is not valid JSON");
    console.error(String(e));
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error("❌ puzzles.json must be a JSON array");
    process.exit(1);
  }

  const allErrors = [];
  const dateSet = new Set();
  const idSet = new Set();

  raw.forEach((p, idx) => {
    const label = `#${p?.id ?? "?"} (${
      p?.dateISO ?? "no-date"
    }) [index ${idx}]`;
    const errs = validatePuzzle(p);

    // uniqueness checks
    if (p?.dateISO) {
      if (dateSet.has(p.dateISO)) errs.push(`duplicate dateISO "${p.dateISO}"`);
      dateSet.add(p.dateISO);
    }
    if (typeof p?.id === "number") {
      if (idSet.has(p.id)) errs.push(`duplicate id "${p.id}"`);
      idSet.add(p.id);
    }

    if (errs.length) allErrors.push({ label, errs });
  });

  if (allErrors.length) {
    console.error(
      `\n❌ Puzzle validation failed (${allErrors.length} puzzle(s) have issues)\n`
    );
    for (const e of allErrors) {
      console.error(`- ${e.label}`);
      for (const msg of e.errs) console.error(`   • ${msg}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(`✅ Puzzle validation passed (${raw.length} puzzle(s))`);
}

main();
