import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ContentManifestSchema, ProgramSchema, PublicationSchema } from "../src/index.js";

for (const fixture of [
  "examples/editions-publication.json", "examples/mypets-guide.json",
  "examples/article.json", "examples/guide.json",
]) {
  PublicationSchema.parse(JSON.parse(await readFile(resolve(fixture), "utf8")));
  console.log("validated: " + fixture);
}
ProgramSchema.parse(JSON.parse(await readFile("examples/journey-seven-days.json", "utf8")));
console.log("validated: examples/journey-seven-days.json");
ContentManifestSchema.parse(JSON.parse(await readFile("examples/content-manifest.json", "utf8")));
console.log("validated: examples/content-manifest.json (including cross-references)");
