import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredPatternsByFile = {
  "src/app/globals.css": [
    "--control-height-md",
    "--font-fluid-title",
    ".ds-title-1",
    ".ds-text-body",
    ".ds-control",
    ".ds-badge",
  ],
  "src/app/[locale]/my/page.tsx": [
    "ds-title-1",
    "ds-text-body",
    "ds-control",
    "ds-chip",
  ],
  "src/features/bookings/views/BookingHistoryView.tsx": [
    "ds-control",
    "ds-text-body",
    "ds-badge",
  ],
  "src/app/[locale]/bookings/[id]/page.tsx": [
    "getOrFetchReschedSlots",
    "border-2 border-transparent",
    "ds-control",
  ],
};

const bannedPatternsByFile = {
  "src/app/[locale]/my/page.tsx": [
    /\bmin-h-\[\d+px\]/g,
    /\btext-sm\b/g,
  ],
  "src/features/bookings/views/BookingHistoryView.tsx": [
    /\bmin-h-\[\d+px\]/g,
    /\btext-sm\b/g,
  ],
};

async function readFileSafe(filePath) {
  try {
    return await fs.readFile(path.join(root, filePath), "utf8");
  } catch {
    return null;
  }
}

async function run() {
  const errors = [];

  for (const [filePath, patterns] of Object.entries(requiredPatternsByFile)) {
    const content = await readFileSafe(filePath);
    if (content === null) {
      errors.push(`Missing file: ${filePath}`);
      continue;
    }

    for (const pattern of patterns) {
      if (!content.includes(pattern)) {
        errors.push(`Missing required pattern "${pattern}" in ${filePath}`);
      }
    }
  }

  for (const [filePath, patterns] of Object.entries(bannedPatternsByFile)) {
    const content = await readFileSafe(filePath);
    if (content === null) continue;

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        errors.push(`Found banned pattern ${pattern} in ${filePath}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Design system enforcement failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Design system enforcement passed.");
}

run().catch((error) => {
  console.error("Failed to run design system enforcement:", error);
  process.exit(1);
});
