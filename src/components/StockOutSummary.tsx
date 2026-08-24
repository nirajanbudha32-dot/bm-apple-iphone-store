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

export function StockOutSummary() {
  const { sales } = useStore();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let result = sales;
    if (dateFrom) result = result.filter((s) => s.date >= dateFrom);
    if (dateTo) result = result.filter((s) => s.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) {
      result = result.filter(
        (s) =>
          s.itemName.toLowerCase().includes(t) ||
          s.itemCode.toLowerCase().includes(t) ||
          s.invoiceNo.toLowerCase().includes(t) ||
          s.customer.toLowerCase().includes(t) ||
          s.subCategory.toLowerCase().includes(t),
      );
    }
    return result;
  }, [sales, dateFrom, dateTo, q]);

  const totalQty = filtered.reduce((a, s) => a + s.qty, 0);
  const totalAmount = filtered.reduce((a, s) => a + s.amount, 0);
  const totalVat = filtered.reduce((a, s) => a + s.vat, 0);
  const totalTotal = filtered.reduce((a, s) => a + s.total, 0);

  function onExport() {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportRows(
      filtered.map((s) => ({
        Date: s.date,
        "Store Name": "BM iPhone Store",
        "Item Code": s.itemCode,
        "Item Name": s.itemName,
        "Sub Category": s.subCategory,
        "Qty Out": s.qty,
        "Unit Price": s.rate,
        Customer: s.customer,
        "Invoice No": s.invoiceNo,
      })),
      "Stock Out",
      `BM_StockOut_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label htmlFor="so-from" className="text-xs sm:text-sm">Date from</Label>
            <Input
              id="so-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="so-to" className="text-xs sm:text-sm">Date to</Label>
            <Input
              id="so-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="so-search" className="text-xs sm:text-sm">Search</Label>
            <Input
              id="so-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Item, code, invoice, customer..."
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
          <span><strong className="text-foreground">{totalQty}</strong> units out</span>
        </div>
        <div>
          Total Value: <strong className="text-foreground">{money(totalTotal)}</strong>
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
                <th className="p-2.5 text-right">Qty Out</th>
                <th className="p-2.5 text-right">Unit Price</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Invoice No</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-2.5 whitespace-nowrap">{s.date}</td>
                  <td className="p-2.5">BM iPhone Store</td>
                  <td className="p-2.5 font-mono">{s.itemCode}</td>
                  <td className="p-2.5 font-medium">{s.itemName}</td>
                  <td className="p-2.5">{s.subCategory}</td>
                  <td className="p-2.5 text-right font-semibold">{s.qty}</td>
                  <td className="p-2.5 text-right">{money(s.rate)}</td>
                  <td className="p-2.5">{s.customer}</td>
                  <td className="p-2.5 font-mono">{s.invoiceNo}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    No stock out records found.
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
