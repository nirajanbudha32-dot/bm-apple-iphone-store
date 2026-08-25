import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { exportRows } from "@/lib/excel";
import { money } from "@/lib/utils";

type ProfitRow = {
  invoiceNo: string;
  date: string;
  customer: string;
  itemName: string;
  itemCode: string;
  qty: number;
  saleRate: number;
  saleAmount: number;
  costPrice: number;
  totalCost: number;
  profit: number;
  margin: number;
};

export function ProfitReport() {
  const { sales, stockLots, saleAllocations, purchases } = useStore();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const purchaseMap = useMemo(() => new Map(purchases.map((p) => [p.id, p])), [purchases]);

  const profitData = useMemo((): ProfitRow[] => {
    const invoiceMap = new Map<string, ProfitRow>();

    for (const sale of sales) {
      const allocs = saleAllocations.filter((a) => a.saleId === sale.id);
      let totalCost = 0;
      for (const alloc of allocs) {
        const lot = stockLots.find((l) => l.id === alloc.lotId);
        totalCost += alloc.qtyTaken * (lot?.purchasePrice ?? 0);
      }

      const existing = invoiceMap.get(sale.invoiceNo);
      if (existing) {
        existing.saleAmount += sale.amount;
        existing.totalCost += totalCost;
        existing.profit = existing.saleAmount - existing.totalCost;
        existing.margin = existing.saleAmount > 0 ? (existing.profit / existing.saleAmount) * 100 : 0;
        existing.qty += sale.qty;
      } else {
        const saleAmount = sale.amount;
        invoiceMap.set(sale.invoiceNo, {
          invoiceNo: sale.invoiceNo,
          date: sale.date,
          customer: sale.customer,
          itemName: sale.itemName,
          itemCode: sale.itemCode,
          qty: sale.qty,
          saleRate: sale.rate,
          saleAmount,
          costPrice: allocs.length > 0 ? totalCost / sale.qty : 0,
          totalCost,
          profit: saleAmount - totalCost,
          margin: saleAmount > 0 ? ((saleAmount - totalCost) / saleAmount) * 100 : 0,
        });
      }
    }
    return [...invoiceMap.values()];
  }, [sales, saleAllocations, stockLots, purchaseMap]);

  const filtered = useMemo(() => {
    let result = profitData;
    if (dateFrom) result = result.filter((r) => r.date >= dateFrom);
    if (dateTo) result = result.filter((r) => r.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) {
      result = result.filter((r) =>
        [r.invoiceNo, r.customer, r.itemName, r.itemCode]
          .join(" ")
          .toLowerCase()
          .includes(t),
      );
    }
    return result;
  }, [profitData, dateFrom, dateTo, q]);

  const totalSale = filtered.reduce((a, r) => a + r.saleAmount, 0);
  const totalCost = filtered.reduce((a, r) => a + r.totalCost, 0);
  const totalProfit = filtered.reduce((a, r) => a + r.profit, 0);
  const avgMargin = totalSale > 0 ? (totalProfit / totalSale) * 100 : 0;

  function onExport() {
    if (filtered.length === 0) { toast.error("No data to export"); return; }
    exportRows(
      filtered.map((r) => ({
        "Invoice No": r.invoiceNo,
        Date: r.date,
        Customer: r.customer,
        Item: r.itemName,
        "Item Code": r.itemCode,
        Qty: r.qty,
        "Sale Rate": r.saleRate,
        "Sale Amount": r.saleAmount,
        "Cost Price": r.costPrice,
        "Total Cost": r.totalCost,
        Profit: r.profit,
        "Margin %": r.margin.toFixed(1) + "%",
      })),
      "Profit Report",
      `BM_Profit_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label htmlFor="pr-from" className="text-xs sm:text-sm">Date from</Label>
            <Input id="pr-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="pr-to" className="text-xs sm:text-sm">Date to</Label>
            <Input id="pr-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="pr-search" className="text-xs sm:text-sm">Search</Label>
            <Input id="pr-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice, customer, item..." className="h-9 text-xs sm:text-sm" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onExport} className="h-9 w-full text-xs sm:text-sm">
              <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-3">
          <span><strong className="text-foreground">{filtered.length}</strong> invoices</span>
          <span>Sales: <strong className="text-foreground">{money(totalSale)}</strong></span>
          <span>Cost: <strong className="text-foreground">{money(totalCost)}</strong></span>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className={`font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            Profit: {money(totalProfit)}
          </span>
          <span>Margin: <strong className="text-foreground">{avgMargin.toFixed(1)}%</strong></span>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[850px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Sale Amount</th>
                <th className="p-2.5 text-right">Cost</th>
                <th className="p-2.5 text-right">Profit</th>
                <th className="p-2.5 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.invoiceNo} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium">{r.invoiceNo}</td>
                  <td className="p-2.5 whitespace-nowrap">{r.date}</td>
                  <td className="p-2.5">{r.customer}</td>
                  <td className="p-2.5 font-medium">{r.itemName}</td>
                  <td className="p-2.5 text-right font-semibold">{r.qty}</td>
                  <td className="p-2.5 text-right">{money(r.saleAmount)}</td>
                  <td className="p-2.5 text-right">{money(r.totalCost)}</td>
                  <td className={`p-2.5 text-right font-bold ${r.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {money(r.profit)}
                  </td>
                  <td className="p-2.5 text-right">{r.margin.toFixed(1)}%</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">No profit data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
