import { useMemo } from "react";
import { Building2, TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { useStoreContext } from "@/lib/store-context";
import { money } from "@/lib/utils";

export function CrossStoreSummary() {
  const { stores, isAdmin } = useStoreContext();
  const { stock, sales, purchaseHeaders, vendors, vendorTransactions } = useStore();

  const storeData = useMemo(() => {
    return stores.map((store) => {
      const storeStock = stock.filter((s) => s.storeId === store.id);
      const storeSales = sales.filter((s) => s.storeId === store.id);
      const storePurchases = purchaseHeaders.filter((p) => p.storeId === store.id);
      const storeVendors = vendors.filter((v) => v.storeId === store.id);
      const storeTxns = vendorTransactions.filter((t) => t.storeId === store.id);

      const stockValue = storeStock.reduce((a, s) => a + s.qty * s.purchasePrice, 0);
      const totalSales = storeSales.reduce((a, s) => a + s.total, 0);
      const totalPurchases = storePurchases.reduce((a, p) => a + p.grandTotal, 0);
      const totalVat = storeSales.reduce((a, s) => a + s.vat, 0);
      const vendorPayable = storeVendors.reduce((a, v) => {
        const vTxns = storeTxns.filter((t) => t.vendorId === v.id);
        const debit = vTxns.reduce((d, t) => d + t.debit, 0);
        const credit = vTxns.reduce((c, t) => c + t.credit, 0);
        return a + v.openingBalance + debit - credit;
      }, 0);

      return {
        id: store.id,
        name: store.name,
        stockItems: storeStock.length,
        stockQty: storeStock.reduce((a, s) => a + s.qty, 0),
        stockValue,
        totalSales,
        totalPurchases,
        totalVat,
        vendorCount: storeVendors.length,
        vendorPayable: Math.max(0, vendorPayable),
        salesCount: storeSales.length,
      };
    });
  }, [stores, stock, sales, purchaseHeaders, vendors, vendorTransactions]);

  const totals = useMemo(() => ({
    stockValue: storeData.reduce((a, s) => a + s.stockValue, 0),
    totalSales: storeData.reduce((a, s) => a + s.totalSales, 0),
    totalPurchases: storeData.reduce((a, s) => a + s.totalPurchases, 0),
    totalVat: storeData.reduce((a, s) => a + s.totalVat, 0),
    vendorPayable: storeData.reduce((a, s) => a + s.vendorPayable, 0),
    salesCount: storeData.reduce((a, s) => a + s.salesCount, 0),
  }), [storeData]);

  if (!isAdmin) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Cross-store summary is available to Admin only.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="size-5 text-primary" />
        <h2 className="text-base font-semibold sm:text-lg">Cross-Store Summary</h2>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Sales</p>
          <p className="text-lg font-bold">{money(totals.totalSales)}</p>
          <p className="text-xs text-muted-foreground">{totals.salesCount} invoices</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Purchases</p>
          <p className="text-lg font-bold">{money(totals.totalPurchases)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Stock Value</p>
          <p className="text-lg font-bold">{money(totals.stockValue)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Vendor Payable</p>
          <p className="text-lg font-bold text-red-600">{money(totals.vendorPayable)}</p>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[700px] text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left font-semibold">Store</th>
              <th className="px-3 py-2 text-right font-semibold">Stock Items</th>
              <th className="px-3 py-2 text-right font-semibold">Stock Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Stock Value</th>
              <th className="px-3 py-2 text-right font-semibold">Sales</th>
              <th className="px-3 py-2 text-right font-semibold">Purchases</th>
              <th className="px-3 py-2 text-right font-semibold">VAT</th>
              <th className="px-3 py-2 text-right font-semibold">Vendors</th>
              <th className="px-3 py-2 text-right font-semibold">Payable</th>
            </tr>
          </thead>
          <tbody>
            {storeData.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{s.name}</td>
                <td className="px-3 py-2 text-right">{s.stockItems}</td>
                <td className="px-3 py-2 text-right">{s.stockQty}</td>
                <td className="px-3 py-2 text-right">{money(s.stockValue)}</td>
                <td className="px-3 py-2 text-right">{money(s.totalSales)}</td>
                <td className="px-3 py-2 text-right">{money(s.totalPurchases)}</td>
                <td className="px-3 py-2 text-right">{money(s.totalVat)}</td>
                <td className="px-3 py-2 text-right">{s.vendorCount}</td>
                <td className="px-3 py-2 text-right text-red-600">{money(s.vendorPayable)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/50 font-semibold">
              <td className="px-3 py-2">Total ({storeData.length} stores)</td>
              <td className="px-3 py-2 text-right">{storeData.reduce((a, s) => a + s.stockItems, 0)}</td>
              <td className="px-3 py-2 text-right">{storeData.reduce((a, s) => a + s.stockQty, 0)}</td>
              <td className="px-3 py-2 text-right">{money(totals.stockValue)}</td>
              <td className="px-3 py-2 text-right">{money(totals.totalSales)}</td>
              <td className="px-3 py-2 text-right">{money(totals.totalPurchases)}</td>
              <td className="px-3 py-2 text-right">{money(totals.totalVat)}</td>
              <td className="px-3 py-2 text-right">{storeData.reduce((a, s) => a + s.vendorCount, 0)}</td>
              <td className="px-3 py-2 text-right text-red-600">{money(totals.vendorPayable)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
