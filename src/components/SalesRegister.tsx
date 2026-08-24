import { useMemo, useState, useCallback } from "react";
import { Download, Trash2, Plus, Check, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
  type PaymentMethod,
  type BillItem,
} from "@/lib/store";
import { exportRows } from "@/lib/excel";

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function SalesRegister() {
  const { stock, sales } = useStore();
  const invoiceNo = nextInvoiceNo(sales);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState("");
  const [customerPan, setCustomerPan] = useState("");
  const [hasVatPan, setHasVatPan] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");

  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState(0);

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [printData, setPrintData] = useState<{
    invoiceNo: string;
    date: string;
    customer: string;
    customerPan: string;
    hasVatPan: boolean;
    paymentMethod: PaymentMethod;
    items: BillItem[];
    subtotal: number;
    vat: number;
    total: number;
  } | null>(null);

  const suggestions = useMemo(() => {
    const t = itemName.trim().toLowerCase();
    if (!t) return [];
    const exact = stock.some((i) => i.name.toLowerCase() === t);
    if (exact) return [];
    return stock.filter((i) =>
      [i.name, i.subCategory, i.brand, i.model, i.code]
        .join(" ")
        .toLowerCase()
        .includes(t),
    ).slice(0, 8);
  }, [stock, itemName]);

  const matched = useMemo(
    () => stock.find((i) => i.name.toLowerCase() === itemName.trim().toLowerCase()),
    [stock, itemName],
  );

  const billSubtotal = useMemo(() => billItems.reduce((a, i) => a + i.amount, 0), [billItems]);
  const billVat = useMemo(() => billItems.reduce((a, i) => a + i.vat, 0), [billItems]);
  const billTotal = useMemo(() => billItems.reduce((a, i) => a + i.total, 0), [billItems]);

  function pick(name: string) {
    const item = stock.find((i) => i.name === name);
    setItemName(name);
    if (item?.sellingPrice) setItemRate(item.sellingPrice);
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
    const amount = itemQty * itemRate;
    const vat = amount * VAT_RATE;
    const newItem: BillItem = {
      itemCode: matched?.code ?? "",
      itemName: matched?.name ?? itemName.trim(),
      category: matched?.category ?? "",
      subCategory: matched?.subCategory ?? "",
      brand: matched?.brand ?? "",
      model: matched?.model ?? "",
      qty: itemQty,
      rate: itemRate,
      amount,
      vat,
      total: amount + vat,
    };
    setBillItems((prev) => [...prev, newItem]);
    setItemName("");
    setItemQty(1);
    setItemRate(0);
  }

  function removeBillItem(index: number) {
    setBillItems((prev) => prev.filter((_, i) => i !== index));
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
    setSaving(true);
    const { error } = await addBill(invoiceNo, date, customer.trim(), customerPan.trim(), hasVatPan, paymentMethod, billItems);
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
      paymentMethod,
      items: [...billItems],
      subtotal: billSubtotal,
      vat: billVat,
      total: billTotal,
    });
    setCustomer("");
    setCustomerPan("");
    setHasVatPan(false);
    setBillItems([]);
    setPaymentMethod("Cash");
    toast.success(`${invoiceNo} saved with ${billItems.length} items`);
  }

  function printInvoice() {
    if (!printData) return;
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) { toast.error("Pop-up blocked. Allow pop-ups to print."); return; }
    w.document.write(`<!DOCTYPE html>
<html><head><title>Invoice ${printData.invoiceNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
  .header h1 { font-size: 18px; margin-bottom: 2px; }
  .header p { font-size: 11px; color: #555; }
  .info { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; }
  .info div { flex: 1; }
  .info .label { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 11px; }
  th { background: #f0f0f0; font-weight: bold; }
  .text-right { text-align: right; }
  .totals { margin-top: 10px; text-align: right; }
  .totals .row { margin-bottom: 4px; }
  .totals .grand { font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 6px; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
  @media print { body { padding: 10px; } }
</style></head><body>
<div class="header">
  <h1>BM Apple Iphone Store</h1>
  <p>Stock Management &amp; Sales</p>
</div>
<div class="info">
  <div><span class="label">Invoice No:</span> ${esc(printData.invoiceNo)}</div>
  <div><span class="label">Date:</span> ${esc(printData.date)}</div>
  <div><span class="label">Payment:</span> ${esc(printData.paymentMethod)}</div>
</div>
<div class="info">
  <div><span class="label">Customer:</span> ${esc(printData.customer)}</div>
  ${printData.hasVatPan ? `<div><span class="label">PAN:</span> ${esc(printData.customerPan)}</div>` : ""}
</div>
<table>
  <thead><tr>
    <th>#</th><th>Item</th><th>Sub Category</th><th>Brand</th><th>Model</th>
    <th class="text-right">Qty</th><th class="text-right">Rate</th>
    <th class="text-right">Amount</th><th class="text-right">VAT 13%</th><th class="text-right">Total</th>
  </tr></thead>
  <tbody>
  ${printData.items.map((it, i) => `<tr>
    <td>${i + 1}</td>
    <td>${esc(it.itemName)}</td><td>${esc(it.subCategory)}</td><td>${esc(it.brand)}</td><td>${esc(it.model)}</td>
    <td class="text-right">${it.qty}</td><td class="text-right">${money(it.rate)}</td>
    <td class="text-right">${money(it.amount)}</td><td class="text-right">${money(it.vat)}</td>
    <td class="text-right">${money(it.total)}</td>
  </tr>`).join("")}
  </tbody>
</table>
<div class="totals">
  <div class="row">Subtotal: <strong>${money(printData.subtotal)}</strong></div>
  <div class="row">VAT 13%: <strong>${money(printData.vat)}</strong></div>
  <div class="row grand">Grand Total: <strong>${money(printData.total)}</strong></div>
</div>
<div class="footer">
  <p>Thank you for your purchase!</p>
  <p>BM Apple Iphone Store</p>
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
        "Item Code": s.itemCode,
        Item: s.itemName,
        "Sub Category": s.subCategory,
        Category: s.category,
        Brand: s.brand,
        Model: s.model,
        Qty: s.qty,
        Rate: s.rate,
        Amount: s.amount,
        "VAT 13%": s.vat,
        Total: s.total,
        "Payment Method": s.paymentMethod,
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
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Add items to bill</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-12">
            <div className="relative sm:col-span-6 md:col-span-5">
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
            <div className="grid grid-cols-2 gap-2 sm:col-span-6 md:col-span-4">
              <div>
                <Label htmlFor="s-qty" className="text-xs sm:text-sm">Qty</Label>
                <Input
                  id="s-qty"
                  type="number"
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
                  value={itemRate}
                  onChange={(e) => setItemRate(Number(e.target.value))}
                  className="h-9 text-xs sm:text-sm"
                />
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
              <table className="w-full min-w-[600px] text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr className="text-left">
                    <th className="p-2">#</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Sub Category</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
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
                      <td className="p-2">{item.subCategory}</td>
                      <td className="p-2 text-right font-semibold">{item.qty}</td>
                      <td className="p-2 text-right">{money(item.rate)}</td>
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

            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                <span>
                  Subtotal: <strong>{money(billSubtotal)}</strong>
                </span>
                <span>
                  VAT 13%: <strong>{money(billVat)}</strong>
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">
                  Total: {money(billTotal)}
                </span>
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
          <table className="w-full min-w-[650px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Payment</th>
                <th className="p-2.5">Items</th>
                <th className="p-2.5 text-right">Total</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {groupedSales.map((g) => (
                <tr key={g.header.invoiceNo} className="border-t border-border">
                  <td className="p-2.5 whitespace-nowrap">{g.header.date}</td>
                  <td className="p-2.5 font-mono font-medium">{g.header.invoiceNo}</td>
                  <td className="p-2.5">{g.header.customer}</td>
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
                    {money(g.items.reduce((a, i) => a + i.total, 0))}
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
                            paymentMethod: g.header.paymentMethod,
                            items: g.items.map((s) => ({
                              itemCode: s.itemCode,
                              itemName: s.itemName,
                              category: s.category,
                              subCategory: s.subCategory,
                              brand: s.brand,
                              model: s.model,
                              qty: s.qty,
                              rate: s.rate,
                              amount: s.amount,
                              vat: s.vat,
                              total: s.total,
                            })),
                            subtotal: g.items.reduce((a, i) => a + i.amount, 0),
                            vat: g.items.reduce((a, i) => a + i.vat, 0),
                            total: g.items.reduce((a, i) => a + i.total, 0),
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
                        onClick={() => deleteInvoice(g.header.invoiceNo)}
                        className="h-7 w-7"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {groupedSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-right text-xs sm:text-sm text-muted-foreground">
        Grand total sales: <strong className="text-foreground">{money(grand)}</strong>
      </p>
    </div>
  );
}
