import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { money } from "@/lib/utils";

type HistoryEntry = {
  date: string;
  transaction: string;
  type: "purchase" | "sale" | "adjustment";
  qtyIn: number;
  qtyOut: number;
  balance: number;
  reference: string;
};

export function LotHistory() {
  const { stockLots, purchases, sales, saleAllocations, stockAdjustments } = useStore();
  const [selectedLotId, setSelectedLotId] = useState("");
  const [q, setQ] = useState("");

  const lotOptions = useMemo(() => {
    const t = q.trim().toLowerCase();
    const items = stockLots.map((l) => ({ id: l.id, label: `${l.lotNo} — ${l.itemName}` }));
    if (!t) return items;
    return items.filter((i) => i.label.toLowerCase().includes(t));
  }, [stockLots, q]);

  const purchaseMap = useMemo(() => new Map(purchases.map((p) => [p.id, p])), [purchases]);
  const saleMap = useMemo(() => new Map(sales.map((s) => [s.id, s])), [sales]);

  const history = useMemo((): HistoryEntry[] => {
    if (!selectedLotId) return [];
    const lot = stockLots.find((l) => l.id === selectedLotId);
    if (!lot) return [];

    const entries: HistoryEntry[] = [];

    const purchase = purchaseMap.get(lot.purchaseId ?? "");
    entries.push({
      date: lot.date,
      transaction: purchase ? `Purchase ${purchase.billNo}` : "Purchase",
      type: "purchase",
      qtyIn: purchase?.qty ?? lot.qty,
      qtyOut: 0,
      balance: 0,
      reference: purchase?.billNo ?? "",
    });

    const allocs = saleAllocations.filter((a) => a.lotId === lot.id);
    let runningBalance = entries[0].qtyIn;
    for (const alloc of allocs) {
      const sale = saleMap.get(alloc.saleId);
      runningBalance -= alloc.qtyTaken;
      entries.push({
        date: sale?.date ?? "",
        transaction: sale ? `Sale ${sale.invoiceNo}` : "Sale",
        type: "sale",
        qtyIn: 0,
        qtyOut: alloc.qtyTaken,
        balance: runningBalance,
        reference: sale?.invoiceNo ?? "",
      });
    }

    const adjs = stockAdjustments.filter((a) => a.lotId === lot.id);
    for (const adj of adjs) {
      runningBalance += adj.qtyAdjusted;
      entries.push({
        date: adj.date,
        transaction: `Adjustment (${adj.adjustmentType})`,
        type: "adjustment",
        qtyIn: adj.qtyAdjusted > 0 ? adj.qtyAdjusted : 0,
        qtyOut: adj.qtyAdjusted < 0 ? Math.abs(adj.qtyAdjusted) : 0,
        balance: runningBalance,
        reference: adj.reason,
      });
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));

    let bal = 0;
    for (const e of entries) {
      bal += e.qtyIn - e.qtyOut;
      e.balance = bal;
    }

    return entries;
  }, [selectedLotId, stockLots, saleAllocations, stockAdjustments, purchaseMap, saleMap]);

  const selectedLot = stockLots.find((l) => l.id === selectedLotId);

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <div>
            <Label htmlFor="lh-search" className="text-xs sm:text-sm">Search lots</Label>
            <Input id="lh-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lot number or item name..." className="h-9 text-xs sm:text-sm" />
            {q && lotOptions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                {lotOptions.slice(0, 20).map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      className={`w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-accent ${selectedLotId === opt.id ? "bg-accent" : ""}`}
                      onClick={() => { setSelectedLotId(opt.id); setQ(""); }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-end">
            {selectedLot && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                <strong className="text-foreground">{selectedLot.lotNo}</strong> — {selectedLot.itemName} — {selectedLot.qty} available — {money(selectedLot.purchasePrice)} / unit
              </div>
            )}
          </div>
        </div>
      </Card>

      {selectedLotId && (
        <Card className="overflow-hidden p-0">
          <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[600px] text-xs sm:text-sm">
              <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                <tr className="text-left">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Transaction</th>
                  <th className="p-2.5 text-right">Qty In</th>
                  <th className="p-2.5 text-right">Qty Out</th>
                  <th className="p-2.5 text-right">Balance</th>
                  <th className="p-2.5">Reference</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-2.5 whitespace-nowrap">{h.date}</td>
                    <td className="p-2.5 font-medium">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        h.type === "purchase" ? "bg-blue-100 text-blue-700" :
                        h.type === "sale" ? "bg-orange-100 text-orange-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {h.transaction}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-semibold text-green-600">{h.qtyIn > 0 ? h.qtyIn : ""}</td>
                    <td className="p-2.5 text-right font-semibold text-red-600">{h.qtyOut > 0 ? h.qtyOut : ""}</td>
                    <td className="p-2.5 text-right font-bold">{h.balance}</td>
                    <td className="p-2.5 text-muted-foreground">{h.reference || "-"}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">No history for this lot.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
