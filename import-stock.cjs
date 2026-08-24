const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aulhjaemgbpjhxkljyrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGhqYWVtZ2Jwamh4a2xqeXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTQyMjAsImV4cCI6MjEwMzAzMDIyMH0.uVrdhn0gGma9tvPcPtQq5YZrt4RNA4pgxO9W2SatAe8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importStock() {
  const wb = XLSX.readFile('C:\\Users\\DELL\\Desktop\\BM\\BM Apple Iphone Store\\BM Apple Iphone Store Stock Management V1.xlsx');
  const ws = wb.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(ws);

  console.log(`Found ${data.length} items in Excel file`);

  // Clear existing stock
  const { error: deleteError } = await supabase.from('stock').delete().neq('code', '');
  if (deleteError) {
    console.error('Error clearing stock:', deleteError);
  } else {
    console.log('Cleared existing stock');
  }

  // Insert new stock
  const stockItems = data.map(row => ({
    code: String(row['Item Code']),
    name: row['Item Name'],
    category: row['Category'],
    sub_category: row['Sub-Category'],
    brand: row['Brand'],
    sub_brand: row['Sub-Brand'],
    model: row['Models'],
    unit: row['Unit'],
    qty: row['Qty'],
    purchase_price: 0,
    selling_price: 0,
  }));

  // Insert in batches of 50
  for (let i = 0; i < stockItems.length; i += 50) {
    const batch = stockItems.slice(i, i + 50);
    const { error } = await supabase.from('stock').insert(batch);
    if (error) {
      console.error(`Error inserting batch ${i}:`, error);
    } else {
      console.log(`Inserted items ${i + 1} to ${Math.min(i + 50, stockItems.length)}`);
    }
  }

  console.log('Import completed!');
}

importStock().catch(console.error);
