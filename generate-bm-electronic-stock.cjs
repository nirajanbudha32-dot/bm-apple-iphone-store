const XLSX = require('xlsx');
const fs = require('fs');

const STORE_ID = 'a0000000-0000-0000-0000-000000000003'; // BM Electronic
const STORE_NAME = 'BM Electronic';
const LOT_PREFIX = 'ELC';
const wb = XLSX.readFile('C:\\Users\\DELL\\Desktop\\stock\\BM Electronics Stock.xlsx');
const ws = wb.Sheets['Sheet1'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Skip header row
const rows = data.slice(1).filter(r => r[1] && r[2]); // must have code and name

function esc(val) {
  return String(val || '').trim().replace(/'/g, "''");
}

let sql = `-- ============================================\n`;
sql += `-- BM Electronics Stock - Full Import\n`;
sql += `-- Source: BM Electronics Stock.xlsx\n`;
sql += `-- Total items: ${rows.length}\n`;
sql += `-- Store: BM Electronic (${STORE_ID})\n`;
sql += `-- Run this in Supabase SQL Editor\n`;
sql += `-- ============================================\n\n`;

sql += `-- 1. Clear old stock for BM Electronic only\n`;
sql += `DELETE FROM public.stock WHERE store_id = '${STORE_ID}';\n`;
sql += `DELETE FROM public.stock_lots WHERE store_id = '${STORE_ID}';\n\n`;

sql += `-- 2. Insert stock items\n`;

for (const row of rows) {
  const code = String(row[1]);         // Item Code
  const name = esc(row[2]);            // Item Name
  const category = esc(row[3]);        // Category
  const subCategory = esc(row[4]);     // Sub-Category
  const brand = esc(row[5]);           // Brand
  const subBrand = esc(row[6]);        // Sub-Brand
  const model = esc(row[7]);           // Models
  const unit = esc(row[8]) || 'Pcs';   // Unit
  const qty = parseInt(row[9]) || 0;   // Qty

  sql += `INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id, updated_at) VALUES ('${code}', '${name}', '${category}', '${subCategory}', '${brand}', '${subBrand}', '${model}', '${unit}', ${qty}, 0, 0, '${STORE_ID}', now()) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id, updated_at=EXCLUDED.updated_at;\n`;
}

sql += `\n-- 3. Insert stock lots (one lot per item for FIFO sales)\n`;
sql += `-- Reset lot sequence first\n`;
sql += `SELECT setval('public.lot_no_seq', (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots));\n\n`;

for (const row of rows) {
  const code = String(row[1]);
  const name = esc(row[2]);
  const qty = parseInt(row[9]) || 0;
  const today = new Date().toISOString().slice(0, 10);

  sql += `INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id) VALUES ('${LOT_PREFIX}-${code}', NULL, '${code}', '${name}', '${today}', 'IMPORT', ${qty}, 0, '${STORE_ID}');\n`;
}

sql += `\n-- 4. Reset sequences (global — set to max across ALL stores)\n`;
sql += `SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));\n`;
sql += `SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));\n`;

fs.writeFileSync('bm-electronic-stock-import.sql', sql);
console.log(`Generated bm-electronic-stock-import.sql with ${rows.length} items + lots`);
