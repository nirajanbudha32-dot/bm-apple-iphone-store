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

type LotRow = {
  id: string;
  lotNo: string;
  itemCode: string;
  itemName: string;
  category: string;
  brand: string;
  date: string;
  received: number;
  sold: number;
  available: number;
  purchasePrice: number;
  cost: number;
  status: "OPEN" | "PARTIAL" | "SOLD";
  billNo: string;
};

export function LotStockReport() {
  const { stockLots, sales, purchases, purchaseHeaders, purchaseItems, stock, saleAllocations, stockAdjustments } = useStore();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const lotData = useMemo((): LotRow[] => {
    const headerMap = new Map(purchaseHeaders.map((h) => [h.id, h]));
    const itemMap = new Map(purchaseItems.map((pi) => [pi.id, pi]));
    const purchaseMap = new Map(purchases.map((p) => [p.id, p]));
    const stockMap = new Map(stock.map((s) => [s.name, s]));

    return stockLots.map((lot) => {
      const header = headerMap.get(lot.purchaseId ?? "");
      const pItem = itemMap.get(lot.purchaseId ?? "");
      const purchase = purchaseMap.get(lot.purchaseId ?? "");
      const stockItem = stockMap.get(lot.itemName);

      const billNo = header?.purchaseNo || (pItem ? headerMap.get(pItem.purchaseHeaderId)?.purchaseNo : "") || purchase?.billNo || "";
      const category = pItem?.category || purchase?.category || stockItem?.category || "";
      const brand = pItem?.brand || purchase?.brand || stockItem?.brand || "";

      const allocs = saleAllocations.filter((a) => a.lotId === lot.id);
      const sold = allocs.reduce((a, c) => a + c.qtyTaken, 0);
      const adjustments = stockAdjustments.filter((a) => a.lotId === lot.id);
      const adjQty = adjustments.reduce((a, c) => a + c.qtyAdjusted, 0);
      const originalReceived = pItem?.qty ?? purchase?.qty ?? lot.qty + sold - adjQty;
      const available = lot.qty;
      let status: "OPEN" | "PARTIAL" | "SOLD" = "OPEN";
      if (available <= 0) status = "SOLD";
      else if (sold > 0 || adjQty < 0) status = "PARTIAL";
      return {
        id: lot.id,
        lotNo: lot.lotNo,
        itemCode: lot.itemCode,
        itemName: lot.itemName,
        category,
        brand,
        date: lot.date,
        received: originalReceived,
        sold,
        available,
        purchasePrice: lot.purchasePrice,
        cost: originalReceived * lot.purchasePrice,
        status,
        billNo,
      };
    });
  }, [stockLots, saleAllocations, purchases, purchaseHeaders, purchaseItems, stock, stockAdjustments]);

  const filtered = useMemo(() => {
    let result = lotData;
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    const t = q.trim().toLowerCase();
    if (t) {
      result = result.filter((r) =>
        [r.lotNo, r.itemName, r.itemCode, r.category, r.brand, r.billNo]
          .join(" ")
          .toLowerCase()
          .includes(t),
      );
    }
    return result;
  }, [lotData, q, statusFilter]);

  const totalReceived = filtered.reduce((a, r) => a + r.received, 0);
  const totalSold = filtered.reduce((a, r) => a + r.sold, 0);
  const totalAvailable = filtered.reduce((a, r) => a + r.available, 0);
  const totalCost = filtered.reduce((a, r) => a + r.cost, 0);

  function onExport() {
    if (filtered.length === 0) { toast.error("No data to export"); return; }
    exportRows(
      filtered.map((r) => ({
        "Lot No": r.lotNo,
        "Item Code": r.itemCode,
        "Item Name": r.itemName,
        Category: r.category,
        Brand: r.brand,
        "Purchase Date": r.date,
        "Bill No": r.billNo,
        Received: r.received,
        Sold: r.sold,
        Available: r.available,
        "Purchase Price": r.purchasePrice,
        "Total Cost": r.cost,
        Status: r.status === "OPEN" ? "Open" : r.status === "PARTIAL" ? "Partially Sold" : "Fully Sold",
      })),
      "Lot Stock Report",
      `BM_LotStock_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  function statusBadge(s: "OPEN" | "PARTIAL" | "SOLD") {
    const cls = s === "OPEN" ? "bg-green-100 text-green-700" : s === "PARTIAL" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
    const label = s === "OPEN" ? "Open" : s === "PARTIAL" ? "Partial" : "Sold";
    return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div>
            <Label htmlFor="ls-search" className="text-xs sm:text-sm">Search</Label>
            <Input id="ls-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lot, item, code..." className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Status</Label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs sm:text-sm">
              <option value="all">All</option>
              <option value="OPEN">Open</option>
              <option value="PARTIAL">Partially Sold</option>
              <option value="SOLD">Fully Sold</option>
            </select>
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
          <span><strong className="text-foreground">{filtered.length}</strong> lots</span>
          <span>Received: <strong className="text-foreground">{totalReceived}</strong></span>
          <span>Sold: <strong className="text-foreground">{totalSold}</strong></span>
          <span>Available: <strong className="text-foreground">{totalAvailable}</strong></span>
        </div>
        <div>Total Cost: <strong className="text-foreground">{money(totalCost)}</strong></div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[900px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Lot No</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Bill No</th>
                <th className="p-2.5 text-right">Received</th>
                <th className="p-2.5 text-right">Sold</th>
                <th className="p-2.5 text-right">Available</th>
                <th className="p-2.5 text-right">Unit Cost</th>
                <th className="p-2.5 text-right">Total Cost</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium text-primary">{r.lotNo}</td>
                  <td className="p-2.5 font-medium">{r.itemName}</td>
                  <td className="p-2.5 whitespace-nowrap">{r.date}</td>
                  <td className="p-2.5 font-mono">{r.billNo || "-"}</td>
                  <td className="p-2.5 text-right font-semibold">{r.received}</td>
                  <td className="p-2.5 text-right">{r.sold}</td>
                  <td className={`p-2.5 text-right font-semibold ${r.available <= 0 ? "text-destructive" : ""}`}>{r.available}</td>
                  <td className="p-2.5 text-right">{money(r.purchasePrice)}</td>
                  <td className="p-2.5 text-right font-medium">{money(r.cost)}</td>
                  <td className="p-2.5">{statusBadge(r.status)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-muted-foreground">No lots found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
