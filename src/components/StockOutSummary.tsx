import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useStore, getTransfers, getTransferItems, LOCATION_LABELS, type StockTransfer, type StockTransferItem } from "@/lib/store";
import { useStoreContext } from "@/lib/store-context";
import { exportRows } from "@/lib/excel";
import { money } from "@/lib/utils";

interface OutRow {
  id: string;
  date: string;
  itemCode: string;
  itemName: string;
  lotInfo: string;
  qty: number;
  rate: number;
  amount: number;
  vat: number;
  total: number;
  customer: string;
  invoiceNo: string;
}

export function StockOutSummary() {
  const { sales, stockLots, saleAllocations } = useStore();
  const { currentStoreId } = useStoreContext();
  const [outgoingTransfers, setOutgoingTransfers] = useState<StockTransfer[]>([]);
  const [transferItemsMap, setTransferItemsMap] = useState<Record<string, StockTransferItem[]>>({});

  useEffect(() => {
    async function loadTransfers() {
      const transfers = await getTransfers();
      const relevant = transfers.filter((t) => {
        if (currentStoreId) return t.fromStoreId === currentStoreId;
        return true;
      });
      setOutgoingTransfers(relevant);
      const itemsMap: Record<string, StockTransferItem[]> = {};
      for (const t of relevant) {
        itemsMap[t.id] = await getTransferItems(t.id);
      }
      setTransferItemsMap(itemsMap);
    }
    loadTransfers();
  }, [currentStoreId]);

  const allRows = useMemo(() => {
    const saleRows: OutRow[] = sales.map((s) => {
      const allocs = saleAllocations.filter((a) => a.saleId === s.id);
      const lotNos = allocs
        .map((a) => {
          const lot = stockLots.find((l) => l.id === a.lotId);
          return lot ? `${lot.lotNo}(${a.qtyTaken})` : null;
        })
        .filter(Boolean)
        .join(", ");
      return {
        id: s.id,
        date: s.date,
        itemCode: s.itemCode,
        itemName: s.itemName,
        lotInfo: lotNos || "-",
        qty: s.qty,
        rate: s.rate,
        amount: s.amount,
        vat: s.vat,
        total: s.total,
        customer: s.customer,
        invoiceNo: s.invoiceNo,
      };
    });

    const transferRows: OutRow[] = [];
    for (const t of outgoingTransfers) {
      const items = transferItemsMap[t.id] || [];
      for (const item of items) {
        const toName = LOCATION_LABELS[t.toStoreId ?? ""] || "Unknown";
        const lot = item.lotId ? stockLots.find((l) => l.id === item.lotId) : null;
        transferRows.push({
          id: `transfer-${t.id}-${item.id}`,
          date: t.date,
          itemCode: item.itemCode,
          itemName: item.itemName,
          lotInfo: lot?.lotNo || "-",
          qty: item.qty,
          rate: item.purchasePrice,
          amount: 0,
          vat: 0,
          total: 0,
          customer: `Transfer to ${toName}`,
          invoiceNo: t.transferNo,
        });
      }
    }

    return [...saleRows, ...transferRows];
  }, [sales, stockLots, saleAllocations, outgoingTransfers, transferItemsMap]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let result = allRows;
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
          s.lotInfo.toLowerCase().includes(t),
      );
    }
    return result;
  }, [allRows, dateFrom, dateTo, q]);

  const totalQty = filtered.reduce((a, s) => a + s.qty, 0);
  const totalAmount = filtered.reduce((a, s) => a + s.amount, 0);
  const totalVat = filtered.reduce((a, s) => a + s.vat, 0);
  const totalTotal = filtered.reduce((a, s) => a + s.total, 0);

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
      filtered.map((s) => ({
        Date: s.date,
        "Item Code": s.itemCode,
        "Item Name": s.itemName,
        "Lot Info": s.lotInfo,
        "Qty Out": s.qty,
        "Unit Price": s.rate,
        Amount: s.amount,
        VAT: s.vat,
        Total: s.total,
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
          Total: <strong className="text-foreground">{money(totalTotal)}</strong>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[900px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Item Code</th>
                <th className="p-2.5">Item Name</th>
                <th className="p-2.5">Lot No</th>
                <th className="p-2.5 text-right">Qty Out</th>
                <th className="p-2.5 text-right">Unit Price</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5 text-right">VAT</th>
                <th className="p-2.5 text-right">Total</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Invoice No</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-2.5 whitespace-nowrap">{s.date}</td>
                  <td className="p-2.5 font-mono">{s.itemCode}</td>
                  <td className="p-2.5 font-medium">{s.itemName}</td>
                  <td className="p-2.5 font-mono text-primary text-[11px]">{s.lotInfo}</td>
                  <td className="p-2.5 text-right font-semibold">{s.qty}</td>
                  <td className="p-2.5 text-right">{money(s.rate)}</td>
                  <td className="p-2.5 text-right">{money(s.amount)}</td>
                  <td className="p-2.5 text-right text-muted-foreground">{money(s.vat)}</td>
                  <td className="p-2.5 text-right font-medium">{money(s.total)}</td>
                  <td className="p-2.5">{s.customer}</td>
                  <td className="p-2.5 font-mono">{s.invoiceNo}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-muted-foreground">
                    No stock out records found.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="sticky bottom-0 bg-muted">
                <tr className="border-t border-border font-semibold">
                  <td className="p-2.5" colSpan={4}>Total</td>
                  <td className="p-2.5 text-right">{totalQty}</td>
                  <td className="p-2.5 text-right" colSpan={2}>{money(totalAmount)}</td>
                  <td className="p-2.5 text-right">{money(totalVat)}</td>
                  <td className="p-2.5 text-right">{money(totalTotal)}</td>
                  <td className="p-2.5" colSpan={2}></td>
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
