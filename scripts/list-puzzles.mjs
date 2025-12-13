import fs from "node:fs";
import path from "node:path";

const PUZZLES_PATH = path.join(process.cwd(), "data", "puzzles.json");

function main() {
  if (!fs.existsSync(PUZZLES_PATH)) {
    console.error(`❌ Missing ${PUZZLES_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(PUZZLES_PATH, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("❌ data/puzzles.json must be a JSON array");
    process.exit(1);
  }

  // Heuristic: placeholder puzzles created by our script contain these patterns.
  const isPlaceholder = (p) => {
    const exp = typeof p?.explanation === "string" ? p.explanation : "";
    const clues = Array.isArray(p?.clues) ? p.clues : [];
    const optLabels = Array.isArray(p?.options)
      ? p.options.map((o) => o?.label)
      : [];

    const clueHasPlaceholder = clues.some(
      (c) => typeof c === "string" && c.includes("Placeholder clue")
    );
    const expHasPlaceholder = exp.includes("Placeholder explanation");
    const optionsLookDefault = optLabels.every(
      (l) => typeof l === "string" && /^Option [A-L]$/.test(l.trim())
    );

    return Boolean(
      clueHasPlaceholder || expHasPlaceholder || optionsLookDefault
    );
  };

  // Sort by date for readability
  raw.sort((a, b) =>
    a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0
  );

  const total = raw.length;
  const placeholders = raw.filter(isPlaceholder);
  const real = total - placeholders.length;

  console.log(`\nPuzzles: ${total}`);
  console.log(`Real:    ${real}`);
  console.log(`Todo:    ${placeholders.length}\n`);

  if (!placeholders.length) {
    console.log("✅ No placeholders found.");
    return;
  }

  console.log("Placeholder dates:");
  for (const p of placeholders) {
    console.log(`- ${p.dateISO}  (#${p.id})`);
  }
  console.log("");
}

main();
