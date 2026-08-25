import { useMemo, useState } from "react";
import { Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useStore, addStockAdjustment } from "@/lib/store";
import { exportRows } from "@/lib/excel";
import { money } from "@/lib/utils";

export function StockAdjustments() {
  const { stockLots, stockAdjustments } = useStore();
  const [lotId, setLotId] = useState("");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const [lotSearch, setLotSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const lotOptions = useMemo(() => {
    const t = lotSearch.trim().toLowerCase();
    const items = stockLots.filter((l) => l.qty > 0).map((l) => ({ id: l.id, label: `${l.lotNo} — ${l.itemName} (${l.qty} avail)` }));
    if (!t) return items;
    return items.filter((i) => i.label.toLowerCase().includes(t));
  }, [stockLots, lotSearch]);

  const selectedLot = stockLots.find((l) => l.id === lotId);

  const filtered = useMemo(() => {
    let result = stockAdjustments;
    if (dateFrom) result = result.filter((a) => a.date >= dateFrom);
    if (dateTo) result = result.filter((a) => a.date <= dateTo);
    return result;
  }, [stockAdjustments, dateFrom, dateTo]);

  async function handleSave() {
    if (!lotId) { toast.error("Select a lot"); return; }
    if (qty >= 0) { toast.error("Enter a negative number to reduce stock (e.g. -3)"); return; }
    if (!reason.trim()) { toast.error("Enter a reason"); return; }
    if (selectedLot && Math.abs(qty) > selectedLot.qty) {
      toast.error(`Cannot reduce more than available (${selectedLot.qty})`);
      return;
    }
    setSaving(true);
    const { error } = await addStockAdjustment(lotId, qty, reason.trim());
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Adjustment saved");
    setLotId("");
    setQty(0);
    setReason("");
    setLotSearch("");
  }

  function onExport() {
    if (filtered.length === 0) { toast.error("No data to export"); return; }
    exportRows(
      filtered.map((a) => ({
        Date: a.date,
        Type: a.adjustmentType,
        "Lot ID": a.lotId.slice(0, 8),
        Item: a.itemName,
        "Qty Adjusted": a.qtyAdjusted,
        Reason: a.reason,
      })),
      "Stock Adjustments",
      `BM_Adjustments_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600">
          <AlertTriangle className="size-4" /> Record Stock Damage / Adjustment
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Label className="text-xs sm:text-sm">Search Lot</Label>
            <Input value={lotSearch} onChange={(e) => { setLotSearch(e.target.value); setLotId(""); }} placeholder="Search lot number or item..." className="h-9 text-xs sm:text-sm" />
            {lotSearch && !lotId && lotOptions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                {lotOptions.slice(0, 15).map((opt) => (
                  <li key={opt.id}>
                    <button type="button" className="w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-accent" onClick={() => { setLotId(opt.id); setLotSearch(opt.label); }}>
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Qty to Reduce (negative)</Label>
            <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="-3" className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Damaged, expired..." className="h-9 text-xs sm:text-sm" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="h-9 text-xs sm:text-sm">
            {saving ? "Saving..." : "Record Adjustment"}
          </Button>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div>
            <Label className="text-xs sm:text-sm">Date from</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Date to</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs sm:text-sm" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onExport} className="h-9 w-full text-xs sm:text-sm">
              <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[50vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[600px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5 text-right">Qty Adjusted</th>
                <th className="p-2.5">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-2.5 whitespace-nowrap">{a.date}</td>
                  <td className="p-2.5">
                    <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {a.adjustmentType}
                    </span>
                  </td>
                  <td className="p-2.5 font-medium">{a.itemName}</td>
                  <td className="p-2.5 text-right font-semibold text-red-600">{a.qtyAdjusted}</td>
                  <td className="p-2.5 text-muted-foreground">{a.reason}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">No adjustments recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
