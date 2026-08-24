import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { exportRows } from "@/lib/excel";

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function StockInSummary() {
  const { purchases } = useStore();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let result = purchases;
    if (dateFrom) result = result.filter((p) => p.date >= dateFrom);
    if (dateTo) result = result.filter((p) => p.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) {
      result = result.filter(
        (p) =>
          p.itemName.toLowerCase().includes(t) ||
          p.itemCode.toLowerCase().includes(t) ||
          p.billNo.toLowerCase().includes(t) ||
          p.supplier.toLowerCase().includes(t) ||
          p.subCategory.toLowerCase().includes(t),
      );
    }
    return result;
  }, [purchases, dateFrom, dateTo, q]);

  const totalQty = filtered.reduce((a, p) => a + p.qty, 0);
  const totalAmount = filtered.reduce((a, p) => a + p.amount, 0);

  function onExport() {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportRows(
      filtered.map((p) => ({
        Date: p.date,
        "Store Name": "BM iPhone Store",
        "Item Code": p.itemCode,
        "Item Name": p.itemName,
        "Sub Category": p.subCategory,
        "Qty In": p.qty,
        "Unit Price": p.rate,
        Supplier: p.supplier,
        "Bill No": p.billNo,
        "Payment Method": p.paymentMethod,
      })),
      "Stock In",
      `BM_StockIn_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label htmlFor="si-from" className="text-xs sm:text-sm">Date from</Label>
            <Input
              id="si-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="si-to" className="text-xs sm:text-sm">Date to</Label>
            <Input
              id="si-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="si-search" className="text-xs sm:text-sm">Search</Label>
            <Input
              id="si-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Item, code, bill, supplier..."
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onExport} className="h-9 w-full text-xs sm:text-sm">
              <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
        <div>
          <span><strong className="text-foreground">{filtered.length}</strong> items</span>
          <span className="mx-2">•</span>
          <span><strong className="text-foreground">{totalQty}</strong> units in</span>
        </div>
        <div>
          Total Value: <strong className="text-foreground">{money(totalAmount)}</strong>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[700px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Store Name</th>
                <th className="p-2.5">Item Code</th>
                <th className="p-2.5">Item Name</th>
                <th className="p-2.5">Sub Category</th>
                <th className="p-2.5 text-right">Qty In</th>
                <th className="p-2.5 text-right">Unit Price</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Bill No</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-2.5 whitespace-nowrap">{p.date}</td>
                  <td className="p-2.5">BM iPhone Store</td>
                  <td className="p-2.5 font-mono">{p.itemCode}</td>
                  <td className="p-2.5 font-medium">{p.itemName}</td>
                  <td className="p-2.5">{p.subCategory}</td>
                  <td className="p-2.5 text-right font-semibold">{p.qty}</td>
                  <td className="p-2.5 text-right">{money(p.rate)}</td>
                  <td className="p-2.5">{p.supplier}</td>
                  <td className="p-2.5 font-mono">{p.billNo || "-"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    No stock in records found.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="sticky bottom-0 bg-muted">
                <tr className="border-t border-border font-semibold">
                  <td className="p-2.5" colSpan={5}>
                    Total
                  </td>
                  <td className="p-2.5 text-right">{totalQty}</td>
                  <td className="p-2.5 text-right">{money(totalAmount)}</td>
                  <td className="p-2.5" colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
