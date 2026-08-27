import { useEffect, useMemo, useState } from "react";
import { Download, Trash2, Plus, Check, Printer, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addBill,
  deleteInvoice,
  nextInvoiceNo,
  useStore,
  VAT_RATE,
  PAYMENT_METHODS,
  getAvailableImeis,
  type PaymentMethod,
  type BillItem,
} from "@/lib/store";
import { exportRows } from "@/lib/excel";
import { useDebounce } from "@/lib/use-debounce";
import { money, numberToWords } from "@/lib/utils";
import { useStoreContext } from "@/lib/store-context";

const DEFAULT_COMPANY = {
  name: "BM Apple iPhone Store",
  address: "Pokhara, Nepal",
  pan: "123456789",
  vatNo: "123456789",
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function SalesRegister() {
  const { stock, sales, saleImeis, stockLots } = useStore();
  const { currentStore } = useStoreContext();
  const [invoiceNo, setInvoiceNo] = useState("BM-AIS-0001");

  useEffect(() => {
    nextInvoiceNo().then(setInvoiceNo);
  }, [sales.length]);

  const COMPANY = {
    name: DEFAULT_COMPANY.name,
    address: currentStore?.address || DEFAULT_COMPANY.address,
    pan: currentStore?.pan || DEFAULT_COMPANY.pan,
    vatNo: currentStore?.vatNumber || DEFAULT_COMPANY.vatNo,
  };

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState("");
  const [customerPan, setCustomerPan] = useState("");
  const [hasVatPan, setHasVatPan] = useState(false);
  const [customerType, setCustomerType] = useState<"Individual" | "Business" | "VAT Registered">("Individual");
  const [customerContact, setCustomerContact] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [saleType, setSaleType] = useState<"Cash" | "Credit">("Cash");
  const [remarks, setRemarks] = useState("");

  const [itemName, setItemName] = useState("");
  const debouncedItemName = useDebounce(itemName, 150);
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);

  const [imeiInput, setImeiInput] = useState("");
  const [showImeiInput, setShowImeiInput] = useState(false);
  const [draftImeis, setDraftImeis] = useState<string[]>([]);
  const [availableImeis, setAvailableImeis] = useState<string[]>([]);
  const [expandedBillItem, setExpandedBillItem] = useState<number | null>(null);

  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billItemImeis, setBillItemImeis] = useState<Record<number, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [printData, setPrintData] = useState<{
    invoiceNo: string;
    date: string;
    customer: string;
    customerPan: string;
    hasVatPan: boolean;
    customerContact: string;
    customerLocation: string;
    paymentMethod: PaymentMethod;
    saleType: string;
    status: string;
    items: BillItem[];
    itemImeis: Record<number, string[]>;
    subtotal: number;
    headerDiscount: number;
    otherCharges: number;
    vat: number;
    total: number;
    paidAmount: number;
    remaining: number;
    remarks: string;
  } | null>(null);

  const suggestions = useMemo(() => {
    const t = debouncedItemName.trim().toLowerCase();
    if (!t) return [];
    const exact = stock.some((i) => i.name.toLowerCase() === t);
    if (exact) return [];
    return stock.filter((i) =>
      [i.name, i.subCategory, i.brand, i.model, i.code]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [stock, debouncedItemName]);

  const matched = useMemo(
    () => stock.find((i) => i.name.toLowerCase() === itemName.trim().toLowerCase()),
    [stock, itemName],
  );

  const billSubtotal = useMemo(() => billItems.reduce((a, i) => a + i.amount, 0), [billItems]);
  const billVat = useMemo(() => billItems.reduce((a, i) => a + i.vat, 0), [billItems]);
  const billItemTotal = useMemo(() => billItems.reduce((a, i) => a + i.total, 0), [billItems]);
  const billGrandTotal = useMemo(() => billItemTotal - headerDiscount + otherCharges, [billItemTotal, headerDiscount, otherCharges]);
  const billRemaining = useMemo(() => Math.max(0, billGrandTotal - paidAmount), [billGrandTotal, paidAmount]);

  function pick(name: string) {
    const item = stock.find((i) => i.name === name);
    setItemName(name);
    if (item?.sellingPrice) setItemRate(item.sellingPrice);
    // Fetch available IMEIs for this item
    getAvailableImeis(name).then((imeis) => setAvailableImeis(imeis));
  }

  function addToBill() {
    if (!itemName.trim()) {
      toast.error("Select an item");
      return;
    }
    if (itemQty <= 0 || itemRate <= 0) {
      toast.error("Enter valid quantity and rate");
      return;
    }
    if (matched && matched.qty < itemQty) {
      toast.error(`Insufficient stock. Available: ${matched.qty}`);
      return;
    }
    const amount = itemQty * itemRate - itemDiscount;
    const vat = amount * VAT_RATE;
    const newItem: BillItem = {
      itemCode: matched?.code ?? "",
      itemName: matched?.name ?? itemName.trim(),
      category: matched?.category ?? "",
      subCategory: matched?.subCategory ?? "",
      brand: matched?.brand ?? "",
      model: matched?.model ?? "",
      hsCode: "",
      qty: itemQty,
      rate: itemRate,
      discount: itemDiscount,
      amount,
      vat,
      total: amount + vat,
    };
    setBillItems((prev) => {
      const newIndex = prev.length;
      // Store IMEIs for this new item
      if (draftImeis.length > 0 || imeiInput.trim()) {
        const imeis = draftImeis.length > 0 ? [...draftImeis] : (imeiInput.trim() ? [imeiInput.trim()] : []);
        setBillItemImeis((prevImeis) => ({ ...prevImeis, [newIndex]: imeis }));
      }
      return [...prev, newItem];
    });
    setItemName("");
    setItemQty(1);
    setItemRate(0);
    setItemDiscount(0);
    setDraftImeis([]);
    setImeiInput("");
    setAvailableImeis([]);
  }

  function removeBillItem(index: number) {
    setBillItems((prev) => prev.filter((_, i) => i !== index));
    // Reindex IMEIs after removal
    setBillItemImeis((prev) => {
      const updated: Record<number, string[]> = {};
      let newIdx = 0;
      for (let i = 0; i < 100; i++) {
        if (i === index) continue;
        if (prev[i]) {
          updated[newIdx] = prev[i] as string[];
          newIdx++;
        }
      }
      return updated;
    });
  }

  async function saveBill() {
    if (!customer.trim()) {
      toast.error("Enter customer name");
      return;
    }
    if (billItems.length === 0) {
      toast.error("Add at least one item to the bill");
      return;
    }
    for (const item of billItems) {
      const inStock = stock.find((s) => s.code === item.itemCode || s.name === item.itemName);
      if (!inStock || inStock.qty < item.qty) {
        toast.error(`Insufficient stock for "${item.itemName}". Available: ${inStock?.qty ?? 0}, needed: ${item.qty}`);
        setSaving(false);
        return;
      }
    }
    setSaving(true);
    const { error } = await addBill(
      invoiceNo,
      date,
      customer.trim(),
      customerPan.trim(),
      hasVatPan,
      paymentMethod,
      billItems,
      headerDiscount,
      otherCharges,
      paidAmount,
      remarks.trim(),
      saleType,
      "CONFIRMED",
      customerType,
      customerContact.trim(),
      customerLocation.trim(),
      billItemImeis,
    );
    setSaving(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    setPrintData({
      invoiceNo,
      date,
      customer: customer.trim(),
      customerPan: customerPan.trim(),
      hasVatPan,
      customerContact: customerContact.trim(),
      customerLocation: customerLocation.trim(),
      paymentMethod,
      saleType,
      status: "CONFIRMED",
      items: [...billItems],
      itemImeis: { ...billItemImeis },
      subtotal: billSubtotal,
      headerDiscount,
      otherCharges,
      vat: billVat,
      total: billGrandTotal,
      paidAmount,
      remaining: billRemaining,
      remarks: remarks.trim(),
    });
    setCustomer("");
    setCustomerPan("");
    setHasVatPan(false);
    setCustomerType("Individual");
    setCustomerContact("");
    setCustomerLocation("");
    setBillItems([]);
    setBillItemImeis({});
    setPaymentMethod("Cash");
    setSaleType("Cash");
    setRemarks("");
    setHeaderDiscount(0);
    setOtherCharges(0);
    setPaidAmount(0);
    setSalesPage(0);
    toast.success(`${invoiceNo} saved with ${billItems.length} items`);
  }

  function printInvoice() {
    if (!printData) return;
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) { toast.error("Pop-up blocked. Allow pop-ups to print."); return; }

    const storePhone = currentStore?.phone || "";
    const storeEmail = currentStore?.email || "";
    const contactLine = [storePhone, storeEmail].filter(Boolean).join(" | ");

    function renderImeiRow(idx: number): string {
      const pd = printData;
      if (!pd) return "";
      const imeis = pd.itemImeis[idx];
      if (!imeis || imeis.length === 0) return "";
      return `<tr class="imei-row"><td></td><td colspan="10" style="font-size:10px;color:#6b7280;padding:2px 8px 6px;font-family:monospace">IMEI: ${imeis.map(esc).join(", ")}</td></tr>`;
    }

    w.document.write(`<!DOCTYPE html>
<html><head><title>Invoice ${esc(printData.invoiceNo)}</title>
<style>
  @page { margin: 15mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 11.5px; color: #1f2937; padding: 30px 40px; line-height: 1.5; }

  .header { text-align: center; margin-bottom: 24px; }
  .company-name { font-size: 22px; font-weight: 700; color: #16a34a; letter-spacing: 0.5px; }
  .company-address { font-size: 10px; color: #6b7280; margin-top: 3px; letter-spacing: 0.2px; }
  .company-contact { font-size: 10px; color: #6b7280; margin-top: 2px; letter-spacing: 0.2px; }
  .company-tagline { font-size: 11px; color: #6b7280; margin-top: 2px; letter-spacing: 0.3px; }
  .header-bar { width: 60px; height: 3px; background: #16a34a; margin: 10px auto 0; border-radius: 2px; }

  .info-grid { display: flex; gap: 20px; margin-bottom: 20px; }
  .info-card { flex: 1; border: 1px solid #e5e7eb; border-left: 3px solid #16a34a; border-radius: 6px; padding: 12px 14px; background: #fafafa; }
  .info-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin-bottom: 6px; }
  .info-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
  .info-row .lbl { color: #6b7280; }
  .info-row .val { font-weight: 600; color: #111827; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb; }
  thead th { background: #16a34a; color: #ffffff; font-weight: 600; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.4px; padding: 9px 8px; text-align: left; border: none; }
  tbody td { padding: 7px 8px; font-size: 11px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
  tbody tr:nth-child(even) { background: #f8faf9; }
  tbody tr:last-child td { border-bottom: 1px solid #e5e7eb; }
  .imei-row td { background: #f9fafb !important; border-bottom: 1px solid #f0f0f0 !important; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .row-num { color: #9ca3af; font-weight: 500; }

  .summary-section { display: flex; justify-content: flex-end; gap: 30px; margin-bottom: 16px; }
  .totals-box { width: 280px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
  .totals-header { background: #f0fdf4; padding: 8px 14px; font-weight: 700; font-size: 11px; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; }
  .totals-body { padding: 4px 0; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 14px; font-size: 11px; }
  .totals-row .t-label { color: #6b7280; }
  .totals-row .t-value { font-weight: 600; }
  .totals-divider { border-top: 1px solid #e5e7eb; margin: 0; }
  .grand-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #16a34a; color: #ffffff; font-size: 13px; font-weight: 700; }
  .payment-row { display: flex; justify-content: space-between; padding: 5px 14px; font-size: 11px; border-top: 1px solid #f0f0f0; }
  .badge-paid { display: inline-block; background: #dcfce7; color: #15803d; font-weight: 600; font-size: 10px; padding: 2px 8px; border-radius: 10px; }
  .badge-remaining { display: inline-block; background: #fee2e2; color: #dc2626; font-weight: 600; font-size: 10px; padding: 2px 8px; border-radius: 10px; }
  .badge-status { display: inline-block; background: #dbeafe; color: #1d4ed8; font-weight: 600; font-size: 10px; padding: 2px 8px; border-radius: 10px; }

  .amount-words { margin-bottom: 16px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 11px; }
  .amount-words .aw-label { font-weight: 700; color: #15803d; }

  .remarks-section { margin-bottom: 16px; padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 11px; }
  .remarks-section .r-label { font-weight: 700; color: #374151; }
  .remarks-section .r-value { color: #6b7280; margin-left: 4px; }

  .signatures { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; }
  .sig-box { width: 200px; text-align: center; }
  .sig-line { border-top: 1px solid #374151; margin-top: 50px; padding-top: 6px; font-size: 11px; font-weight: 600; color: #374151; }
  .sig-sub { font-size: 9.5px; color: #6b7280; font-weight: 400; }

  .footer { text-align: center; padding-top: 16px; border-top: 2px solid #e5e7eb; margin-top: 20px; }
  .footer-thanks { font-size: 13px; font-weight: 600; color: #16a34a; margin-bottom: 3px; }
  .footer-note { font-size: 9.5px; color: #9ca3af; font-style: italic; }

  @media print {
    body { padding: 0; }
    .info-card { break-inside: avoid; }
    table { break-inside: auto; }
    tr { break-inside: avoid; }
    .footer { margin-top: 20px; }
  }
</style></head><body>

<div class="header">
  <div class="company-name">${esc(COMPANY.name)}</div>
  <div class="company-address">${esc(COMPANY.address)} | PAN: ${esc(COMPANY.pan)} | VAT: ${esc(COMPANY.vatNo)}</div>
  ${contactLine ? `<div class="company-contact">${esc(contactLine)}</div>` : ""}
  <div class="company-tagline">Stock Management &amp; Sales</div>
  <div class="header-bar"></div>
</div>

<div class="info-grid">
  <div class="info-card">
    <div class="info-label">Invoice To</div>
    <div class="info-row"><span class="lbl">Customer</span><span class="val">${esc(printData.customer)}</span></div>
    ${printData.hasVatPan ? `<div class="info-row"><span class="lbl">PAN Number</span><span class="val">${esc(printData.customerPan)}</span></div>` : ""}
    ${printData.customerContact ? `<div class="info-row"><span class="lbl">Contact</span><span class="val">${esc(printData.customerContact)}</span></div>` : ""}
    ${printData.customerLocation ? `<div class="info-row"><span class="lbl">Address</span><span class="val">${esc(printData.customerLocation)}</span></div>` : ""}
  </div>
  <div class="info-card">
    <div class="info-label">Invoice Details</div>
    <div class="info-row"><span class="lbl">Invoice No</span><span class="val">${esc(printData.invoiceNo)}</span></div>
    <div class="info-row"><span class="lbl">Date</span><span class="val">${esc(printData.date)}</span></div>
    <div class="info-row"><span class="lbl">Payment</span><span class="val">${esc(printData.paymentMethod)} (${esc(printData.saleType)})</span></div>
    <div class="info-row"><span class="lbl">Status</span><span class="val"><span class="badge-status">${esc(printData.status || "CONFIRMED")}</span></span></div>
  </div>
</div>

<table>
  <thead><tr>
    <th class="text-center" style="width:30px">#</th>
    <th>Item Description</th>
    <th class="text-center" style="width:68px">HS Code</th>
    <th class="text-right" style="width:38px">Qty</th>
    <th class="text-right" style="width:68px">Rate</th>
    <th class="text-right" style="width:58px">Disc</th>
    <th class="text-right" style="width:74px">Amount</th>
    <th class="text-right" style="width:64px">VAT 13%</th>
    <th class="text-right" style="width:78px">Total</th>
  </tr></thead>
  <tbody>
  ${printData.items.map((it, i) => `<tr>
    <td class="text-center row-num">${i + 1}</td>
    <td>
      <div style="font-weight:500">${esc(it.itemName)}</div>
      <div style="font-size:10px;color:#6b7280">${esc(it.subCategory)} | ${esc(it.brand)} | ${esc(it.model)}</div>
    </td>
    <td class="text-center" style="font-family:monospace;font-size:10.5px">${esc(it.hsCode || "")}</td>
    <td class="text-right">${it.qty}</td>
    <td class="text-right">${money(it.rate)}</td>
    <td class="text-right">${it.discount > 0 ? money(it.discount) : "-"}</td>
    <td class="text-right">${money(it.amount)}</td>
    <td class="text-right">${money(it.vat)}</td>
    <td class="text-right" style="font-weight:600">${money(it.total)}</td>
  </tr>${renderImeiRow(i)}`).join("")}
  </tbody>
</table>

<div class="summary-section">
  <div class="totals-box">
    <div class="totals-header">Summary</div>
    <div class="totals-body">
      <div class="totals-row"><span class="t-label">Subtotal</span><span class="t-value">${money(printData.subtotal)}</span></div>
      ${printData.headerDiscount > 0 ? `<div class="totals-row"><span class="t-label">Discount</span><span class="t-value" style="color:#dc2626">-${money(printData.headerDiscount)}</span></div>` : ""}
      ${printData.otherCharges > 0 ? `<div class="totals-row"><span class="t-label">Other Charges</span><span class="t-value">${money(printData.otherCharges)}</span></div>` : ""}
      <div class="totals-row"><span class="t-label">VAT (13%)</span><span class="t-value">${money(printData.vat)}</span></div>
    </div>
    <div class="totals-divider"></div>
    <div class="grand-row"><span>GRAND TOTAL</span><span>${money(printData.total)}</span></div>
    <div class="payment-row"><span style="color:#6b7280">Paid Amount</span><span style="font-weight:600">${money(printData.paidAmount)}</span></div>
    ${printData.remaining > 0 ? `<div class="payment-row"><span style="color:#6b7280">Remaining</span><span class="badge-remaining">${money(printData.remaining)}</span></div>` : `<div class="payment-row"><span style="color:#6b7280">Status</span><span class="badge-paid">PAID IN FULL</span></div>`}
  </div>
</div>

<div class="amount-words">
  <span class="aw-label">Amount in Words: </span>${esc(numberToWords(printData.total))}
</div>

${printData.remarks ? `<div class="remarks-section"><span class="r-label">Remarks:</span><span class="r-value">${esc(printData.remarks)}</span></div>` : ""}

<div class="signatures">
  <div class="sig-box">
    <div class="sig-line">
      Seller's Signature
      <div class="sig-sub">${esc(COMPANY.name)}</div>
    </div>
  </div>
  <div class="sig-box">
    <div class="sig-line">
      Buyer's Signature
      <div class="sig-sub">${esc(printData.customer)}</div>
    </div>
  </div>
</div>

<div class="footer">
  <div class="footer-thanks">Thank you for your purchase!</div>
  <div class="footer-note">This is a computer-generated invoice. ${esc(COMPANY.name)}</div>
</div>

<script>window.onload=function(){window.print();}</script>
</body></html>`);
    w.document.close();
  }

  function onExport() {
    if (sales.length === 0) {
      toast.error("No sales to export");
      return;
    }
    exportRows(
      sales.map((s) => ({
        Date: s.date,
        "Invoice No": s.invoiceNo,
        Customer: s.customer,
        "PAN Number": s.customerPan,
        "Has VAT/PAN": s.hasVatPan ? "Yes" : "No",
        "Contact Number": s.customerContact,
        Location: s.customerLocation,
        "Item Code": s.itemCode,
        Item: s.itemName,
        "HS Code": "",
        "Sub Category": s.subCategory,
        Category: s.category,
        Brand: s.brand,
        Model: s.model,
        Qty: s.qty,
        Rate: s.rate,
        Discount: s.discount,
        Amount: s.amount,
        "VAT 13%": s.vat,
        Total: s.total,
        "Sale Type": s.saleType,
        "Payment Method": s.paymentMethod,
        "Paid Amount": s.paidAmount,
        Remaining: s.remaining,
        Remarks: s.remarks,
      })),
      "Sales",
      `BM_Sales_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  const groupedSales = useMemo(() => {
    const groups = new Map<string, { header: (typeof sales)[0]; items: typeof sales }>();
    for (const s of sales) {
      const existing = groups.get(s.invoiceNo);
      if (existing) {
        existing.items.push(s);
      } else {
        groups.set(s.invoiceNo, { header: s, items: [s] });
      }
    }
    return [...groups.values()];
  }, [sales]);

  const grand = sales.reduce((a, s) => a + s.total, 0);

  const SALES_PER_PAGE = 50;
  const [salesPage, setSalesPage] = useState(0);
  const totalPages = Math.ceil(groupedSales.length / SALES_PER_PAGE);
  const pagedSales = groupedSales.slice(salesPage * SALES_PER_PAGE, (salesPage + 1) * SALES_PER_PAGE);

  return (
    <div className="space-y-4">
      {printData && (
        <Card className="border-primary bg-primary/5 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Bill saved successfully!</p>
              <p className="text-xs text-muted-foreground">{printData.invoiceNo} — {printData.customer} — {money(printData.total)}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={printInvoice} size="sm" className="h-8 text-xs sm:text-sm">
                <Printer className="mr-1 size-3.5 sm:size-4" /> Print Invoice
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrintData(null)} className="h-8 text-xs sm:text-sm">
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label htmlFor="s-date" className="text-xs sm:text-sm">Date</Label>
            <Input id="s-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="s-inv" className="text-xs sm:text-sm">Invoice no (auto)</Label>
            <Input id="s-inv" value={invoiceNo} readOnly className="h-9 bg-muted font-mono text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="s-cust" className="text-xs sm:text-sm">Customer name</Label>
            <Input
              id="s-cust"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Customer name"
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="s-pan" className="text-xs sm:text-sm">Customer PAN</Label>
            <Input
              id="s-pan"
              value={customerPan}
              onChange={(e) => setCustomerPan(e.target.value)}
              placeholder="PAN number (optional)"
              disabled={!hasVatPan}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div className="flex items-end pb-0.5">
            <button
              type="button"
              onClick={() => {
                const next = !hasVatPan;
                setHasVatPan(next);
                if (!next) setCustomerPan("");
              }}
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs sm:text-sm transition-colors ${
                hasVatPan
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                hasVatPan ? "border-primary bg-primary" : "border-muted-foreground"
              }`}>
                {hasVatPan && <Check className="size-3" />}
              </div>
              VAT / PAN
            </button>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Sale Type</Label>
            <Select value={saleType} onValueChange={(v) => setSaleType(v as "Cash" | "Credit")}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Customer Type</Label>
            <Select value={customerType} onValueChange={(v) => setCustomerType(v as "Individual" | "Business" | "VAT Registered")}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="VAT Registered">VAT Registered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(customerType === "Business" || customerType === "VAT Registered") && (
            <>
              <div>
                <Label className="text-xs sm:text-sm">Contact Number</Label>
                <Input
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="Contact phone number"
                  className="h-9 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Location</Label>
                <Input
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  placeholder="Business location/address"
                  className="h-9 text-xs sm:text-sm"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Add items to bill</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-12">
            <div className="relative sm:col-span-5 md:col-span-4">
              <Label htmlFor="s-item" className="text-xs sm:text-sm">Item</Label>
              <Input
                id="s-item"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Type item name to search..."
                autoComplete="off"
                className="h-9 text-xs sm:text-sm"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                  {suggestions.map((s) => (
                    <li key={s.code + s.name}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-accent"
                        onClick={() => pick(s.name)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {s.subCategory} · {s.category} · {s.brand} · stock {s.qty}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="sm:col-span-7 md:col-span-5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="s-qty" className="text-xs sm:text-sm">Qty</Label>
                  <Input
                    id="s-qty"
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="h-9 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="s-rate" className="text-xs sm:text-sm">Rate</Label>
                  <Input
                    id="s-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemRate}
                    onChange={(e) => setItemRate(Number(e.target.value))}
                    className="h-9 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="s-disc" className="text-xs sm:text-sm">Discount</Label>
                  <Input
                    id="s-disc"
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemDiscount}
                    onChange={(e) => setItemDiscount(Number(e.target.value))}
                    className="h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowImeiInput(!showImeiInput)}
                  className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
                    showImeiInput ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Smartphone className="size-3.5" />
                  IMEI
                </button>
                {showImeiInput && (
                  <Input
                    value={imeiInput}
                    onChange={(e) => setImeiInput(e.target.value)}
                    placeholder="15-digit IMEI"
                    maxLength={15}
                    className="h-8 max-w-[200px] text-xs font-mono"
                  />
                )}
                {draftImeis.length > 0 && (
                  <span className="text-xs text-muted-foreground">{draftImeis.length} IMEI(s) attached</span>
                )}
              </div>
            </div>
            <div className="flex items-end sm:col-span-12 md:col-span-3">
              <Button onClick={addToBill} className="h-9 w-full text-xs sm:text-sm">
                <Plus className="mr-1 size-3.5 sm:size-4" /> Add to bill
              </Button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground sm:grid-cols-4">
            <div>
              Category: <strong className="text-foreground">{matched?.category || "-"}</strong>
            </div>
            <div>
              Sub Category: <strong className="text-foreground">{matched?.subCategory || "-"}</strong>
            </div>
            <div>
              Brand: <strong className="text-foreground">{matched?.brand || "-"}</strong>
            </div>
            <div>
              Model: <strong className="text-foreground">{matched?.model || "-"}</strong>
            </div>
          </div>
        </div>

        {billItems.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
              Bill items ({billItems.length})
            </p>
            <div className="max-h-[35vh] overflow-x-auto overflow-y-auto rounded-md border border-border">
              <table className="w-full min-w-[700px] text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr className="text-left">
                    <th className="p-2">#</th>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Disc</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-right">VAT</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 font-medium">
                        {item.itemName}
                        <span className="block text-[11px] text-muted-foreground font-normal">
                          {item.subCategory} · {item.brand} · {item.model}
                        </span>
                      </td>
                      <td className="p-2 text-right font-semibold">{item.qty}</td>
                      <td className="p-2 text-right">{money(item.rate)}</td>
                      <td className="p-2 text-right text-muted-foreground">{item.discount > 0 ? money(item.discount) : "-"}</td>
                      <td className="p-2 text-right">{money(item.amount)}</td>
                      <td className="p-2 text-right">{money(item.vat)}</td>
                      <td className="p-2 text-right font-medium">{money(item.total)}</td>
                      <td className="p-2 text-right">
                        <Button size="icon" variant="ghost" onClick={() => removeBillItem(idx)} className="h-7 w-7">
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS BAR */}
            <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Subtotal</Label>
                  <div className="font-semibold">{money(billSubtotal)}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Header Discount</Label>
                  <Input type="number" min="0" step="0.01" value={headerDiscount} onChange={(e) => setHeaderDiscount(Number(e.target.value))} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Other Charges</Label>
                  <Input type="number" min="0" step="0.01" value={otherCharges} onChange={(e) => setOtherCharges(Number(e.target.value))} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">VAT 13%</Label>
                  <div className="font-semibold">{money(billVat)}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Grand Total</Label>
                  <div className="text-lg font-bold text-primary">{money(billGrandTotal)}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Paid Amount</Label>
                  <Input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Remaining Balance</Label>
                  <div className={`font-semibold ${billRemaining > 0 ? "text-destructive" : "text-green-600"}`}>
                    {money(billRemaining)}
                  </div>
                </div>
              </div>
            </div>

            {/* REMARKS */}
            <div className="mt-3">
              <Label className="text-xs sm:text-sm">Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes..." className="h-16 text-xs sm:text-sm mt-1" />
            </div>

            {/* ACTIONS */}
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground">
                <span>Items: <strong className="text-foreground">{billItems.length}</strong></span>
                <span>Total Qty: <strong className="text-foreground">{billItems.reduce((a, i) => a + i.qty, 0)}</strong></span>
                {billRemaining > 0 && (
                  <Badge variant="destructive" className="text-[10px]">Credit: {money(billRemaining)}</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={saveBill} disabled={saving} className="flex-1 sm:flex-initial">
                  {saving ? "Saving..." : "Save Bill"}
                </Button>
                <Button variant="outline" onClick={onExport} className="flex-1 sm:flex-initial">
                  <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
                </Button>
              </div>
            </div>
          </div>
        )}

        {billItems.length === 0 && (
          <div className="mt-4 flex justify-end border-t border-border pt-4">
            <Button variant="outline" onClick={onExport} size="sm" className="text-xs sm:text-sm">
              <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[50vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[750px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Payment</th>
                <th className="p-2.5">Items</th>
                <th className="p-2.5 text-right">Total</th>
                <th className="p-2.5 text-right">Paid</th>
                <th className="p-2.5 text-right">Remaining</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {pagedSales.map((g) => {
                const invTotal = g.items.reduce((a, i) => a + i.total, 0);
                const invPaid = g.header.paidAmount;
                const invRemaining = g.header.remaining;
                return (
                  <tr key={g.header.invoiceNo} className="border-t border-border">
                    <td className="p-2.5 whitespace-nowrap">{g.header.date}</td>
                    <td className="p-2.5 font-mono font-medium">{g.header.invoiceNo}</td>
                    <td className="p-2.5">{g.header.customer}</td>
                    <td className="p-2.5">
                      <Badge variant={g.header.saleType === "Credit" ? "destructive" : "secondary"} className="text-[10px]">
                        {g.header.saleType || "Cash"}
                      </Badge>
                    </td>
                    <td className="p-2.5">
                      <Badge variant={g.header.status === "CANCELLED" || g.header.status === "RETURNED" ? "destructive" : "outline"} className="text-[10px]">
                        {g.header.status || "CONFIRMED"}
                      </Badge>
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                        {g.header.paymentMethod}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {g.items.length} item{g.items.length > 1 ? "s" : ""}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({g.items.reduce((a, i) => a + i.qty, 0)} pcs)
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-medium">
                      {money(invTotal)}
                    </td>
                    <td className="p-2.5 text-right">{money(invPaid)}</td>
                    <td className={`p-2.5 text-right font-medium ${invRemaining > 0 ? "text-destructive" : ""}`}>
                      {money(invRemaining)}
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setPrintData({
                              invoiceNo: g.header.invoiceNo,
                              date: g.header.date,
                              customer: g.header.customer,
                              customerPan: g.header.customerPan,
                              hasVatPan: g.header.hasVatPan,
                              customerContact: g.header.customerContact,
                              customerLocation: g.header.customerLocation,
                              paymentMethod: g.header.paymentMethod,
                              saleType: g.header.saleType,
                              status: g.header.status || "CONFIRMED",
                              items: g.items.map((s) => ({
                                itemCode: s.itemCode,
                                itemName: s.itemName,
                                category: s.category,
                                subCategory: s.subCategory,
                                brand: s.brand,
                                model: s.model,
                                hsCode: "",
                                qty: s.qty,
                                rate: s.rate,
                                discount: s.discount,
                                amount: s.amount,
                                vat: s.vat,
                                total: s.total,
                              })),
                              itemImeis: {},
                              subtotal: g.items.reduce((a, i) => a + i.amount, 0),
                              headerDiscount: Math.max(0, g.items.reduce((a, i) => a + i.amount, 0) + (g.header.otherCharges ?? 0) - invPaid - invRemaining),
                              otherCharges: g.header.otherCharges,
                              vat: g.items.reduce((a, i) => a + i.vat, 0),
                              total: invTotal,
                              paidAmount: invPaid,
                              remaining: invRemaining,
                              remarks: g.header.remarks,
                            });
                            setTimeout(() => printInvoice(), 100);
                          }}
                          className="h-7 w-7"
                          title="Print invoice"
                        >
                          <Printer className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm(`Delete invoice ${g.header.invoiceNo}? This cannot be undone.`)) {
                              deleteInvoice(g.header.invoiceNo);
                            }
                          }}
                          className="h-7 w-7"
                        >
                          <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {groupedSales.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-muted-foreground">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>
            Showing {salesPage * SALES_PER_PAGE + 1}–{Math.min((salesPage + 1) * SALES_PER_PAGE, groupedSales.length)} of {groupedSales.length} invoices
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={salesPage === 0}
              onClick={() => setSalesPage((p) => p - 1)}
              className="h-8 text-xs"
            >
              Prev
            </Button>
            <span className="flex items-center px-2 text-xs">
              {salesPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={salesPage >= totalPages - 1}
              onClick={() => setSalesPage((p) => p + 1)}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <p className="text-right text-xs sm:text-sm text-muted-foreground">
        Grand total sales: <strong className="text-foreground">{money(grand)}</strong>
      </p>
    </div>
  );
}
