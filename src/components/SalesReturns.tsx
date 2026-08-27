import { useMemo, useState } from "react";
import { RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addSalesReturn,
  useStore,
  type Sale,
  type SaleAllocation,
  type StockLot,
  type SaleItemImei,
} from "@/lib/store";
import { exportRows } from "@/lib/excel";
import { money } from "@/lib/utils";

export function SalesReturns() {
  const { sales, salesReturns, saleAllocations, stockLots, saleImeis } = useStore();

  const groupedSales = useMemo(() => {
    const groups = new Map<string, { header: Sale; items: Sale[] }>();
    for (const s of sales) {
      const existing = groups.get(s.invoiceNo);
      if (existing) {
        existing.items.push(s);
      } else {
        groups.set(s.invoiceNo, { header: s, items: [s] });
      }
    }
    return [...groups.values()];
  }, [sales]);

  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedItemCode, setSelectedSelectedItemCode] = useState("");
  const [selectedLotId, setSelectedLotId] = useState("");
  const [selectedImei, setSelectedImei] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const selectedGroup = useMemo(
    () => groupedSales.find((g) => g.header.invoiceNo === selectedInvoice),
    [groupedSales, selectedInvoice],
  );

  const selectedSaleItem = useMemo(
    () => selectedGroup?.items.find((s) => s.itemName === selectedItemName && s.id === selectedSaleId),
    [selectedGroup, selectedItemName, selectedSaleId],
  );

  const allocatedLots = useMemo(() => {
    if (!selectedSaleId) return [];
    const allocs = saleAllocations.filter((a) => a.saleId === selectedSaleId);
    return allocs.map((a) => {
      const lot = stockLots.find((l) => l.id === a.lotId);
      return { ...a, lot };
    }).filter((a) => a.lot);
  }, [saleAllocations, selectedSaleId, stockLots]);

  const saleImeisForItem = useMemo(() => {
    if (!selectedSaleId) return [];
    return saleImeis.filter((si) => si.saleId === selectedSaleId);
  }, [selectedSaleId, saleImeis]);

  const alreadyReturnedQty = useMemo(() => {
    if (!selectedSaleId) return 0;
    return salesReturns
      .filter((r) => r.saleId === selectedSaleId)
      .reduce((sum, r) => sum + r.qty, 0);
  }, [selectedSaleId, salesReturns]);

  const maxReturnableQty = useMemo(() => {
    if (!selectedSaleItem) return 0;
    return Math.max(0, selectedSaleItem.qty - alreadyReturnedQty);
  }, [selectedSaleItem, alreadyReturnedQty]);

  function handleInvoiceChange(invoiceNo: string) {
    setSelectedInvoice(invoiceNo);
    setSelectedSaleId("");
    setSelectedItemName("");
    setSelectedSelectedItemCode("");
    setSelectedLotId("");
    setSelectedImei("");
    setReturnQty(1);
    setReturnReason("");
    setRefundAmount(0);
  }

  function handleItemSelect(saleId: string, itemName: string, itemCode: string, rate: number) {
    setSelectedSaleId(saleId);
    setSelectedItemName(itemName);
    setSelectedSelectedItemCode(itemCode);
    setSelectedLotId("");
    setSelectedImei("");
    setReturnQty(1);
    setRefundAmount(rate);
  }

  async function handleReturn() {
    if (!selectedInvoice) {
      toast.error("Select an invoice");
      return;
    }
    if (!selectedSaleId) {
      toast.error("Select an item to return");
      return;
    }
    if (!selectedLotId) {
      toast.error("Select the lot to restore");
      return;
    }
    if (returnQty <= 0) {
      toast.error("Return quantity must be at least 1");
      return;
    }
    if (selectedSaleItem && returnQty > maxReturnableQty) {
      toast.error(`Cannot return more than remaining quantity (${maxReturnableQty} of ${selectedSaleItem.qty} already returned ${alreadyReturnedQty})`);
      return;
    }
    if (!returnReason.trim()) {
      toast.error("Enter a return reason");
      return;
    }

    setSaving(true);
    const { error } = await addSalesReturn(
      selectedInvoice,
      selectedSaleId,
      selectedItemName,
      selectedItemCode,
      selectedLotId,
      selectedImei,
      returnQty,
      returnDate,
      returnReason.trim(),
      refundAmount,
    );
    setSaving(false);

    if (error) {
      toast.error(`Return failed: ${error}`);
      return;
    }

    toast.success(`Return recorded: ${selectedItemName} x${returnQty}`);
    setSelectedInvoice("");
    setSelectedSaleId("");
    setSelectedItemName("");
    setSelectedSelectedItemCode("");
    setSelectedLotId("");
    setSelectedImei("");
    setReturnQty(1);
    setReturnReason("");
    setRefundAmount(0);
  }

  function onExport() {
    if (salesReturns.length === 0) {
      toast.error("No returns to export");
      return;
    }
    exportRows(
      salesReturns.map((r) => ({
        "Return No": r.returnNo,
        "Original Invoice": r.originalInvoiceNo,
        "Item": r.saleItemName,
        "Code": r.saleItemCode,
        "IMEI": r.imei,
        "Qty": r.qty,
        "Return Date": r.returnDate,
        "Reason": r.reason,
        "Refund Amount": r.refundAmount,
        "Status": r.status,
      })),
      "Sales Returns",
      `BM_SalesReturns_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Process Sales Return</p>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label className="text-xs sm:text-sm">Invoice Number</Label>
            <Select value={selectedInvoice} onValueChange={handleInvoiceChange}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue placeholder="Select invoice..." /></SelectTrigger>
              <SelectContent>
                {groupedSales.map((g) => (
                  <SelectItem key={g.header.invoiceNo} value={g.header.invoiceNo}>
                    {g.header.invoiceNo} — {g.header.customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Return Date</Label>
            <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="h-9 text-xs sm:text-sm" />
          </div>
        </div>

        {selectedGroup && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Select item to return:</p>
            <div className="max-h-[200px] overflow-auto rounded-md border border-border">
              <table className="w-full text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-right">Qty Sold</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.items.map((item) => (
                    <tr key={item.id} className={`border-t border-border ${selectedSaleId === item.id ? "bg-primary/5" : ""}`}>
                      <td className="p-2 font-medium">{item.itemName}</td>
                      <td className="p-2 text-muted-foreground">{item.subCategory} · {item.brand}</td>
                      <td className="p-2 text-right">{item.qty}</td>
                      <td className="p-2 text-right">{money(item.rate)}</td>
                      <td className="p-2 text-right font-medium">{money(item.total)}</td>
                      <td className="p-2 text-center">
                        <Button
                          size="sm"
                          variant={selectedSaleId === item.id ? "default" : "outline"}
                          className="h-7 text-[10px]"
                          onClick={() => handleItemSelect(item.id, item.itemName, item.itemCode, item.rate)}
                        >
                          <RotateCcw className="mr-1 size-3" /> Return
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedSaleId && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Lot & IMEI Details:</p>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <Label className="text-xs sm:text-sm">Lot (FIFO allocated)</Label>
                <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                  <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue placeholder="Select lot..." /></SelectTrigger>
                  <SelectContent>
                    {allocatedLots.map((a) => (
                      <SelectItem key={a.lotId} value={a.lotId}>
                        {a.lot?.lotNo} — {a.qtyTaken} units @ {money(a.lot?.purchasePrice ?? 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {saleImeisForItem.length > 0 && (
                <div>
                  <Label className="text-xs sm:text-sm">IMEI</Label>
                  <Select value={selectedImei} onValueChange={setSelectedImei}>
                    <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue placeholder="Select IMEI..." /></SelectTrigger>
                    <SelectContent>
                      {saleImeisForItem.map((si) => (
                        <SelectItem key={si.imei} value={si.imei}>{si.imei}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs sm:text-sm">Return Qty</Label>
                <Input
                  type="number"
                  min="1"
                  max={maxReturnableQty || 1}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Number(e.target.value))}
                  className="h-9 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Refund Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="h-9 text-xs sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs sm:text-sm">Return Reason *</Label>
              <Textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Describe the reason for return..."
                className="h-16 text-xs sm:text-sm mt-1"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={handleReturn} disabled={saving} className="text-xs sm:text-sm">
                {saving ? "Processing..." : "Process Return"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Returns History */}
      <Card className="overflow-hidden p-0">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Return History ({salesReturns.length})</p>
            <Button variant="outline" size="sm" onClick={onExport} className="text-xs sm:text-sm">
              <Download className="mr-1 size-3.5 sm:size-4" /> Export
            </Button>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[700px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Return No</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">IMEI</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Refund</th>
                <th className="p-2.5">Reason</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {salesReturns.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium">{r.returnNo}</td>
                  <td className="p-2.5 whitespace-nowrap">{r.returnDate}</td>
                  <td className="p-2.5 font-mono">{r.originalInvoiceNo}</td>
                  <td className="p-2.5">{r.saleItemName}</td>
                  <td className="p-2.5 font-mono text-[11px]">{r.imei || "-"}</td>
                  <td className="p-2.5 text-right">{r.qty}</td>
                  <td className="p-2.5 text-right font-medium">{money(r.refundAmount)}</td>
                  <td className="p-2.5 max-w-[200px] truncate text-muted-foreground">{r.reason || "-"}</td>
                  <td className="p-2.5">
                    <Badge variant={r.status === "COMPLETED" ? "secondary" : "outline"} className="text-[10px]">
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {salesReturns.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    No returns recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
