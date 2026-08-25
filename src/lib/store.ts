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
  discount: number;
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
  discount: number;
  amount: number;
  vat: number;
  total: number;
  paymentMethod: PaymentMethod;
  otherCharges: number;
  paidAmount: number;
  remaining: number;
  remarks: string;
  saleType: string;
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

export type StockAdjustment = {
  id: string;
  lotId: string;
  itemCode: string;
  itemName: string;
  date: string;
  adjustmentType: string;
  qtyAdjusted: number;
  reason: string;
  createdAt: string;
};

export type PurchaseHeader = {
  id: string;
  purchaseNo: string;
  supplierInvoiceNo: string;
  date: string;
  supplierName: string;
  supplierAddress: string;
  supplierPan: string;
  supplierVat: string;
  purchaseType: "Cash" | "Credit";
  dueDate: string;
  remarks: string;
  paymentMethod: PaymentMethod;
  grossAmount: number;
  discount: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  otherCharges: number;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number;
  createdAt: string;
};

export type PurchaseItem = {
  id: string;
  purchaseHeaderId: string;
  sn: number;
  itemCode: string;
  itemName: string;
  category: string;
  subCategory: string;
  brand: string;
  model: string;
  unit: string;
  qty: number;
  rate: number;
  discount: number;
  amount: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  lotNo: string;
};

export type PurchaseItemImei = {
  id: string;
  purchaseItemId: string;
  imei: string;
};

export type PurchaseAttachment = {
  id: string;
  purchaseHeaderId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
};

export const VAT_RATE = 0.13;

type State = {
  stock: StockItem[];
  sales: Sale[];
  purchases: Purchase[];
  stockLots: StockLot[];
  saleAllocations: SaleAllocation[];
  stockAdjustments: StockAdjustment[];
  purchaseHeaders: PurchaseHeader[];
  purchaseItems: PurchaseItem[];
  purchaseImeis: PurchaseItemImei[];
  purchaseAttachments: PurchaseAttachment[];
};

const listeners = new Set<() => void>();
let state: State = {
  stock: [],
  sales: [],
  purchases: [],
  stockLots: [],
  saleAllocations: [],
  stockAdjustments: [],
  purchaseHeaders: [],
  purchaseItems: [],
  purchaseImeis: [],
  purchaseAttachments: [],
};
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
    discount: Number(r['discount'] ?? 0),
    amount: r['amount'] as number,
    vat: r['vat'] as number,
    total: r['total'] as number,
    paymentMethod: r['payment_method'] as PaymentMethod,
    otherCharges: Number(r['other_charges'] ?? 0),
    paidAmount: Number(r['paid_amount'] ?? 0),
    remaining: Number(r['remaining'] ?? 0),
    remarks: (r['remarks'] as string) ?? "",
    saleType: (r['sale_type'] as string) ?? "Cash",
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

function mapStockAdjustmentRow(r: Record<string, unknown>): StockAdjustment {
  return {
    id: r['id'] as string,
    lotId: r['lot_id'] as string,
    itemCode: r['item_code'] as string,
    itemName: r['item_name'] as string,
    date: r['date'] as string,
    adjustmentType: r['adjustment_type'] as string,
    qtyAdjusted: r['qty_adjusted'] as number,
    reason: r['reason'] as string,
    createdAt: r['created_at'] as string,
  };
}

function mapPurchaseHeaderRow(r: Record<string, unknown>): PurchaseHeader {
  return {
    id: r['id'] as string,
    purchaseNo: r['purchase_no'] as string,
    supplierInvoiceNo: (r['supplier_invoice_no'] as string) ?? "",
    date: r['date'] as string,
    supplierName: (r['supplier_name'] as string) ?? "",
    supplierAddress: (r['supplier_address'] as string) ?? "",
    supplierPan: (r['supplier_pan'] as string) ?? "",
    supplierVat: (r['supplier_vat'] as string) ?? "",
    purchaseType: (r['purchase_type'] as "Cash" | "Credit") ?? "Cash",
    dueDate: (r['due_date'] as string) ?? "",
    remarks: (r['remarks'] as string) ?? "",
    paymentMethod: (r['payment_method'] as PaymentMethod) ?? "Cash",
    grossAmount: Number(r['gross_amount'] ?? 0),
    discount: Number(r['discount'] ?? 0),
    taxableAmount: Number(r['taxable_amount'] ?? 0),
    vatRate: Number(r['vat_rate'] ?? 13),
    vatAmount: Number(r['vat_amount'] ?? 0),
    otherCharges: Number(r['other_charges'] ?? 0),
    grandTotal: Number(r['grand_total'] ?? 0),
    paidAmount: Number(r['paid_amount'] ?? 0),
    remainingBalance: Number(r['remaining_balance'] ?? 0),
    createdAt: r['created_at'] as string,
  };
}

function mapPurchaseItemRow(r: Record<string, unknown>): PurchaseItem {
  return {
    id: r['id'] as string,
    purchaseHeaderId: r['purchase_header_id'] as string,
    sn: Number(r['sn'] ?? 1),
    itemCode: (r['item_code'] as string) ?? "",
    itemName: r['item_name'] as string,
    category: (r['category'] as string) ?? "",
    subCategory: (r['sub_category'] as string) ?? "",
    brand: (r['brand'] as string) ?? "",
    model: (r['model'] as string) ?? "",
    unit: (r['unit'] as string) ?? "PCS",
    qty: Number(r['qty'] ?? 0),
    rate: Number(r['rate'] ?? 0),
    discount: Number(r['discount'] ?? 0),
    amount: Number(r['amount'] ?? 0),
    taxableAmount: Number(r['taxable_amount'] ?? 0),
    vatRate: Number(r['vat_rate'] ?? 13),
    vatAmount: Number(r['vat_amount'] ?? 0),
    total: Number(r['total'] ?? 0),
    lotNo: (r['lot_no'] as string) ?? "",
  };
}

function mapPurchaseImeiRow(r: Record<string, unknown>): PurchaseItemImei {
  return {
    id: r['id'] as string,
    purchaseItemId: r['purchase_item_id'] as string,
    imei: r['imei'] as string,
  };
}

function mapPurchaseAttachmentRow(r: Record<string, unknown>): PurchaseAttachment {
  return {
    id: r['id'] as string,
    purchaseHeaderId: r['purchase_header_id'] as string,
    fileName: r['file_name'] as string,
    fileType: (r['file_type'] as string) ?? "",
    fileSize: Number(r['file_size'] ?? 0),
    fileData: (r['file_data'] as string) ?? "",
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
  headerDiscount: number = 0,
  otherCharges: number = 0,
  paidAmount: number = 0,
  remarks: string = "",
  saleType: string = "Cash",
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
    discount: item.discount,
    amount: item.amount,
    vat: item.vat,
    total: item.total,
    payment_method: paymentMethod,
    other_charges: otherCharges,
    paid_amount: paidAmount,
    remaining: 0,
    remarks,
    sale_type: saleType,
    created_by: user?.id ?? null,
  }));

  // Calculate remaining from first item (will be set on all rows for grouping)
  const grossTotal = items.reduce((a, i) => a + i.total, 0);
  const remaining = Math.max(0, grossTotal - headerDiscount + otherCharges - paidAmount);
  rows.forEach((r) => { r.remaining = remaining; });

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

export async function calculateMaxStockCode(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("next_stock_code");
    if (!error && data) {
      const parsed = Number(data);
      if (Number.isFinite(parsed) && parsed > 0) return parsed - 1;
    }
  } catch (_) {}

  // Fallback: query all codes from stock table
  const { data: allRows } = await supabase.from("stock").select("code");
  let max = 0;
  if (allRows && allRows.length > 0) {
    for (const row of allRows) {
      const codeStr = String((row as Record<string, unknown>)["code"] ?? "");
      const n = parseInt(codeStr.replace(/\D/g, ""), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  } else if (state.stock && state.stock.length > 0) {
    for (const item of state.stock) {
      const n = parseInt(String(item.code).replace(/\D/g, ""), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return max;
}

export async function nextItemCode(): Promise<string> {
  const max = await calculateMaxStockCode();
  let candidate = max + 1;
  const existingCodes = new Set(state.stock.map((s) => String(s.code).trim()));
  while (existingCodes.has(String(candidate))) {
    candidate++;
  }
  return String(candidate);
}

export async function calculateMaxLotNo(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("next_lot_no");
    if (!error && data) {
      const n = Number(String(data).replace(/\D/g, ""));
      if (Number.isFinite(n) && n > 0) return n - 1;
    }
  } catch (_) {}

  // Fallback: query from stock_lots table
  const { data: allLots } = await supabase.from("stock_lots").select("lot_no");
  let max = 0;
  if (allLots && allLots.length > 0) {
    for (const row of allLots) {
      const lotStr = String((row as Record<string, unknown>)["lot_no"] ?? "");
      const n = parseInt(lotStr.replace(/\D/g, ""), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  } else if (state.stockLots && state.stockLots.length > 0) {
    for (const lot of state.stockLots) {
      const n = parseInt(String(lot.lotNo).replace(/\D/g, ""), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return max;
}

export async function getNextLotNo(): Promise<string> {
  const max = await calculateMaxLotNo();
  let candidate = max + 1;
  const existingLots = new Set(state.stockLots.map((l) => String(l.lotNo).trim()));
  while (existingLots.has(`LOT-${String(candidate).padStart(4, "0")}`)) {
    candidate++;
  }
  return `LOT-${String(candidate).padStart(4, "0")}`;
}

export async function addPurchase(entry: Omit<Purchase, "id">) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stockResult = await applyStockDelta(entry, entry.qty);
  if (stockResult.error) return { error: new Error(stockResult.error) };
  const resolvedItemCode = stockResult.itemCode || entry.itemCode;

  const { data: inserted, error } = await supabase.from("purchases").insert({
    bill_no: entry.billNo,
    date: entry.date,
    supplier: entry.supplier,
    item_code: resolvedItemCode,
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
    let lotNo = "";
    try {
      const { data: lotNoResult, error: lotErr } = await supabase.rpc("next_lot_no");
      if (!lotErr && lotNoResult) {
        lotNo = lotNoResult as string;
      }
    } catch (_) {}

    if (!lotNo) {
      lotNo = await getNextLotNo();
    }

    const { error: lotInsertErr } = await supabase.from("stock_lots").insert({
      lot_no: lotNo,
      purchase_id: inserted.id,
      item_code: resolvedItemCode,
      item_name: entry.itemName,
      date: entry.date,
      supplier: entry.supplier,
      qty: entry.qty,
      purchase_price: entry.rate,
    });

    if (lotInsertErr) {
      console.warn("Stock lot insert warning:", lotInsertErr.message);
    }
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

export function nextPurchaseNo(headers: PurchaseHeader[]) {
  const max = headers.reduce((acc, h) => {
    const n = Number(h.purchaseNo.replace(/\D/g, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `PUR-${String(max + 1).padStart(4, "0")}`;
}

export async function addPurchaseHeader(
  header: Omit<PurchaseHeader, "id" | "createdAt">,
  items: Omit<PurchaseItem, "id" | "purchaseHeaderId">[],
  imeisByItem: Record<number, string[]>,
): Promise<{ error?: string; headerId?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  // Generate purchase_no server-side to avoid duplicates
  let purchaseNo = header.purchaseNo;
  try {
    const { data: noResult, error: noErr } = await supabase.rpc("next_purchase_no");
    if (!noErr && noResult) {
      purchaseNo = noResult as string;
    }
  } catch (_) {}

  const { data: inserted, error } = await supabase.from("purchase_headers").insert({
    purchase_no: purchaseNo,
    supplier_invoice_no: header.supplierInvoiceNo,
    date: header.date,
    supplier_name: header.supplierName,
    supplier_address: header.supplierAddress,
    supplier_pan: header.supplierPan,
    supplier_vat: header.supplierVat,
    purchase_type: header.purchaseType,
    due_date: header.dueDate,
    remarks: header.remarks,
    payment_method: header.paymentMethod,
    gross_amount: header.grossAmount,
    discount: header.discount,
    taxable_amount: header.taxableAmount,
    vat_rate: header.vatRate,
    vat_amount: header.vatAmount,
    other_charges: header.otherCharges,
    grand_total: header.grandTotal,
    paid_amount: header.paidAmount,
    remaining_balance: header.remainingBalance,
    created_by: user?.id ?? null,
  }).select("id").single();

  if (error) return { error: error.message };
  const headerId = inserted!.id as string;

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;

    // Update stock first to ensure new stock item is created and itemCode is resolved
    const stockResult = await applyStockDelta(
      {
        billNo: header.purchaseNo,
        date: header.date,
        supplier: header.supplierName,
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category,
        subCategory: item.subCategory,
        brand: item.brand,
        model: item.model,
        qty: item.qty,
        rate: item.rate,
        amount: item.amount,
        paymentMethod: header.paymentMethod,
        note: "",
      },
      item.qty,
    );
    if (stockResult.error) return { error: stockResult.error };
    const resolvedItemCode = stockResult.itemCode || item.itemCode;

    // Create stock lot automatically
    let lotNo = item.lotNo?.trim();
    if (!lotNo) {
      try {
        const { data: lotNoResult, error: lotErr } = await supabase.rpc("next_lot_no");
        if (!lotErr && lotNoResult) {
          lotNo = lotNoResult as string;
        }
      } catch (_) {}
      if (!lotNo) {
        lotNo = await getNextLotNo();
      }
    }

    const { data: insertedItem, error: itemErr } = await supabase.from("purchase_items").insert({
      purchase_header_id: headerId,
      sn: item.sn,
      item_code: resolvedItemCode,
      item_name: item.itemName,
      category: item.category,
      sub_category: item.subCategory,
      brand: item.brand,
      model: item.model,
      unit: item.unit,
      qty: item.qty,
      rate: item.rate,
      discount: item.discount,
      amount: item.amount,
      taxable_amount: item.taxableAmount,
      vat_rate: item.vatRate,
      vat_amount: item.vatAmount,
      total: item.total,
      lot_no: lotNo,
    }).select("id").single();

    if (itemErr) return { error: `Failed to save item ${item.itemName}: ${itemErr.message}` };

    const itemId = (insertedItem as Record<string, unknown>)['id'] as string;

    // Insert IMEIs if any
    const imeis = imeisByItem[i] || [];
    if (imeis.length > 0 && insertedItem) {
      const imeiRows = imeis.map((imei) => ({
        purchase_item_id: itemId,
        imei,
      }));
      const { error: imeiErr } = await supabase.from("purchase_item_imeis").insert(imeiRows);
      if (imeiErr) return { error: `Failed to save IMEIs for ${item.itemName}: ${imeiErr.message}` };
    }

    const { error: lotInsertErr } = await supabase.from("stock_lots").insert({
      lot_no: lotNo,
      purchase_id: itemId,
      item_code: resolvedItemCode,
      item_name: item.itemName,
      date: header.date,
      supplier: header.supplierName,
      qty: item.qty,
      purchase_price: item.rate,
    });

    if (lotInsertErr) {
      console.warn("Stock lot insert warning for " + item.itemName, lotInsertErr.message);
    }
  }

  await reload();
  return { headerId };
}

export async function deletePurchaseHeader(id: string): Promise<{ error?: string }> {
  try {
    const items = state.purchaseItems.filter((pi) => pi.purchaseHeaderId === id);
    for (const item of items) {
      const lots = state.stockLots.filter((l) => l.purchaseId === item.id || l.purchaseId === id);
      for (const lot of lots) {
        try {
          await supabase.from("stock_lots").delete().eq("id", lot.id);
        } catch (_) {}
      }
      try {
        const { data } = await supabase.from("stock").select("qty").eq("code", item.itemCode).maybeSingle();
        if (data) {
          const current = Number((data as Record<string, unknown>)['qty'] ?? 0);
          await supabase.from("stock").update({ qty: Math.max(0, current - item.qty), updated_at: new Date().toISOString() }).eq("code", item.itemCode);
        }
      } catch (_) {}
      try {
        await supabase.from("purchase_item_imeis").delete().eq("purchase_item_id", item.id);
      } catch (_) {}
    }

    await supabase.from("purchase_items").delete().eq("purchase_header_id", id);
    await supabase.from("purchase_attachments").delete().eq("purchase_header_id", id);
    await supabase.from("purchase_headers").delete().eq("id", id);

    await reload();
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function addPurchaseAttachment(
  headerId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileData: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("purchase_attachments").insert({
    purchase_header_id: headerId,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    file_data: fileData,
  });
  if (error) return { error: error.message };
  await reload();
  return {};
}

export async function addStockAdjustment(
  lotId: string,
  qtyAdjusted: number,
  reason: string,
  adjustmentType: string = "damage",
): Promise<{ error?: Error }> {
  const lot = state.stockLots.find((l) => l.id === lotId);
  if (!lot) return { error: new Error("Lot not found") };
  if (lot.qty + qtyAdjusted < 0) return { error: new Error(`Cannot reduce below 0. Available: ${lot.qty}`) };

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("stock_adjustments").insert({
    lot_id: lotId,
    item_code: lot.itemCode,
    item_name: lot.itemName,
    date: new Date().toISOString().slice(0, 10),
    adjustment_type: adjustmentType,
    qty_adjusted: qtyAdjusted,
    reason,
    created_by: user?.id ?? null,
  });
  if (error) return { error: new Error(error.message) };

  await supabase.from("stock_lots").update({ qty: lot.qty + qtyAdjusted }).eq("id", lotId);
  const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", lot.itemName);
  const totalLotQty = (lots ?? []).reduce((sum: number, l: Record<string, unknown>) => sum + (l['qty'] as number), 0);
  await supabase.from("stock").update({ qty: totalLotQty, updated_at: new Date().toISOString() }).eq("name", lot.itemName);
  await reload();
  return {};
}

// Module-level counter for generating unique stock codes within a session
// Prevents race conditions when multiple new items are added in a single purchase
let nextStockCode: number | null = null;

async function getNextStockCode(): Promise<string> {
  if (nextStockCode === null) {
    const max = await calculateMaxStockCode();
    nextStockCode = max + 1;
  }

  let candidate = nextStockCode;
  const existingCodes = new Set(state.stock.map((s) => String(s.code).trim()));
  while (existingCodes.has(String(candidate))) {
    candidate++;
  }
  nextStockCode = candidate + 1;
  return String(candidate);
}

async function applyStockDelta(
  entry: Omit<Purchase, "id">,
  delta: number,
): Promise<{ error?: string; itemCode?: string }> {
  // First try to find by name (new items may have empty itemCode)
  let itemCode = entry.itemCode;
  if (!itemCode && entry.itemName) {
    const { data: byName } = await supabase
      .from("stock")
      .select("code, qty")
      .eq("name", entry.itemName.trim())
      .maybeSingle();
    if (byName) {
      itemCode = (byName as Record<string, unknown>)["code"] as string;
    }
  }

  const { data } = itemCode
    ? await supabase
        .from("stock")
        .select("code, qty")
        .eq("code", itemCode)
        .maybeSingle()
    : { data: null };

  if (data) {
    const { error: rpcErr } = await supabase.rpc("increment_stock_by_code", {
      p_code: itemCode,
      p_qty: delta,
    });
    if (rpcErr) {
      const current = Number((data as Record<string, unknown>)["qty"] ?? 0);
      const { error: updateErr } = await supabase
        .from("stock")
        .update({ qty: Math.max(0, current + delta), updated_at: new Date().toISOString() })
        .eq("code", itemCode);
      if (updateErr) return { error: `Stock update failed: ${updateErr.message}` };
    }
    return { itemCode };
  } else if (delta > 0) {
    let inserted = false;
    let attempts = 0;
    let lastErr = "";
    let finalCode = "";
    while (!inserted && attempts < 5) {
      attempts++;
      finalCode = await getNextStockCode();
      const { error: insertErr } = await supabase.from("stock").insert({
        code: finalCode,
        name: entry.itemName.trim(),
        category: entry.category || "General",
        sub_category: entry.subCategory || "",
        brand: entry.brand || "",
        sub_brand: "",
        model: entry.model || "",
        unit: "PCS",
        qty: delta,
        purchase_price: entry.rate,
        selling_price: 0,
      });
      if (!insertErr) {
        inserted = true;
        state.stock.push({
          code: finalCode,
          name: entry.itemName.trim(),
          category: entry.category || "General",
          subCategory: entry.subCategory || "",
          brand: entry.brand || "",
          subBrand: "",
          model: entry.model || "",
          unit: "PCS",
          qty: delta,
          purchasePrice: entry.rate,
          sellingPrice: 0,
        });
      } else {
        lastErr = insertErr.message;
        nextStockCode = null;
      }
    }
    if (!inserted) {
      return { error: `Stock insert failed after retries: ${lastErr}` };
    }
    return { itemCode: finalCode };
  }
  return { itemCode };
}

async function reload() {
  nextStockCode = null; // Reset so next insert reads fresh MAX(code) from DB
  const [stockRes, salesRes, purchasesRes] = await Promise.all([
    supabase.from("stock").select("*").order("name"),
    supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(5000),
    supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(5000),
  ]);

  let lots: StockLot[] = [];
  let allocs: SaleAllocation[] = [];
  let adjustments: StockAdjustment[] = [];
  try {
    const [lotsRes, allocRes, adjRes] = await Promise.all([
      supabase.from("stock_lots").select("*").order("created_at", { ascending: false }).limit(10000),
      supabase.from("sale_lot_allocations").select("*").limit(10000),
      supabase.from("stock_adjustments").select("*").order("created_at", { ascending: false }).limit(10000),
    ]);
    lots = (lotsRes.data ?? []).map(mapStockLotRow);
    allocs = (allocRes.data ?? []).map(mapSaleAllocationRow);
    adjustments = (adjRes.data ?? []).map(mapStockAdjustmentRow);
  } catch (_) {}

  let ph: PurchaseHeader[] = [];
  let pi: PurchaseItem[] = [];
  let pImeis: PurchaseItemImei[] = [];
  let pAttach: PurchaseAttachment[] = [];
  try {
    const [headersRes, itemsRes, imeisRes, attachRes] = await Promise.all([
      supabase.from("purchase_headers").select("*").order("created_at", { ascending: false }).limit(5000),
      supabase.from("purchase_items").select("*").order("sn", { ascending: true }).limit(10000),
      supabase.from("purchase_item_imeis").select("*").limit(20000),
      supabase.from("purchase_attachments").select("*").limit(10000),
    ]);
    ph = (headersRes.data ?? []).map(mapPurchaseHeaderRow);
    pi = (itemsRes.data ?? []).map(mapPurchaseItemRow);
    pImeis = (imeisRes.data ?? []).map(mapPurchaseImeiRow);
    pAttach = (attachRes.data ?? []).map(mapPurchaseAttachmentRow);
  } catch (_) {}

  state = {
    stock: (stockRes.data ?? []).map(mapStockRow),
    sales: (salesRes.data ?? []).map(mapSaleRow),
    purchases: (purchasesRes.data ?? []).map(mapPurchaseRow),
    stockLots: lots,
    saleAllocations: allocs,
    stockAdjustments: adjustments,
    purchaseHeaders: ph,
    purchaseItems: pi,
    purchaseImeis: pImeis,
    purchaseAttachments: pAttach,
  };
  emit();
}
