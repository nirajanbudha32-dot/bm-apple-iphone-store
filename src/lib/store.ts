import { useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import { useStoreContext } from "@/lib/store-context";

let _currentStoreId: string | null = null;
export function setCurrentStoreIdForStore(id: string | null) { _currentStoreId = id; }
export function getCurrentStoreId(): string | null { return _currentStoreId; }

// Double-submit prevention guard
const inFlightOps = new Set<string>();
function acquireOp(key: string): boolean {
  if (inFlightOps.has(key)) return false;
  inFlightOps.add(key);
  return true;
}
function releaseOp(key: string) { inFlightOps.delete(key); }

// Audit trail logger
async function logAudit(action: string, tableName: string, recordId?: string, oldData?: unknown, newData?: unknown) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert({
      user_id: user?.id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData ? JSON.stringify(oldData) : null,
      new_data: newData ? JSON.stringify(newData) : null,
    });
  } catch (err) {
    console.error("[store] audit log failed:", err);
  }
}

// File upload size validation (10MB max)
const MAX_FILE_BASE64_LENGTH = 13_981_016;
function validateFileSize(fileData: string): string | null {
  if (fileData.length > MAX_FILE_BASE64_LENGTH) return "File too large. Maximum size is 10MB.";
  return null;
}

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
  destItemCode: string | null;
  destItemName: string | null;
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
  const { data, error } = await supabase.rpc("next_invoice_no");
  if (error) throw new Error(`Failed to generate invoice number: ${error.message}`);
  return data as string;
}

export async function peekInvoiceNo(): Promise<string> {
  const { data, error } = await supabase.rpc("peek_invoice_no");
  if (error) throw new Error(`Failed to peek invoice number: ${error.message}`);
  return data as string;
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
  const opKey = `addBill:${invoiceNo}`;
  if (!acquireOp(opKey)) return { error: "Operation already in progress" };
  try {
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

        const { error: fifoErr } = await supabase.rpc("fifo_deduct", {
          p_item_name: inserted.item_name,
          p_qty: inserted.qty,
          p_sale_id: inserted.id,
        });
        if (fifoErr) {
          console.error("[store] fifo_deduct failed:", fifoErr);
          return { error: `Stock deduction failed for "${inserted.item_name}": ${fifoErr.message}` };
        }

        const imeis = imeisByItem[idx] || [];
        if (imeis.length > 0) {
          const imeiRows = imeis.map((imei) => ({
            sale_id: inserted.id,
            imei,
            store_id: _currentStoreId,
          }));
          const { error: imeiErr } = await supabase.from("sale_item_imeis").insert(imeiRows);
          if (imeiErr) console.error("[store] sale IMEI insert failed:", imeiErr);
        }

        affectedItems.add(inserted.item_name);
      }

      for (const itemName of affectedItems) {
        try {
          await supabase.rpc("reconcile_stock_from_lots", { p_item_name: itemName, p_store_id: _currentStoreId });
        } catch (err) {
          console.error("[store] reconcile_stock_from_lots failed:", err);
        }
      }

      await logAudit("INSERT", "sales", undefined, null, { invoice_no: invoiceNo, items: items.length });
      await reload();
    }
    return { error: salesError };
  } finally {
    releaseOp(opKey);
  }
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
        await supabase.rpc("adjust_lot_qty", { p_lot_id: lotId, p_delta: qtyTaken });
      }
      await supabase.from("sale_lot_allocations").delete().eq("sale_id", id);
      lotRestored = true;
    }
  } catch (err) {
    console.error("[store] deleteSale lot restore failed:", err);
  }

  try {
    await supabase.from("sale_item_imeis").delete().eq("sale_id", id);
  } catch (err) {
    console.error("[store] deleteSale IMEI delete failed:", err);
  }

  await supabase.from("sales").delete().eq("id", id);

  if (!lotRestored) {
    await supabase.rpc("increment_stock", { item_name: sale.itemName, qty_returned: sale.qty });
  }

  try {
    await supabase.rpc("reconcile_stock_from_lots", { p_item_name: sale.itemName, p_store_id: _currentStoreId });
  } catch (err) {
    console.error("[store] deleteSale reconcile failed:", err);
  }

  await logAudit("DELETE", "sales", id, { invoice_no: sale.invoiceNo, item_name: sale.itemName });
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
          await supabase.rpc("adjust_lot_qty", { p_lot_id: lotId, p_delta: qtyTaken });
        }
        await supabase.from("sale_lot_allocations").delete().eq("sale_id", sale.id);
        lotRestored = true;
      }
    }
  } catch (err) {
    console.error("[store] deleteInvoice lot restore failed:", err);
  }

  try {
    const saleIds = items.map((s) => s.id);
    for (const saleId of saleIds) {
      await supabase.from("sale_item_imeis").delete().eq("sale_id", saleId);
    }
  } catch (err) {
    console.error("[store] deleteInvoice IMEI delete failed:", err);
  }

  await supabase.from("sales").delete().eq("invoice_no", invoiceNo);

  if (!lotRestored) {
    await Promise.all(
      items.map((item) =>
        supabase.rpc("increment_stock", { item_name: item.itemName, qty_returned: item.qty })
      )
    );
  }

  const affectedItems = new Set(items.map((i) => i.itemName));
  for (const itemName of affectedItems) {
    try {
      await supabase.rpc("reconcile_stock_from_lots", { p_item_name: itemName, p_store_id: _currentStoreId });
    } catch (err) {
      console.error("[store] deleteInvoice reconcile failed:", err);
    }
  }

  await logAudit("DELETE", "sales", undefined, { invoice_no: invoiceNo, item_count: items.length });
  await reload();
}

export async function upsertStock(item: StockItem, originalCode?: string) {
  const { error } = await supabase.from("stock").upsert({
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
    store_id: _currentStoreId,
  }, { onConflict: "code" });
  if (error) return { error: error.message };
  await reload();
  return {};
}

export async function deleteStock(code: string) {
  try {
    const { data: stockItem } = await supabase.from("stock").select("name").eq("code", code).maybeSingle();
    if (stockItem) {
      await supabase.from("stock_lots").delete().eq("item_name", (stockItem as Record<string, unknown>)['name'] as string);
    }
  } catch (err) {
    console.error("[store] deleteStock lot cleanup failed:", err);
  }
  await supabase.from("stock").delete().eq("code", code);
  await logAudit("DELETE", "stock", undefined, { code });
  await reload();
}

export async function calculateMaxStockCode(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("next_stock_code");
    if (!error && data) {
      const parsed = Number(data);
      if (Number.isFinite(parsed) && parsed > 0) return parsed - 1;
    }
  } catch (err) {
    console.error("[store] calculateMaxStockCode RPC failed:", err);
  }

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
  } catch (err) {
    console.error("[store] calculateMaxLotNo RPC failed:", err);
  }

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
    } catch (err) {
      console.error("[store] addPurchase next_lot_no failed:", err);
    }

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
  } catch (err) {
    console.error("[store] deletePurchase lot cleanup failed:", err);
  }

  await supabase.from("purchases").delete().eq("id", id);
  await applyStockDelta(p, -p.qty);
  await reload();
}

export async function nextPurchaseNo(): Promise<string> {
  const { data, error } = await supabase.rpc("next_purchase_no");
  if (error) throw new Error(`Failed to generate purchase number: ${error.message}`);
  return data as string;
}

export async function addPurchaseHeader(
  header: Omit<PurchaseHeader, "id" | "createdAt">,
  items: Omit<PurchaseItem, "id" | "purchaseHeaderId">[],
  imeisByItem: Record<number, string[]>,
  destinationStoreId?: string,
): Promise<{ error?: string; headerId?: string }> {
  const opKey = `addPurchaseHeader:${header.purchaseNo}`;
  if (!acquireOp(opKey)) return { error: "Operation already in progress" };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetStoreId = destinationStoreId || _currentStoreId;

    let purchaseNo = header.purchaseNo;
    try {
      const { data: noResult, error: noErr } = await supabase.rpc("next_purchase_no");
      if (!noErr && noResult) {
        purchaseNo = noResult as string;
      }
    } catch (err) {
      console.error("[store] next_purchase_no failed:", err);
    }

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

      let lotNo = item.lotNo?.trim();
      if (!lotNo) {
        try {
          const { data: lotNoResult, error: lotErr } = await supabase.rpc("next_lot_no");
          if (!lotErr && lotNoResult) {
            lotNo = lotNoResult as string;
          }
        } catch (err) {
          console.error("[store] next_lot_no failed:", err);
        }
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
        console.warn("[store] Stock lot insert warning for " + item.itemName, lotInsertErr.message);
      }
    }

    const vendorIdForTxn = (header as Record<string, unknown>)['vendorId'] as string | undefined;
    if (vendorIdForTxn && header.grandTotal > 0) {
      const paidAmt = header.paidAmount ?? 0;
      await supabase.rpc("insert_vendor_txn", {
        p_vendor_id: vendorIdForTxn,
        p_txn_type: "PURCHASE",
        p_ref_no: purchaseNo,
        p_ref_id: headerId,
        p_txn_date: header.date,
        p_debit: header.grandTotal,
        p_credit: 0,
        p_remarks: `Purchase ${purchaseNo}`,
        p_store_id: targetStoreId,
      });

      if (paidAmt > 0) {
        const purchasePaymentNo = await nextVendorPaymentNo();
        const { data: paymentInserted } = await supabase.from("vendor_payments").insert({
          payment_no: purchasePaymentNo,
          vendor_id: vendorIdForTxn,
          payment_date: header.date,
          payment_method: header.paymentMethod,
          amount: paidAmt,
          bank_name: "",
          reference_no: purchaseNo,
          remarks: `Payment at purchase ${purchaseNo}`,
          created_by: user?.id ?? null,
          store_id: targetStoreId,
        }).select("id").single();

        if (paymentInserted) {
          await supabase.from("vendor_payment_allocations").insert({
            payment_id: paymentInserted.id,
            purchase_header_id: headerId,
            amount: paidAmt,
            allocation_type: "bill",
            store_id: targetStoreId,
          });
        }

        await supabase.rpc("insert_vendor_txn", {
          p_vendor_id: vendorIdForTxn,
          p_txn_type: "PAYMENT",
          p_ref_no: purchasePaymentNo,
          p_ref_id: paymentInserted?.id ?? headerId,
          p_txn_date: header.date,
          p_debit: 0,
          p_credit: paidAmt,
          p_remarks: `Payment at purchase ${purchaseNo}`,
          p_store_id: targetStoreId,
        });
      }
    }

    await logAudit("INSERT", "purchase_headers", headerId, null, { purchase_no: purchaseNo, items: items.length });
    await reload();
    return { headerId };
  } finally {
    releaseOp(opKey);
  }
}

export async function deletePurchaseHeader(id: string): Promise<{ error?: string }> {
  try {
    const { data: linkedPayments } = await supabase.from("vendor_payment_allocations").select("payment_id").eq("purchase_header_id", id);
    const linkedPaymentIds = [...new Set((linkedPayments ?? []).map((p) => p.payment_id as string))];

    await supabase.from("vendor_payment_allocations").delete().eq("purchase_header_id", id);

    const header = state.purchaseHeaders.find((h) => h.id === id);
    if (header) {
      const { data: autoPayments } = await supabase.from("vendor_payments").select("id").eq("reference_no", header.purchaseNo);
      if (autoPayments && autoPayments.length > 0) {
        for (const ap of autoPayments) {
          await supabase.from("vendor_payment_allocations").delete().eq("payment_id", ap.id);
          await supabase.from("vendor_payments").delete().eq("id", ap.id);
        }
      }
    }

    await supabase.from("vendor_transactions").delete().eq("reference_id", id);
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
        } catch (err) {
          console.error("[store] deletePurchaseHeader lot delete failed:", err);
        }
      }
      try {
        await supabase.rpc("adjust_stock_by_code", { p_code: item.itemCode, p_delta: -item.qty });
      } catch (err) {
        console.error("[store] deletePurchaseHeader stock adjust failed:", err);
      }
      try {
        await supabase.from("purchase_item_imeis").delete().eq("purchase_item_id", item.id);
      } catch (err) {
        console.error("[store] deletePurchaseHeader IMEI delete failed:", err);
      }
    }

    await supabase.from("purchase_items").delete().eq("purchase_header_id", id);
    await supabase.from("purchase_attachments").delete().eq("purchase_header_id", id);
    await supabase.from("purchase_headers").delete().eq("id", id);

    await logAudit("DELETE", "purchase_headers", id, { purchase_no: header?.purchaseNo });
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
  const sizeErr = validateFileSize(fileData);
  if (sizeErr) return { error: sizeErr };
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

  await supabase.rpc("adjust_lot_qty", { p_lot_id: lotId, p_delta: qtyAdjusted });
  await supabase.rpc("reconcile_stock_from_lots", { p_item_name: lot.itemName, p_store_id: _currentStoreId });
  await logAudit("INSERT", "stock_adjustments", undefined, null, { lot_id: lotId, qty_adjusted: qtyAdjusted, reason });
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
  const opKey = `addSalesReturn:${saleId}:${lotId}`;
  if (!acquireOp(opKey)) return { error: "Operation already in progress" };
  try {
    const { data: { user } } = await supabase.auth.getUser();

    let returnNo = "";
    try {
      const { data: noResult, error: noErr } = await supabase.rpc("next_return_no");
      if (!noErr && noResult) returnNo = noResult as string;
    } catch (err) {
      console.error("[store] next_return_no failed:", err);
    }

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

    if (lotId) {
      await supabase.rpc("adjust_lot_qty", { p_lot_id: lotId, p_delta: qty });
    }

    if (saleId && lotId) {
      try {
        await supabase.from("sale_lot_allocations").delete().eq("sale_id", saleId).eq("lot_id", lotId);
      } catch (err) {
        console.error("[store] addSalesReturn alloc delete failed:", err);
      }
    }

    if (imei && saleId) {
      try {
        await supabase.from("sale_item_imeis").delete().eq("sale_id", saleId).eq("imei", imei);
      } catch (err) {
        console.error("[store] addSalesReturn IMEI delete failed:", err);
      }
    }

    try {
      await supabase.rpc("reconcile_stock_from_lots", { p_item_name: itemName, p_store_id: _currentStoreId });
    } catch (err) {
      console.error("[store] addSalesReturn reconcile failed:", err);
    }

    if (saleId) {
      try {
        const { data: existingReturns } = await supabase.from("sales_returns").select("qty").eq("sale_id", saleId);
        const totalReturned = (existingReturns ?? []).reduce((sum: number, r: Record<string, unknown>) => sum + (r['qty'] as number), 0);
        const newStatus = totalReturned >= qty ? "RETURNED" : "PARTIALLY_RETURNED";
        await supabase.from("sales").update({ status: newStatus }).eq("id", saleId);
      } catch (err) {
        console.error("[store] addSalesReturn status update failed:", err);
      }
    }

    await logAudit("INSERT", "sales_returns", undefined, null, { return_no: returnNo, sale_id: saleId, qty });
    await reload();
    return {};
  } finally {
    releaseOp(opKey);
  }
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
  const { data, error } = await supabase.rpc("next_vendor_code");
  if (error) throw new Error(`Failed to generate vendor code: ${error.message}`);
  return data as string;
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
  const sizeErr = validateFileSize(fileData);
  if (sizeErr) return { error: sizeErr };
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
  const { data, error } = await supabase.rpc("next_vendor_payment_no");
  if (error) throw new Error(`Failed to generate payment number: ${error.message}`);
  return data as string;
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
  const opKey = `addVendorPayment:${vendorId}:${paymentDate}`;
  if (!acquireOp(opKey)) return { error: "Operation already in progress" };
  try {
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
        if (allocType === "bill" && alloc.purchaseHeaderId) {
          await supabase.rpc("adjust_purchase_balance", {
            p_header_id: alloc.purchaseHeaderId,
            p_paid_delta: alloc.amount,
            p_remaining_delta: -alloc.amount,
          });
        }
      }
    }

    await supabase.rpc("insert_vendor_txn", {
      p_vendor_id: vendorId,
      p_txn_type: "PAYMENT",
      p_ref_no: paymentNo,
      p_ref_id: paymentId,
      p_txn_date: paymentDate,
      p_debit: 0,
      p_credit: amount,
      p_remarks: remarks || `Payment ${paymentNo}`,
      p_store_id: _currentStoreId,
    });

    await logAudit("INSERT", "vendor_payments", paymentId, null, { payment_no: paymentNo, vendor_id: vendorId, amount });
    await reload();
    return {};
  } finally {
    releaseOp(opKey);
  }
}

export async function nextPurchaseReturnNo(): Promise<string> {
  const { data, error } = await supabase.rpc("next_purchase_return_no");
  if (error) throw new Error(`Failed to generate purchase return number: ${error.message}`);
  return data as string;
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
  const opKey = `addPurchaseReturn:${lotId}:${imei}`;
  if (!acquireOp(opKey)) return { error: "Operation already in progress" };
  try {
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

    if (lotId) {
      await supabase.rpc("adjust_lot_qty", { p_lot_id: lotId, p_delta: -qty });
    }

    try {
      await supabase.rpc("reconcile_stock_from_lots", { p_item_name: itemName, p_store_id: _currentStoreId });
    } catch (err) {
      console.error("[store] addPurchaseReturn reconcile failed:", err);
    }

    if (vendorId) {
      await supabase.rpc("insert_vendor_txn", {
        p_vendor_id: vendorId,
        p_txn_type: "PURCHASE_RETURN",
        p_ref_no: returnNo,
        p_ref_id: null,
        p_txn_date: returnDate,
        p_debit: 0,
        p_credit: refundAmount,
        p_remarks: reason || `Return ${returnNo}`,
        p_store_id: _currentStoreId,
      });
    }

    if (purchaseHeaderId) {
      await supabase.rpc("adjust_purchase_balance", {
        p_header_id: purchaseHeaderId,
        p_paid_delta: 0,
        p_remaining_delta: -refundAmount,
      });
    }

    if (imei) {
      try {
        const { data: piRow } = await supabase.from("purchase_items").select("id").eq("item_code", itemCode).eq("purchase_header_id", purchaseHeaderId).maybeSingle();
        if (piRow) {
          await supabase.from("purchase_item_imeis").delete().eq("purchase_item_id", piRow.id).eq("imei", imei);
        }
      } catch (err) {
        console.error("[store] addPurchaseReturn IMEI cleanup failed:", err);
      }
    }

    await logAudit("INSERT", "purchase_returns", undefined, null, { return_no: returnNo, vendor_id: vendorId, qty });
    await reload();
    return {};
  } finally {
    releaseOp(opKey);
  }
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

  await supabase.rpc("adjust_purchase_balance", {
    p_header_id: purchaseHeaderId,
    p_paid_delta: amount,
    p_remaining_delta: -amount,
  });

  await supabase.rpc("insert_vendor_txn", {
    p_vendor_id: vendorId,
    p_txn_type: "ADVANCE_APPLIED",
    p_ref_no: paymentNo,
    p_ref_id: paymentId,
    p_txn_date: paymentDate,
    p_debit: 0,
    p_credit: amount,
    p_remarks: `Advance applied to purchase`,
    p_store_id: _currentStoreId,
  });

  await logAudit("INSERT", "vendor_payments", paymentId, null, { advance_applied: amount, purchase_header_id: purchaseHeaderId });
  await reload();
  return {};
}

export async function getNextTransferNo(): Promise<string> {
  const { data, error } = await supabase.rpc("next_transfer_no");
  if (error) throw new Error(`Failed to generate transfer number: ${error.message}`);
  return data as string;
}

export async function createTransfer(
  fromStoreId: string,
  toStoreId: string,
  items: Array<{ itemCode: string; itemName: string; lotId: string; qty: number; imei?: string; purchasePrice: number; destItemCode?: string; destItemName?: string }>,
  remarks: string = "",
): Promise<{ error?: string; transferNo?: string }> {
  if (fromStoreId === toStoreId) return { error: "Source and destination cannot be the same" };
  if (items.length === 0) return { error: "Add at least one item to transfer" };

  const opKey = `createTransfer:${fromStoreId}:${toStoreId}:${Date.now()}`;
  if (!acquireOp(opKey)) return { error: "Operation already in progress" };
  try {
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
      await supabase.rpc("adjust_lot_qty", { p_lot_id: item.lotId, p_delta: -item.qty });

      let destLotId: string | null = null;
      const destName = item.destItemName || item.itemName;
      const destCode = item.destItemCode || item.itemCode;
      const { data: existingDestLot } = await supabase.from("stock_lots")
        .select("id, qty")
        .eq("item_name", destName)
        .eq("store_id", toStoreId)
        .eq("purchase_price", item.purchasePrice)
        .maybeSingle();

      if (existingDestLot) {
        destLotId = (existingDestLot as Record<string, unknown>)['id'] as string;
        await supabase.rpc("adjust_lot_qty", { p_lot_id: destLotId, p_delta: item.qty });
      } else {
        const destLotNo = await getNextLotNo();
        const { data: newDestLot } = await supabase.from("stock_lots").insert({
          lot_no: destLotNo,
          purchase_id: null,
          item_code: destCode,
          item_name: destName,
          date: new Date().toISOString().slice(0, 10),
          supplier: "Transfer",
          qty: item.qty,
          purchase_price: item.purchasePrice,
          store_id: toStoreId,
        }).select("id").maybeSingle();
        destLotId = newDestLot ? (newDestLot as Record<string, unknown>)['id'] as string : null;
      }

      await supabase.from("stock_transfer_items").insert({
        transfer_id: transferId,
        item_code: item.itemCode,
        item_name: item.itemName,
        dest_item_code: destCode,
        dest_item_name: destName,
        lot_id: destLotId,
        qty: item.qty,
        imei: item.imei || null,
        purchase_price: item.purchasePrice,
      });

      if (item.imei) {
        await supabase.from("purchase_item_imeis").delete().eq("imei", item.imei);
        const { data: newLot } = await supabase.from("stock_lots").select("id").eq("item_name", destName).eq("store_id", toStoreId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (newLot) {
          await supabase.from("purchase_item_imeis").insert({
            imei: item.imei,
            item_code: destCode,
            item_name: destName,
            lot_id: (newLot as Record<string, unknown>)['id'],
            is_sold: false,
            store_id: toStoreId,
          });
        }
      }
    }

    await reconcileStockQty(fromStoreId);
    await reconcileStockQty(toStoreId);
    await logAudit("INSERT", "stock_transfers", transferId, null, { transfer_no: transferNo, from: fromStoreId, to: toStoreId, items: items.length });
    await reload();
    return { transferNo };
  } finally {
    releaseOp(opKey);
  }
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
  const { data: stockItems } = await supabase.from("stock").select("name, code").eq("store_id", storeId);
  const existingNames = new Set<string>();
  if (stockItems) {
    for (const s of stockItems) {
      const name = (s as Record<string, unknown>)['name'] as string;
      existingNames.add(name);
      const totalQty = qtyMap.get(name) || 0;
      await supabase.from("stock").update({ qty: totalQty }).eq("name", name).eq("store_id", storeId);
    }
  }
  for (const [itemName, totalQty] of qtyMap) {
    if (!existingNames.has(itemName) && totalQty > 0) {
      const newCode = await getNextStockCode();
      await supabase.from("stock").insert({
        code: newCode,
        name: itemName,
        category: "General",
        sub_category: "",
        brand: "",
        sub_brand: "",
        model: "",
        unit: "PCS",
        qty: totalQty,
        purchase_price: 0,
        selling_price: 0,
        store_id: storeId,
      });
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

    await supabase.rpc("adjust_lot_qty", { p_lot_id: lotId, p_delta: -qty });

    const { data: srcLots } = await supabase.from("stock_lots")
      .select("id, qty")
      .eq("item_name", itemName)
      .eq("store_id", fromStoreId)
      .eq("purchase_price", purchasePrice)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (srcLots) {
      await supabase.rpc("adjust_lot_qty", { p_lot_id: (srcLots as Record<string, unknown>)['id'] as string, p_delta: qty });
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
  await logAudit("DELETE", "stock_transfers", transferId);
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
    destItemCode: (r['dest_item_code'] as string) ?? null,
    destItemName: (r['dest_item_name'] as string) ?? null,
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
  } catch (err) {
    console.error("[store] reload: lots/allocs/adj fetch failed:", err);
  }

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
  } catch (err) {
    console.error("[store] reload: purchase headers/items fetch failed:", err);
  }

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
  } catch (err) {
    console.error("[store] reload: sale IMEIs/returns fetch failed:", err);
  }

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
  } catch (err) {
    console.error("[store] reload: vendors/transactions/payments fetch failed:", err);
  }

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
