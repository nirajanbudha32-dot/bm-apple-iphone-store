import { useEffect, useState, useCallback } from "react";
import { supabase, type Profile } from "@/lib/supabase";

export type StockItem = {
  code: string;
  name: string;
  category: string;
  subCategory: string;
  brand: string;
  subBrand: string;
  model: string;
  unit: string;
  qty: number;
  purchasePrice: number;
  sellingPrice: number;
};

export type PaymentMethod = "Cash" | "Bank" | "Khalti" | "eSewa" | "Other Bank";

export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Bank", "Khalti", "eSewa", "Other Bank"];

export type BillItem = {
  itemCode: string;
  itemName: string;
  category: string;
  subCategory: string;
  brand: string;
  model: string;
  qty: number;
  rate: number;
  amount: number;
  vat: number;
  total: number;
};

export type Sale = {
  id: string;
  invoiceNo: string;
  date: string;
  customer: string;
  customerPan: string;
  hasVatPan: boolean;
  itemName: string;
  itemCode: string;
  category: string;
  subCategory: string;
  brand: string;
  model: string;
  qty: number;
  rate: number;
  amount: number;
  vat: number;
  total: number;
  paymentMethod: PaymentMethod;
};

export type Purchase = {
  id: string;
  billNo: string;
  date: string;
  supplier: string;
  itemCode: string;
  itemName: string;
  category: string;
  subCategory: string;
  brand: string;
  model: string;
  qty: number;
  rate: number;
  amount: number;
  paymentMethod: PaymentMethod;
  note: string;
};

export type StockLot = {
  id: string;
  lotNo: string;
  purchaseId: string | null;
  itemCode: string;
  itemName: string;
  date: string;
  supplier: string;
  qty: number;
  purchasePrice: number;
};

export type SaleAllocation = {
  id: string;
  saleId: string;
  lotId: string;
  qtyTaken: number;
};

export const VAT_RATE = 0.13;

type State = { stock: StockItem[]; sales: Sale[]; purchases: Purchase[]; stockLots: StockLot[]; saleAllocations: SaleAllocation[] };

const listeners = new Set<() => void>();
let state: State = { stock: [], sales: [], purchases: [], stockLots: [], saleAllocations: [] };
let loaded = false;

function emit() {
  listeners.forEach((l) => l());
}

function mapStockRow(r: Record<string, unknown>): StockItem {
  return {
    code: r['code'] as string,
    name: r['name'] as string,
    category: r['category'] as string,
    subCategory: r['sub_category'] as string,
    brand: r['brand'] as string,
    subBrand: r['sub_brand'] as string,
    model: r['model'] as string,
    unit: r['unit'] as string,
    qty: r['qty'] as number,
    purchasePrice: r['purchase_price'] as number,
    sellingPrice: r['selling_price'] as number,
  };
}

function mapSaleRow(r: Record<string, unknown>): Sale {
  return {
    id: r['id'] as string,
    invoiceNo: r['invoice_no'] as string,
    date: r['date'] as string,
    customer: r['customer'] as string,
    customerPan: (r['customer_pan'] as string) ?? "",
    hasVatPan: (r['has_vat_pan'] as boolean) ?? false,
    itemName: r['item_name'] as string,
    itemCode: r['item_code'] as string,
    category: r['category'] as string,
    subCategory: r['sub_category'] as string,
    brand: r['brand'] as string,
    model: r['model'] as string,
    qty: r['qty'] as number,
    rate: r['rate'] as number,
    amount: r['amount'] as number,
    vat: r['vat'] as number,
    total: r['total'] as number,
    paymentMethod: r['payment_method'] as PaymentMethod,
  };
}

function mapPurchaseRow(r: Record<string, unknown>): Purchase {
  return {
    id: r['id'] as string,
    billNo: (r['bill_no'] as string) ?? "",
    date: r['date'] as string,
    supplier: (r['supplier'] as string) ?? "",
    itemCode: (r['item_code'] as string) ?? "",
    itemName: r['item_name'] as string,
    category: (r['category'] as string) ?? "",
    subCategory: (r['sub_category'] as string) ?? "",
    brand: (r['brand'] as string) ?? "",
    model: (r['model'] as string) ?? "",
    qty: r['qty'] as number,
    rate: r['rate'] as number,
    amount: r['amount'] as number,
    paymentMethod: (r['payment_method'] as PaymentMethod) ?? "Cash",
    note: (r['note'] as string) ?? "",
  };
}

function mapStockLotRow(r: Record<string, unknown>): StockLot {
  return {
    id: r['id'] as string,
    lotNo: r['lot_no'] as string,
    purchaseId: (r['purchase_id'] as string) ?? null,
    itemCode: r['item_code'] as string,
    itemName: r['item_name'] as string,
    date: r['date'] as string,
    supplier: r['supplier'] as string,
    qty: r['qty'] as number,
    purchasePrice: r['purchase_price'] as number,
  };
}

function mapSaleAllocationRow(r: Record<string, unknown>): SaleAllocation {
  return {
    id: r['id'] as string,
    saleId: r['sale_id'] as string,
    lotId: r['lot_id'] as string,
    qtyTaken: r['qty_taken'] as number,
  };
}

export function useStore() {
  const [snapshot, setSnapshot] = useState(state);

  const load = useCallback(async () => {
    await reload();
    loaded = true;
  }, []);

  useEffect(() => {
    const l = () => setSnapshot({ ...state });
    listeners.add(l);
    if (!loaded) load();
    l();
    return () => {
      listeners.delete(l);
    };
  }, [load]);

  return snapshot;
}

export function nextInvoiceNo(sales: Sale[]) {
  const max = sales.reduce((acc, s) => {
    const n = Number(s.invoiceNo.replace(/\D/g, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `BM-AIS-${String(max + 1).padStart(4, "0")}`;
}

export async function addBill(
  invoiceNo: string,
  date: string,
  customer: string,
  customerPan: string,
  hasVatPan: boolean,
  paymentMethod: PaymentMethod,
  items: BillItem[],
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rows = items.map((item) => ({
    invoice_no: invoiceNo,
    date,
    customer,
    customer_pan: customerPan,
    has_vat_pan: hasVatPan,
    item_name: item.itemName,
    item_code: item.itemCode,
    category: item.category,
    sub_category: item.subCategory,
    brand: item.brand,
    model: item.model,
    qty: item.qty,
    rate: item.rate,
    amount: item.amount,
    vat: item.vat,
    total: item.total,
    payment_method: paymentMethod,
    created_by: user?.id ?? null,
  }));

  const { data: insertedSales, error: salesError } = await supabase.from("sales").insert(rows).select("id, item_name, qty");

  if (!salesError && insertedSales) {
    const affectedItems = new Set<string>();
    for (const inserted of insertedSales) {
      const { error: fifoErr } = await supabase.rpc("fifo_deduct", {
        p_item_name: inserted.item_name,
        p_qty: inserted.qty,
        p_sale_id: inserted.id,
      });
      if (fifoErr) {
        await supabase.rpc("decrement_stock", { item_name: inserted.item_name, qty_sold: inserted.qty });
      }
      affectedItems.add(inserted.item_name);
    }

    for (const itemName of affectedItems) {
      try {
        const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", itemName);
        if (lots && lots.length > 0) {
          const totalLotQty = (lots as Record<string, unknown>[]).reduce((sum: number, l) => sum + (l['qty'] as number), 0);
          await supabase.from("stock").update({ qty: totalLotQty, updated_at: new Date().toISOString() }).eq("name", itemName);
        }
      } catch (_) {
        await supabase.rpc("decrement_stock", { item_name: itemName, qty_sold: 0 });
      }
    }
    await reload();
  }
  return { error: salesError };
}

export async function deleteSale(id: string) {
  const sale = state.sales.find((s) => s.id === id);
  if (!sale) return;

  let lotRestored = false;
  try {
    const { data: allocations } = await supabase
      .from("sale_lot_allocations")
      .select("lot_id, qty_taken")
      .eq("sale_id", id);

    if (allocations && allocations.length > 0) {
      for (const alloc of allocations) {
        const lotId = alloc['lot_id'] as string;
        const qtyTaken = alloc['qty_taken'] as number;
        const lot = state.stockLots.find((l) => l.id === lotId);
        if (lot) {
          await supabase.from("stock_lots").update({ qty: lot.qty + qtyTaken }).eq("id", lotId);
        }
      }
      await supabase.from("sale_lot_allocations").delete().eq("sale_id", id);
      lotRestored = true;
    }
  } catch (_) {}

  await supabase.from("sales").delete().eq("id", id);

  if (!lotRestored) {
    await supabase.rpc("increment_stock", { item_name: sale.itemName, qty_returned: sale.qty });
  } else {
    const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", sale.itemName);
    const totalLotQty = (lots ?? []).reduce((sum: number, l: Record<string, unknown>) => sum + (l['qty'] as number), 0);
    await supabase.from("stock").update({ qty: totalLotQty, updated_at: new Date().toISOString() }).eq("name", sale.itemName);
  }

  await reload();
}

export async function deleteInvoice(invoiceNo: string) {
  const items = state.sales.filter((s) => s.invoiceNo === invoiceNo);
  if (items.length === 0) return;

  let lotRestored = false;
  try {
    for (const sale of items) {
      const { data: allocations } = await supabase
        .from("sale_lot_allocations")
        .select("lot_id, qty_taken")
        .eq("sale_id", sale.id);

      if (allocations && allocations.length > 0) {
        for (const alloc of allocations) {
          const lotId = alloc['lot_id'] as string;
          const qtyTaken = alloc['qty_taken'] as number;
          const lot = state.stockLots.find((l) => l.id === lotId);
          if (lot) {
            await supabase.from("stock_lots").update({ qty: lot.qty + qtyTaken }).eq("id", lotId);
          }
        }
        await supabase.from("sale_lot_allocations").delete().eq("sale_id", sale.id);
        lotRestored = true;
      }
    }
  } catch (_) {}

  await supabase.from("sales").delete().eq("invoice_no", invoiceNo);

  if (!lotRestored) {
    await Promise.all(
      items.map((item) =>
        supabase.rpc("increment_stock", { item_name: item.itemName, qty_returned: item.qty })
      )
    );
  } else {
    const affectedItems = new Set(items.map((i) => i.itemName));
    for (const itemName of affectedItems) {
      const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", itemName);
      const totalLotQty = (lots ?? []).reduce((sum: number, l: Record<string, unknown>) => sum + (l['qty'] as number), 0);
      await supabase.from("stock").update({ qty: totalLotQty, updated_at: new Date().toISOString() }).eq("name", itemName);
    }
  }

  await reload();
}

export async function upsertStock(item: StockItem, originalCode?: string) {
  const key = originalCode ?? item.code;
  const { data: existing } = await supabase.from("stock").select("code").eq("code", key).single();

  if (existing) {
    await supabase
      .from("stock")
      .update({
        code: item.code,
        name: item.name,
        category: item.category,
        sub_category: item.subCategory,
        brand: item.brand,
        sub_brand: item.subBrand,
        model: item.model,
        unit: item.unit,
        qty: item.qty,
        purchase_price: item.purchasePrice,
        selling_price: item.sellingPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("code", key);
  } else {
    await supabase.from("stock").insert({
      code: item.code,
      name: item.name,
      category: item.category,
      sub_category: item.subCategory,
      brand: item.brand,
      sub_brand: item.subBrand,
      model: item.model,
      unit: item.unit,
      qty: item.qty,
      purchase_price: item.purchasePrice,
      selling_price: item.sellingPrice,
    });
  }
  await reload();
}

export async function deleteStock(code: string) {
  await supabase.from("stock").delete().eq("code", code);
  await reload();
}

export async function nextItemCode(): Promise<string> {
  const { data } = await supabase
    .from("stock")
    .select("code")
    .order("code", { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return "1";
  const n = Number(String((data[0] as Record<string, unknown>)['code']).replace(/\D/g, ""));
  return String((Number.isFinite(n) ? n : 0) + 1);
}

export async function addPurchase(entry: Omit<Purchase, "id">) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inserted, error } = await supabase.from("purchases").insert({
    bill_no: entry.billNo,
    date: entry.date,
    supplier: entry.supplier,
    item_code: entry.itemCode,
    item_name: entry.itemName,
    category: entry.category,
    sub_category: entry.subCategory,
    brand: entry.brand,
    model: entry.model,
    qty: entry.qty,
    rate: entry.rate,
    amount: entry.amount,
    payment_method: entry.paymentMethod,
    note: entry.note,
    created_by: user?.id ?? null,
  }).select("id").single();

  if (error) return { error };

  if (inserted) {
    let lotError = false;
    try {
      const { data: lotNoResult, error: lotErr } = await supabase.rpc("next_lot_no");
      if (!lotErr && lotNoResult) {
        const { error: lotInsertErr } = await supabase.from("stock_lots").insert({
          lot_no: lotNoResult as string,
          purchase_id: inserted.id,
          item_code: entry.itemCode,
          item_name: entry.itemName,
          date: entry.date,
          supplier: entry.supplier,
          qty: entry.qty,
          purchase_price: entry.rate,
        });
        if (lotInsertErr) lotError = true;
      } else {
        lotError = true;
      }
    } catch (_) {
      lotError = true;
    }

    const stockResult = await applyStockDelta(entry, entry.qty);
    if (stockResult.error) return { error: new Error(stockResult.error) };
    if (lotError) return { error: new Error("Stock updated but lot tracking failed. Lot schema may not be installed.") };
    await reload();
  }
  return { error: null };
}

export async function deletePurchase(id: string) {
  const p = state.purchases.find((x) => x.id === id);
  if (!p) return;

  try {
    const lot = state.stockLots.find((l) => l.purchaseId === id);
    if (lot) {
      await supabase.from("stock_lots").delete().eq("id", lot.id);
    }
  } catch (_) {}

  await supabase.from("purchases").delete().eq("id", id);
  await applyStockDelta(p, -p.qty);
  await reload();
}

async function applyStockDelta(entry: Omit<Purchase, "id">, delta: number): Promise<{ error?: string }> {
  const { data } = await supabase
    .from("stock")
    .select("code, qty")
    .eq("code", entry.itemCode)
    .maybeSingle();

  if (data) {
    const { error: rpcErr } = await supabase.rpc("increment_stock_by_code", {
      p_code: entry.itemCode,
      p_qty: delta,
    });
    if (rpcErr) {
      const current = Number((data as Record<string, unknown>)['qty'] ?? 0);
      const { error: updateErr } = await supabase
        .from("stock")
        .update({ qty: Math.max(0, current + delta), updated_at: new Date().toISOString() })
        .eq("code", entry.itemCode);
      if (updateErr) return { error: `Stock update failed: ${updateErr.message}` };
    }
  } else if (delta > 0) {
    const code = entry.itemCode || (await nextItemCode());
    const { error: insertErr } = await supabase.from("stock").insert({
      code,
      name: entry.itemName,
      category: entry.category,
      sub_category: entry.subCategory,
      brand: entry.brand,
      sub_brand: "",
      model: entry.model,
      unit: "PCS",
      qty: delta,
      purchase_price: entry.rate,
      selling_price: 0,
    });
    if (insertErr) return { error: `Stock insert failed: ${insertErr.message}` };
  }
  return {};
}

async function reload() {
  const [stockRes, salesRes, purchasesRes] = await Promise.all([
    supabase.from("stock").select("*").order("name"),
    supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(5000),
    supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(5000),
  ]);

  let lots: StockLot[] = [];
  let allocs: SaleAllocation[] = [];
  try {
    const [lotsRes, allocRes] = await Promise.all([
      supabase.from("stock_lots").select("*").order("created_at", { ascending: false }).limit(10000),
      supabase.from("sale_lot_allocations").select("*").limit(10000),
    ]);
    lots = (lotsRes.data ?? []).map(mapStockLotRow);
    allocs = (allocRes.data ?? []).map(mapSaleAllocationRow);
  } catch (_) {}

  state = {
    stock: (stockRes.data ?? []).map(mapStockRow),
    sales: (salesRes.data ?? []).map(mapSaleRow),
    purchases: (purchasesRes.data ?? []).map(mapPurchaseRow),
    stockLots: lots,
    saleAllocations: allocs,
  };
  emit();
}
