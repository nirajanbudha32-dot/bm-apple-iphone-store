import { useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import { useStoreContext } from "@/lib/store-context";

let _currentStoreId: string | null = null;
export function setCurrentStoreIdForStore(id: string | null) { _currentStoreId = id; }
export function getCurrentStoreId(): string | null { return _currentStoreId; }

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
  storeId?: string;
};

export type PaymentMethod = "Cash" | "Bank" | "Khalti" | "eSewa" | "Other Bank" | "Card" | "Online";

export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Bank", "Card", "Khalti", "eSewa", "Online", "Other Bank"];

export const WAREHOUSE_ID = "a0000000-0000-0000-0000-000000000004";
export const LOCATION_LABELS: Record<string, string> = {
  [WAREHOUSE_ID]: "Warehouse",
  "a0000000-0000-0000-0000-000000000001": "BM Apple Iphone Store",
  "a0000000-0000-0000-0000-000000000002": "BM Iphone Store",
  "a0000000-0000-0000-0000-000000000003": "BM Electronic",
};

export type BillItem = {
  itemCode: string;
  itemName: string;
  category: string;
  subCategory: string;
  brand: string;
  model: string;
  hsCode: string;
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
  customerType: string;
  customerContact: string;
  customerLocation: string;
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
  status: string;
  storeId?: string;
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
  storeId?: string;
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
  storeId?: string;
};

export type SaleAllocation = {
  id: string;
  saleId: string;
  lotId: string;
  qtyTaken: number;
  storeId?: string;
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
  storeId?: string;
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
  vendorId: string;
  createdAt: string;
  storeId?: string;
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
  storeId?: string;
};

export type PurchaseItemImei = {
  id: string;
  purchaseItemId: string;
  imei: string;
  storeId?: string;
};

export type PurchaseAttachment = {
  id: string;
  purchaseHeaderId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  storeId?: string;
};

export type SaleItemImei = {
  id: string;
  saleId: string;
  imei: string;
  storeId?: string;
};

export type SalesReturn = {
  id: string;
  returnNo: string;
  originalInvoiceNo: string;
  saleId: string;
  saleItemName: string;
  saleItemCode: string;
  lotId: string;
  imei: string;
  qty: number;
  returnDate: string;
  reason: string;
  refundAmount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  storeId?: string;
};

export type Vendor = {
  id: string;
  vendorCode: string;
  vendorName: string;
  vendorType: string;
  pan: string;
  vatNumber: string;
  vatStatus: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: string;
  creditLimit: number;
  bankName: string;
  bankAccountNo: string;
  openingBalance: number;
  openingBalanceDate: string;
  status: string;
  remarks: string;
  createdBy: string;
  createdAt: string;
  storeId?: string;
};

export type VendorTransaction = {
  id: string;
  vendorId: string;
  transactionType: string;
  referenceNo: string;
  referenceId: string;
  transactionDate: string;
  debit: number;
  credit: number;
  balance: number;
  remarks: string;
  createdAt: string;
  storeId?: string;
};

export type VendorPayment = {
  id: string;
  paymentNo: string;
  vendorId: string;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  bankName: string;
  referenceNo: string;
  remarks: string;
  createdBy: string;
  createdAt: string;
  storeId?: string;
};

export type VendorPaymentAllocation = {
  id: string;
  paymentId: string;
  purchaseHeaderId: string;
  amount: number;
  allocationType: string;
  storeId?: string;
};

export type PurchaseReturn = {
  id: string;
  returnNo: string;
  originalPurchaseNo: string;
  purchaseHeaderId: string;
  vendorId: string;
  itemCode: string;
  itemName: string;
  lotId: string;
  imei: string;
  qty: number;
  returnDate: string;
  reason: string;
  refundAmount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  storeId?: string;
};

export type VendorDocument = {
  id: string;
  vendorId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  uploadedAt: string;
  storeId?: string;
};

export type StockTransfer = {
  id: string;
  transferNo: string;
  date: string;
  fromStoreId: string | null;
  toStoreId: string | null;
  status: string;
  remarks: string;
  createdBy: string | null;
  createdAt: string;
};

export type StockTransferItem = {
  id: string;
  transferId: string;
  itemCode: string;
  itemName: string;
  lotId: string | null;
  qty: number;
  imei: string | null;
  purchasePrice: number;
  createdAt: string;
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
  saleImeis: SaleItemImei[];
  salesReturns: SalesReturn[];
  vendors: Vendor[];
  vendorTransactions: VendorTransaction[];
  vendorPayments: VendorPayment[];
  vendorPaymentAllocations: VendorPaymentAllocation[];
  purchaseReturns: PurchaseReturn[];
  vendorDocuments: VendorDocument[];
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
  saleImeis: [],
  salesReturns: [],
  vendors: [],
  vendorTransactions: [],
  vendorPayments: [],
  vendorPaymentAllocations: [],
  purchaseReturns: [],
  vendorDocuments: [],
};

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
    storeId: (r['store_id'] as string) ?? "",
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
    customerType: (r['customer_type'] as string) ?? "Individual",
    customerContact: (r['customer_contact'] as string) ?? "",
    customerLocation: (r['customer_location'] as string) ?? "",
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
    status: (r['status'] as string) ?? "CONFIRMED",
    storeId: (r['store_id'] as string) ?? "",
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
    storeId: (r['store_id'] as string) ?? "",
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
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapSaleAllocationRow(r: Record<string, unknown>): SaleAllocation {
  return {
    id: r['id'] as string,
    saleId: r['sale_id'] as string,
    lotId: r['lot_id'] as string,
    qtyTaken: r['qty_taken'] as number,
    storeId: (r['store_id'] as string) ?? "",
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
    storeId: (r['store_id'] as string) ?? "",
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
    vendorId: (r['vendor_id'] as string) ?? "",
    createdAt: r['created_at'] as string,
    storeId: (r['store_id'] as string) ?? "",
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
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapPurchaseImeiRow(r: Record<string, unknown>): PurchaseItemImei {
  return {
    id: r['id'] as string,
    purchaseItemId: r['purchase_item_id'] as string,
    imei: r['imei'] as string,
    storeId: (r['store_id'] as string) ?? "",
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
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapSaleImeiRow(r: Record<string, unknown>): SaleItemImei {
  return {
    id: r['id'] as string,
    saleId: r['sale_id'] as string,
    imei: r['imei'] as string,
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapSalesReturnRow(r: Record<string, unknown>): SalesReturn {
  return {
    id: r['id'] as string,
    returnNo: r['return_no'] as string,
    originalInvoiceNo: r['original_invoice_no'] as string,
    saleId: (r['sale_id'] as string) ?? "",
    saleItemName: r['sale_item_name'] as string,
    saleItemCode: r['sale_item_code'] as string,
    lotId: (r['lot_id'] as string) ?? "",
    imei: (r['imei'] as string) ?? "",
    qty: r['qty'] as number,
    returnDate: r['return_date'] as string,
    reason: (r['reason'] as string) ?? "",
    refundAmount: Number(r['refund_amount'] ?? 0),
    status: (r['status'] as string) ?? "COMPLETED",
    createdBy: (r['created_by'] as string) ?? "",
    createdAt: r['created_at'] as string,
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapVendorRow(r: Record<string, unknown>): Vendor {
  return {
    id: r['id'] as string,
    vendorCode: r['vendor_code'] as string,
    vendorName: r['vendor_name'] as string,
    vendorType: (r['vendor_type'] as string) ?? "Local Supplier",
    pan: (r['pan'] as string) ?? "",
    vatNumber: (r['vat_number'] as string) ?? "",
    vatStatus: (r['vat_status'] as string) ?? "PAN Only",
    address: (r['address'] as string) ?? "",
    contactPerson: (r['contact_person'] as string) ?? "",
    phone: (r['phone'] as string) ?? "",
    email: (r['email'] as string) ?? "",
    paymentTerms: (r['payment_terms'] as string) ?? "30 Days",
    creditLimit: Number(r['credit_limit'] ?? 0),
    bankName: (r['bank_name'] as string) ?? "",
    bankAccountNo: (r['bank_account_no'] as string) ?? "",
    openingBalance: Number(r['opening_balance'] ?? 0),
    openingBalanceDate: (r['opening_balance_date'] as string) ?? "",
    status: (r['status'] as string) ?? "Active",
    remarks: (r['remarks'] as string) ?? "",
    createdBy: (r['created_by'] as string) ?? "",
    createdAt: r['created_at'] as string,
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapVendorTransactionRow(r: Record<string, unknown>): VendorTransaction {
  return {
    id: r['id'] as string,
    vendorId: r['vendor_id'] as string,
    transactionType: r['transaction_type'] as string,
    referenceNo: (r['reference_no'] as string) ?? "",
    referenceId: (r['reference_id'] as string) ?? "",
    transactionDate: r['transaction_date'] as string,
    debit: Number(r['debit'] ?? 0),
    credit: Number(r['credit'] ?? 0),
    balance: Number(r['balance'] ?? 0),
    remarks: (r['remarks'] as string) ?? "",
    createdAt: r['created_at'] as string,
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapVendorPaymentRow(r: Record<string, unknown>): VendorPayment {
  return {
    id: r['id'] as string,
    paymentNo: r['payment_no'] as string,
    vendorId: r['vendor_id'] as string,
    paymentDate: r['payment_date'] as string,
    paymentMethod: (r['payment_method'] as string) ?? "Cash",
    amount: Number(r['amount'] ?? 0),
    bankName: (r['bank_name'] as string) ?? "",
    referenceNo: (r['reference_no'] as string) ?? "",
    remarks: (r['remarks'] as string) ?? "",
    createdBy: (r['created_by'] as string) ?? "",
    createdAt: r['created_at'] as string,
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapVendorPaymentAllocationRow(r: Record<string, unknown>): VendorPaymentAllocation {
  return {
    id: r['id'] as string,
    paymentId: r['payment_id'] as string,
    purchaseHeaderId: (r['purchase_header_id'] as string) ?? "",
    amount: Number(r['amount'] ?? 0),
    allocationType: (r['allocation_type'] as string) ?? "bill",
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapPurchaseReturnRow(r: Record<string, unknown>): PurchaseReturn {
  return {
    id: r['id'] as string,
    returnNo: r['return_no'] as string,
    originalPurchaseNo: r['original_purchase_no'] as string,
    purchaseHeaderId: (r['purchase_header_id'] as string) ?? "",
    vendorId: (r['vendor_id'] as string) ?? "",
    itemCode: r['item_code'] as string,
    itemName: r['item_name'] as string,
    lotId: (r['lot_id'] as string) ?? "",
    imei: (r['imei'] as string) ?? "",
    qty: r['qty'] as number,
    returnDate: r['return_date'] as string,
    reason: (r['reason'] as string) ?? "",
    refundAmount: Number(r['refund_amount'] ?? 0),
    status: (r['status'] as string) ?? "COMPLETED",
    createdBy: (r['created_by'] as string) ?? "",
    createdAt: r['created_at'] as string,
    storeId: (r['store_id'] as string) ?? "",
  };
}

function mapVendorDocumentRow(r: Record<string, unknown>): VendorDocument {
  return {
    id: r['id'] as string,
    vendorId: r['vendor_id'] as string,
    fileName: r['file_name'] as string,
    fileType: (r['file_type'] as string) ?? "",
    fileUrl: "",
    fileSize: Number(r['file_size'] ?? 0),
    fileData: (r['file_data'] as string) ?? "",
    uploadedAt: (r['created_at'] as string) ?? "",
    storeId: (r['store_id'] as string) ?? "",
  };
}

export function useStore() {
  const [snapshot, setSnapshot] = useState(state);
  const { currentStoreId } = useStoreContext();

  useEffect(() => {
    setCurrentStoreIdForStore(currentStoreId);
    const l = () => setSnapshot({ ...state });
    listeners.add(l);
    reload();
    l();
    return () => {
      listeners.delete(l);
    };
  }, [currentStoreId]);

  return snapshot;
}

export async function nextInvoiceNo(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("next_invoice_no");
    if (!error && data) return data as string;
  } catch (_) {}
  // Fallback: query MAX directly from sales table
  const { data: rows } = await supabase.from("sales").select("invoice_no").order("invoice_no", { ascending: false }).limit(1);
  let max = 0;
  if (rows && rows.length > 0) {
    const n = Number(String((rows[0] as any).invoice_no ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  let candidate = max + 1;
  let noStr = `BM-AIS-${String(candidate).padStart(4, "0")}`;
  const { data: existing } = await supabase.from("sales").select("invoice_no").eq("invoice_no", noStr);
  while (existing && existing.length > 0) {
    candidate++;
    noStr = `BM-AIS-${String(candidate).padStart(4, "0")}`;
    const { data: check } = await supabase.from("sales").select("invoice_no").eq("invoice_no", noStr);
    if (!check || check.length === 0) break;
  }
  return noStr;
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
  status: string = "CONFIRMED",
  customerType: string = "Individual",
  customerContact: string = "",
  customerLocation: string = "",
  imeisByItem: Record<number, string[]> = {},
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
    customer_type: customerType,
    customer_contact: customerContact,
    customer_location: customerLocation,
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
    status,
    created_by: user?.id ?? null,
    store_id: _currentStoreId,
  }));

  // Calculate remaining from first item (set only on first row — other rows keep 0)
  const grossTotal = items.reduce((a, i) => a + i.total, 0);
  const remaining = Math.max(0, grossTotal - headerDiscount + otherCharges - paidAmount);
  if (rows[0]) {
    rows[0].remaining = remaining;
  }

  const { data: insertedSales, error: salesError } = await supabase.from("sales").insert(rows).select("id, item_name, qty");

  if (!salesError && insertedSales) {
    const affectedItems = new Set<string>();
    for (let idx = 0; idx < insertedSales.length; idx++) {
      const inserted = insertedSales[idx]!;

      // FIFO deduct first — only insert IMEIs after stock is confirmed deducted
      const { error: fifoErr } = await supabase.rpc("fifo_deduct", {
        p_item_name: inserted.item_name,
        p_qty: inserted.qty,
        p_sale_id: inserted.id,
      });
      if (fifoErr) {
        await supabase.rpc("decrement_stock", { item_name: inserted.item_name, qty_sold: inserted.qty });
      }

      // Insert IMEIs for this sale row (after FIFO succeeds)
      const imeis = imeisByItem[idx] || [];
      if (imeis.length > 0) {
        const imeiRows = imeis.map((imei) => ({
          sale_id: inserted.id,
          imei,
          store_id: _currentStoreId,
        }));
        await supabase.from("sale_item_imeis").insert(imeiRows);
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
        const { data: freshLot } = await supabase.from("stock_lots").select("qty").eq("id", lotId).maybeSingle();
        if (freshLot) {
          const currentQty = (freshLot as Record<string, unknown>)['qty'] as number;
          await supabase.from("stock_lots").update({ qty: currentQty + qtyTaken }).eq("id", lotId);
        }
      }
      await supabase.from("sale_lot_allocations").delete().eq("sale_id", id);
      lotRestored = true;
    }
  } catch (_) {}

  // Delete sale IMEIs
  try {
    await supabase.from("sale_item_imeis").delete().eq("sale_id", id);
  } catch (_) {}

  await supabase.from("sales").delete().eq("id", id);

  if (!lotRestored) {
    await supabase.rpc("increment_stock", { item_name: sale.itemName, qty_returned: sale.qty });
  }

  // Reconcile stock qty from lot totals (always, to ensure consistency)
  try {
    const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", sale.itemName);
    const totalLotQty = (lots ?? []).reduce((sum: number, l: Record<string, unknown>) => sum + (l['qty'] as number), 0);
    await supabase.from("stock").update({ qty: totalLotQty, updated_at: new Date().toISOString() }).eq("name", sale.itemName);
  } catch (_) {}

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
          const { data: freshLot } = await supabase.from("stock_lots").select("qty").eq("id", lotId).maybeSingle();
          if (freshLot) {
            const currentQty = (freshLot as Record<string, unknown>)['qty'] as number;
            await supabase.from("stock_lots").update({ qty: currentQty + qtyTaken }).eq("id", lotId);
          }
        }
        await supabase.from("sale_lot_allocations").delete().eq("sale_id", sale.id);
        lotRestored = true;
      }
    }
  } catch (_) {}

  // Delete all sale IMEIs for this invoice
  try {
    const saleIds = items.map((s) => s.id);
    for (const saleId of saleIds) {
      await supabase.from("sale_item_imeis").delete().eq("sale_id", saleId);
    }
  } catch (_) {}

  await supabase.from("sales").delete().eq("invoice_no", invoiceNo);

  if (!lotRestored) {
    await Promise.all(
      items.map((item) =>
        supabase.rpc("increment_stock", { item_name: item.itemName, qty_returned: item.qty })
      )
    );
  }

  // Reconcile stock qty from lot totals for all affected items
  const affectedItems = new Set(items.map((i) => i.itemName));
  for (const itemName of affectedItems) {
    try {
      const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", itemName);
      const totalLotQty = (lots ?? []).reduce((sum: number, l: Record<string, unknown>) => sum + (l['qty'] as number), 0);
      await supabase.from("stock").update({ qty: totalLotQty, updated_at: new Date().toISOString() }).eq("name", itemName);
    } catch (_) {}
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
      store_id: _currentStoreId,
    });
  }
  await reload();
}

export async function deleteStock(code: string) {
  // Delete orphan lots for this stock item
  try {
    const { data: stockItem } = await supabase.from("stock").select("name").eq("code", code).maybeSingle();
    if (stockItem) {
      await supabase.from("stock_lots").delete().eq("item_name", (stockItem as Record<string, unknown>)['name'] as string);
    }
  } catch (_) {}
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

  // Fallback: query max code from stock table directly
  const { data: allRows } = await supabase.from("stock").select("code").order("code", { ascending: false }).limit(1);
  let max = 0;
  if (allRows && allRows.length > 0) {
    const n = parseInt(String((allRows[0] as any).code ?? "").replace(/\D/g, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

export async function nextItemCode(): Promise<string> {
  const max = await calculateMaxStockCode();
  let candidate = max + 1;
  // Dedup: check against DB
  const { data: existing } = await supabase.from("stock").select("code").eq("code", String(candidate));
  while (existing && existing.length > 0) {
    candidate++;
    const { data: check } = await supabase.from("stock").select("code").eq("code", String(candidate));
    if (!check || check.length === 0) break;
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

  // Fallback: query from stock_lots table directly
  const { data: allLots } = await supabase.from("stock_lots").select("lot_no").order("lot_no", { ascending: false }).limit(1);
  let max = 0;
  if (allLots && allLots.length > 0) {
    const n = parseInt(String((allLots[0] as any).lot_no ?? "").replace(/\D/g, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

export async function getNextLotNo(): Promise<string> {
  const max = await calculateMaxLotNo();
  let candidate = max + 1;
  // Dedup: check against DB
  const lotNoStr = `LOT-${String(candidate).padStart(4, "0")}`;
  const { data: existing } = await supabase.from("stock_lots").select("lot_no").eq("lot_no", lotNoStr);
  while (existing && existing.length > 0) {
    candidate++;
    const nextStr = `LOT-${String(candidate).padStart(4, "0")}`;
    const { data: check } = await supabase.from("stock_lots").select("lot_no").eq("lot_no", nextStr);
    if (!check || check.length === 0) break;
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
    store_id: _currentStoreId,
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
      store_id: _currentStoreId,
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

export async function nextPurchaseNo(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("next_purchase_no");
    if (!error && data) return data as string;
  } catch (_) {}
  const { data: rows } = await supabase.from("purchase_headers").select("purchase_no").order("purchase_no", { ascending: false }).limit(1);
  let max = 0;
  if (rows && rows.length > 0) {
    const n = Number(String((rows[0] as any).purchase_no ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  let candidate = max + 1;
  let noStr = `PUR-${String(candidate).padStart(4, "0")}`;
  const { data: existing } = await supabase.from("purchase_headers").select("purchase_no").eq("purchase_no", noStr);
  while (existing && existing.length > 0) {
    candidate++;
    noStr = `PUR-${String(candidate).padStart(4, "0")}`;
    const { data: check } = await supabase.from("purchase_headers").select("purchase_no").eq("purchase_no", noStr);
    if (!check || check.length === 0) break;
  }
  return noStr;
}

export async function addPurchaseHeader(
  header: Omit<PurchaseHeader, "id" | "createdAt">,
  items: Omit<PurchaseItem, "id" | "purchaseHeaderId">[],
  imeisByItem: Record<number, string[]>,
  destinationStoreId?: string,
): Promise<{ error?: string; headerId?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetStoreId = destinationStoreId || _currentStoreId;

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
    remaining_balance: header.grandTotal - header.paidAmount,
    vendor_id: (header as Record<string, unknown>)['vendorId'] || null,
    created_by: user?.id ?? null,
    store_id: targetStoreId,
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
      store_id: targetStoreId,
    }).select("id").single();

    if (itemErr) return { error: `Failed to save item ${item.itemName}: ${itemErr.message}` };

    const itemId = (insertedItem as Record<string, unknown>)['id'] as string;

    // Insert IMEIs if any
    const imeis = imeisByItem[i] || [];
    if (imeis.length > 0 && insertedItem) {
      const imeiRows = imeis.map((imei) => ({
        purchase_item_id: itemId,
        imei,
        store_id: targetStoreId,
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
      store_id: targetStoreId,
    });

    if (lotInsertErr) {
      console.warn("Stock lot insert warning for " + item.itemName, lotInsertErr.message);
    }
  }

  // Create vendor ledger entry for this purchase (debit = increases what we owe)
  const vendorIdForTxn = (header as Record<string, unknown>)['vendorId'] as string | undefined;
  if (vendorIdForTxn && header.grandTotal > 0) {
    const prevBalance = getVendorBalance(vendorIdForTxn);
    const paidAmount = header.paidAmount ?? 0;
    // Record the full purchase as debit
    await supabase.from("vendor_transactions").insert({
      vendor_id: vendorIdForTxn,
      transaction_type: "PURCHASE",
      reference_no: purchaseNo,
      reference_id: headerId,
      transaction_date: header.date,
      debit: header.grandTotal,
      credit: 0,
      balance: prevBalance + header.grandTotal,
      remarks: `Purchase ${purchaseNo}`,
      store_id: targetStoreId,
    });
    // If paid at purchase time, record the payment as credit
    if (paidAmount > 0) {
      const balanceAfterPurchase = prevBalance + header.grandTotal;
      // Create vendor_transactions PAYMENT entry (for ledger)
      const purchasePaymentNo = await nextVendorPaymentNo();
      const { data: paymentInserted } = await supabase.from("vendor_payments").insert({
        payment_no: purchasePaymentNo,
        vendor_id: vendorIdForTxn,
        payment_date: header.date,
        payment_method: header.paymentMethod,
        amount: paidAmount,
        bank_name: "",
        reference_no: purchaseNo,
        remarks: `Payment at purchase ${purchaseNo}`,
        created_by: user?.id ?? null,
        store_id: targetStoreId,
      }).select("id").single();

      if (paymentInserted) {
        // Create allocation linking payment to this purchase bill
        await supabase.from("vendor_payment_allocations").insert({
          payment_id: paymentInserted.id,
          purchase_header_id: headerId,
          amount: paidAmount,
          allocation_type: "bill",
          store_id: targetStoreId,
        });
      }

      await supabase.from("vendor_transactions").insert({
        vendor_id: vendorIdForTxn,
        transaction_type: "PAYMENT",
        reference_no: purchasePaymentNo,
        reference_id: paymentInserted?.id ?? headerId,
        transaction_date: header.date,
        debit: 0,
        credit: paidAmount,
        balance: balanceAfterPurchase - paidAmount,
        remarks: `Payment at purchase ${purchaseNo}`,
        store_id: _currentStoreId,
      });
    }
  }

  await reload();
  return { headerId };
}

export async function deletePurchaseHeader(id: string): Promise<{ error?: string }> {
  try {
    // Clean up vendor financial records first
    // 1. Delete vendor_payment_allocations linked to this purchase
    const { data: linkedPayments } = await supabase.from("vendor_payment_allocations").select("payment_id").eq("purchase_header_id", id);
    const linkedPaymentIds = [...new Set((linkedPayments ?? []).map((p) => p.payment_id as string))];

    // Delete allocations for this purchase
    await supabase.from("vendor_payment_allocations").delete().eq("purchase_header_id", id);

    // Delete vendor_payments that were auto-created for this purchase (reference_no matches purchase_no)
    const header = state.purchaseHeaders.find((h) => h.id === id);
    if (header) {
      const { data: autoPayments } = await supabase.from("vendor_payments").select("id").eq("reference_no", header.purchaseNo);
      if (autoPayments && autoPayments.length > 0) {
        for (const ap of autoPayments) {
          // Delete allocations for this payment first
          await supabase.from("vendor_payment_allocations").delete().eq("payment_id", ap.id);
          await supabase.from("vendor_payments").delete().eq("id", ap.id);
        }
      }
    }

    // Delete vendor_transactions referencing this purchase header
    await supabase.from("vendor_transactions").delete().eq("reference_id", id);
    // Also delete vendor_transactions referencing auto-created payments
    if (header) {
      const { data: autoVtxns } = await supabase.from("vendor_transactions").select("id").eq("reference_no", header.purchaseNo);
      if (autoVtxns && autoVtxns.length > 0) {
        for (const vt of autoVtxns) {
          await supabase.from("vendor_transactions").delete().eq("id", vt.id);
        }
      }
    }

    const items = state.purchaseItems.filter((pi) => pi.purchaseHeaderId === id);
    for (const item of items) {
      const lots = state.stockLots.filter((l) => l.purchaseId === item.id);
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
    store_id: _currentStoreId,
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
    store_id: _currentStoreId,
  });
  if (error) return { error: new Error(error.message) };

  await supabase.from("stock_lots").update({ qty: lot.qty + qtyAdjusted }).eq("id", lotId);
  const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", lot.itemName);
  const totalLotQty = (lots ?? []).reduce((sum: number, l: Record<string, unknown>) => sum + (l['qty'] as number), 0);
  await supabase.from("stock").update({ qty: totalLotQty, updated_at: new Date().toISOString() }).eq("name", lot.itemName);
  await reload();
  return {};
}

export async function findItemByImei(imei: string): Promise<{ item?: StockItem; lot?: StockLot; error?: string }> {
  if (!imei.trim()) return { error: "IMEI is required" };

  // Find the IMEI in purchase_item_imeis
  const { data: imeiRow, error: imeiErr } = await supabase
    .from("purchase_item_imeis")
    .select("purchase_item_id, imei")
    .eq("imei", imei.trim())
    .maybeSingle();

  if (imeiErr || !imeiRow) return { error: "IMEI not found in purchases" };

  // Check if this IMEI is already sold
  const { data: soldImei } = await supabase
    .from("sale_item_imeis")
    .select("id")
    .eq("imei", imei.trim())
    .maybeSingle();

  if (soldImei) return { error: "IMEI already sold" };

  // Find the purchase item to get the product info
  const { data: purchaseItem } = await supabase
    .from("purchase_items")
    .select("item_code, item_name, category, sub_category, brand, model, unit, rate")
    .eq("id", imeiRow['purchase_item_id'] as string)
    .maybeSingle();

  if (!purchaseItem) return { error: "Purchase item not found" };

  // Find the stock item
  const itemName = purchaseItem['item_name'] as string;
  const { data: stockItem } = await supabase
    .from("stock")
    .select("*")
    .eq("name", itemName)
    .maybeSingle();

  if (!stockItem) return { error: "Stock item not found" };

  // Find available lot for this item
  const { data: lot } = await supabase
    .from("stock_lots")
    .select("*")
    .eq("item_name", itemName)
    .gt("qty", 0)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    item: mapStockRow(stockItem as Record<string, unknown>),
    lot: lot ? mapStockLotRow(lot as Record<string, unknown>) : undefined,
  } as { item?: StockItem; lot?: StockLot; error?: string };
}

export async function getAvailableImeis(itemName: string): Promise<string[]> {
  if (!itemName.trim()) return [];

  // Get all purchase IMEIs for this item
  const { data: purchaseItems } = await supabase
    .from("purchase_items")
    .select("id")
    .eq("item_name", itemName);

  if (!purchaseItems || purchaseItems.length === 0) return [];

  const purchaseItemIds = purchaseItems.map((pi) => pi['id'] as string);

  // Get all purchase IMEIs for these items
  const { data: purchaseImeis } = await supabase
    .from("purchase_item_imeis")
    .select("imei, purchase_item_id")
    .in("purchase_item_id", purchaseItemIds);

  if (!purchaseImeis || purchaseImeis.length === 0) return [];

  // Get all sold IMEIs
  const allImeis = purchaseImeis.map((pi) => pi['imei'] as string);
  const { data: soldImeis } = await supabase
    .from("sale_item_imeis")
    .select("imei")
    .in("imei", allImeis);

  const soldSet = new Set((soldImeis ?? []).map((si) => si['imei'] as string));

  // Return only unsold IMEIs
  return allImeis.filter((imei) => !soldSet.has(imei));
}

export async function addSalesReturn(
  originalInvoiceNo: string,
  saleId: string,
  itemName: string,
  itemCode: string,
  lotId: string,
  imei: string,
  qty: number,
  returnDate: string,
  reason: string,
  refundAmount: number,
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  // Generate return_no
  let returnNo = "";
  try {
    const { data: noResult, error: noErr } = await supabase.rpc("next_return_no");
    if (!noErr && noResult) returnNo = noResult as string;
  } catch (_) {}

  // Insert the return record
  const { error } = await supabase.from("sales_returns").insert({
    return_no: returnNo,
    original_invoice_no: originalInvoiceNo,
    sale_id: saleId,
    sale_item_name: itemName,
    sale_item_code: itemCode,
    lot_id: lotId,
    imei,
    qty,
    return_date: returnDate,
    reason,
    refund_amount: refundAmount,
    status: "COMPLETED",
    created_by: user?.id ?? null,
    store_id: _currentStoreId,
  });
  if (error) return { error: error.message };

  // Restore lot qty
  if (lotId) {
    const { data: freshLot } = await supabase.from("stock_lots").select("qty").eq("id", lotId).maybeSingle();
    if (freshLot) {
      const currentQty = (freshLot as Record<string, unknown>)['qty'] as number;
      await supabase.from("stock_lots").update({ qty: currentQty + qty }).eq("id", lotId);
    }
  }

  // Remove sale_lot_allocations for this sale item
  if (saleId && lotId) {
    try {
      await supabase.from("sale_lot_allocations").delete().eq("sale_id", saleId).eq("lot_id", lotId);
    } catch (_) {}
  }

  // Delete sale IMEI if present
  if (imei && saleId) {
    try {
      await supabase.from("sale_item_imeis").delete().eq("sale_id", saleId).eq("imei", imei);
    } catch (_) {}
  }

  // Reconcile stock qty from lot totals
  try {
    const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", itemName);
    if (lots && lots.length > 0) {
      const totalLotQty = (lots as Record<string, unknown>[]).reduce((sum: number, l) => sum + (l['qty'] as number), 0);
      await supabase.from("stock").update({ qty: totalLotQty, updated_at: new Date().toISOString() }).eq("name", itemName);
    }
  } catch (_) {}

  // Update original sale status to reflect return
  if (saleId) {
    try {
      const { data: existingReturns } = await supabase.from("sales_returns").select("qty").eq("sale_id", saleId);
      const totalReturned = (existingReturns ?? []).reduce((sum: number, r: Record<string, unknown>) => sum + (r['qty'] as number), 0);
      const newStatus = totalReturned >= qty ? "RETURNED" : "PARTIALLY_RETURNED";
      await supabase.from("sales").update({ status: newStatus }).eq("id", saleId);
    } catch (_) {}
  }

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
        store_id: _currentStoreId,
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
          storeId: _currentStoreId ?? "",
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

export async function nextVendorCode(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("next_vendor_code");
    if (!error && data) return data as string;
  } catch (_) {}
  const { data: rows } = await supabase.from("vendors").select("vendor_code").order("vendor_code", { ascending: false }).limit(1);
  let max = 0;
  if (rows && rows.length > 0) {
    const n = Number(String((rows[0] as any).vendor_code ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  let candidate = max + 1;
  let code = `VEN-${String(candidate).padStart(4, "0")}`;
  const { data: existing } = await supabase.from("vendors").select("vendor_code").eq("vendor_code", code);
  while (existing && existing.length > 0) {
    candidate++;
    code = `VEN-${String(candidate).padStart(4, "0")}`;
    const { data: check } = await supabase.from("vendors").select("vendor_code").eq("vendor_code", code);
    if (!check || check.length === 0) break;
  }
  return code;
}

export async function addVendor(
  vendor: Omit<Vendor, "id" | "createdAt">,
): Promise<{ error?: string; vendorId?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  let vendorCode = vendor.vendorCode;
  if (!vendorCode) {
    vendorCode = await nextVendorCode();
  }
  const { data: inserted, error } = await supabase.from("vendors").insert({
    vendor_code: vendorCode,
    vendor_name: vendor.vendorName,
    vendor_type: vendor.vendorType,
    pan: vendor.pan,
    vat_number: vendor.vatNumber,
    vat_status: vendor.vatStatus,
    address: vendor.address,
    contact_person: vendor.contactPerson,
    phone: vendor.phone,
    email: vendor.email,
    payment_terms: vendor.paymentTerms,
    credit_limit: vendor.creditLimit,
    bank_name: vendor.bankName,
    bank_account_no: vendor.bankAccountNo,
    opening_balance: vendor.openingBalance,
    opening_balance_date: vendor.openingBalanceDate,
    status: vendor.status,
    remarks: vendor.remarks,
    created_by: user?.id ?? null,
    store_id: _currentStoreId,
  }).select("id").single();

  if (error) return { error: error.message };
  const vendorId = inserted!.id as string;

  // Create opening balance ledger entry if balance > 0
  if (vendor.openingBalance > 0 && vendor.openingBalanceDate) {
    await supabase.from("vendor_transactions").insert({
      vendor_id: vendorId,
      transaction_type: "OPENING_BALANCE",
      reference_no: "Opening",
      reference_id: vendorId,
      transaction_date: vendor.openingBalanceDate,
      debit: vendor.openingBalance,
      credit: 0,
      balance: vendor.openingBalance,
      remarks: "Opening balance",
      store_id: _currentStoreId,
    });
  }

  await reload();
  return { vendorId };
}

export async function updateVendor(
  id: string,
  vendor: Omit<Vendor, "id" | "createdAt">,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("vendors").update({
    vendor_code: vendor.vendorCode,
    vendor_name: vendor.vendorName,
    vendor_type: vendor.vendorType,
    pan: vendor.pan,
    vat_number: vendor.vatNumber,
    vat_status: vendor.vatStatus,
    address: vendor.address,
    contact_person: vendor.contactPerson,
    phone: vendor.phone,
    email: vendor.email,
    payment_terms: vendor.paymentTerms,
    credit_limit: vendor.creditLimit,
    bank_name: vendor.bankName,
    bank_account_no: vendor.bankAccountNo,
    opening_balance: vendor.openingBalance,
    opening_balance_date: vendor.openingBalanceDate,
    status: vendor.status,
    remarks: vendor.remarks,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };

  // Sync opening balance to vendor_transactions OPENING_BALANCE entry
  const { data: existingOb } = await supabase.from("vendor_transactions").select("id, debit, credit").eq("vendor_id", id).eq("transaction_type", "OPENING_BALANCE").maybeSingle();
  if (existingOb) {
    const oldDebit = (existingOb as Record<string, unknown>)['debit'] as number;
    if (vendor.openingBalance !== oldDebit) {
      await supabase.from("vendor_transactions").update({
        debit: vendor.openingBalance,
        credit: 0,
        transaction_date: vendor.openingBalanceDate || new Date().toISOString().slice(0, 10),
      }).eq("id", (existingOb as Record<string, unknown>)['id'] as string);
    }
  } else if (vendor.openingBalance > 0 && vendor.openingBalanceDate) {
    // Create opening balance entry if it doesn't exist
    await supabase.from("vendor_transactions").insert({
      vendor_id: id,
      transaction_type: "OPENING_BALANCE",
      reference_no: "Opening",
      reference_id: id,
      transaction_date: vendor.openingBalanceDate,
      debit: vendor.openingBalance,
      credit: 0,
      balance: vendor.openingBalance,
      remarks: "Opening balance",
      store_id: _currentStoreId,
    });
  }

  await reload();
  return {};
}

export async function addVendorDocument(
  vendorId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileData: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("vendor_documents").insert({
    vendor_id: vendorId,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    file_data: fileData,
    store_id: _currentStoreId,
  });
  if (error) return { error: error.message };
  await reload();
  return {};
}

export async function deleteVendorDocument(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("vendor_documents").delete().eq("id", id);
  if (error) return { error: error.message };
  await reload();
  return {};
}

export async function nextVendorPaymentNo(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("next_vendor_payment_no");
    if (!error && data) return data as string;
  } catch (_) {}
  const { data: rows } = await supabase.from("vendor_payments").select("payment_no").order("payment_no", { ascending: false }).limit(1);
  let max = 0;
  if (rows && rows.length > 0) {
    const n = Number(String((rows[0] as any).payment_no ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  let candidate = max + 1;
  let noStr = `VP-${String(candidate).padStart(4, "0")}`;
  const { data: existing } = await supabase.from("vendor_payments").select("payment_no").eq("payment_no", noStr);
  while (existing && existing.length > 0) {
    candidate++;
    noStr = `VP-${String(candidate).padStart(4, "0")}`;
    const { data: check } = await supabase.from("vendor_payments").select("payment_no").eq("payment_no", noStr);
    if (!check || check.length === 0) break;
  }
  return noStr;
}

export async function addVendorPayment(
  vendorId: string,
  paymentDate: string,
  paymentMethod: string,
  amount: number,
  bankName: string,
  referenceNo: string,
  remarks: string,
  allocations: { purchaseHeaderId: string; amount: number; allocationType: string }[],
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const paymentNo = await nextVendorPaymentNo();

  const { data: inserted, error } = await supabase.from("vendor_payments").insert({
    payment_no: paymentNo,
    vendor_id: vendorId,
    payment_date: paymentDate,
    payment_method: paymentMethod,
    amount,
    bank_name: bankName,
    reference_no: referenceNo,
    remarks,
    created_by: user?.id ?? null,
    store_id: _currentStoreId,
  }).select("id").single();

  if (error) return { error: error.message };
  const paymentId = inserted!.id as string;

  // Insert allocations
  for (const alloc of allocations) {
    if (alloc.amount > 0) {
      const allocType = alloc.allocationType || "bill";
      await supabase.from("vendor_payment_allocations").insert({
        payment_id: paymentId,
        purchase_header_id: allocType === "bill" ? alloc.purchaseHeaderId : null,
        amount: alloc.amount,
        allocation_type: allocType,
        store_id: _currentStoreId,
      });
      // Update purchase_headers remaining_balance and paid_amount for bill allocations
      if (allocType === "bill" && alloc.purchaseHeaderId) {
        const { data: phRow } = await supabase.from("purchase_headers").select("remaining_balance, paid_amount").eq("id", alloc.purchaseHeaderId).maybeSingle();
        if (phRow) {
          const currentRemaining = (phRow as Record<string, unknown>)['remaining_balance'] as number;
          const currentPaid = (phRow as Record<string, unknown>)['paid_amount'] as number;
          const newRemaining = Math.max(0, currentRemaining - alloc.amount);
          const newPaid = currentPaid + alloc.amount;
          await supabase.from("purchase_headers").update({ remaining_balance: newRemaining, paid_amount: newPaid }).eq("id", alloc.purchaseHeaderId);
        }
      }
    }
  }

  // Create ledger entry (credit = reduces what you owe)
  const vendor = state.vendors.find((v) => v.id === vendorId);
  const prevBalance = vendor ? getVendorBalance(vendorId) : 0;
  const newBalance = prevBalance - amount;
  await supabase.from("vendor_transactions").insert({
    vendor_id: vendorId,
    transaction_type: "PAYMENT",
    reference_no: paymentNo,
    reference_id: paymentId,
    transaction_date: paymentDate,
    debit: 0,
    credit: amount,
    balance: newBalance,
    remarks: remarks || `Payment ${paymentNo}`,
    store_id: _currentStoreId,
  });

  await reload();
  return {};
}

export async function nextPurchaseReturnNo(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("next_purchase_return_no");
    if (!error && data) return data as string;
  } catch (_) {}
  const { data: rows } = await supabase.from("purchase_returns").select("return_no").order("return_no", { ascending: false }).limit(1);
  let max = 0;
  if (rows && rows.length > 0) {
    const n = Number(String((rows[0] as any).return_no ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  let candidate = max + 1;
  let noStr = `PR-${String(candidate).padStart(4, "0")}`;
  const { data: existing } = await supabase.from("purchase_returns").select("return_no").eq("return_no", noStr);
  while (existing && existing.length > 0) {
    candidate++;
    noStr = `PR-${String(candidate).padStart(4, "0")}`;
    const { data: check } = await supabase.from("purchase_returns").select("return_no").eq("return_no", noStr);
    if (!check || check.length === 0) break;
  }
  return noStr;
}

export async function addPurchaseReturn(
  originalPurchaseNo: string,
  purchaseHeaderId: string,
  vendorId: string,
  itemCode: string,
  itemName: string,
  lotId: string,
  imei: string,
  qty: number,
  returnDate: string,
  reason: string,
  refundAmount: number,
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const returnNo = await nextPurchaseReturnNo();

  const { error } = await supabase.from("purchase_returns").insert({
    return_no: returnNo,
    original_purchase_no: originalPurchaseNo,
    purchase_header_id: purchaseHeaderId,
    vendor_id: vendorId,
    item_code: itemCode,
    item_name: itemName,
    lot_id: lotId,
    imei,
    qty,
    return_date: returnDate,
    reason,
    refund_amount: refundAmount,
    status: "COMPLETED",
    created_by: user?.id ?? null,
    store_id: _currentStoreId,
  });
  if (error) return { error: error.message };

  // Restore lot qty (reduce it — we're returning stock)
  if (lotId) {
    const { data: freshLot } = await supabase.from("stock_lots").select("qty").eq("id", lotId).maybeSingle();
    if (freshLot) {
      const currentQty = (freshLot as Record<string, unknown>)['qty'] as number;
      await supabase.from("stock_lots").update({ qty: Math.max(0, currentQty - qty) }).eq("id", lotId);
    }
  }

  // Reconcile stock qty
  try {
    const { data: lots } = await supabase.from("stock_lots").select("qty").eq("item_name", itemName);
    if (lots && lots.length > 0) {
      const totalLotQty = (lots as Record<string, unknown>[]).reduce((sum: number, l) => sum + (l['qty'] as number), 0);
      await supabase.from("stock").update({ qty: Math.max(0, totalLotQty), updated_at: new Date().toISOString() }).eq("name", itemName);
    }
  } catch (_) {}

  // Create ledger entry (credit = reduces what you owe)
  if (vendorId) {
    const prevBalance = getVendorBalance(vendorId);
    const newBalance = prevBalance - refundAmount;
    await supabase.from("vendor_transactions").insert({
      vendor_id: vendorId,
      transaction_type: "PURCHASE_RETURN",
      reference_no: returnNo,
      transaction_date: returnDate,
      debit: 0,
      credit: refundAmount,
      balance: newBalance,
      remarks: reason || `Return ${returnNo}`,
      store_id: _currentStoreId,
    });
  }

  // Update purchase_headers.remaining_balance for this purchase
  if (purchaseHeaderId) {
    const ph = state.purchaseHeaders.find((h) => h.id === purchaseHeaderId);
    if (ph) {
      const newRemaining = Math.max(0, ph.remainingBalance - refundAmount);
      await supabase.from("purchase_headers").update({ remaining_balance: newRemaining }).eq("id", purchaseHeaderId);
    }
  }

  // Clean up purchase_item_imeis for returned IMEI
  if (imei) {
    try {
      const { data: piRow } = await supabase.from("purchase_items").select("id").eq("item_code", itemCode).eq("purchase_header_id", purchaseHeaderId).maybeSingle();
      if (piRow) {
        await supabase.from("purchase_item_imeis").delete().eq("purchase_item_id", piRow.id).eq("imei", imei);
      }
    } catch (_) {}
  }

  await reload();
  return {};
}

export function getVendorBalance(vendorId: string): number {
  const txns = state.vendorTransactions
    .filter((t) => t.vendorId === vendorId)
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate) || a.createdAt.localeCompare(b.createdAt));

  // Purchases and opening balance increase what we owe (debit)
  // Payments, returns, and advance applications decrease what we owe (credit)
  const totalDebit = txns.filter((t) => t.transactionType === "PURCHASE" || t.transactionType === "OPENING_BALANCE" || t.transactionType === "ADVANCE_APPLIED").reduce((a, t) => a + t.debit, 0);
  const totalCredit = txns.filter((t) => t.transactionType !== "PURCHASE" && t.transactionType !== "OPENING_BALANCE" && t.transactionType !== "ADVANCE_APPLIED").reduce((a, t) => a + t.credit, 0);
  return totalDebit - totalCredit;
}

export function getVendorPurchases(vendorId: string) {
  return state.purchaseHeaders.filter((ph) => {
    // Match by vendor_id if set, else by supplier_name
    const vendor = state.vendors.find((v) => v.id === vendorId);
    if (ph.vendorId === vendorId) return true;
    if (vendor && ph.supplierName === vendor.vendorName) return true;
    return false;
  });
}

export function getVendorPayments(vendorId: string) {
  return state.vendorPayments.filter((p) => p.vendorId === vendorId);
}

export function getVendorLedger(vendorId: string) {
  return state.vendorTransactions
    .filter((t) => t.vendorId === vendorId)
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate) || a.createdAt.localeCompare(b.createdAt));
}

export function getVendorAdvance(vendorId: string): number {
  const vendor = state.vendors.find((v) => v.id === vendorId);
  if (!vendor) return 0;
  const balance = getVendorBalance(vendorId);
  return balance < 0 ? Math.abs(balance) : 0;
}

export async function applyVendorAdvance(
  vendorId: string,
  purchaseHeaderId: string,
  amount: number,
  paymentDate: string,
): Promise<{ error?: string }> {
  const advance = getVendorAdvance(vendorId);
  if (amount > advance) return { error: `Advance available is Rs. ${advance.toFixed(2)}` };

  const { data: { user } } = await supabase.auth.getUser();
  const paymentNo = await nextVendorPaymentNo();

  const { data: inserted, error } = await supabase.from("vendor_payments").insert({
    payment_no: paymentNo,
    vendor_id: vendorId,
    payment_date: paymentDate,
    payment_method: "Cash",
    amount,
    bank_name: "",
    reference_no: "",
    remarks: `Advance applied to purchase`,
    created_by: user?.id ?? null,
    store_id: _currentStoreId,
  }).select("id").single();

  if (error) return { error: error.message };
  const paymentId = inserted!.id as string;

  await supabase.from("vendor_payment_allocations").insert({
    payment_id: paymentId,
    purchase_header_id: purchaseHeaderId,
    amount,
    allocation_type: "bill",
    store_id: _currentStoreId,
  });

  const { data: phRow } = await supabase.from("purchase_headers").select("remaining_balance, paid_amount").eq("id", purchaseHeaderId).maybeSingle();
  if (phRow) {
    const currentRemaining = (phRow as Record<string, unknown>)['remaining_balance'] as number;
    const currentPaid = (phRow as Record<string, unknown>)['paid_amount'] as number;
    const newRemaining = Math.max(0, currentRemaining - amount);
    await supabase.from("purchase_headers").update({ remaining_balance: newRemaining, paid_amount: currentPaid + amount }).eq("id", purchaseHeaderId);
  }

  const vendor = state.vendors.find((v) => v.id === vendorId);
  const prevBalance = vendor ? getVendorBalance(vendorId) : 0;
  await supabase.from("vendor_transactions").insert({
    vendor_id: vendorId,
    transaction_type: "ADVANCE_APPLIED",
    reference_no: paymentNo,
    reference_id: paymentId,
    transaction_date: paymentDate,
    debit: 0,
    credit: amount,
    balance: prevBalance - amount,
    remarks: `Advance applied to purchase`,
    store_id: _currentStoreId,
  });

  await reload();
  return {};
}

export async function getNextTransferNo(): Promise<string> {
  try {
    const { data } = await supabase.rpc("next_transfer_no");
    if (data) return data as string;
  } catch (_) {}
  return "TRF-0001";
}

export async function createTransfer(
  fromStoreId: string,
  toStoreId: string,
  items: Array<{ itemCode: string; itemName: string; lotId: string; qty: number; imei?: string; purchasePrice: number }>,
  remarks: string = "",
): Promise<{ error?: string; transferNo?: string }> {
  if (fromStoreId === toStoreId) return { error: "Source and destination cannot be the same" };
  if (items.length === 0) return { error: "Add at least one item to transfer" };

  const { data: { user } } = await supabase.auth.getUser();
  const transferNo = await getNextTransferNo();

  for (const item of items) {
    const { data: lot } = await supabase.from("stock_lots").select("qty").eq("id", item.lotId).maybeSingle();
    if (!lot) return { error: `Lot not found for "${item.itemName}"` };
    const lotQty = (lot as Record<string, unknown>)['qty'] as number;
    if (lotQty < item.qty) return { error: `Insufficient qty in lot for "${item.itemName}". Available: ${lotQty}, requested: ${item.qty}` };
  }

  const { data: transferRow, error: tErr } = await supabase.from("stock_transfers").insert({
    transfer_no: transferNo,
    date: new Date().toISOString().slice(0, 10),
    from_store_id: fromStoreId,
    to_store_id: toStoreId,
    status: "COMPLETED",
    remarks,
    created_by: user?.id ?? null,
  }).select("id").single();

  if (tErr) return { error: tErr.message };
  const transferId = (transferRow as Record<string, unknown>)['id'] as string;

  for (const item of items) {
    await supabase.from("stock_transfer_items").insert({
      transfer_id: transferId,
      item_code: item.itemCode,
      item_name: item.itemName,
      lot_id: item.lotId,
      qty: item.qty,
      imei: item.imei || null,
      purchase_price: item.purchasePrice,
    });

    const { data: srcLot } = await supabase.from("stock_lots").select("qty").eq("id", item.lotId).maybeSingle();
    if (srcLot) {
      const newSrcQty = ((srcLot as Record<string, unknown>)['qty'] as number) - item.qty;
      if (newSrcQty > 0) {
        await supabase.from("stock_lots").update({ qty: newSrcQty }).eq("id", item.lotId);
      } else {
        await supabase.from("stock_lots").delete().eq("id", item.lotId);
      }
    }

    const { data: existingDestLot } = await supabase.from("stock_lots")
      .select("id, qty")
      .eq("item_name", item.itemName)
      .eq("store_id", toStoreId)
      .eq("purchase_price", item.purchasePrice)
      .maybeSingle();

    if (existingDestLot) {
      const destLotQty = (existingDestLot as Record<string, unknown>)['qty'] as number;
      await supabase.from("stock_lots").update({ qty: destLotQty + item.qty }).eq("id", (existingDestLot as Record<string, unknown>)['id']);
    } else {
      const destLotNo = await getNextLotNo();
      await supabase.from("stock_lots").insert({
        lot_no: destLotNo,
        purchase_id: null,
        item_code: item.itemCode,
        item_name: item.itemName,
        date: new Date().toISOString().slice(0, 10),
        supplier: "Transfer",
        qty: item.qty,
        purchase_price: item.purchasePrice,
        store_id: toStoreId,
      });
    }

    if (item.imei) {
      await supabase.from("purchase_item_imeis").delete().eq("imei", item.imei);
      const { data: newLot } = await supabase.from("stock_lots").select("id").eq("item_name", item.itemName).eq("store_id", toStoreId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (newLot) {
        await supabase.from("purchase_item_imeis").insert({
          imei: item.imei,
          item_code: item.itemCode,
          item_name: item.itemName,
          lot_id: (newLot as Record<string, unknown>)['id'],
          is_sold: false,
          store_id: toStoreId,
        });
      }
    }
  }

  await reconcileStockQty(fromStoreId);
  await reconcileStockQty(toStoreId);
  await reload();
  return { transferNo };
}

async function reconcileStockQty(storeId: string) {
  const { data: lots } = await supabase.from("stock_lots").select("item_name, qty").eq("store_id", storeId);
  if (!lots) return;
  const qtyMap = new Map<string, number>();
  for (const l of lots) {
    const name = (l as Record<string, unknown>)['item_name'] as string;
    const qty = (l as Record<string, unknown>)['qty'] as number;
    qtyMap.set(name, (qtyMap.get(name) || 0) + qty);
  }
  const { data: stockItems } = await supabase.from("stock").select("name").eq("store_id", storeId);
  if (stockItems) {
    for (const s of stockItems) {
      const name = (s as Record<string, unknown>)['name'] as string;
      const totalQty = qtyMap.get(name) || 0;
      await supabase.from("stock").update({ qty: totalQty }).eq("name", name).eq("store_id", storeId);
    }
  }
}

export async function deleteTransfer(transferId: string): Promise<{ error?: string }> {
  const { data: items } = await supabase.from("stock_transfer_items").select("*").eq("transfer_id", transferId);
  if (!items || items.length === 0) return { error: "Transfer not found" };

  const { data: transfer } = await supabase.from("stock_transfers").select("from_store_id, to_store_id").eq("id", transferId).maybeSingle();
  if (!transfer) return { error: "Transfer not found" };

  const fromStoreId = (transfer as Record<string, unknown>)['from_store_id'] as string;
  const toStoreId = (transfer as Record<string, unknown>)['to_store_id'] as string;

  for (const item of items) {
    const ti = item as Record<string, unknown>;
    const lotId = ti['lot_id'] as string;
    const qty = ti['qty'] as number;
    const itemName = ti['item_name'] as string;
    const itemCode = ti['item_code'] as string;
    const purchasePrice = ti['purchase_price'] as number;
    const imei = ti['imei'] as string | null;

    const { data: destLot } = await supabase.from("stock_lots").select("qty").eq("id", lotId).maybeSingle();
    if (destLot) {
      const destQty = (destLot as Record<string, unknown>)['qty'] as number;
      const newDestQty = destQty - qty;
      if (newDestQty > 0) {
        await supabase.from("stock_lots").update({ qty: newDestQty }).eq("id", lotId);
      } else {
        await supabase.from("stock_lots").delete().eq("id", lotId);
      }
    }

    const { data: srcLots } = await supabase.from("stock_lots")
      .select("id, qty")
      .eq("item_name", itemName)
      .eq("store_id", fromStoreId)
      .eq("purchase_price", purchasePrice)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (srcLots) {
      const srcQty = (srcLots as Record<string, unknown>)['qty'] as number;
      await supabase.from("stock_lots").update({ qty: srcQty + qty }).eq("id", (srcLots as Record<string, unknown>)['id']);
    } else {
      const srcLotNo = await getNextLotNo();
      await supabase.from("stock_lots").insert({
        lot_no: srcLotNo,
        purchase_id: null,
        item_code: itemCode,
        item_name: itemName,
        date: new Date().toISOString().slice(0, 10),
        supplier: "Transfer Reversal",
        qty,
        purchase_price: purchasePrice,
        store_id: fromStoreId,
      });
    }

    if (imei) {
      const { data: restoredLot } = await supabase.from("stock_lots").select("id").eq("item_name", itemName).eq("store_id", fromStoreId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (restoredLot) {
        await supabase.from("purchase_item_imeis").insert({
          imei,
          item_code: itemCode,
          item_name: itemName,
          lot_id: (restoredLot as Record<string, unknown>)['id'],
          is_sold: false,
          store_id: fromStoreId,
        });
      }
    }
  }

  await supabase.from("stock_transfer_items").delete().eq("transfer_id", transferId);
  await supabase.from("stock_transfers").delete().eq("id", transferId);
  await reconcileStockQty(fromStoreId);
  await reconcileStockQty(toStoreId);
  await reload();
  return {};
}

export async function getTransfers(): Promise<StockTransfer[]> {
  const { data } = await supabase.from("stock_transfers").select("*").order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r['id'] as string,
    transferNo: r['transfer_no'] as string,
    date: r['date'] as string,
    fromStoreId: r['from_store_id'] as string | null,
    toStoreId: r['to_store_id'] as string | null,
    status: r['status'] as string,
    remarks: r['remarks'] as string,
    createdBy: r['created_by'] as string | null,
    createdAt: r['created_at'] as string,
  }));
}

export async function getTransferItems(transferId: string): Promise<StockTransferItem[]> {
  const { data } = await supabase.from("stock_transfer_items").select("*").eq("transfer_id", transferId);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r['id'] as string,
    transferId: r['transfer_id'] as string,
    itemCode: r['item_code'] as string,
    itemName: r['item_name'] as string,
    lotId: r['lot_id'] as string | null,
    qty: r['qty'] as number,
    imei: r['imei'] as string | null,
    purchasePrice: r['purchase_price'] as number,
    createdAt: r['created_at'] as string,
  }));
}

async function reload() {
  nextStockCode = null; // Reset so next insert reads fresh MAX(code) from DB

  let stockQuery = supabase.from("stock").select("*").order("name");
  let salesQuery = supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(5000);
  let purchasesQuery = supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(5000);

  if (_currentStoreId) {
    stockQuery = stockQuery.eq("store_id", _currentStoreId);
    salesQuery = salesQuery.eq("store_id", _currentStoreId);
    purchasesQuery = purchasesQuery.eq("store_id", _currentStoreId);
  }

  const [stockRes, salesRes, purchasesRes] = await Promise.all([
    stockQuery,
    salesQuery,
    purchasesQuery,
  ]);

  let lots: StockLot[] = [];
  let allocs: SaleAllocation[] = [];
  let adjustments: StockAdjustment[] = [];
  try {
    let lotsQuery = supabase.from("stock_lots").select("*").order("created_at", { ascending: false }).limit(10000);
    let allocQuery = supabase.from("sale_lot_allocations").select("*").limit(10000);
    let adjQuery = supabase.from("stock_adjustments").select("*").order("created_at", { ascending: false }).limit(10000);

    if (_currentStoreId) {
      lotsQuery = lotsQuery.eq("store_id", _currentStoreId);
      allocQuery = allocQuery.eq("store_id", _currentStoreId);
      adjQuery = adjQuery.eq("store_id", _currentStoreId);
    }

    const [lotsRes, allocRes, adjRes] = await Promise.all([
      lotsQuery,
      allocQuery,
      adjQuery,
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
    let headersQuery = supabase.from("purchase_headers").select("*").order("created_at", { ascending: false }).limit(5000);
    let itemsQuery = supabase.from("purchase_items").select("*").order("sn", { ascending: true }).limit(10000);
    let imeisQuery = supabase.from("purchase_item_imeis").select("*").limit(20000);
    let attachQuery = supabase.from("purchase_attachments").select("*").limit(10000);

    if (_currentStoreId) {
      headersQuery = headersQuery.eq("store_id", _currentStoreId);
      itemsQuery = itemsQuery.eq("store_id", _currentStoreId);
      imeisQuery = imeisQuery.eq("store_id", _currentStoreId);
      attachQuery = attachQuery.eq("store_id", _currentStoreId);
    }

    const [headersRes, itemsRes, imeisRes, attachRes] = await Promise.all([
      headersQuery,
      itemsQuery,
      imeisQuery,
      attachQuery,
    ]);
    ph = (headersRes.data ?? []).map(mapPurchaseHeaderRow);
    pi = (itemsRes.data ?? []).map(mapPurchaseItemRow);
    pImeis = (imeisRes.data ?? []).map(mapPurchaseImeiRow);
    pAttach = (attachRes.data ?? []).map(mapPurchaseAttachmentRow);
  } catch (_) {}

  let saleImeis: SaleItemImei[] = [];
  let salesReturns: SalesReturn[] = [];
  try {
    let saleImeiQuery = supabase.from("sale_item_imeis").select("*").limit(20000);
    let returnsQuery = supabase.from("sales_returns").select("*").order("created_at", { ascending: false }).limit(5000);

    if (_currentStoreId) {
      saleImeiQuery = saleImeiQuery.eq("store_id", _currentStoreId);
      returnsQuery = returnsQuery.eq("store_id", _currentStoreId);
    }

    const [saleImeiRes, returnsRes] = await Promise.all([
      saleImeiQuery,
      returnsQuery,
    ]);
    saleImeis = (saleImeiRes.data ?? []).map(mapSaleImeiRow);
    salesReturns = (returnsRes.data ?? []).map(mapSalesReturnRow);
  } catch (_) {}

  let vendors: Vendor[] = [];
  let vendorTransactions: VendorTransaction[] = [];
  let vendorPaymentsList: VendorPayment[] = [];
  let vendorPaymentAllocs: VendorPaymentAllocation[] = [];
  let purchaseReturnsList: PurchaseReturn[] = [];
  let vendorDocs: VendorDocument[] = [];
  try {
    let vendorsQuery = supabase.from("vendors").select("*").order("vendor_name");
    let txnsQuery = supabase.from("vendor_transactions").select("*").order("transaction_date", { ascending: true }).limit(20000);
    let vpQuery = supabase.from("vendor_payments").select("*").order("created_at", { ascending: false }).limit(5000);
    let vpaQuery = supabase.from("vendor_payment_allocations").select("*").limit(10000);
    let prQuery = supabase.from("purchase_returns").select("*").order("created_at", { ascending: false }).limit(5000);
    let vdQuery = supabase.from("vendor_documents").select("*").limit(10000);

    if (_currentStoreId) {
      vendorsQuery = vendorsQuery.eq("store_id", _currentStoreId);
      txnsQuery = txnsQuery.eq("store_id", _currentStoreId);
      vpQuery = vpQuery.eq("store_id", _currentStoreId);
      vpaQuery = vpaQuery.eq("store_id", _currentStoreId);
      prQuery = prQuery.eq("store_id", _currentStoreId);
      vdQuery = vdQuery.eq("store_id", _currentStoreId);
    }

    const [vendorsRes, txnsRes, vpRes, vpaRes, prRes, vdRes] = await Promise.all([
      vendorsQuery,
      txnsQuery,
      vpQuery,
      vpaQuery,
      prQuery,
      vdQuery,
    ]);
    vendors = (vendorsRes.data ?? []).map(mapVendorRow);
    vendorTransactions = (txnsRes.data ?? []).map(mapVendorTransactionRow);
    vendorPaymentsList = (vpRes.data ?? []).map(mapVendorPaymentRow);
    vendorPaymentAllocs = (vpaRes.data ?? []).map(mapVendorPaymentAllocationRow);
    purchaseReturnsList = (prRes.data ?? []).map(mapPurchaseReturnRow);
    vendorDocs = (vdRes.data ?? []).map(mapVendorDocumentRow);
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
    saleImeis,
    salesReturns,
    vendors,
    vendorTransactions,
    vendorPayments: vendorPaymentsList,
    vendorPaymentAllocations: vendorPaymentAllocs,
    purchaseReturns: purchaseReturnsList,
    vendorDocuments: vendorDocs,
  };
  emit();
}
