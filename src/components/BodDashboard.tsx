import { useMemo, useState } from "react";
import {
  LayoutDashboard, TrendingUp, TrendingDown, ShoppingBag, PackagePlus,
  DollarSign, BarChart3, PieChart as PieChartIcon, Building2, Download,
  Search, Filter, Boxes, Users, AlertTriangle, Truck, RotateCcw,
  Wallet, CreditCard, Banknote, Clock, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useStore, LOCATION_LABELS, WAREHOUSE_ID, VAT_RATE } from "@/lib/store";
import { useStoreContext } from "@/lib/store-context";
import { money } from "@/lib/utils";
import { exportRows } from "@/lib/excel";

const STORE_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#e11d48"];
const PIE_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#e11d48", "#ca8a04", "#6366f1"];
const fmt = (d: string) => d?.slice(0, 10) || "";
const shortMonth = (d: string) => {
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dt = new Date(d);
  return m[dt.getMonth()] + " " + dt.getDate();
};

function Kpi({ label, value, sub, icon: Icon, trend, color }: {
  label: string; value: string; sub?: string; icon?: any; trend?: "up" | "down"; color?: string;
}) {
  return (
    <Card className={`p-3 sm:p-4 ${color ? `border-l-4 border-l-${color}` : ""}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">{label}</p>
          <p className="mt-1 text-lg font-bold sm:text-xl">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{sub}</p>}
        </div>
        {Icon && <div className="rounded-md bg-muted p-1.5"><Icon className="size-4 text-muted-foreground" /></div>}
      </div>
    </Card>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: any; className?: string }) {
  return (
    <Card className={`p-4 ${className}`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">{title}</p>
      {children}
    </Card>
  );
}

function DateFilter({ from, to, onFrom, onTo, q, onQ, placeholder }: {
  from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void;
  q: string; onQ: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
      <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="h-9 text-xs" /></div>
      <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => onTo(e.target.value)} className="h-9 text-xs" /></div>
      <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => onQ(e.target.value)} placeholder={placeholder || "Search..."} className="h-9 text-xs" /></div>
      <div className="flex items-end"><Filter className="mr-1 size-3.5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Filter active</span></div>
    </div>
  );
}

function ExportBtn({ onExport, label }: { onExport: () => void; label?: string }) {
  return (
    <Button variant="outline" onClick={onExport} className="h-9 text-xs">
      <Download className="mr-1 size-3.5" /> {label || "Export Excel"}
    </Button>
  );
}

const NoData = ({ msg }: { msg?: string }) => (
  <p className="py-8 text-center text-xs text-muted-foreground">{msg || "No data available."}</p>
);

const DataTable = ({ children, className = "" }: { children: any; className?: string }) => (
  <Card className={`overflow-hidden p-0 ${className}`}>
    <div className="max-h-[60vh] overflow-auto">
      <table className="w-full min-w-[800px] text-xs">{children}</table>
    </div>
  </Card>
);

const Th = ({ children, className = "" }: { children: any; className?: string }) => (
  <th className={`p-2.5 ${className}`}>{children}</th>
);
const ThR = ({ children, className = "" }: { children: any; className?: string }) => (
  <th className={`p-2.5 text-right ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }: { children: any; className?: string }) => (
  <td className={`p-2.5 ${className}`}>{children}</td>
);
const TdR = ({ children, className = "" }: { children: any; className?: string }) => (
  <td className={`p-2.5 text-right ${className}`}>{children}</td>
);

export function BodDashboard() {
  const {
    stock, sales, purchases, stockLots, saleAllocations, purchaseHeaders, purchaseItems,
    salesReturns, vendors, vendorTransactions, vendorPayments, stockAdjustments,
    purchaseReturns,
  } = useStore();
  const { currentStoreId } = useStoreContext();
  const [subTab, setSubTab] = useState("overview");
  const storeLabel = currentStoreId ? LOCATION_LABELS[currentStoreId] || "Store" : "All Stores";

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="mb-4 flex h-10 w-full overflow-x-auto overflow-y-hidden p-1 sm:w-auto sm:flex-nowrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm"><LayoutDashboard className="mr-1 size-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm"><ShoppingBag className="mr-1 size-3.5" /> Sales</TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs sm:text-sm"><PackagePlus className="mr-1 size-3.5" /> Purchases</TabsTrigger>
          <TabsTrigger value="profitability" className="text-xs sm:text-sm"><TrendingUp className="mr-1 size-3.5" /> Profitability</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm"><Boxes className="mr-1 size-3.5" /> Inventory</TabsTrigger>
          <TabsTrigger value="vendors" className="text-xs sm:text-sm"><Users className="mr-1 size-3.5" /> Vendors</TabsTrigger>
          <TabsTrigger value="cashflow" className="text-xs sm:text-sm"><Wallet className="mr-1 size-3.5" /> Cash Flow</TabsTrigger>
          <TabsTrigger value="stores" className="text-xs sm:text-sm"><Building2 className="mr-1 size-3.5" /> Stores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><TabOverview {...{ stock, sales, purchases, stockLots, saleAllocations, purchaseHeaders, purchaseItems, salesReturns, vendors, vendorTransactions, vendorPayments, storeLabel }} /></TabsContent>
        <TabsContent value="sales"><TabSales {...{ sales, stockLots, saleAllocations, salesReturns }} /></TabsContent>
        <TabsContent value="purchases"><TabPurchases {...{ purchaseHeaders, purchaseItems, purchaseReturns }} /></TabsContent>
        <TabsContent value="profitability"><TabProfitability {...{ sales, saleAllocations, stockLots, purchaseHeaders, purchaseItems }} /></TabsContent>
        <TabsContent value="inventory"><TabInventory {...{ stock, sales, stockLots, saleAllocations, stockAdjustments }} /></TabsContent>
        <TabsContent value="vendors"><TabVendors {...{ vendors, vendorTransactions, vendorPayments }} /></TabsContent>
        <TabsContent value="cashflow"><TabCashFlow {...{ sales, purchases, purchaseHeaders, vendorPayments, saleAllocations, stockLots }} /></TabsContent>
        <TabsContent value="stores"><TabStores {...{ stock, sales, purchaseHeaders, stockLots, saleAllocations, vendors, vendorTransactions }} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── TAB 1: EXECUTIVE OVERVIEW ────────────────────────────────────────────────

function TabOverview({ stock, sales, purchases, stockLots, saleAllocations, purchaseHeaders, salesReturns, vendors, vendorTransactions, storeLabel }: any) {
  const o = useMemo(() => {
    const totalSales = sales.reduce((a: number, s: any) => a + s.total, 0);
    const totalPurchases = purchaseHeaders.reduce((a: number, p: any) => a + p.grandTotal, 0);
    const stockValue = stockLots.filter((l: any) => l.qty > 0).reduce((a: number, l: any) => a + l.qty * l.purchasePrice, 0);
    const stockQty = stockLots.filter((l: any) => l.qty > 0).reduce((a: number, l: any) => a + l.qty, 0);
    const totalProfit = sales.reduce((a: number, s: any) => {
      const allocs = saleAllocations.filter((al: any) => al.saleId === s.id);
      const cost = allocs.reduce((c: number, al: any) => c + al.qtyTaken * (stockLots.find((l: any) => l.id === al.lotId)?.purchasePrice || 0), 0);
      return a + (s.total - cost);
    }, 0);
    const vendorPayable = vendors.reduce((a: number, v: any) => {
      const txns = vendorTransactions.filter((t: any) => t.vendorId === v.id);
      const lastBal = txns.length > 0 ? txns.reduce((max: number, t: any) => t.balance > max ? t.balance : max, 0) : v.openingBalance;
      return a + lastBal;
    }, 0);
    const today = new Date().toISOString().slice(0, 10);
    const todaySalesTotal = sales.filter((s: any) => s.date === today).reduce((a: number, s: any) => a + s.total, 0);
    const invoiceCount = new Set(sales.map((s: any) => s.invoiceNo)).size;
    const totalVat = sales.reduce((a: number, s: any) => a + s.vat, 0);
    const totalReturnRefund = salesReturns.reduce((a: number, r: any) => a + r.refundAmount, 0);
    const avgSaleValue = invoiceCount > 0 ? totalSales / invoiceCount : 0;
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;

    const monthMap = new Map<string, { sales: number; purchases: number }>();
    for (const s of sales) {
      const m = s.date?.slice(0, 7);
      if (m) { const e = monthMap.get(m) || { sales: 0, purchases: 0 }; e.sales += s.total; monthMap.set(m, e); }
    }
    for (const p of purchaseHeaders) {
      const m = p.date?.slice(0, 7);
      if (m) { const e = monthMap.get(m) || { sales: 0, purchases: 0 }; e.purchases += p.grandTotal; monthMap.set(m, e); }
    }
    const monthlyTrend = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([m, v]) => ({ month: m, label: m, sales: v.sales, purchases: v.purchases, profit: v.sales - v.purchases }));

    const storeMap = new Map<string, { name: string; sales: number; purchases: number }>();
    for (const [id, name] of Object.entries(LOCATION_LABELS)) {
      if (id === WAREHOUSE_ID) continue;
      storeMap.set(id, { name, sales: 0, purchases: 0 });
    }
    for (const s of sales) { const st = storeMap.get(s.storeId || ""); if (st) st.sales += s.total; }
    for (const p of purchaseHeaders) { const st = storeMap.get(p.storeId || ""); if (st) st.purchases += p.grandTotal; }
    const storePerf = Array.from(storeMap.values()).map(s => ({ ...s, profit: s.sales - s.purchases, margin: s.sales > 0 ? ((s.sales - s.purchases) / s.sales * 100) : 0 }));

    const methodMap = new Map<string, number>();
    for (const s of sales) { const m = s.paymentMethod || "Cash"; methodMap.set(m, (methodMap.get(m) || 0) + s.total); }
    const paymentBreakdown = Array.from(methodMap.entries()).map(([name, value]) => ({ name, value }));

    return {
      totalSales, totalPurchases, stockValue, stockQty, totalProfit, vendorPayable,
      todaySalesTotal, invoiceCount, totalVat, totalReturnRefund, avgSaleValue, profitMargin,
      monthlyTrend, storePerf, paymentBreakdown,
    };
  }, [stock, sales, purchases, stockLots, saleAllocations, purchaseHeaders, salesReturns, vendors, vendorTransactions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">{storeLabel} — Executive Overview</p>
        <ExportBtn onExport={() => {
          exportRows([{ Metric: "Total Sales", Value: o.totalSales }, { Metric: "Total Purchases", Value: o.totalPurchases },
            { Metric: "Total Profit", Value: o.totalProfit }, { Metric: "Profit Margin", Value: o.profitMargin.toFixed(1) + "%" },
            { Metric: "Stock Value", Value: o.stockValue }, { Metric: "Vendor Payable", Value: o.vendorPayable },
            { Metric: "Total VAT", Value: o.totalVat }, { Metric: "Invoices", Value: o.invoiceCount },
            { Metric: "Avg Sale Value", Value: o.avgSaleValue }], "Overview KPIs", `BOD_Overview_${today()}.xlsx`);
        }} />
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Total Sales" value={money(o.totalSales)} sub={`${o.invoiceCount} invoices`} icon={ShoppingBag} color="blue" />
        <Kpi label="Total Purchases" value={money(o.totalPurchases)} icon={PackagePlus} color="green" />
        <Kpi label="Net Profit" value={money(o.totalProfit)} sub={`${o.profitMargin.toFixed(1)}% margin`} icon={TrendingUp} color="orange" />
        <Kpi label="Stock Value" value={money(o.stockValue)} sub={`${o.stockQty} units`} icon={Boxes} color="purple" />
        <Kpi label="Vendor Payable" value={money(o.vendorPayable)} icon={Users} color="red" />
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Kpi label="Today's Sales" value={money(o.todaySalesTotal)} icon={DollarSign} />
        <Kpi label="Total VAT" value={money(o.totalVat)} icon={CreditCard} />
        <Kpi label="Returns Refund" value={money(o.totalReturnRefund)} icon={RotateCcw} />
        <Kpi label="Avg Sale Value" value={money(o.avgSaleValue)} icon={Target} />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Monthly Sales vs Purchases">
          {o.monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={o.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="purchases" stroke="#16a34a" strokeWidth={2} name="Purchases" />
                <Line type="monotone" dataKey="profit" stroke="#ea580c" strokeWidth={2} strokeDasharray="5 5" name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          ) : <NoData msg="No monthly data yet." />}
        </ChartCard>
        <ChartCard title="Store Performance">
          {o.storePerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={o.storePerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Bar dataKey="sales" fill="#2563eb" name="Sales" />
                <Bar dataKey="purchases" fill="#16a34a" name="Purchases" />
                <Bar dataKey="profit" fill="#ea580c" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      {o.paymentBreakdown.length > 0 && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <ChartCard title="Sales by Payment Method">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={o.paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {o.paymentBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <Card className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Store Summary</p>
            <div className="space-y-2">
              {o.storePerf.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-medium">{s.name}</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-muted-foreground">Sales: <strong className="text-foreground">{money(s.sales)}</strong></span>
                    <span className="text-muted-foreground">Margin: <strong className={s.margin >= 0 ? "text-green-600" : "text-destructive"}>{s.margin.toFixed(1)}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── TAB 2: SALES ANALYTICS ──────────────────────────────────────────────────

function TabSales({ sales, stockLots, saleAllocations, salesReturns }: any) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let rows = sales;
    if (dateFrom) rows = rows.filter((s: any) => s.date >= dateFrom);
    if (dateTo) rows = rows.filter((s: any) => s.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) rows = rows.filter((s: any) => s.invoiceNo.toLowerCase().includes(t) || s.customer.toLowerCase().includes(t) || s.itemName.toLowerCase().includes(t) || s.itemCode.toLowerCase().includes(t));
    return rows;
  }, [sales, dateFrom, dateTo, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, { invoiceNo: string; date: string; customer: string; saleType: string; status: string; items: any[]; grandTotal: number; paidAmount: number; remaining: number; paymentMethod: string; storeId: string }>();
    for (const s of filtered) {
      const existing = map.get(s.invoiceNo);
      const allocs = saleAllocations.filter((a: any) => a.saleId === s.id);
      const lotInfo = allocs.map((a: any) => { const lot = stockLots.find((l: any) => l.id === a.lotId); return lot ? `${lot.lotNo}(${a.qtyTaken})` : ""; }).filter(Boolean).join(", ");
      if (existing) {
        existing.items.push({ ...s, lotInfo });
        existing.grandTotal += s.total;
        existing.paidAmount += s.paidAmount;
        existing.remaining += s.remaining;
      } else {
        map.set(s.invoiceNo, { invoiceNo: s.invoiceNo, date: s.date, customer: s.customer, saleType: s.saleType, status: s.status, items: [{ ...s, lotInfo }], grandTotal: s.total, paidAmount: s.paidAmount, remaining: s.remaining, paymentMethod: s.paymentMethod, storeId: s.storeId });
      }
    }
    return Array.from(map.values());
  }, [filtered, saleAllocations, stockLots]);

  const a = useMemo(() => {
    const totalGrand = grouped.reduce((a, r) => a + r.grandTotal, 0);
    const totalPaid = grouped.reduce((a, r) => a + r.paidAmount, 0);
    const totalVat = filtered.reduce((a, s) => a + s.vat, 0);
    const creditSales = grouped.filter(r => r.saleType === "Credit").reduce((a, r) => a + r.grandTotal, 0);
    const creditPct = totalGrand > 0 ? (creditSales / totalGrand * 100) : 0;
    const totalReturns = salesReturns.filter((r: any) => {
      if (dateFrom && r.returnDate < dateFrom) return false;
      if (dateTo && r.returnDate > dateTo) return false;
      return true;
    }).reduce((a: number, r: any) => a + r.refundAmount, 0);
    const returnRate = totalGrand > 0 ? (totalReturns / totalGrand * 100) : 0;

    const dailyMap = new Map<string, number>();
    for (const s of filtered) { const d = s.date?.slice(0, 10); if (d) dailyMap.set(d, (dailyMap.get(d) || 0) + s.total); }
    const dailyTrend = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date: shortMonth(date), label: date, total }));

    const catMap = new Map<string, number>();
    for (const s of filtered) { const c = s.category || "Uncategorized"; catMap.set(c, (catMap.get(c) || 0) + s.total); }
    const categoryBreakdown = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const brandMap = new Map<string, { sales: number; qty: number; profit: number }>();
    for (const s of filtered) {
      const b = s.brand || "Unknown";
      const e = brandMap.get(b) || { sales: 0, qty: 0, profit: 0 };
      e.sales += s.total;
      e.qty += s.qty;
      const allocs = saleAllocations.filter((al: any) => al.saleId === s.id);
      const cost = allocs.reduce((c: number, al: any) => c + al.qtyTaken * (stockLots.find((l: any) => l.id === al.lotId)?.purchasePrice || 0), 0);
      e.profit += s.total - cost;
      brandMap.set(b, e);
    }
    const brandPerformance = Array.from(brandMap.entries()).map(([brand, v]) => ({
      brand, sales: v.sales, qty: v.qty, profit: v.profit, margin: v.sales > 0 ? (v.profit / v.sales * 100) : 0,
    })).sort((a, b) => b.sales - a.sales);

    const itemMap = new Map<string, { name: string; code: string; qty: number; revenue: number; profit: number }>();
    for (const s of filtered) {
      const key = s.itemCode;
      const e = itemMap.get(key) || { name: s.itemName, code: s.itemCode, qty: 0, revenue: 0, profit: 0 };
      e.qty += s.qty;
      e.revenue += s.total;
      const allocs = saleAllocations.filter((al: any) => al.saleId === s.id);
      const cost = allocs.reduce((c: number, al: any) => c + al.qtyTaken * (stockLots.find((l: any) => l.id === al.lotId)?.purchasePrice || 0), 0);
      e.profit += s.total - cost;
      itemMap.set(key, e);
    }
    const topItems = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 15);

    const methodMap = new Map<string, number>();
    for (const s of filtered) { const m = s.paymentMethod || "Cash"; methodMap.set(m, (methodMap.get(m) || 0) + s.total); }
    const paymentBreakdown = Array.from(methodMap.entries()).map(([name, value]) => ({ name, value }));

    return { totalGrand, totalPaid, totalVat, creditPct, returnRate, totalReturns, dailyTrend, categoryBreakdown, brandPerformance, topItems, paymentBreakdown };
  }, [filtered, grouped, salesReturns, saleAllocations, stockLots, dateFrom, dateTo]);

  function onExport() {
    const rows: any[] = [];
    for (const g of grouped) {
      for (const it of g.items) {
        rows.push({ Invoice: g.invoiceNo, Date: g.date, Customer: g.customer, "Item Code": it.itemCode, Item: it.itemName, Qty: it.qty, Rate: it.rate, Amount: it.amount, VAT: it.vat, Total: it.total, "Sale Type": g.saleType, Status: g.status, "Paid Amount": g.paidAmount, Remaining: g.remaining, "Lot Info": it.lotInfo });
      }
    }
    if (rows.length === 0) { toast.error("No data"); return; }
    exportRows(rows, "BOD Sales", `BOD_Sales_${today()}.xlsx`);
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-5">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice, customer, item..." className="h-9 text-xs" /></div>
          <div className="flex items-end sm:col-span-2"><ExportBtn onExport={onExport} /></div>
        </div>
      </Card>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Invoices" value={String(grouped.length)} icon={ReceiptText} />
        <Kpi label="Revenue" value={money(a.totalGrand)} icon={DollarSign} />
        <Kpi label="Avg Sale" value={money(grouped.length > 0 ? a.totalGrand / grouped.length : 0)} icon={Target} />
        <Kpi label="VAT Collected" value={money(a.totalVat)} icon={CreditCard} />
        <Kpi label="Credit Sales" value={a.creditPct.toFixed(1) + "%"} icon={Banknote} />
        <Kpi label="Return Rate" value={a.returnRate.toFixed(1) + "%"} sub={money(a.totalReturns) + " refund"} icon={RotateCcw} />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Daily Sales Trend">
          {a.dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={a.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="total" fill="#2563eb" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
        <ChartCard title="Sales by Category">
          {a.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={a.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {a.categoryBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Sales by Payment Method">
          {a.paymentBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={a.paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {a.paymentBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
        <ChartCard title="Brand Performance">
          {a.brandPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.brandPerformance.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="brand" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="sales" fill="#16a34a" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      {a.brandPerformance.length > 0 && (
        <DataTable>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr>
              <Th>Brand</Th><ThR>Sales</ThR><ThR>Qty</ThR><ThR>Profit</ThR><ThR>Margin</ThR>
            </tr>
          </thead>
          <tbody>
            {a.brandPerformance.map((b: any) => (
              <tr key={b.brand} className="border-t border-border">
                <Td className="font-medium">{b.brand}</Td>
                <TdR className="font-semibold">{money(b.sales)}</TdR>
                <TdR>{b.qty}</TdR>
                <TdR className={b.profit >= 0 ? "text-green-600" : "text-destructive"}>{money(b.profit)}</TdR>
                <TdR>{b.margin.toFixed(1)}%</TdR>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      {a.topItems.length > 0 && (
        <DataTable>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr><Th>Item</Th><Th>Code</Th><ThR>Qty Sold</ThR><ThR>Revenue</ThR><ThR>Profit</ThR><ThR>Margin</ThR></tr>
          </thead>
          <tbody>
            {a.topItems.map((it: any, i: number) => (
              <tr key={it.code} className="border-t border-border">
                <Td className="font-medium">{i + 1}. {it.name}</Td>
                <Td className="font-mono">{it.code}</Td>
                <TdR>{it.qty}</TdR>
                <TdR className="font-semibold">{money(it.revenue)}</TdR>
                <TdR className={it.profit >= 0 ? "text-green-600" : "text-destructive"}>{money(it.profit)}</TdR>
                <TdR>{it.revenue > 0 ? (it.profit / it.revenue * 100).toFixed(1) : 0}%</TdR>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}

function ReceiptText({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8h-4"/><path d="M16 12h-6"/><path d="M10 16h6"/></svg>;
}

// ─── TAB 3: PURCHASE ANALYTICS ────────────────────────────────────────────────

function TabPurchases({ purchaseHeaders, purchaseItems, purchaseReturns }: any) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let rows = purchaseHeaders;
    if (dateFrom) rows = rows.filter((p: any) => p.date >= dateFrom);
    if (dateTo) rows = rows.filter((p: any) => p.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) rows = rows.filter((p: any) => p.purchaseNo.toLowerCase().includes(t) || p.supplierName.toLowerCase().includes(t) || p.supplierInvoiceNo.toLowerCase().includes(t));
    return rows;
  }, [purchaseHeaders, dateFrom, dateTo, q]);

  const a = useMemo(() => {
    const totalGrand = filtered.reduce((a: number, p: any) => a + p.grandTotal, 0);
    const totalPaid = filtered.reduce((a: number, p: any) => a + p.paidAmount, 0);
    const totalVat = filtered.reduce((a: number, p: any) => a + p.vatAmount, 0);
    const creditPurchases = filtered.filter((p: any) => p.purchaseType === "Credit").reduce((a: number, p: any) => a + p.grandTotal, 0);
    const creditPct = totalGrand > 0 ? (creditPurchases / totalGrand * 100) : 0;
    const totalReturns = purchaseReturns.filter((r: any) => {
      if (dateFrom && r.returnDate < dateFrom) return false;
      if (dateTo && r.returnDate > dateTo) return false;
      return true;
    }).reduce((a: number, r: any) => a + r.refundAmount, 0);

    const dailyMap = new Map<string, number>();
    for (const p of filtered) { const d = p.date?.slice(0, 10); if (d) dailyMap.set(d, (dailyMap.get(d) || 0) + p.grandTotal); }
    const dailyTrend = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date: shortMonth(date), label: date, total }));

    const supplierMap = new Map<string, { name: string; purchases: number; count: number; paid: number; remaining: number }>();
    for (const p of filtered) {
      const e = supplierMap.get(p.supplierName) || { name: p.supplierName, purchases: 0, count: 0, paid: 0, remaining: 0 };
      e.purchases += p.grandTotal;
      e.count++;
      e.paid += p.paidAmount;
      e.remaining += p.remainingBalance;
      supplierMap.set(p.supplierName, e);
    }
    const topSuppliers = Array.from(supplierMap.values()).sort((a, b) => b.purchases - a.purchases);

    const catMap = new Map<string, { amount: number; qty: number }>();
    for (const pi of purchaseItems) {
      const ph = filtered.find((p: any) => p.id === pi.purchaseHeaderId);
      if (!ph) continue;
      const c = pi.category || "Uncategorized";
      const e = catMap.get(c) || { amount: 0, qty: 0 };
      e.amount += pi.total;
      e.qty += pi.qty;
      catMap.set(c, e);
    }
    const categoryBreakdown = Array.from(catMap.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount);

    const brandMap = new Map<string, number>();
    for (const pi of purchaseItems) {
      const ph = filtered.find((p: any) => p.id === pi.purchaseHeaderId);
      if (!ph) continue;
      const b = pi.brand || "Unknown";
      brandMap.set(b, (brandMap.get(b) || 0) + pi.total);
    }
    const brandBreakdown = Array.from(brandMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

    return { totalGrand, totalPaid, totalVat, creditPct, totalReturns, dailyTrend, topSuppliers, categoryBreakdown, brandBreakdown };
  }, [filtered, purchaseItems, purchaseReturns, dateFrom, dateTo]);

  function today() { return new Date().toISOString().slice(0, 10); }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-5">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Purchase no, supplier..." className="h-9 text-xs" /></div>
          <div className="flex items-end sm:col-span-2">
            <ExportBtn onExport={() => {
              exportRows(filtered.map((p: any) => ({ "Purchase No": p.purchaseNo, Date: p.date, Supplier: p.supplierName, "Grand Total": p.grandTotal, Paid: p.paidAmount, Remaining: p.remainingBalance, Type: p.purchaseType })), "BOD Purchases", `BOD_Purchases_${today()}.xlsx`);
            }} />
          </div>
        </div>
      </Card>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Purchases" value={String(filtered.length)} icon={PackagePlus} />
        <Kpi label="Total Value" value={money(a.totalGrand)} icon={DollarSign} />
        <Kpi label="VAT Input" value={money(a.totalVat)} icon={CreditCard} />
        <Kpi label="Credit %" value={a.creditPct.toFixed(1) + "%"} icon={Banknote} />
        <Kpi label="Returns" value={money(a.totalReturns)} icon={RotateCcw} />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Purchase Trend">
          {a.dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={a.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} name="Purchases" />
              </LineChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
        <ChartCard title="Purchases by Category">
          {a.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={a.categoryBreakdown} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {a.categoryBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      {a.brandBreakdown.length > 0 && (
        <ChartCard title="Purchases by Brand">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={a.brandBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="value" fill="#9333ea" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
      {a.topSuppliers.length > 0 && (
        <DataTable>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr><Th>Supplier</Th><ThR>Purchases</ThR><ThR>Count</ThR><ThR>Paid</ThR><ThR>Outstanding</ThR></tr>
          </thead>
          <tbody>
            {a.topSuppliers.map((s) => (
              <tr key={s.name} className="border-t border-border">
                <Td className="font-medium">{s.name}</Td>
                <TdR className="font-semibold">{money(s.purchases)}</TdR>
                <TdR>{s.count}</TdR>
                <TdR>{money(s.paid)}</TdR>
                <TdR className={s.remaining > 0 ? "text-destructive" : ""}>{money(s.remaining)}</TdR>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}

// ─── TAB 4: PROFITABILITY DEEP DIVE ───────────────────────────────────────────

function TabProfitability({ sales, saleAllocations, stockLots, purchaseHeaders, purchaseItems }: any) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let rows = sales;
    if (dateFrom) rows = rows.filter((s: any) => s.date >= dateFrom);
    if (dateTo) rows = rows.filter((s: any) => s.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) rows = rows.filter((s: any) => s.invoiceNo.toLowerCase().includes(t) || s.customer.toLowerCase().includes(t) || s.itemName.toLowerCase().includes(t));
    return rows;
  }, [sales, dateFrom, dateTo, q]);

  const a = useMemo(() => {
    let totalRevenue = 0, totalCost = 0;
    const catMap = new Map<string, { revenue: number; cost: number }>();
    const brandMap = new Map<string, { revenue: number; cost: number }>();
    const storeMap = new Map<string, { revenue: number; cost: number }>();
    const itemMap = new Map<string, { name: string; code: string; revenue: number; cost: number; qty: number }>();
    const dailyMap = new Map<string, { revenue: number; cost: number }>();

    for (const s of filtered) {
      const allocs = saleAllocations.filter((al: any) => al.saleId === s.id);
      const cost = allocs.reduce((c: number, al: any) => c + al.qtyTaken * (stockLots.find((l: any) => l.id === al.lotId)?.purchasePrice || 0), 0);
      const profit = s.total - cost;
      totalRevenue += s.total;
      totalCost += cost;

      const cat = s.category || "Uncategorized";
      const ce = catMap.get(cat) || { revenue: 0, cost: 0 }; ce.revenue += s.total; ce.cost += cost; catMap.set(cat, ce);
      const br = s.brand || "Unknown";
      const be = brandMap.get(br) || { revenue: 0, cost: 0 }; be.revenue += s.total; be.cost += cost; brandMap.set(br, be);
      const st = LOCATION_LABELS[s.storeId] || "Unknown";
      const se = storeMap.get(st) || { revenue: 0, cost: 0 }; se.revenue += s.total; se.cost += cost; storeMap.set(st, se);
      const key = s.itemCode;
      const ie = itemMap.get(key) || { name: s.itemName, code: s.itemCode, revenue: 0, cost: 0, qty: 0 }; ie.revenue += s.total; ie.cost += cost; ie.qty += s.qty; itemMap.set(key, ie);
      const day = s.date?.slice(0, 10);
      if (day) { const de = dailyMap.get(day) || { revenue: 0, cost: 0 }; de.revenue += s.total; de.cost += cost; dailyMap.set(day, de); }
    }

    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

    const categoryData = Array.from(catMap.entries()).map(([name, v]) => ({
      name, revenue: v.revenue, cost: v.cost, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue * 100) : 0,
    })).sort((a, b) => b.profit - a.profit);

    const brandData = Array.from(brandMap.entries()).map(([name, v]) => ({
      name, revenue: v.revenue, cost: v.cost, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue * 100) : 0,
    })).sort((a, b) => b.profit - a.profit);

    const storeData = Array.from(storeMap.entries()).map(([name, v]) => ({
      name, revenue: v.revenue, cost: v.cost, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue * 100) : 0,
    })).sort((a, b) => b.profit - a.profit);

    const itemData = Array.from(itemMap.values()).map(v => ({
      ...v, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue * 100) : 0,
    })).sort((a, b) => b.profit - a.profit);
    const top10 = itemData.slice(0, 10);
    const bottom10 = itemData.filter(i => i.revenue > 0).slice(-10).reverse();

    const trendData = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({
      date: shortMonth(day), revenue: v.revenue, cost: v.cost, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue * 100) : 0,
    }));

    return { totalRevenue, totalCost, totalProfit, avgMargin, categoryData, brandData, storeData, itemData, top10, bottom10, trendData };
  }, [filtered, saleAllocations, stockLots, dateFrom, dateTo]);

  function today() { return new Date().toISOString().slice(0, 10); }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-5">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice, customer, item..." className="h-9 text-xs" /></div>
          <div className="flex items-end sm:col-span-2">
            <ExportBtn onExport={() => {
              exportRows(a.categoryData.map(c => ({ Category: c.name, Revenue: c.revenue, Cost: c.cost, Profit: c.profit, Margin: c.margin.toFixed(1) + "%" })), "Profit by Category", `BOD_Profit_Cat_${today()}.xlsx`);
            }} />
          </div>
        </div>
      </Card>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue" value={money(a.totalRevenue)} icon={DollarSign} />
        <Kpi label="Cost of Goods" value={money(a.totalCost)} icon={PackagePlus} />
        <Kpi label="Net Profit" value={money(a.totalProfit)} icon={TrendingUp} color="green" />
        <Kpi label="Avg Margin" value={a.avgMargin.toFixed(1) + "%"} icon={Target} />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Profit Margin Trend">
          {a.trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={a.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, name: string) => name === "margin" ? v.toFixed(1) + "%" : money(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="cost" stroke="#ea580c" strokeWidth={2} name="Cost" />
                <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
        <ChartCard title="Profit by Category">
          {a.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={a.categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="#2563eb" name="Revenue" />
                <Bar dataKey="cost" fill="#ea580c" name="Cost" />
                <Bar dataKey="profit" fill="#16a34a" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Profit by Brand">
          {a.brandData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={a.brandData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="profit" fill="#9333ea" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
        <ChartCard title="Profit by Store">
          {a.storeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={a.storeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="#2563eb" name="Revenue" />
                <Bar dataKey="profit" fill="#16a34a" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      {a.top10.length > 0 && (
        <DataTable>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr><Th>#</Th><Th>Item</Th><Th>Code</Th><ThR>Qty</ThR><ThR>Revenue</ThR><ThR>Cost</ThR><ThR>Profit</ThR><ThR>Margin</ThR></tr>
          </thead>
          <tbody>
            {a.top10.map((it, i) => (
              <tr key={it.code} className="border-t border-border">
                <Td>{i + 1}</Td><Td className="font-medium">{it.name}</Td><Td className="font-mono">{it.code}</Td>
                <TdR>{it.qty}</TdR><TdR className="font-semibold">{money(it.revenue)}</TdR><TdR>{money(it.cost)}</TdR>
                <TdR className={it.profit >= 0 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>{money(it.profit)}</TdR>
                <TdR>{it.margin.toFixed(1)}%</TdR>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      {a.storeData.length > 0 && (
        <DataTable>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr><Th>Store</Th><ThR>Revenue</ThR><ThR>Cost</ThR><ThR>Profit</ThR><ThR>Margin</ThR></tr>
          </thead>
          <tbody>
            {a.storeData.map((s) => (
              <tr key={s.name} className="border-t border-border">
                <Td className="font-medium">{s.name}</Td>
                <TdR className="font-semibold">{money(s.revenue)}</TdR>
                <TdR>{money(s.cost)}</TdR>
                <TdR className={s.profit >= 0 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>{money(s.profit)}</TdR>
                <TdR>{s.margin.toFixed(1)}%</TdR>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-muted">
            <tr className="border-t border-border font-semibold">
              <Td>Total</Td><TdR>{money(a.totalRevenue)}</TdR><TdR>{money(a.totalCost)}</TdR>
              <TdR className={a.totalProfit >= 0 ? "text-green-600" : "text-destructive"}>{money(a.totalProfit)}</TdR>
              <TdR>{a.avgMargin.toFixed(1)}%</TdR>
            </tr>
          </tfoot>
        </DataTable>
      )}
    </div>
  );
}

// ─── TAB 5: INVENTORY INTELLIGENCE ────────────────────────────────────────────

function TabInventory({ stock, sales, stockLots, saleAllocations, stockAdjustments }: any) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const a = useMemo(() => {
    let items = stock;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      items = items.filter((s: any) => s.name.toLowerCase().includes(t) || s.code.toLowerCase().includes(t) || s.brand.toLowerCase().includes(t) || s.category.toLowerCase().includes(t));
    }

    const stockValue = items.reduce((a: number, s: any) => a + s.qty * s.sellingPrice, 0);
    const totalQty = items.reduce((a: number, s: any) => a + s.qty, 0);

    const today = new Date();
    const saleItemMap = new Map<string, { totalSold: number; lastSaleDate: string }>();
    for (const s of sales || []) {
      const e = saleItemMap.get(s.itemCode) || { totalSold: 0, lastSaleDate: "" };
      e.totalSold += s.qty;
      if (s.date > e.lastSaleDate) e.lastSaleDate = s.date;
      saleItemMap.set(s.itemCode, e);
    }

    const stockAge = items.map((s: any) => {
      const lots = stockLots.filter((l: any) => l.itemCode === s.code && l.qty > 0);
      const oldestDate = lots.length > 0 ? lots.reduce((min: string, l: any) => !min || l.date < min ? l.date : min, "") : "";
      const daysInStock = oldestDate ? Math.floor((today.getTime() - new Date(oldestDate).getTime()) / 86400000) : 0;
      const saleInfo = saleItemMap.get(s.code);
      const turnover = saleInfo ? saleInfo.totalSold : 0;
      return { ...s, daysInStock, turnover, oldestDate, lastSaleDate: saleInfo?.lastSaleDate || "" };
    });

    const fastMoving = [...stockAge].filter(s => s.turnover > 0).sort((a, b) => b.turnover - a.turnover).slice(0, 10);
    const slowMoving = [...stockAge].filter(s => s.turnover > 0 && s.turnover <= 2).sort((a, b) => a.turnover - b.turnover).slice(0, 10);
    const deadStock = [...stockAge].filter(s => s.turnover === 0 && s.qty > 0).sort((a, b) => b.daysInStock - a.daysInStock).slice(0, 20);
    const lowStock = [...stockAge].filter(s => s.qty > 0 && s.qty <= 3).sort((a, b) => a.qty - b.qty);

    const ageBuckets = [
      { label: "0-7 days", count: 0, value: 0 },
      { label: "8-30 days", count: 0, value: 0 },
      { label: "31-60 days", count: 0, value: 0 },
      { label: "61-90 days", count: 0, value: 0 },
      { label: "90+ days", count: 0, value: 0 },
    ];
    for (const s of stockAge) {
      const d = s.daysInStock;
      const bucket = d <= 7 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4;
      ageBuckets[bucket].count += s.qty;
      ageBuckets[bucket].value += s.qty * s.purchasePrice;
    }

    let filteredStock = stockAge;
    if (statusFilter === "low") filteredStock = lowStock;
    else if (statusFilter === "dead") filteredStock = deadStock;
    else if (statusFilter === "fast") filteredStock = fastMoving;
    else if (statusFilter === "slow") filteredStock = slowMoving;

    const catMap = new Map<string, { qty: number; value: number }>();
    for (const s of items) {
      const c = s.category || "Uncategorized";
      const e = catMap.get(c) || { qty: 0, value: 0 }; e.qty += s.qty; e.value += s.qty * s.sellingPrice; catMap.set(c, e);
    }
    const categoryBreakdown = Array.from(catMap.entries()).map(([name, v]) => ({ name, ...v }));

    return { stockValue, totalQty, fastMoving, slowMoving, deadStock, lowStock, ageBuckets, filteredStock, categoryBreakdown };
  }, [stock, stockLots, saleAllocations, stockAdjustments, q, statusFilter, sales]);

  function today() { return new Date().toISOString().slice(0, 10); }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Item name, code, brand..." className="h-9 text-xs" /></div>
          <div><Label className="text-xs">Filter</Label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs">
              <option value="all">All Items</option>
              <option value="low">Low Stock (≤3)</option>
              <option value="dead">Dead Stock (No Sales)</option>
              <option value="fast">Fast Moving</option>
              <option value="slow">Slow Moving</option>
            </select>
          </div>
          <div className="flex items-end">
            <ExportBtn onExport={() => {
              exportRows(a.filteredStock.map((s: any) => ({
                Code: s.code, Name: s.name, Category: s.category, Brand: s.brand, Qty: s.qty,
                "Purchase Price": s.purchasePrice, "Selling Price": s.sellingPrice, Value: s.qty * s.sellingPrice,
                "Days in Stock": s.daysInStock, "Total Sold": s.turnover,
              })), "Inventory", `BOD_Inventory_${today()}.xlsx`);
            }} />
          </div>
        </div>
      </Card>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Stock Items" value={String(stock.length)} icon={Boxes} />
        <Kpi label="Total Qty" value={String(a.totalQty)} icon={PackagePlus} />
        <Kpi label="Stock Value" value={money(a.stockValue)} icon={DollarSign} />
        <Kpi label="Low Stock" value={String(a.lowStock.length)} sub="≤3 units" icon={AlertTriangle} color="orange" />
        <Kpi label="Dead Stock" value={String(a.deadStock.length)} sub="No sales" icon={Clock} color="red" />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Stock Age Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={a.ageBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#ea580c" name="Qty" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Stock by Category">
          {a.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={a.categoryBreakdown} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {a.categoryBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      {a.deadStock.length > 0 && (
        <DataTable>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr><Th colSpan={7}><span className="text-destructive font-semibold">Dead Stock — No Sales ({a.deadStock.length} items)</span></Th></tr>
            <tr><Th>Code</Th><Th>Name</Th><Th>Category</Th><Th>Brand</Th><ThR>Qty</ThR><ThR>Value</ThR><ThR>Days in Stock</ThR></tr>
          </thead>
          <tbody>
            {a.deadStock.map((s: any) => (
              <tr key={s.code} className="border-t border-border">
                <Td className="font-mono">{s.code}</Td><Td className="font-medium">{s.name}</Td><Td>{s.category}</Td><Td>{s.brand}</Td>
                <TdR className="font-semibold">{s.qty}</TdR><TdR>{money(s.qty * s.purchasePrice)}</TdR>
                <TdR className={s.daysInStock > 60 ? "text-destructive font-semibold" : ""}>{s.daysInStock} days</TdR>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      {a.lowStock.length > 0 && (
        <DataTable>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr><Th colSpan={6}><span className="text-orange-600 font-semibold">Low Stock Alert ({a.lowStock.length} items)</span></Th></tr>
            <tr><Th>Code</Th><Th>Name</Th><Th>Category</Th><Th>Brand</Th><ThR>Qty</ThR><ThR>Value</ThR></tr>
          </thead>
          <tbody>
            {a.lowStock.map((s: any) => (
              <tr key={s.code} className="border-t border-border">
                <Td className="font-mono">{s.code}</Td><Td className="font-medium">{s.name}</Td><Td>{s.category}</Td><Td>{s.brand}</Td>
                <TdR className={`font-bold ${s.qty <= 1 ? "text-destructive" : "text-orange-600"}`}>{s.qty}</TdR>
                <TdR>{money(s.qty * s.sellingPrice)}</TdR>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      {a.filteredStock.length > 0 && (
        <DataTable>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr><Th>Code</Th><Th>Name</Th><Th>Category</Th><Th>Brand</Th><ThR>Qty</ThR><ThR>Purchase</ThR><ThR>Selling</ThR><ThR>Value</ThR><ThR>Days</ThR><ThR>Sold</ThR></tr>
          </thead>
          <tbody>
            {a.filteredStock.map((s: any) => (
              <tr key={s.code} className="border-t border-border">
                <Td className="font-mono">{s.code}</Td><Td className="font-medium">{s.name}</Td><Td>{s.category}</Td><Td>{s.brand}</Td>
                <TdR className={`font-semibold ${s.qty === 0 ? "text-destructive" : ""}`}>{s.qty}</TdR>
                <TdR>{money(s.purchasePrice)}</TdR><TdR>{money(s.sellingPrice)}</TdR><TdR>{money(s.qty * s.sellingPrice)}</TdR>
                <TdR>{s.daysInStock}</TdR><TdR>{s.turnover}</TdR>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}

// ─── TAB 6: VENDOR ANALYTICS ─────────────────────────────────────────────────

function TabVendors({ vendors, vendorTransactions, vendorPayments }: any) {
  const [q, setQ] = useState("");

  const a = useMemo(() => {
    let rows = vendors;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      rows = rows.filter((v: any) => v.vendorName.toLowerCase().includes(t) || v.vendorCode.toLowerCase().includes(t) || v.vendorType.toLowerCase().includes(t));
    }

    const vendorData = rows.map((v: any) => {
      const txns = vendorTransactions.filter((t: any) => t.vendorId === v.id);
      const totalPurchases = txns.filter((t: any) => t.transactionType === "PURCHASE").reduce((a: number, t: any) => a + t.debit, 0);
      const totalPayments = txns.filter((t: any) => t.transactionType === "PAYMENT").reduce((a: number, t: any) => a + t.credit, 0);
      const totalReturns = txns.filter((t: any) => t.transactionType === "PURCHASE_RETURN").reduce((a: number, t: any) => a + t.credit, 0);
      const outstanding = txns.length > 0 ? txns.reduce((max: number, t: any) => t.balance > max ? t.balance : max, v.openingBalance) : v.openingBalance;
      const lastTxn = txns.length > 0 ? txns[txns.length - 1].transactionDate : v.openingBalanceDate;
      const daysSinceLastTxn = lastTxn ? Math.floor((Date.now() - new Date(lastTxn).getTime()) / 86400000) : 999;
      return { ...v, totalPurchases, totalPayments, totalReturns, outstanding, daysSinceLastTxn };
    }).sort((a, b) => b.totalPurchases - a.totalPurchases);

    const totalOutstanding = vendorData.reduce((a, v) => a + v.outstanding, 0);
    const overdueVendors = vendorData.filter(v => v.outstanding > 0 && v.daysSinceLastTxn > 30);
    const overdueAmount = overdueVendors.reduce((a, v) => a + v.outstanding, 0);

    const aging = [
      { label: "0-30 days", amount: 0, count: 0 },
      { label: "31-60 days", amount: 0, count: 0 },
      { label: "61-90 days", amount: 0, count: 0 },
      { label: "90+ days", amount: 0, count: 0 },
    ];
    for (const v of vendorData) {
      if (v.outstanding <= 0) continue;
      const d = v.daysSinceLastTxn;
      const bucket = d <= 30 ? 0 : d <= 60 ? 1 : d <= 90 ? 2 : 3;
      aging[bucket].amount += v.outstanding;
      aging[bucket].count++;
    }

    const typeMap = new Map<string, { count: number; totalPurchases: number; outstanding: number }>();
    for (const v of vendorData) {
      const e = typeMap.get(v.vendorType) || { count: 0, totalPurchases: 0, outstanding: 0 };
      e.count++;
      e.totalPurchases += v.totalPurchases;
      e.outstanding += v.outstanding;
      typeMap.set(v.vendorType, e);
    }
    const typeBreakdown = Array.from(typeMap.entries()).map(([name, v]) => ({ name, ...v }));

    const paymentMethodMap = new Map<string, number>();
    for (const p of vendorPayments) {
      const m = p.paymentMethod || "Cash";
      paymentMethodMap.set(m, (paymentMethodMap.get(m) || 0) + p.amount);
    }
    const paymentBreakdown = Array.from(paymentMethodMap.entries()).map(([name, value]) => ({ name, value }));

    return { vendorData, totalOutstanding, overdueVendors, overdueAmount, aging, typeBreakdown, paymentBreakdown };
  }, [vendors, vendorTransactions, vendorPayments, q]);

  function today() { return new Date().toISOString().slice(0, 10); }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Vendor name, code, type..." className="h-9 text-xs" /></div>
          <div className="flex items-end">
            <ExportBtn onExport={() => {
              exportRows(a.vendorData.map(v => ({
                Code: v.vendorCode, Name: v.vendorName, Type: v.vendorType, PAN: v.pan,
                "Total Purchases": v.totalPurchases, "Total Payments": v.totalPayments,
                Returns: v.totalReturns, Outstanding: v.outstanding, "Days Since Activity": v.daysSinceLastTxn,
              })), "Vendor Analytics", `BOD_VendorAnalytics_${today()}.xlsx`);
            }} />
          </div>
        </div>
      </Card>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Vendors" value={String(a.vendorData.length)} icon={Users} />
        <Kpi label="Total Outstanding" value={money(a.totalOutstanding)} icon={DollarSign} color={a.totalOutstanding > 0 ? "red" : "green"} />
        <Kpi label="Overdue Vendors" value={String(a.overdueVendors.length)} sub={money(a.overdueAmount)} icon={AlertTriangle} color="red" />
        <Kpi label="Total Purchases" value={money(a.vendorData.reduce((a, v) => a + v.totalPurchases, 0))} icon={PackagePlus} />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Payment Aging (Outstanding by Days)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={a.aging}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, name: string) => name === "amount" ? money(v) : v} />
              <Legend />
              <Bar dataKey="amount" fill="#e11d48" name="Amount" />
              <Bar dataKey="count" fill="#9333ea" name="Vendors" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Vendors by Type">
          {a.typeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={a.typeBreakdown} dataKey="totalPurchases" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {a.typeBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      {a.paymentBreakdown.length > 0 && (
        <ChartCard title="Vendor Payments by Method">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.paymentBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="value" fill="#16a34a" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
      <DataTable>
        <thead className="sticky top-0 bg-secondary text-secondary-foreground">
          <tr><Th>Code</Th><Th>Name</Th><Th>Type</Th><ThR>Purchases</ThR><ThR>Payments</ThR><ThR>Returns</ThR><ThR>Outstanding</ThR><ThR>Days</ThR></tr>
        </thead>
        <tbody>
          {a.vendorData.map((v: any) => (
            <tr key={v.id} className="border-t border-border">
              <Td className="font-mono">{v.vendorCode}</Td>
              <Td className="font-medium">{v.vendorName}</Td>
              <Td><Badge variant="outline" className="text-[10px]">{v.vendorType}</Badge></Td>
              <TdR>{money(v.totalPurchases)}</TdR>
              <TdR>{money(v.totalPayments)}</TdR>
              <TdR>{v.totalReturns > 0 ? money(v.totalReturns) : "-"}</TdR>
              <TdR className={v.outstanding > 0 ? "text-destructive font-semibold" : ""}>{money(v.outstanding)}</TdR>
              <TdR>{v.daysSinceLastTxn}d</TdR>
            </tr>
          ))}
          {a.vendorData.length === 0 && <tr><Td colSpan={8}><NoData msg="No vendors found." /></Td></tr>}
        </tbody>
      </DataTable>
    </div>
  );
}

// ─── TAB 7: CASH FLOW ─────────────────────────────────────────────────────────

function TabCashFlow({ sales, purchases, purchaseHeaders, vendorPayments, saleAllocations, stockLots }: any) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const a = useMemo(() => {
    let sFiltered = sales;
    let pFiltered = purchaseHeaders;
    let vpFiltered = vendorPayments;
    if (dateFrom) { sFiltered = sFiltered.filter((s: any) => s.date >= dateFrom); pFiltered = pFiltered.filter((p: any) => p.date >= dateFrom); vpFiltered = vpFiltered.filter((p: any) => p.paymentDate >= dateFrom); }
    if (dateTo) { sFiltered = sFiltered.filter((s: any) => s.date <= dateTo); pFiltered = pFiltered.filter((p: any) => p.date <= dateTo); vpFiltered = vpFiltered.filter((p: any) => p.paymentDate <= dateTo); }

    const totalInflows = sFiltered.reduce((a: number, s: any) => a + s.paidAmount, 0);
    const totalOutflows = pFiltered.reduce((a: number, p: any) => a + p.paidAmount, 0) + vpFiltered.reduce((a: number, p: any) => a + p.amount, 0);
    const netCashFlow = totalInflows - totalOutflows;

    const monthlyMap = new Map<string, { inflow: number; outflow: number }>();
    for (const s of sFiltered) {
      const m = s.date?.slice(0, 7);
      if (m) { const e = monthlyMap.get(m) || { inflow: 0, outflow: 0 }; e.inflow += s.paidAmount; monthlyMap.set(m, e); }
    }
    for (const p of pFiltered) {
      const m = p.date?.slice(0, 7);
      if (m) { const e = monthlyMap.get(m) || { inflow: 0, outflow: 0 }; e.outflow += p.paidAmount; monthlyMap.set(m, e); }
    }
    for (const p of vpFiltered) {
      const m = p.paymentDate?.slice(0, 7);
      if (m) { const e = monthlyMap.get(m) || { inflow: 0, outflow: 0 }; e.outflow += p.amount; monthlyMap.set(m, e); }
    }
    const monthlyFlow = Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([m, v]) => ({
      month: m, inflow: v.inflow, outflow: v.outflow, net: v.inflow - v.outflow,
    }));

    const methodMap = new Map<string, number>();
    for (const s of sFiltered) { const m = s.paymentMethod || "Cash"; methodMap.set(m, (methodMap.get(m) || 0) + s.paidAmount); }
    const paymentBreakdown = Array.from(methodMap.entries()).map(([name, value]) => ({ name, value }));

    const receivables = sFiltered.filter((s: any) => s.remaining > 0).reduce((a: number, s: any) => a + s.remaining, 0);
    const payables = pFiltered.filter((p: any) => p.remainingBalance > 0).reduce((a: number, p: any) => a + p.remainingBalance, 0);

    return { totalInflows, totalOutflows, netCashFlow, monthlyFlow, paymentBreakdown, receivables, payables };
  }, [sales, purchases, purchaseHeaders, vendorPayments, saleAllocations, stockLots, dateFrom, dateTo]);

  function today() { return new Date().toISOString().slice(0, 10); }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" /></div>
          <div className="flex items-end">
            <ExportBtn onExport={() => {
              exportRows(a.monthlyFlow.map(m => ({ Month: m.month, Inflow: m.inflow, Outflow: m.outflow, Net: m.net })), "Cash Flow", `BOD_CashFlow_${today()}.xlsx`);
            }} />
          </div>
        </div>
      </Card>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Inflows" value={money(a.totalInflows)} sub="Cash received" icon={ArrowUpRight} color="green" />
        <Kpi label="Total Outflows" value={money(a.totalOutflows)} sub="Cash paid" icon={ArrowDownRight} color="red" />
        <Kpi label="Net Cash Flow" value={money(a.netCashFlow)} icon={Wallet} color={a.netCashFlow >= 0 ? "green" : "red"} />
        <Kpi label="Outstanding" value={money(a.receivables)} sub={`Payables: ${money(a.payables)}`} icon={CreditCard} />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Monthly Cash Inflow vs Outflow">
          {a.monthlyFlow.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={a.monthlyFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Bar dataKey="inflow" fill="#16a34a" name="Inflow (Sales)" />
                <Bar dataKey="outflow" fill="#e11d48" name="Outflow (Purchases)" />
                <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={2} name="Net" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
        <ChartCard title="Sales Payment Methods">
          {a.paymentBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={a.paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {a.paymentBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receivables vs Payables</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-green-600 font-medium">Receivables (Credit Sales)</span><span className="font-semibold">{money(a.receivables)}</span></div>
              <div className="h-3 w-full rounded-full bg-muted">
                <div className="h-3 rounded-full bg-green-500" style={{ width: `${Math.min((a.receivables / Math.max(a.receivables + a.payables, 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-red-600 font-medium">Payables (Outstanding)</span><span className="font-semibold">{money(a.payables)}</span></div>
              <div className="h-3 w-full rounded-full bg-muted">
                <div className="h-3 rounded-full bg-red-500" style={{ width: `${Math.min((a.payables / Math.max(a.receivables + a.payables, 1)) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </Card>
        {a.monthlyFlow.length > 0 && (
          <DataTable>
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr><Th>Month</Th><ThR>Inflow</ThR><ThR>Outflow</ThR><ThR>Net</ThR></tr>
            </thead>
            <tbody>
              {a.monthlyFlow.map((m) => (
                <tr key={m.month} className="border-t border-border">
                  <Td className="font-medium">{m.month}</Td>
                  <TdR className="text-green-600">{money(m.inflow)}</TdR>
                  <TdR className="text-red-600">{money(m.outflow)}</TdR>
                  <TdR className={m.net >= 0 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>{money(m.net)}</TdR>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-muted">
              <tr className="border-t border-border font-semibold">
                <Td>Total</Td><TdR>{money(a.totalInflows)}</TdR><TdR>{money(a.totalOutflows)}</TdR>
                <TdR className={a.netCashFlow >= 0 ? "text-green-600" : "text-destructive"}>{money(a.netCashFlow)}</TdR>
              </tr>
            </tfoot>
          </DataTable>
        )}
      </div>
    </div>
  );
}

// ─── TAB 8: STORE COMPARISON ──────────────────────────────────────────────────

function TabStores({ stock, sales, purchaseHeaders, stockLots, saleAllocations, vendors, vendorTransactions }: any) {
  const stores = useMemo(() => {
    const storeMap = new Map<string, {
      name: string; stockItems: number; stockQty: number; stockValue: number;
      sales: number; salesCount: number; purchases: number; vat: number;
      vendorCount: number; payable: number; profit: number; avgSaleValue: number;
    }>();
    for (const [id, name] of Object.entries(LOCATION_LABELS)) {
      if (id === WAREHOUSE_ID) continue;
      storeMap.set(id, {
        name, stockItems: 0, stockQty: 0, stockValue: 0, sales: 0, salesCount: 0,
        purchases: 0, vat: 0, vendorCount: 0, payable: 0, profit: 0, avgSaleValue: 0,
      });
    }
    for (const s of stock) { const st = storeMap.get(s.storeId || ""); if (st) { st.stockItems++; st.stockQty += s.qty; } }
    for (const l of stockLots) { const st = storeMap.get(l.storeId || ""); if (st && l.qty > 0) st.stockValue += l.qty * l.purchasePrice; }
    for (const s of sales) {
      const st = storeMap.get(s.storeId || "");
      if (st) { st.sales += s.total; st.salesCount++; st.vat += s.vat; }
    }
    for (const p of purchaseHeaders) { const st = storeMap.get(p.storeId || ""); if (st) st.purchases += p.grandTotal; }
    const vendorStoreMap = new Map<string, Set<string>>();
    for (const v of vendors) { if (v.storeId) { if (!vendorStoreMap.has(v.storeId)) vendorStoreMap.set(v.storeId, new Set()); vendorStoreMap.get(v.storeId)!.add(v.id); } }
    for (const [storeId, ids] of vendorStoreMap) { const st = storeMap.get(storeId); if (st) st.vendorCount = ids.size; }
    for (const [, st] of storeMap) {
      st.profit = st.sales - st.purchases;
      st.avgSaleValue = st.salesCount > 0 ? st.sales / st.salesCount : 0;
    }
    return Array.from(storeMap.values());
  }, [stock, sales, purchaseHeaders, stockLots, vendors, vendorTransactions]);

  const g = useMemo(() => {
    const total = stores.reduce((a, s) => ({
      stockItems: a.stockItems + s.stockItems, stockQty: a.stockQty + s.stockQty, stockValue: a.stockValue + s.stockValue,
      sales: a.sales + s.sales, purchases: a.purchases + s.purchases, vat: a.vat + s.vat,
      vendorCount: a.vendorCount + s.vendorCount, profit: a.profit + s.profit, salesCount: a.salesCount + s.salesCount,
    }), { stockItems: 0, stockQty: 0, stockValue: 0, sales: 0, purchases: 0, vat: 0, vendorCount: 0, profit: 0, salesCount: 0 });
    total.profit = total.sales - total.purchases;
    return total;
  }, [stores]);

  function today() { return new Date().toISOString().slice(0, 10); }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportBtn onExport={() => {
          exportRows([...stores.map(s => ({ Store: s.name, "Stock Items": s.stockItems, "Stock Qty": s.stockQty, "Stock Value": s.stockValue, Sales: s.sales, Purchases: s.purchases, Profit: s.profit, VAT: s.vat, "Avg Sale": s.avgSaleValue, Vendors: s.vendorCount })),
            { Store: "GRAND TOTAL", "Stock Items": g.stockItems, "Stock Qty": g.stockQty, "Stock Value": g.stockValue, Sales: g.sales, Purchases: g.purchases, Profit: g.profit, VAT: g.vat, "Avg Sale": g.salesCount > 0 ? g.sales / g.salesCount : 0, Vendors: g.vendorCount }
          ], "Store Comparison", `BOD_StoreComparison_${today()}.xlsx`);
        }} />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Sales by Store">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Legend />
              <Bar dataKey="sales" fill="#2563eb" name="Sales" />
              <Bar dataKey="purchases" fill="#16a34a" name="Purchases" />
              <Bar dataKey="profit" fill="#ea580c" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Stock Value Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stores} dataKey="stockValue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {stores.map((_: any, i: number) => <Cell key={i} fill={STORE_COLORS[i % STORE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => money(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DataTable>
        <thead className="sticky top-0 bg-secondary text-secondary-foreground">
          <tr><Th>Store</Th><ThR>Stock Items</ThR><ThR>Stock Qty</ThR><ThR>Stock Value</ThR><ThR>Sales</ThR><ThR>Purchases</ThR><ThR>Profit</ThR><ThR>Avg Sale</ThR><ThR>VAT</ThR><ThR>Vendors</ThR></tr>
        </thead>
        <tbody>
          {stores.map((s) => (
            <tr key={s.name} className="border-t border-border">
              <Td className="font-medium">{s.name}</Td>
              <TdR>{s.stockItems}</TdR><TdR>{s.stockQty}</TdR><TdR>{money(s.stockValue)}</TdR>
              <TdR className="font-semibold">{money(s.sales)}</TdR><TdR>{money(s.purchases)}</TdR>
              <TdR className={s.profit >= 0 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>{money(s.profit)}</TdR>
              <TdR>{money(s.avgSaleValue)}</TdR><TdR>{money(s.vat)}</TdR><TdR>{s.vendorCount}</TdR>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-muted">
          <tr className="border-t border-border font-semibold">
            <Td>Grand Total</Td><TdR>{g.stockItems}</TdR><TdR>{g.stockQty}</TdR><TdR>{money(g.stockValue)}</TdR>
            <TdR>{money(g.sales)}</TdR><TdR>{money(g.purchases)}</TdR>
            <TdR className={g.profit >= 0 ? "text-green-600" : "text-destructive"}>{money(g.profit)}</TdR>
            <TdR>{g.salesCount > 0 ? money(g.sales / g.salesCount) : "0.00"}</TdR><TdR>{money(g.vat)}</TdR><TdR>{g.vendorCount}</TdR>
          </tr>
        </tfoot>
      </DataTable>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Best Performing Store</p>
          {stores.length > 0 && (() => {
            const best = [...stores].sort((a, b) => b.sales - a.sales)[0];
            return <div><p className="text-lg font-bold">{best.name}</p><p className="text-xs text-muted-foreground">Sales: {money(best.sales)} | Profit: {money(best.profit)} | Margin: {best.sales > 0 ? (best.profit / best.sales * 100).toFixed(1) : 0}%</p></div>;
          })()}
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most Profitable Store</p>
          {stores.length > 0 && (() => {
            const best = [...stores].sort((a, b) => b.profit - a.profit)[0];
            return <div><p className="text-lg font-bold">{best.name}</p><p className="text-xs text-muted-foreground">Profit: {money(best.profit)} | Margin: {best.sales > 0 ? (best.profit / best.sales * 100).toFixed(1) : 0}%</p></div>;
          })()}
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Highest Avg Sale</p>
          {stores.length > 0 && (() => {
            const best = [...stores].sort((a, b) => b.avgSaleValue - a.avgSaleValue)[0];
            return <div><p className="text-lg font-bold">{best.name}</p><p className="text-xs text-muted-foreground">Avg: {money(best.avgSaleValue)} | Invoices: {best.salesCount}</p></div>;
          })()}
        </Card>
      </div>
    </div>
  );
}
