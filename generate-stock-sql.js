const XLSX = require('xlsx');
const fs = require('fs');
const wb = XLSX.readFile('C:\\Users\\DELL\\Desktop\\BM Iphone Store 2026-09-17\\Stock\\BM Iphone Store Stock.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
const rows = data.slice(1);
let sql = '-- ============================================\n-- BM Apple Iphone Store Stock V2 - Full Import\n-- Source: BM Iphone Store Stock.xlsx (BM Iphone Store 2026-09-17)\n-- Total items: ' + rows.length + '\n-- Run this in Supabase SQL Editor\n-- ============================================\n\nDELETE FROM public.stock;\n\n';
for (const r of rows) {
  const code = String(r[0]);
  const qty = r[1];
  const name = String(r[2]).replace(/'/g, "''");
  const category = String(r[3]).replace(/'/g, "''");
  const subCategory = String(r[4]).replace(/'/g, "''");
  const brand = String(r[5]).replace(/'/g, "''");
  const subBrand = String(r[6]).replace(/'/g, "''");
  const model = String(r[7]).replace(/'/g, "''");
  const unit = String(r[8]).replace(/'/g, "''");
  sql += "INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price) VALUES ('" + code + "', '" + name + "', '" + category + "', '" + subCategory + "', '" + brand + "', '" + subBrand + "', '" + model + "', '" + unit + "', " + qty + ", 0, 0) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price;\n";
}
fs.writeFileSync('C:\\Users\\DELL\\Desktop\\data-refresh-hub-main\\data-refresh-hub-main\\stock-v2-import.sql', sql);
console.log('Done! Total items: ' + rows.length);
