import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PublicationSchema } from "../src/index.js";

const fixtures = [
  "examples/editions-publication.json",
  "examples/mypets-guide.json",
];

for (const fixture of fixtures) {
  const raw = await readFile(resolve(fixture), "utf8");
  PublicationSchema.parse(JSON.parse(raw));
  console.log(`validated: ${fixture}`);
}
