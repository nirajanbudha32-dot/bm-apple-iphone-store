const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function esc(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/'/g, "''");
}

function num(val) {
  if (val === null || val === undefined || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// =================================================================
// 1. BM Apple Iphone Store
// =================================================================
function generateAppleStore() {
  const filePath = 'C:\\Users\\DELL\\Desktop\\BM Apple Iphone Store Final Stock.xlsx';
  const STORE_ID = 'a0000000-0000-0000-0000-000000000001';
  const STORE_NAME = 'BM Apple Iphone Store';
  const LOT_PREFIX = 'AIS';

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['Stock'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Header: ['Qty', 'Item Code', 'Item Name', 'Category', 'Sub-Category', 'Brand', 'Model', 'Unit', 'Qty', 'Purchase Price', 'Selling Price']
  const rows = data.slice(1).filter(r => r && r[1] && r[2]);

  let sql = `-- ============================================\n`;
  sql += `-- ${STORE_NAME} Stock - Full Import\n`;
  sql += `-- Source: BM Apple Iphone Store Final Stock.xlsx\n`;
  sql += `-- Total items: ${rows.length}\n`;
  sql += `-- Store: ${STORE_NAME} (${STORE_ID})\n`;
  sql += `-- Run this in Supabase SQL Editor\n`;
  sql += `-- ============================================\n\n`;

  sql += `DELETE FROM public.stock_lots WHERE store_id = '${STORE_ID}';\n`;
  sql += `DELETE FROM public.stock WHERE store_id = '${STORE_ID}';\n\n`;

  sql += `-- 2. Insert stock items\n`;

  for (const row of rows) {
    let code = String(row[1]).trim();
    // Resolve collision: code 84 in Apple store clashed with code 84 in BM Electronic
    if (code === '84') {
      code = '2308';
    }

    const name = esc(row[2]);
    const category = esc(row[3]);
    const subCategory = esc(row[4]);
    const brand = esc(row[5]);
    const subBrand = brand; // Sheet lacks separate Sub-Brand column; use Brand
    const model = esc(row[6]);
    const unit = esc(row[7]) || 'Pcs';
    const qty = Math.round(num(row[0])); // Column A is the final physical count
    const purchasePrice = num(row[9]);
    const sellingPrice = num(row[10]);

    sql += `INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id) VALUES ('${code}', '${name}', '${category}', '${subCategory}', '${brand}', '${subBrand}', '${model}', '${unit}', ${qty}, ${purchasePrice}, ${sellingPrice}, '${STORE_ID}') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id;\n`;
  }

  sql += `\n-- 3. Create opening stock lots for FIFO sales deduction\n`;
  sql += `INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id)\n`;
  sql += `SELECT \n`;
  sql += `  '${LOT_PREFIX}-' || code, \n`;
  sql += `  NULL, \n`;
  sql += `  code, \n`;
  sql += `  name, \n`;
  sql += `  CURRENT_DATE, \n`;
  sql += `  'IMPORT', \n`;
  sql += `  qty, \n`;
  sql += `  purchase_price, \n`;
  sql += `  store_id\n`;
  sql += `FROM public.stock\n`;
  sql += `WHERE store_id = '${STORE_ID}'\n`;
  sql += `ON CONFLICT DO NOTHING;\n\n`;

  sql += `-- 4. Sync sequences with imported stock data\n`;
  sql += `SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));\n`;
  sql += `SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));\n`;

  fs.writeFileSync('bm-apple-iphone-store-final-stock.sql', sql, 'utf8');
  fs.writeFileSync('bm-apple-iphone-store-import.sql', sql, 'utf8');
  console.log(`Generated BM Apple Store SQL (${rows.length} items)`);
}

// =================================================================
// 2. BM Electronic
// =================================================================
function generateElectronicStore() {
  const filePath = 'C:\\Users\\DELL\\Desktop\\BM Eletronic Final stock.xlsx';
  const STORE_ID = 'a0000000-0000-0000-0000-000000000003';
  const STORE_NAME = 'BM Electronic';
  const LOT_PREFIX = 'ELC';

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['Stock'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Header: ['Qty', 'Item Code', 'Item Name', 'Category', 'Sub-Category', 'Brand', 'Sub Brand', 'Model', 'Unit', 'Purchase Price', 'Selling Price']
  const rows = data.slice(1).filter(r => r && r[1] && r[2]);

  let sql = `-- ============================================\n`;
  sql += `-- ${STORE_NAME} Stock - Full Import\n`;
  sql += `-- Source: BM Eletronic Final stock.xlsx\n`;
  sql += `-- Total items: ${rows.length}\n`;
  sql += `-- Store: ${STORE_NAME} (${STORE_ID})\n`;
  sql += `-- Run this in Supabase SQL Editor\n`;
  sql += `-- ============================================\n\n`;

  sql += `DELETE FROM public.stock_lots WHERE store_id = '${STORE_ID}';\n`;
  sql += `DELETE FROM public.stock WHERE store_id = '${STORE_ID}';\n\n`;

  sql += `-- 2. Insert stock items\n`;

  for (const row of rows) {
    const code = String(row[1]).trim();
    const name = esc(row[2]);
    const category = esc(row[3]);
    const subCategory = esc(row[4]);
    const brand = esc(row[5]);
    const subBrand = esc(row[6]);
    const model = esc(row[7]);
    const unit = esc(row[8]) || 'Pcs';
    const qty = Math.round(num(row[0])); // Column A is the final physical count
    const purchasePrice = num(row[9]);
    const sellingPrice = num(row[10]);

    sql += `INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id) VALUES ('${code}', '${name}', '${category}', '${subCategory}', '${brand}', '${subBrand}', '${model}', '${unit}', ${qty}, ${purchasePrice}, ${sellingPrice}, '${STORE_ID}') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id;\n`;
  }

  sql += `\n-- 3. Create opening stock lots for FIFO sales deduction\n`;
  sql += `INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id)\n`;
  sql += `SELECT \n`;
  sql += `  '${LOT_PREFIX}-' || code, \n`;
  sql += `  NULL, \n`;
  sql += `  code, \n`;
  sql += `  name, \n`;
  sql += `  CURRENT_DATE, \n`;
  sql += `  'IMPORT', \n`;
  sql += `  qty, \n`;
  sql += `  purchase_price, \n`;
  sql += `  store_id\n`;
  sql += `FROM public.stock\n`;
  sql += `WHERE store_id = '${STORE_ID}'\n`;
  sql += `ON CONFLICT DO NOTHING;\n\n`;

  sql += `-- 4. Sync sequences with imported stock data\n`;
  sql += `SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));\n`;
  sql += `SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));\n`;

  fs.writeFileSync('bm-electronic-final-stock.sql', sql, 'utf8');
  fs.writeFileSync('bm-electronic-stock-import.sql', sql, 'utf8');
  console.log(`Generated BM Electronic SQL (${rows.length} items)`);
}

generateAppleStore();
generateElectronicStore();
