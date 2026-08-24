import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useStore, type Sale, type StockItem } from "@/lib/store";
import { exportRows } from "@/lib/excel";

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Group = {
  key: string;
  items: number;
  qty: number;
  purchaseValue: number;
  sellingValue: number;
};

function groupBy(stock: StockItem[], pick: (i: StockItem) => string): Group[] {
  const map = new Map<string, Group>();
  for (const i of stock) {
    const key = (pick(i) || "—").trim() || "—";
    const g = map.get(key) ?? { key, items: 0, qty: 0, purchaseValue: 0, sellingValue: 0 };
    g.items += 1;
    g.qty += i.qty;
    g.purchaseValue += i.qty * i.purchasePrice;
    g.sellingValue += i.qty * i.sellingPrice;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty);
}

function GroupTable({ label, groups }: { label: string; groups: Group[] }) {
  const t = groups.reduce(
    (a, g) => ({
      items: a.items + g.items,
      qty: a.qty + g.qty,
      purchaseValue: a.purchaseValue + g.purchaseValue,
      sellingValue: a.sellingValue + g.sellingValue,
    }),
    { items: 0, qty: 0, purchaseValue: 0, sellingValue: 0 },
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="max-h-[55vh] overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[550px] text-xs sm:text-sm">
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr className="text-left">
              <th className="p-2.5">{label}</th>
              <th className="p-2.5 text-right">Items</th>
              <th className="p-2.5 text-right">Qty</th>
              <th className="p-2.5 text-right">Purchase value</th>
              <th className="p-2.5 text-right">Selling value</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key} className="border-t border-border">
                <td className="p-2.5 font-medium">{g.key}</td>
                <td className="p-2.5 text-right">{g.items}</td>
                <td className={`p-2.5 text-right font-semibold ${g.qty <= 0 ? "text-destructive" : ""}`}>
                  {g.qty}
                </td>
                <td className="p-2.5 text-right">{money(g.purchaseValue)}</td>
                <td className="p-2.5 text-right font-medium">{money(g.sellingValue)}</td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No stock data.
                </td>
              </tr>
            )}
          </tbody>
          {groups.length > 0 && (
            <tfoot className="sticky bottom-0 bg-muted">
              <tr className="border-t border-border font-semibold">
                <td className="p-2.5">Total</td>
                <td className="p-2.5 text-right">{t.items}</td>
                <td className="p-2.5 text-right">{t.qty}</td>
                <td className="p-2.5 text-right">{money(t.purchaseValue)}</td>
                <td className="p-2.5 text-right">{money(t.sellingValue)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-3 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-1 text-lg font-bold sm:text-xl">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">{hint}</p>}
    </Card>
  );
}

export function StockSummary() {
  const { stock, sales } = useStore();
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const byCategory = useMemo(() => groupBy(stock, (i) => i.category), [stock]);
  const byBrand = useMemo(() => groupBy(stock, (i) => i.brand), [stock]);
  const bySubBrand = useMemo(() => groupBy(stock, (i) => i.subBrand), [stock]);

  const todaySales: Sale[] = useMemo(() => {
    const filtered = sales.filter((s) => s.date === today);
    return filtered;
  }, [sales, today]);
  const todayQty = todaySales.reduce((a, s) => a + s.qty, 0);
  const todayAmount = todaySales.reduce((a, s) => a + s.amount, 0);
  const todayVat = todaySales.reduce((a, s) => a + s.vat, 0);
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);

  const totalQty = stock.reduce((a, i) => a + i.qty, 0);
  const totalPurchase = stock.reduce((a, i) => a + i.qty * i.purchasePrice, 0);
  const totalSelling = stock.reduce((a, i) => a + i.qty * i.sellingPrice, 0);
  const outOfStock = stock.filter((i) => i.qty <= 0).length;

  function onExport() {
    const rows = [
      ...byCategory.map((g) => ({
        Group: "Category",
        Name: g.key,
        Items: g.items,
        Qty: g.qty,
        "Purchase Value": g.purchaseValue,
        "Selling Value": g.sellingValue,
      })),
      ...byBrand.map((g) => ({
        Group: "Brand",
        Name: g.key,
        Items: g.items,
        Qty: g.qty,
        "Purchase Value": g.purchaseValue,
        "Selling Value": g.sellingValue,
      })),
      ...bySubBrand.map((g) => ({
        Group: "Sub-Brand",
        Name: g.key,
        Items: g.items,
        Qty: g.qty,
        "Purchase Value": g.purchaseValue,
        "Selling Value": g.sellingValue,
      })),
    ];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    exportRows(rows, "Summary", `BM_Stock_Summary_${today}.xlsx`);
  }

  function onExportToday() {
    if (todaySales.length === 0) {
      toast.error("No sales today");
      return;
    }
    exportRows(
      todaySales.map((s) => ({
        Date: s.date,
        "Invoice No": s.invoiceNo,
        Customer: s.customer,
        Item: s.itemName,
        Category: s.category,
        Brand: s.brand,
        Model: s.model,
        Qty: s.qty,
        Rate: s.rate,
        Amount: s.amount,
        "VAT 13%": s.vat,
        Total: s.total,
      })),
      "Today",
      `BM_Today_Sales_${today}.xlsx`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Today sales"
          value={money(todayTotal)}
          hint={`${todaySales.length} inv · VAT ${money(todayVat)}`}
        />
        <Stat
          label="Today stock out"
          value={`${todayQty} units`}
          hint={`Net ${money(todayAmount)}`}
        />
        <Stat
          label="Stock on hand"
          value={`${totalQty} units`}
          hint={`${stock.length} items · ${outOfStock} out`}
        />
        <Stat
          label="Stock value"
          value={money(totalSelling)}
          hint={`Cost ${money(totalPurchase)}`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onExport} className="flex-1 sm:flex-initial text-xs sm:text-sm">
          <Download className="mr-1 size-3.5 sm:size-4" /> Export summary
        </Button>
        <Button variant="outline" size="sm" onClick={onExportToday} className="flex-1 sm:flex-initial text-xs sm:text-sm">
          <Download className="mr-1 size-3.5 sm:size-4" /> Export today sales
        </Button>
      </div>

      <Tabs defaultValue="category">
        <TabsList className="mb-3 grid grid-cols-4 h-auto p-1 text-xs sm:flex sm:h-10 sm:w-auto">
          <TabsTrigger value="category" className="py-1.5 text-xs sm:text-sm">Category</TabsTrigger>
          <TabsTrigger value="brand" className="py-1.5 text-xs sm:text-sm">Brand</TabsTrigger>
          <TabsTrigger value="subbrand" className="py-1.5 text-xs sm:text-sm">Sub-brand</TabsTrigger>
          <TabsTrigger value="today" className="py-1.5 text-xs sm:text-sm">Today</TabsTrigger>
        </TabsList>
        <TabsContent value="category">
          <GroupTable label="Category" groups={byCategory} />
        </TabsContent>
        <TabsContent value="brand">
          <GroupTable label="Brand" groups={byBrand} />
        </TabsContent>
        <TabsContent value="subbrand">
          <GroupTable label="Sub-brand" groups={bySubBrand} />
        </TabsContent>
        <TabsContent value="today">
          <Card className="overflow-hidden p-0">
            <div className="max-h-[55vh] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[600px] text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr className="text-left">
                    <th className="p-2.5">Invoice</th>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-right">VAT 13%</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySales.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="p-2.5 font-mono font-medium">{s.invoiceNo}</td>
                      <td className="p-2.5">{s.customer}</td>
                      <td className="p-2.5">{s.itemName}</td>
                      <td className="p-2.5 text-right font-semibold">{s.qty}</td>
                      <td className="p-2.5 text-right">{money(s.amount)}</td>
                      <td className="p-2.5 text-right">{money(s.vat)}</td>
                      <td className="p-2.5 text-right font-medium">{money(s.total)}</td>
                    </tr>
                  ))}
                  {todaySales.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No sales recorded today.
                      </td>
                    </tr>
                  )}
                </tbody>
                {todaySales.length > 0 && (
                  <tfoot className="sticky bottom-0 bg-muted">
                    <tr className="border-t border-border font-semibold">
                      <td className="p-2.5" colSpan={3}>
                        Total
                      </td>
                      <td className="p-2.5 text-right">{todayQty}</td>
                      <td className="p-2.5 text-right">{money(todayAmount)}</td>
                      <td className="p-2.5 text-right">{money(todayVat)}</td>
                      <td className="p-2.5 text-right">{money(todayTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
