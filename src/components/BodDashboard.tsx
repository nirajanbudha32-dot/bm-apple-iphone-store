import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, ReceiptText, PackagePlus, Boxes, PackageMinus, Truck,
  BarChart3, TrendingUp, RotateCcw, Building2, Download, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useStore, LOCATION_LABELS, VAT_RATE } from "@/lib/store";
import { useStoreContext } from "@/lib/store-context";
import { money } from "@/lib/utils";
import { exportRows } from "@/lib/excel";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">{label}</p>
      <p className="text-lg font-bold sm:text-xl">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground sm:text-xs">{sub}</p>}
    </Card>
  );
}

export function BodDashboard() {
  const { stock, sales, purchases, stockLots, saleAllocations, purchaseHeaders, purchaseItems, salesReturns, vendors, vendorTransactions, vendorPayments, stockAdjustments, purchaseReturns } = useStore();
  const { currentStoreId } = useStoreContext();
  const [subTab, setSubTab] = useState("overview");

  const storeLabel = currentStoreId ? LOCATION_LABELS[currentStoreId] || "Store" : "All Stores";

  // Overview KPIs
  const overview = useMemo(() => {
    const totalSales = sales.reduce((a, s) => a + s.total, 0);
    const totalPurchases = purchaseHeaders.reduce((a, p) => a + p.grandTotal, 0);
    const stockValue = stockLots.filter((l) => l.qty > 0).reduce((a, l) => a + l.qty * l.purchasePrice, 0);
    const stockQty = stockLots.filter((l) => l.qty > 0).reduce((a, l) => a + l.qty, 0);
    const stockItems = stock.length;
    const totalProfit = sales.reduce((a, s) => {
      const allocs = saleAllocations.filter((al) => al.saleId === s.id);
      const cost = allocs.reduce((c, al) => c + al.qtyTaken * (stockLots.find((l) => l.id === al.lotId)?.purchasePrice || 0), 0);
      return a + (s.total - cost);
    }, 0);
    const vendorPayable = vendors.reduce((a, v) => {
      const txns = vendorTransactions.filter((t) => t.vendorId === v.id);
      const lastBal = txns.length > 0 ? txns.reduce((max, t) => t.balance > max ? t.balance : max, 0) : v.openingBalance;
      return a + lastBal;
    }, 0);
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter((s) => s.date === today);
    const todaySalesTotal = todaySales.reduce((a, s) => a + s.total, 0);
    const invoiceCount = new Set(sales.map((s) => s.invoiceNo)).size;
    const totalVat = sales.reduce((a, s) => a + s.vat, 0);
    return { totalSales, totalPurchases, stockValue, stockQty, stockItems, totalProfit, vendorPayable, todaySalesTotal, invoiceCount, totalVat };
  }, [sales, purchases, stock, stockLots, purchaseHeaders, vendors, vendorTransactions, saleAllocations]);

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="mb-4 flex h-10 w-full overflow-x-auto overflow-y-hidden p-1 sm:w-auto sm:flex-nowrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm"><LayoutDashboard className="mr-1 size-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm"><ReceiptText className="mr-1 size-3.5" /> Sales</TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs sm:text-sm"><PackagePlus className="mr-1 size-3.5" /> Purchases</TabsTrigger>
          <TabsTrigger value="stock" className="text-xs sm:text-sm"><Boxes className="mr-1 size-3.5" /> Stock</TabsTrigger>
          <TabsTrigger value="stockin" className="text-xs sm:text-sm"><PackageMinus className="mr-1 size-3.5" /> Stock In</TabsTrigger>
          <TabsTrigger value="stockout" className="text-xs sm:text-sm"><Truck className="mr-1 size-3.5" /> Stock Out</TabsTrigger>
          <TabsTrigger value="lots" className="text-xs sm:text-sm"><Boxes className="mr-1 size-3.5" /> Lots</TabsTrigger>
          <TabsTrigger value="profit" className="text-xs sm:text-sm"><TrendingUp className="mr-1 size-3.5" /> Profit</TabsTrigger>
          <TabsTrigger value="vendors" className="text-xs sm:text-sm"><Truck className="mr-1 size-3.5" /> Vendors</TabsTrigger>
          <TabsTrigger value="returns" className="text-xs sm:text-sm"><RotateCcw className="mr-1 size-3.5" /> Returns</TabsTrigger>
          <TabsTrigger value="allstores" className="text-xs sm:text-sm"><Building2 className="mr-1 size-3.5" /> All Stores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><BodOverview overview={overview} storeLabel={storeLabel} /></TabsContent>
        <TabsContent value="sales"><BodSales sales={sales} stockLots={stockLots} saleAllocations={saleAllocations} /></TabsContent>
        <TabsContent value="purchases"><BodPurchases purchaseHeaders={purchaseHeaders} purchaseItems={purchaseItems} /></TabsContent>
        <TabsContent value="stock"><BodStock stock={stock} /></TabsContent>
        <TabsContent value="stockin"><BodStockIn purchaseHeaders={purchaseHeaders} purchaseItems={purchaseItems} stockLots={stockLots} /></TabsContent>
        <TabsContent value="stockout"><BodStockOut sales={sales} saleAllocations={saleAllocations} stockLots={stockLots} /></TabsContent>
        <TabsContent value="lots"><BodLots stockLots={stockLots} saleAllocations={saleAllocations} purchases={purchases} /></TabsContent>
        <TabsContent value="profit"><BodProfit sales={sales} saleAllocations={saleAllocations} stockLots={stockLots} /></TabsContent>
        <TabsContent value="vendors"><BodVendors vendors={vendors} vendorTransactions={vendorTransactions} vendorPayments={vendorPayments} /></TabsContent>
        <TabsContent value="returns"><BodReturns salesReturns={salesReturns} /></TabsContent>
        <TabsContent value="allstores"><BodAllStores stock={stock} sales={sales} purchaseHeaders={purchaseHeaders} stockLots={stockLots} vendors={vendors} vendorTransactions={vendorTransactions} /></TabsContent>
      </Tabs>
    </div>
  );
}

function BodOverview({ overview, storeLabel }: { overview: { totalSales: number; totalPurchases: number; stockValue: number; stockQty: number; stockItems: number; totalProfit: number; vendorPayable: number; todaySalesTotal: number; invoiceCount: number; totalVat: number }; storeLabel: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground sm:text-sm">{storeLabel} — Overview</p>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Stat label="Total Sales" value={money(overview.totalSales)} sub={`${overview.invoiceCount} invoices`} />
        <Stat label="Total Purchases" value={money(overview.totalPurchases)} />
        <Stat label="Stock Value" value={money(overview.stockValue)} sub={`${overview.stockItems} items, ${overview.stockQty} units`} />
        <Stat label="Total Profit" value={money(overview.totalProfit)} />
        <Stat label="Vendor Payable" value={money(overview.vendorPayable)} />
        <Stat label="Today's Sales" value={money(overview.todaySalesTotal)} />
        <Stat label="Total VAT" value={money(overview.totalVat)} />
        <Stat label="Total Stock Qty" value={String(overview.stockQty)} sub={`${overview.stockItems} unique items`} />
      </div>
    </div>
  );
}

function BodSales({ sales, stockLots, saleAllocations }: { sales: any[]; stockLots: any[]; saleAllocations: any[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, { invoiceNo: string; date: string; customer: string; saleType: string; status: string; items: { itemName: string; itemCode: string; qty: number; rate: number; amount: number; vat: number; total: number; lotInfo: string }[]; grandTotal: number; paidAmount: number; remaining: number }>();
    for (const s of sales) {
      const existing = map.get(s.invoiceNo);
      const allocs = saleAllocations.filter((a) => a.saleId === s.id);
      const lotInfo = allocs.map((a) => { const lot = stockLots.find((l) => l.id === a.lotId); return lot ? `${lot.lotNo}(${a.qtyTaken})` : ""; }).filter(Boolean).join(", ");
      if (existing) {
        existing.items.push({ itemName: s.itemName, itemCode: s.itemCode, qty: s.qty, rate: s.rate, amount: s.amount, vat: s.vat, total: s.total, lotInfo });
        existing.grandTotal += s.total;
        existing.paidAmount += s.paidAmount;
        existing.remaining += s.remaining;
      } else {
        map.set(s.invoiceNo, { invoiceNo: s.invoiceNo, date: s.date, customer: s.customer, saleType: s.saleType, status: s.status, items: [{ itemName: s.itemName, itemCode: s.itemCode, qty: s.qty, rate: s.rate, amount: s.amount, vat: s.vat, total: s.total, lotInfo }], grandTotal: s.total, paidAmount: s.paidAmount, remaining: s.remaining });
      }
    }
    let rows = Array.from(map.values());
    if (dateFrom) rows = rows.filter((r) => r.date >= dateFrom);
    if (dateTo) rows = rows.filter((r) => r.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) rows = rows.filter((r) => r.invoiceNo.toLowerCase().includes(t) || r.customer.toLowerCase().includes(t) || r.items.some((i) => i.itemName.toLowerCase().includes(t) || i.itemCode.toLowerCase().includes(t)));
    return rows;
  }, [sales, stockLots, saleAllocations, dateFrom, dateTo, q]);

  const totalGrand = grouped.reduce((a, r) => a + r.grandTotal, 0);
  const totalPaid = grouped.reduce((a, r) => a + r.paidAmount, 0);

  function onExport() {
    const rows: any[] = [];
    for (const g of grouped) {
      for (const it of g.items) {
        rows.push({ Invoice: g.invoiceNo, Date: g.date, Customer: g.customer, "Item Code": it.itemCode, Item: it.itemName, Qty: it.qty, Rate: it.rate, Amount: it.amount, VAT: it.vat, Total: it.total, "Sale Type": g.saleType, Status: g.status, "Paid Amount": g.paidAmount, Remaining: g.remaining, "Lot Info": it.lotInfo });
      }
    }
    if (rows.length === 0) { toast.error("No data"); return; }
    exportRows(rows, "BOD Sales", `BOD_Sales_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice, customer, item..." className="h-9 text-xs" /></div>
          <div className="flex items-end"><Button variant="outline" onClick={onExport} className="h-9 w-full text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
        </div>
      </Card>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{grouped.length}</strong> invoices</span>
        <span>Total: <strong className="text-foreground">{money(totalGrand)}</strong></span>
        <span>Paid: <strong className="text-foreground">{money(totalPaid)}</strong></span>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[800px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Items</th>
                <th className="p-2.5 text-right">Total</th>
                <th className="p-2.5 text-right">Paid</th>
                <th className="p-2.5 text-right">Remaining</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((r) => (
                <tr key={r.invoiceNo} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium">{r.invoiceNo}</td>
                  <td className="p-2.5 whitespace-nowrap">{r.date}</td>
                  <td className="p-2.5">{r.customer}</td>
                  <td className="p-2.5">{r.items.length}</td>
                  <td className="p-2.5 text-right font-semibold">{money(r.grandTotal)}</td>
                  <td className="p-2.5 text-right">{money(r.paidAmount)}</td>
                  <td className="p-2.5 text-right text-destructive">{r.remaining > 0 ? money(r.remaining) : "-"}</td>
                  <td className="p-2.5"><Badge variant={r.saleType === "Credit" ? "destructive" : "outline"} className="text-[10px]">{r.saleType}</Badge></td>
                  <td className="p-2.5"><Badge variant={r.status === "COMPLETED" ? "outline" : "secondary"} className="text-[10px]">{r.status}</Badge></td>
                </tr>
              ))}
              {grouped.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No sales records.</td></tr>}
            </tbody>
            {grouped.length > 0 && (
              <tfoot className="sticky bottom-0 bg-muted">
                <tr className="border-t border-border font-semibold">
                  <td className="p-2.5" colSpan={4}>Total</td>
                  <td className="p-2.5 text-right">{money(totalGrand)}</td>
                  <td className="p-2.5 text-right">{money(totalPaid)}</td>
                  <td className="p-2.5 text-right">{money(totalGrand - totalPaid)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodPurchases({ purchaseHeaders, purchaseItems }: { purchaseHeaders: any[]; purchaseItems: any[] }) {
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    let result = purchaseHeaders;
    const t = q.trim().toLowerCase();
    if (t) result = result.filter((p) => p.purchaseNo.toLowerCase().includes(t) || p.supplierName.toLowerCase().includes(t) || p.supplierInvoiceNo.toLowerCase().includes(t));
    return result;
  }, [purchaseHeaders, q]);

  const totalGrand = items.reduce((a, p) => a + p.grandTotal, 0);
  const totalPaid = items.reduce((a, p) => a + p.paidAmount, 0);

  function onExport() {
    const rows = items.map((p) => ({
      "Purchase No": p.purchaseNo, Date: p.date, Supplier: p.supplierName, "Supplier Invoice": p.supplierInvoiceNo,
      Type: p.purchaseType, "Grand Total": p.grandTotal, Paid: p.paidAmount, Remaining: p.remainingBalance,
      "Payment Method": p.paymentMethod, Remarks: p.remarks,
    }));
    if (rows.length === 0) { toast.error("No data"); return; }
    exportRows(rows, "BOD Purchases", `BOD_Purchases_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Purchase no, supplier..." className="h-9 text-xs" /></div>
          <div className="flex items-end"><Button variant="outline" onClick={onExport} className="h-9 w-full text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
        </div>
      </Card>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{items.length}</strong> purchases</span>
        <span>Total: <strong className="text-foreground">{money(totalGrand)}</strong></span>
        <span>Paid: <strong className="text-foreground">{money(totalPaid)}</strong></span>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Purchase No</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5 text-right">Grand Total</th>
                <th className="p-2.5 text-right">Paid</th>
                <th className="p-2.5 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium">{p.purchaseNo}</td>
                  <td className="p-2.5 whitespace-nowrap">{p.date}</td>
                  <td className="p-2.5">{p.supplierName}</td>
                  <td className="p-2.5"><Badge variant={p.purchaseType === "Credit" ? "destructive" : "outline"} className="text-[10px]">{p.purchaseType}</Badge></td>
                  <td className="p-2.5 text-right font-semibold">{money(p.grandTotal)}</td>
                  <td className="p-2.5 text-right">{money(p.paidAmount)}</td>
                  <td className="p-2.5 text-right text-destructive">{p.remainingBalance > 0 ? money(p.remainingBalance) : "-"}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No purchases.</td></tr>}
            </tbody>
            {items.length > 0 && (
              <tfoot className="sticky bottom-0 bg-muted">
                <tr className="border-t border-border font-semibold">
                  <td className="p-2.5" colSpan={4}>Total</td>
                  <td className="p-2.5 text-right">{money(totalGrand)}</td>
                  <td className="p-2.5 text-right">{money(totalPaid)}</td>
                  <td className="p-2.5 text-right">{money(totalGrand - totalPaid)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodStock({ stock }: { stock: any[] }) {
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    if (!q.trim()) return stock;
    const t = q.trim().toLowerCase();
    return stock.filter((s) => s.name.toLowerCase().includes(t) || s.code.toLowerCase().includes(t) || s.brand.toLowerCase().includes(t) || s.category.toLowerCase().includes(t));
  }, [stock, q]);

  const totalQty = items.reduce((a, s) => a + s.qty, 0);
  const totalValue = items.reduce((a, s) => a + s.qty * s.sellingPrice, 0);

  function onExport() {
    const rows = items.map((s) => ({ Code: s.code, Name: s.name, Category: s.category, Brand: s.brand, Model: s.model, Qty: s.qty, "Purchase Price": s.purchasePrice, "Selling Price": s.sellingPrice, Value: s.qty * s.sellingPrice }));
    if (rows.length === 0) { toast.error("No data"); return; }
    exportRows(rows, "BOD Stock", `BOD_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Item name, code, brand..." className="h-9 text-xs" /></div>
          <div className="flex items-end"><Button variant="outline" onClick={onExport} className="h-9 w-full text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
        </div>
      </Card>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{items.length}</strong> items</span>
        <span>Qty: <strong className="text-foreground">{totalQty}</strong></span>
        <span>Value: <strong className="text-foreground">{money(totalValue)}</strong></span>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Name</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Brand</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Purchase</th>
                <th className="p-2.5 text-right">Selling</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.code} className="border-t border-border">
                  <td className="p-2.5 font-mono">{s.code}</td>
                  <td className="p-2.5 font-medium">{s.name}</td>
                  <td className="p-2.5">{s.category}</td>
                  <td className="p-2.5">{s.brand}</td>
                  <td className={`p-2.5 text-right font-semibold ${s.qty === 0 ? "text-destructive" : ""}`}>{s.qty}</td>
                  <td className="p-2.5 text-right">{money(s.purchasePrice)}</td>
                  <td className="p-2.5 text-right">{money(s.sellingPrice)}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No stock items.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodStockIn({ purchaseHeaders, purchaseItems, stockLots }: { purchaseHeaders: any[]; purchaseItems: any[]; stockLots: any[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const result: any[] = [];
    for (const ph of purchaseHeaders) {
      const items = purchaseItems.filter((pi) => pi.purchaseHeaderId === ph.id);
      for (const pi of items) {
        result.push({ date: ph.date, purchaseNo: ph.purchaseNo, supplier: ph.supplierName, itemCode: pi.itemCode, itemName: pi.itemName, qty: pi.qty, rate: pi.rate, total: pi.total, lotNo: pi.lotNo });
      }
    }
    let filtered = result;
    if (dateFrom) filtered = filtered.filter((r) => r.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((r) => r.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) filtered = filtered.filter((r) => r.itemName.toLowerCase().includes(t) || r.itemCode.toLowerCase().includes(t) || r.supplier.toLowerCase().includes(t) || r.purchaseNo.toLowerCase().includes(t));
    return filtered;
  }, [purchaseHeaders, purchaseItems, dateFrom, dateTo, q]);

  const totalQty = rows.reduce((a, r) => a + r.qty, 0);
  const totalValue = rows.reduce((a, r) => a + r.total, 0);

  function onExport() {
    if (rows.length === 0) { toast.error("No data"); return; }
    exportRows(rows.map((r) => ({ Date: r.date, "Purchase No": r.purchaseNo, Supplier: r.supplier, "Item Code": r.itemCode, Item: r.itemName, Qty: r.qty, Rate: r.rate, Total: r.total, "Lot No": r.lotNo })), "BOD Stock In", `BOD_StockIn_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Item, supplier..." className="h-9 text-xs" /></div>
          <div className="flex items-end"><Button variant="outline" onClick={onExport} className="h-9 w-full text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
        </div>
      </Card>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{rows.length}</strong> rows</span>
        <span>Qty: <strong className="text-foreground">{totalQty}</strong></span>
        <span>Value: <strong className="text-foreground">{money(totalValue)}</strong></span>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Purchase No</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Rate</th>
                <th className="p-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-2.5 whitespace-nowrap">{r.date}</td>
                  <td className="p-2.5 font-mono">{r.purchaseNo}</td>
                  <td className="p-2.5">{r.supplier}</td>
                  <td className="p-2.5 font-medium">{r.itemName}</td>
                  <td className="p-2.5 text-right font-semibold">{r.qty}</td>
                  <td className="p-2.5 text-right">{money(r.rate)}</td>
                  <td className="p-2.5 text-right font-medium">{money(r.total)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No stock in records.</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-muted">
                <tr className="border-t border-border font-semibold">
                  <td className="p-2.5" colSpan={4}>Total</td>
                  <td className="p-2.5 text-right">{totalQty}</td>
                  <td className="p-2.5 text-right"></td>
                  <td className="p-2.5 text-right">{money(totalValue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodStockOut({ sales, saleAllocations, stockLots }: { sales: any[]; saleAllocations: any[]; stockLots: any[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return sales.map((s) => {
      const allocs = saleAllocations.filter((a) => a.saleId === s.id);
      const lotInfo = allocs.map((a) => { const lot = stockLots.find((l) => l.id === a.lotId); return lot ? `${lot.lotNo}(${a.qtyTaken})` : ""; }).filter(Boolean).join(", ");
      return { ...s, lotInfo: lotInfo || "-" };
    }).filter((s) => {
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        return s.itemName.toLowerCase().includes(t) || s.itemCode.toLowerCase().includes(t) || s.customer.toLowerCase().includes(t) || s.invoiceNo.toLowerCase().includes(t);
      }
      return true;
    });
  }, [sales, saleAllocations, stockLots, dateFrom, dateTo, q]);

  const totalQty = rows.reduce((a, r) => a + r.qty, 0);
  const totalAmount = rows.reduce((a, r) => a + r.total, 0);

  function onExport() {
    if (rows.length === 0) { toast.error("No data"); return; }
    exportRows(rows.map((r) => ({ Date: r.date, Invoice: r.invoiceNo, Customer: r.customer, "Item Code": r.itemCode, Item: r.itemName, "Lot Info": r.lotInfo, Qty: r.qty, Rate: r.rate, Amount: r.amount, VAT: r.vat, Total: r.total })), "BOD Stock Out", `BOD_StockOut_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Item, invoice, customer..." className="h-9 text-xs" /></div>
          <div className="flex items-end"><Button variant="outline" onClick={onExport} className="h-9 w-full text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
        </div>
      </Card>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{rows.length}</strong> rows</span>
        <span>Qty: <strong className="text-foreground">{totalQty}</strong></span>
        <span>Total: <strong className="text-foreground">{money(totalAmount)}</strong></span>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[800px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Lot</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Rate</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5 text-right">VAT</th>
                <th className="p-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-2.5 whitespace-nowrap">{r.date}</td>
                  <td className="p-2.5 font-mono">{r.invoiceNo}</td>
                  <td className="p-2.5">{r.customer}</td>
                  <td className="p-2.5 font-medium">{r.itemName}</td>
                  <td className="p-2.5 font-mono text-[11px]">{r.lotInfo}</td>
                  <td className="p-2.5 text-right font-semibold">{r.qty}</td>
                  <td className="p-2.5 text-right">{money(r.rate)}</td>
                  <td className="p-2.5 text-right">{money(r.amount)}</td>
                  <td className="p-2.5 text-right text-muted-foreground">{money(r.vat)}</td>
                  <td className="p-2.5 text-right font-medium">{money(r.total)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">No stock out records.</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-muted">
                <tr className="border-t border-border font-semibold">
                  <td className="p-2.5" colSpan={5}>Total</td>
                  <td className="p-2.5 text-right">{totalQty}</td>
                  <td className="p-2.5 text-right" colSpan={2}></td>
                  <td className="p-2.5 text-right">{rows.reduce((a, r) => a + r.vat, 0)}</td>
                  <td className="p-2.5 text-right">{money(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodLots({ stockLots, saleAllocations, purchases }: { stockLots: any[]; saleAllocations: any[]; purchases: any[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    return stockLots.filter((l) => {
      if (status !== "all") {
        if (status === "open" && l.qty <= 0) return false;
        if (status === "sold" && l.qty > 0) return false;
        if (status === "partial") {
          const totalSold = saleAllocations.filter((a) => a.lotId === l.id).reduce((a, al) => a + al.qtyTaken, 0);
          if (l.qty <= 0 || totalSold <= 0) return false;
        }
      }
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        return l.lotNo.toLowerCase().includes(t) || l.itemName.toLowerCase().includes(t) || l.itemCode.toLowerCase().includes(t);
      }
      return true;
    });
  }, [stockLots, saleAllocations, q, status]);

  const totalReceived = rows.reduce((a, r) => a + r.qty + saleAllocations.filter((al) => al.lotId === r.id).reduce((b, al) => b + al.qtyTaken, 0), 0);
  const totalSold = rows.reduce((a, r) => a + saleAllocations.filter((al) => al.lotId === r.id).reduce((b, al) => b + al.qtyTaken, 0), 0);
  const totalAvail = rows.reduce((a, r) => a + r.qty, 0);

  function onExport() {
    if (rows.length === 0) { toast.error("No data"); return; }
    exportRows(rows.map((r) => {
      const sold = saleAllocations.filter((a) => a.lotId === r.id).reduce((b, a) => b + a.qtyTaken, 0);
      return { "Lot No": r.lotNo, Item: r.itemName, Code: r.itemCode, Date: r.date, Supplier: r.supplier, Received: r.qty + sold, Sold: sold, Available: r.qty, "Unit Cost": r.purchasePrice, "Total Cost": r.qty * r.purchasePrice };
    }), "BOD Lots", `BOD_Lots_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lot, item, code..." className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs">
              <option value="all">All</option><option value="open">Open</option><option value="partial">Partial</option><option value="sold">Sold</option>
            </select>
          </div>
          <div className="flex items-end"><Button variant="outline" onClick={onExport} className="h-9 w-full text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
        </div>
      </Card>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{rows.length}</strong> lots</span>
        <span>Received: <strong className="text-foreground">{totalReceived}</strong></span>
        <span>Sold: <strong className="text-foreground">{totalSold}</strong></span>
        <span>Available: <strong className="text-foreground">{totalAvail}</strong></span>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Lot No</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5 text-right">Received</th>
                <th className="p-2.5 text-right">Sold</th>
                <th className="p-2.5 text-right">Available</th>
                <th className="p-2.5 text-right">Cost</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sold = saleAllocations.filter((a) => a.lotId === r.id).reduce((b, a) => b + a.qtyTaken, 0);
                const st = r.qty <= 0 ? "Sold" : sold > 0 ? "Partial" : "Open";
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-2.5 font-mono font-medium">{r.lotNo}</td>
                    <td className="p-2.5">{r.itemName}</td>
                    <td className="p-2.5 whitespace-nowrap">{r.date}</td>
                    <td className="p-2.5 text-right">{r.qty + sold}</td>
                    <td className="p-2.5 text-right">{sold}</td>
                    <td className="p-2.5 text-right font-semibold">{r.qty}</td>
                    <td className="p-2.5 text-right">{money(r.purchasePrice)}</td>
                    <td className="p-2.5"><Badge variant={st === "Sold" ? "destructive" : st === "Partial" ? "secondary" : "outline"} className="text-[10px]">{st}</Badge></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No lots found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodProfit({ sales, saleAllocations, stockLots }: { sales: any[]; saleAllocations: any[]; stockLots: any[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, { invoiceNo: string; date: string; customer: string; totalSale: number; totalCost: number; profit: number }>();
    for (const s of sales) {
      const existing = map.get(s.invoiceNo);
      const allocs = saleAllocations.filter((a) => a.saleId === s.id);
      const cost = allocs.reduce((c, a) => c + a.qtyTaken * (stockLots.find((l) => l.id === a.lotId)?.purchasePrice || 0), 0);
      const profit = s.total - cost;
      if (existing) {
        existing.totalSale += s.total;
        existing.totalCost += cost;
        existing.profit += profit;
      } else {
        map.set(s.invoiceNo, { invoiceNo: s.invoiceNo, date: s.date, customer: s.customer, totalSale: s.total, totalCost: cost, profit });
      }
    }
    let rows = Array.from(map.values());
    if (dateFrom) rows = rows.filter((r) => r.date >= dateFrom);
    if (dateTo) rows = rows.filter((r) => r.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) rows = rows.filter((r) => r.invoiceNo.toLowerCase().includes(t) || r.customer.toLowerCase().includes(t));
    return rows;
  }, [sales, saleAllocations, stockLots, dateFrom, dateTo, q]);

  const totalSale = grouped.reduce((a, r) => a + r.totalSale, 0);
  const totalCost = grouped.reduce((a, r) => a + r.totalCost, 0);
  const totalProfit = grouped.reduce((a, r) => a + r.profit, 0);
  const avgMargin = totalSale > 0 ? (totalProfit / totalSale * 100) : 0;

  function onExport() {
    if (grouped.length === 0) { toast.error("No data"); return; }
    exportRows(grouped.map((r) => ({ Invoice: r.invoiceNo, Date: r.date, Customer: r.customer, "Sale Amount": r.totalSale, Cost: r.totalCost, Profit: r.profit, "Margin %": r.totalSale > 0 ? ((r.profit / r.totalSale) * 100).toFixed(1) + "%" : "0%" })), "BOD Profit", `BOD_Profit_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice, customer..." className="h-9 text-xs" /></div>
          <div className="flex items-end"><Button variant="outline" onClick={onExport} className="h-9 w-full text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
        </div>
      </Card>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Sale: <strong className="text-foreground">{money(totalSale)}</strong></span>
        <span>Cost: <strong className="text-foreground">{money(totalCost)}</strong></span>
        <span>Profit: <strong className={totalProfit >= 0 ? "text-green-600" : "text-destructive"}>{money(totalProfit)}</strong></span>
        <span>Margin: <strong className="text-foreground">{avgMargin.toFixed(1)}%</strong></span>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[600px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5 text-right">Sale</th>
                <th className="p-2.5 text-right">Cost</th>
                <th className="p-2.5 text-right">Profit</th>
                <th className="p-2.5 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((r) => (
                <tr key={r.invoiceNo} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium">{r.invoiceNo}</td>
                  <td className="p-2.5 whitespace-nowrap">{r.date}</td>
                  <td className="p-2.5">{r.customer}</td>
                  <td className="p-2.5 text-right">{money(r.totalSale)}</td>
                  <td className="p-2.5 text-right">{money(r.totalCost)}</td>
                  <td className={`p-2.5 text-right font-semibold ${r.profit >= 0 ? "text-green-600" : "text-destructive"}`}>{money(r.profit)}</td>
                  <td className="p-2.5 text-right">{r.totalSale > 0 ? ((r.profit / r.totalSale) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              {grouped.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No profit data.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodVendors({ vendors, vendorTransactions, vendorPayments }: { vendors: any[]; vendorTransactions: any[]; vendorPayments: any[] }) {
  const rows = useMemo(() => {
    return vendors.map((v) => {
      const txns = vendorTransactions.filter((t) => t.vendorId === v.id);
      const totalPurchases = txns.filter((t) => t.transactionType === "PURCHASE").reduce((a, t) => a + t.debit, 0);
      const totalPayments = txns.filter((t) => t.transactionType === "PAYMENT").reduce((a, t) => a + t.credit, 0);
      const totalReturns = txns.filter((t) => t.transactionType === "PURCHASE_RETURN").reduce((a, t) => a + t.credit, 0);
      const outstanding = txns.length > 0 ? txns.reduce((max, t) => t.balance > max ? t.balance : max, v.openingBalance) : v.openingBalance;
      const status = outstanding <= 0 ? "Paid" : outstanding > 0 ? "Due" : "Overdue";
      return { ...v, totalPurchases, totalPayments, totalReturns, outstanding, status };
    });
  }, [vendors, vendorTransactions]);

  function onExport() {
    if (rows.length === 0) { toast.error("No data"); return; }
    exportRows(rows.map((r) => ({ Code: r.vendorCode, Name: r.vendorName, Type: r.vendorType, PAN: r.pan, "Opening Balance": r.openingBalance, "Total Purchases": r.totalPurchases, "Total Payments": r.totalPayments, Returns: r.totalReturns, Outstanding: r.outstanding, Status: r.status })), "BOD Vendors", `BOD_Vendors_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="outline" onClick={onExport} className="h-9 text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Name</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5 text-right">Opening</th>
                <th className="p-2.5 text-right">Purchases</th>
                <th className="p-2.5 text-right">Payments</th>
                <th className="p-2.5 text-right">Returns</th>
                <th className="p-2.5 text-right">Outstanding</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2.5 font-mono">{r.vendorCode}</td>
                  <td className="p-2.5 font-medium">{r.vendorName}</td>
                  <td className="p-2.5">{r.vendorType}</td>
                  <td className="p-2.5 text-right">{money(r.openingBalance)}</td>
                  <td className="p-2.5 text-right">{money(r.totalPurchases)}</td>
                  <td className="p-2.5 text-right">{money(r.totalPayments)}</td>
                  <td className="p-2.5 text-right">{money(r.totalReturns)}</td>
                  <td className={`p-2.5 text-right font-semibold ${r.outstanding > 0 ? "text-destructive" : ""}`}>{money(r.outstanding)}</td>
                  <td className="p-2.5"><Badge variant={r.status === "Paid" ? "outline" : "destructive"} className="text-[10px]">{r.status}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No vendors.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodReturns({ salesReturns }: { salesReturns: any[] }) {
  const totalRefund = salesReturns.reduce((a, r) => a + r.refundAmount, 0);

  function onExport() {
    if (salesReturns.length === 0) { toast.error("No data"); return; }
    exportRows(salesReturns.map((r) => ({ "Return No": r.returnNo, Invoice: r.originalInvoiceNo, Item: r.saleItemName, Code: r.saleItemCode, IMEI: r.imei, Qty: r.qty, Date: r.returnDate, Reason: r.reason, Refund: r.refundAmount, Status: r.status })), "BOD Returns", `BOD_Returns_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="outline" onClick={onExport} className="h-9 text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
      <div className="text-xs text-muted-foreground"><strong className="text-foreground">{salesReturns.length}</strong> returns — Total refund: <strong className="text-foreground">{money(totalRefund)}</strong></div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[600px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Return No</th>
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Qty</th>
                <th className="p-2.5 text-right">Refund</th>
                <th className="p-2.5">Reason</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {salesReturns.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium">{r.returnNo}</td>
                  <td className="p-2.5 font-mono">{r.originalInvoiceNo}</td>
                  <td className="p-2.5">{r.saleItemName}</td>
                  <td className="p-2.5 text-right font-semibold">{r.qty}</td>
                  <td className="p-2.5 text-right text-destructive">{money(r.refundAmount)}</td>
                  <td className="p-2.5">{r.reason}</td>
                  <td className="p-2.5"><Badge variant="outline" className="text-[10px]">{r.status}</Badge></td>
                </tr>
              ))}
              {salesReturns.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No returns.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BodAllStores({ stock, sales, purchaseHeaders, stockLots, vendors, vendorTransactions }: { stock: any[]; sales: any[]; purchaseHeaders: any[]; stockLots: any[]; vendors: any[]; vendorTransactions: any[] }) {
  const stores = useMemo(() => {
    const storeMap = new Map<string, { name: string; stockItems: number; stockQty: number; stockValue: number; sales: number; purchases: number; vat: number; vendorCount: number; payable: number }>();
    for (const [id, name] of Object.entries(LOCATION_LABELS)) {
      if (id === WAREHOUSE_ID) continue;
      storeMap.set(id, { name, stockItems: 0, stockQty: 0, stockValue: 0, sales: 0, purchases: 0, vat: 0, vendorCount: 0, payable: 0 });
    }
    for (const s of stock) {
      const st = storeMap.get(s.storeId || "");
      if (st) { st.stockItems++; st.stockQty += s.qty; }
    }
    for (const l of stockLots) {
      const st = storeMap.get(l.storeId || "");
      if (st && l.qty > 0) st.stockValue += l.qty * l.purchasePrice;
    }
    for (const s of sales) {
      const st = storeMap.get(s.storeId || "");
      if (st) { st.sales += s.total; st.vat += s.vat; }
    }
    for (const p of purchaseHeaders) {
      const st = storeMap.get(p.storeId || "");
      if (st) st.purchases += p.grandTotal;
    }
    const vendorStoreMap = new Map<string, Set<string>>();
    for (const v of vendors) {
      if (v.storeId) {
        if (!vendorStoreMap.has(v.storeId)) vendorStoreMap.set(v.storeId, new Set());
        vendorStoreMap.get(v.storeId)!.add(v.id);
      }
    }
    for (const [storeId, ids] of vendorStoreMap) {
      const st = storeMap.get(storeId);
      if (st) st.vendorCount = ids.size;
    }
    return Array.from(storeMap.values());
  }, [stock, sales, purchaseHeaders, stockLots, vendors, vendorTransactions]);

  const grandTotal = stores.reduce((a, s) => ({
    stockItems: a.stockItems + s.stockItems, stockQty: a.stockQty + s.stockQty, stockValue: a.stockValue + s.stockValue,
    sales: a.sales + s.sales, purchases: a.purchases + s.purchases, vat: a.vat + s.vat, vendorCount: a.vendorCount + s.vendorCount,
  }), { stockItems: 0, stockQty: 0, stockValue: 0, sales: 0, purchases: 0, vat: 0, vendorCount: 0 });

  function onExport() {
    if (stores.length === 0) { toast.error("No data"); return; }
    exportRows(stores.map((s) => ({ Store: s.name, "Stock Items": s.stockItems, "Stock Qty": s.stockQty, "Stock Value": s.stockValue, Sales: s.sales, Purchases: s.purchases, VAT: s.vat, Vendors: s.vendorCount })), "BOD All Stores", `BOD_AllStores_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="outline" onClick={onExport} className="h-9 text-xs"><Download className="mr-1 size-3.5" /> Export</Button></div>
      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Store</th>
                <th className="p-2.5 text-right">Stock Items</th>
                <th className="p-2.5 text-right">Stock Qty</th>
                <th className="p-2.5 text-right">Stock Value</th>
                <th className="p-2.5 text-right">Sales</th>
                <th className="p-2.5 text-right">Purchases</th>
                <th className="p-2.5 text-right">VAT</th>
                <th className="p-2.5 text-right">Vendors</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.name} className="border-t border-border">
                  <td className="p-2.5 font-medium">{s.name}</td>
                  <td className="p-2.5 text-right">{s.stockItems}</td>
                  <td className="p-2.5 text-right">{s.stockQty}</td>
                  <td className="p-2.5 text-right">{money(s.stockValue)}</td>
                  <td className="p-2.5 text-right">{money(s.sales)}</td>
                  <td className="p-2.5 text-right">{money(s.purchases)}</td>
                  <td className="p-2.5 text-right">{money(s.vat)}</td>
                  <td className="p-2.5 text-right">{s.vendorCount}</td>
                </tr>
              ))}
              {stores.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No stores.</td></tr>}
            </tbody>
            {stores.length > 0 && (
              <tfoot className="sticky bottom-0 bg-muted">
                <tr className="border-t border-border font-semibold">
                  <td className="p-2.5">Grand Total</td>
                  <td className="p-2.5 text-right">{grandTotal.stockItems}</td>
                  <td className="p-2.5 text-right">{grandTotal.stockQty}</td>
                  <td className="p-2.5 text-right">{money(grandTotal.stockValue)}</td>
                  <td className="p-2.5 text-right">{money(grandTotal.sales)}</td>
                  <td className="p-2.5 text-right">{money(grandTotal.purchases)}</td>
                  <td className="p-2.5 text-right">{money(grandTotal.vat)}</td>
                  <td className="p-2.5 text-right">{grandTotal.vendorCount}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

const WAREHOUSE_ID = "a0000000-0000-0000-0000-000000000004";
