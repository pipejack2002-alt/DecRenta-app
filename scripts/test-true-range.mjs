import XLSX from "xlsx";
import fs from "fs";

const buf = fs.readFileSync("Exogena Andres Bernal.xlsx");
const wb = XLSX.read(buf, { type: "buffer" });
const sheet = wb.Sheets["Reporte"];

console.log("Original !ref:", sheet["!ref"]);

// Look at all cell keys in sheet
const keys = Object.keys(sheet).filter(k => !k.startsWith("!"));
console.log("Total cell keys present:", keys.length);

let maxR = 0, maxC = 0;
for (const k of keys) {
  const cell = XLSX.utils.decode_cell(k);
  if (cell.r > maxR) maxR = cell.r;
  if (cell.c > maxC) maxC = cell.c;
}
console.log(`Actual max row: ${maxR + 1}, actual max col: ${maxC + 1}`);

// Recalculate true range
const trueRef = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
console.log("Calculated true !ref:", trueRef);
sheet["!ref"] = trueRef;

const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log("Total rows decoded with trueRef:", rows.length);
for (let i = 13; i < rows.length; i++) {
  console.log(`[Fila ${i + 1}]:`, JSON.stringify(rows[i]));
}
