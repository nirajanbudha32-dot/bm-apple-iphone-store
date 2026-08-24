const XLSX = require('xlsx');
const fs = require('fs');

const EXCEL_PATH = 'C:\\Users\\DELL\\Desktop\\BM\\BM Apple Iphone Store\\BM Apple Iphone Store Stock Management V1.xlsx';
const OUTPUT_PATH = 'stock-import.sql';

const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets['Sheet1'];
const data = XLSX.utils.sheet_to_json(ws);

console.log(`Read ${data.length} rows from Excel`);

const lines = ['DELETE FROM public.stock;'];

for (const row of data) {
  const code = String(row['Item Code']).replace(/'/g, "''");
  const name = String(row['Item Name']).replace(/'/g, "''");
  const category = String(row['Category']).replace(/'/g, "''");
  const sub_category = String(row['Sub-Category']).replace(/'/g, "''");
  const brand = String(row['Brand']).replace(/'/g, "''");
  const sub_brand = String(row['Sub-Brand']).replace(/'/g, "''");
  const model = String(row['Models']).replace(/'/g, "''");
  const unit = String(row['Unit']).replace(/'/g, "''");
  const qty = Number(row['Qty']) || 0;
  const purchase_price = 0;
  const selling_price = 0;

  const sql = `INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price) VALUES ('${code}', '${name}', '${category}', '${sub_category}', '${brand}', '${sub_brand}', '${model}', '${unit}', ${qty}, ${purchase_price}, ${selling_price}) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price;`;
  lines.push(sql);
}

fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf8');
console.log(`Wrote ${lines.length - 1} INSERT statements to ${OUTPUT_PATH}`);
