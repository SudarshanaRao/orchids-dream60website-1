import { readFileSync, readdirSync } from "fs";

const file = process.argv[2];
const start = parseInt(process.argv[3] || "0");
const lines = parseInt(process.argv[4] || "200");

if (file === "--list") {
  const dir = process.argv[3] || "src/components";
  console.log(readdirSync(dir).join("\n"));
} else {
  const content = readFileSync(file, "utf8");
  const allLines = content.split("\n");
  const slice = allLines.slice(start, start + lines);
  slice.forEach((line, i) => { console.log((start + i + 1) + ": " + line); });
  if (start === 0 && lines >= allLines.length) {
    // printed all
  } else {
    console.log("--- Total lines: " + allLines.length + " ---");
  }
}
