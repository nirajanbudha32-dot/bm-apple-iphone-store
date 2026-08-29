import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useStore, getTransfers, getTransferItems, LOCATION_LABELS, WAREHOUSE_ID, type StockTransfer, type StockTransferItem } from "@/lib/store";
import { useStoreContext } from "@/lib/store-context";
import { exportRows } from "@/lib/excel";
import { money } from "@/lib/utils";

export function StockInSummary() {
  const { stockLots, purchases, purchaseHeaders, purchaseItems } = useStore();
  const { currentStoreId, isAdmin } = useStoreContext();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");
  const [incomingTransfers, setIncomingTransfers] = useState<StockTransfer[]>([]);
  const [transferItemsMap, setTransferItemsMap] = useState<Record<string, StockTransferItem[]>>({});

  useEffect(() => {
    async function loadTransfers() {
      const transfers = await getTransfers();
      const relevant = transfers.filter((t) => {
        if (currentStoreId) return t.toStoreId === currentStoreId;
        return true;
      });
      setIncomingTransfers(relevant);
      const itemsMap: Record<string, StockTransferItem[]> = {};
      for (const t of relevant) {
        itemsMap[t.id] = await getTransferItems(t.id);
      }
      setTransferItemsMap(itemsMap);
    }
    loadTransfers();
  }, [currentStoreId]);

  const purchaseRows = useMemo(() => {
    const rows: {
      id: string;
      lotNo: string;
      date: string;
      itemCode: string;
      itemName: string;
      supplier: string;
      billNo: string;
      qty: number;
      purchasePrice: number;
      value: number;
    }[] = [];

    // New purchase_headers + purchase_items
    for (const h of purchaseHeaders) {
      const items = purchaseItems.filter((pi) => pi.purchaseHeaderId === h.id);
      for (const item of items) {
        const lot = stockLots.find(
          (l) =>
            l.purchaseId === item.id ||
            l.lotNo === item.lotNo ||
            (l.purchaseId === h.id && (l.itemCode === item.itemCode || l.itemName === item.itemName))
        );
        rows.push({
          id: item.id,
          lotNo: lot?.lotNo || item.lotNo || "-",
          date: h.date,
          itemCode: item.itemCode,
          itemName: item.itemName,
          supplier: h.supplierName,
          billNo: h.purchaseNo,
          qty: item.qty,
          purchasePrice: item.rate,
          value: item.amount,
        });
      }
    }

    // Legacy flat purchases (only if not already covered by new headers)
    if (purchaseHeaders.length === 0) {
      for (const p of purchases) {
        const lot = stockLots.find(
          (l) =>
            l.purchaseId === p.id ||
            l.lotNo === p.billNo ||
            (l.itemCode === p.itemCode && l.date === p.date)
        );
        rows.push({
          id: p.id,
          lotNo: lot?.lotNo || "-",
          date: p.date,
          itemCode: p.itemCode,
          itemName: p.itemName,
          supplier: p.supplier,
          billNo: p.billNo,
          qty: p.qty,
          purchasePrice: p.rate,
          value: p.amount,
        });
      }
    }

    // Transfer-in rows
    for (const t of incomingTransfers) {
      const items = transferItemsMap[t.id] || [];
      for (const item of items) {
        const fromName = LOCATION_LABELS[t.fromStoreId ?? ""] || "Unknown";
        rows.push({
          id: `transfer-${t.id}-${item.id}`,
          lotNo: "-",
          date: t.date,
          itemCode: item.itemCode,
          itemName: item.itemName,
          supplier: `Transfer from ${fromName}`,
          billNo: t.transferNo,
          qty: item.qty,
          purchasePrice: item.purchasePrice,
          value: item.qty * item.purchasePrice,
        });
      }
    }

    return rows;
  }, [purchases, purchaseHeaders, purchaseItems, stockLots, incomingTransfers, transferItemsMap]);

  const filtered = useMemo(() => {
    let result = purchaseRows;
    if (dateFrom) result = result.filter((l) => l.date >= dateFrom);
    if (dateTo) result = result.filter((l) => l.date <= dateTo);
    const t = q.trim().toLowerCase();
    if (t) {
      result = result.filter(
        (l) =>
          l.itemName.toLowerCase().includes(t) ||
          l.itemCode.toLowerCase().includes(t) ||
          l.lotNo.toLowerCase().includes(t) ||
          l.supplier.toLowerCase().includes(t) ||
          l.billNo.toLowerCase().includes(t),
      );
    }
    return result;
  }, [purchaseRows, dateFrom, dateTo, q]);

  const totalQty = filtered.reduce((a, l) => a + l.qty, 0);
  const totalValue = filtered.reduce((a, l) => a + l.value, 0);

  const PER_PAGE = 50;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  function onExport() {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportRows(
      filtered.map((l) => ({
        "Lot No": l.lotNo,
        Date: l.date,
        "Item Code": l.itemCode,
        "Item Name": l.itemName,
        Supplier: l.supplier,
        "Bill No": l.billNo,
        "Qty In": l.qty,
        "Purchase Price": l.purchasePrice,
        Value: l.value,
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
              placeholder="Lot, item, code, supplier..."
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
          <span><strong className="text-foreground">{filtered.length}</strong> lots</span>
          <span className="mx-2">•</span>
          <span><strong className="text-foreground">{totalQty}</strong> units in</span>
        </div>
        <div>
          Total Value: <strong className="text-foreground">{money(totalValue)}</strong>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[750px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Lot No</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Item Code</th>
                <th className="p-2.5">Item Name</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5 text-right">Qty In</th>
                <th className="p-2.5 text-right">Purchase Price</th>
                <th className="p-2.5 text-right">Value</th>
                <th className="p-2.5">Bill No</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium text-primary">{l.lotNo}</td>
                  <td className="p-2.5 whitespace-nowrap">{l.date}</td>
                  <td className="p-2.5 font-mono">{l.itemCode}</td>
                  <td className="p-2.5 font-medium">{l.itemName}</td>
                  <td className="p-2.5">{l.supplier}</td>
                  <td className="p-2.5 text-right font-semibold">{l.qty}</td>
                  <td className="p-2.5 text-right">{money(l.purchasePrice)}</td>
                  <td className="p-2.5 text-right font-medium">{money(l.value)}</td>
                  <td className="p-2.5 font-mono">{l.billNo || "-"}</td>
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
                  <td className="p-2.5 text-right" colSpan={2}>{money(totalValue)}</td>
                  <td className="p-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>
            Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-8 text-xs">
              Prev
            </Button>
            <span className="flex items-center px-2 text-xs">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="h-8 text-xs">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
