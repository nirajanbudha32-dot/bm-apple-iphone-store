const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('C:\\Users\\DELL\\Desktop\\BM\\BM Apple Iphone Store\\BM Apple Iphone Store Stock Management V1.xlsx');
const ws = wb.Sheets['Sheet1'];
const data = XLSX.utils.sheet_to_json(ws);

function esc(val) {
  return String(val || '').trim().replace(/'/g, "''");
}

let sql = `-- ============================================\n`;
sql += `-- BM Apple Iphone Store - Full Stock Import\n`;
sql += `-- Generated from Excel: BM Apple Iphone Store Stock Management V1.xlsx\n`;
sql += `-- Total items: ${data.length}\n`;
sql += `-- Run this in Supabase SQL Editor\n`;
sql += `-- ============================================\n\n`;

sql += `DELETE FROM public.stock;\n\n`;

for (const row of data) {
  const code = String(row['Item Code']);
  const name = esc(row['Item Name']);
  const category = esc(row['Category'] || 'Accessory');
  const subCategory = esc(row['Sub-Category'] || '');
  const brand = esc(row['Brand'] || '');
  const subBrand = esc(row['Sub-Brand'] || '');
  const model = esc(row['Models'] || '');
  const unit = 'PCS';
  const qty = parseInt(row['Qty']) || 0;

  sql += `INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price) VALUES ('${code}', '${name}', '${category}', '${subCategory}', '${brand}', '${subBrand}', '${model}', '${unit}', ${qty}, 0, 0) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price;\n`;
}

fs.writeFileSync('stock-import.sql', sql);
console.log(`Generated stock-import.sql with ${data.length} items`);
