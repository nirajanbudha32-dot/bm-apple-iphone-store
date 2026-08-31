const XLSX = require('xlsx');
const fs = require('fs');

const STORE_ID = 'a0000000-0000-0000-0000-000000000002'; // BM Iphone Store
const STORE_NAME = 'BM Iphone Store';
const CODE_OFFSET = 2000; // codes 2001-2283
const LOT_PREFIX = 'IPH';

const wb = XLSX.readFile('C:\\Users\\DELL\\Desktop\\stock\\BM Iphone Store Stock.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Different column layout: has null cols at index 3 and 6
const rows = data.slice(1).filter(r => r[1] && r[2]);

function esc(val) {
  return String(val || '').trim().replace(/'/g, "''");
}

let sql = `-- ============================================\n`;
sql += `-- ${STORE_NAME} Stock - Full Import\n`;
sql += `-- Source: BM Iphone Store Stock.xlsx\n`;
sql += `-- Total items: ${rows.length}\n`;
sql += `-- Store: ${STORE_NAME} (${STORE_ID})\n`;
sql += `-- Run this in Supabase SQL Editor\n`;
sql += `-- ============================================\n\n`;

sql += `-- 1. Clear old stock for this store only\n`;
sql += `DELETE FROM public.stock WHERE store_id = '${STORE_ID}';\n`;
sql += `DELETE FROM public.stock_lots WHERE store_id = '${STORE_ID}';\n\n`;

sql += `-- 2. Insert stock items\n`;

for (const row of rows) {
  const code = String(parseInt(row[1]) + CODE_OFFSET);
  const name = esc(row[2]);
  const category = esc(row[4]);
  const subCategory = esc(row[5]);
  const brand = esc(row[7]);
  const subBrand = esc(row[8]);
  const model = esc(row[9]);
  const unit = esc(row[10]) || 'Pcs';
  const qty = parseInt(row[11]) || 0;

  sql += `INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id, updated_at) VALUES ('${code}', '${name}', '${category}', '${subCategory}', '${brand}', '${subBrand}', '${model}', '${unit}', ${qty}, 0, 0, '${STORE_ID}', now()) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id, updated_at=EXCLUDED.updated_at;\n`;
}

sql += `\n-- 3. Insert stock lots (one lot per item for FIFO sales)\n`;

for (const row of rows) {
  const code = String(parseInt(row[1]) + CODE_OFFSET);
  const name = esc(row[2]);
  const qty = parseInt(row[11]) || 0;
  const today = new Date().toISOString().slice(0, 10);

  sql += `INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id) VALUES ('${LOT_PREFIX}-${code}', NULL, '${code}', '${name}', '${today}', 'IMPORT', ${qty}, 0, '${STORE_ID}');\n`;
}

fs.writeFileSync('bm-iphone-store-import.sql', sql);
console.log(`Generated bm-iphone-store-import.sql with ${rows.length} items + lots`);
