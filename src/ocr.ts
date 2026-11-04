import { createWorker } from "tesseract.js";
import { id, emptySet, type Workout } from "./data";
export function parseOCR(text: string): {
  workout: Workout;
  warnings: string[];
} {
  const w: Workout = {
    id: id(),
    name: "Importiertes Workout",
    date: "",
    started: null,
    duration: null,
    status: "completed",
    exercises: [],
  };
  const warnings = [
    "Alle erkannten Werte prüfen. Satzstatus ist zunächst offen.",
  ];
  const date = text.match(/(\d{2})[.\/](\d{2})[.\/](\d{4})/);
  if (date) w.date = `${date[3]}-${date[2]}-${date[1]}`;
  for (const line of text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)) {
    const m = line.match(
      /(?:(\d+)\s+)?(\d+(?:[.,]\d+)?)\s*(kg|lbs?)?\s*(?:x|×|\s)\s*(\d+)\s*(?:reps|wdh\.?)?$/i,
    );
    if (m && w.exercises.length) {
      let weight = Number(m[2].replace(",", "."));
      if (m[3]?.toLowerCase().startsWith("lb")) {
        weight = Math.round(weight * 0.45359237 * 100) / 100;
        warnings.push("lbs wurden in kg umgerechnet.");
      }
      w.exercises
        .at(-1)!
        .sets.push({ ...emptySet(), weight, reps: Number(m[4]) });
    } else if (/[a-zäöü]{3}/i.test(line) && !date?.[0].includes(line)) {
      w.exercises.push({ id: id(), exerciseId: "", name: line, sets: [] });
    }
  }
  if (!w.date) warnings.push("Trainingsdatum fehlt: bitte auswählen.");
  warnings.push(
    "Mehrere Screenshots können Überschneidungen enthalten; doppelte Sätze manuell entfernen.",
  );
  return { workout: w, warnings };
}
export async function recognize(files: File[], progress: (s: string) => void) {
  const worker = await createWorker("deu+eng", 1, {
    logger: (m) =>
      progress(`${m.status} ${Math.round((m.progress ?? 0) * 100)} %`),
  });
  try {
    let text = "";
    for (const file of files) {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 15 * 1024 * 1024
      )
        throw Error(
          "PNG, JPEG oder WebP bis 15 MB verwenden. HEIC bitte als JPEG exportieren.",
        );
      const bitmap = await createImageBitmap(file);
      const c = document.createElement("canvas");
      const scale = Math.min(1, 2400 / bitmap.width);
      c.width = bitmap.width * scale;
      c.height = bitmap.height * scale;
      const ctx = c.getContext("2d")!;
      ctx.filter = "grayscale(1) contrast(1.2)";
      ctx.drawImage(bitmap, 0, 0, c.width, c.height);
      bitmap.close();
      text += "\n" + (await worker.recognize(c)).data.text;
    }
    return parseOCR(text);
  } finally {
    await worker.terminate();
  }
}
