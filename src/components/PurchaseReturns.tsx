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
  addPurchaseReturn,
  useStore,
  type PurchaseHeader,
  type PurchaseItem,
  type StockLot,
} from "@/lib/store";
import { exportRows } from "@/lib/excel";
import { money } from "@/lib/utils";

export function PurchaseReturns() {
  const {
    purchaseHeaders,
    purchaseItems,
    purchaseImeis,
    stockLots,
    purchaseReturns,
    vendors,
  } = useStore();

  const [selectedHeaderId, setSelectedHeaderId] = useState("");
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | null>(null);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [selectedImei, setSelectedImei] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [returnDate, setReturnDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [returnReason, setReturnReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  const selectedHeader = useMemo(
    () => purchaseHeaders.find((h) => h.id === selectedHeaderId),
    [purchaseHeaders, selectedHeaderId]
  );

  const headerItems = useMemo(
    () =>
      purchaseItems.filter((pi) => pi.purchaseHeaderId === selectedHeaderId),
    [purchaseItems, selectedHeaderId]
  );

  const selectedItemIdxResolved =
    selectedItemIdx !== null && headerItems[selectedItemIdx]
      ? selectedItemIdx
      : null;

  const selectedItem = useMemo(
    () =>
      selectedItemIdxResolved !== null
        ? headerItems[selectedItemIdxResolved]
        : null,
    [headerItems, selectedItemIdxResolved]
  );

  const headerStockLots = useMemo(() => {
    if (!selectedHeader) return [];
    return stockLots.filter((lot) =>
      headerItems.some((pi) => lot.purchaseId === pi.id)
    );
  }, [stockLots, headerItems, selectedHeader]);

  const itemStockLots = useMemo(() => {
    if (!selectedItem) return [];
    return stockLots.filter((lot) => lot.purchaseId === selectedItem.id);
  }, [stockLots, selectedItem]);

  const itemImeis = useMemo(() => {
    if (!selectedItem) return [];
    return purchaseImeis.filter(
      (imei) => imei.purchaseItemId === selectedItem.id
    );
  }, [purchaseImeis, selectedItem]);

  function handleHeaderChange(headerId: string) {
    setSelectedHeaderId(headerId);
    setSelectedItemIdx(null);
    setSelectedLotId("");
    setSelectedImei("");
    setReturnQty(1);
    setReturnReason("");
    setRefundAmount(0);
  }

  function handleReturnClick(index: number) {
    setSelectedItemIdx(index);
    setSelectedLotId("");
    setSelectedImei("");
    setReturnQty(1);
    setReturnReason("");
    const item = headerItems[index];
    if (item) {
      setRefundAmount(item.qty * item.rate);
    }
  }

  function handleLotChange(lotId: string) {
    setSelectedLotId(lotId);
    const lot = itemStockLots.find((l) => l.id === lotId);
    if (lot && selectedItem) {
      setReturnQty(1);
      setRefundAmount(lot.purchasePrice);
    }
  }

  async function handleReturn() {
    if (!selectedHeader) {
      toast.error("Select a purchase");
      return;
    }
    if (selectedItemIdx === null || !selectedItem) {
      toast.error("Select an item to return");
      return;
    }
    if (!selectedLotId) {
      toast.error("Select a lot");
      return;
    }
    if (returnQty <= 0) {
      toast.error("Return quantity must be at least 1");
      return;
    }
    if (returnQty > selectedItem.qty) {
      toast.error(
        `Cannot return more than purchased quantity (${selectedItem.qty})`
      );
      return;
    }
    if (!returnReason.trim()) {
      toast.error("Enter a return reason");
      return;
    }
    if (refundAmount < 0) {
      toast.error("Refund amount cannot be negative");
      return;
    }

    setSaving(true);
    const { error } = await addPurchaseReturn(
      selectedHeader.purchaseNo,
      selectedHeader.id,
      selectedHeader.vendorId,
      selectedItem.itemCode,
      selectedItem.itemName,
      selectedLotId,
      selectedImei,
      returnQty,
      returnDate,
      returnReason.trim(),
      refundAmount
    );
    setSaving(false);

    if (error) {
      toast.error(`Return failed: ${error}`);
      return;
    }

    toast.success(
      `Return recorded: ${selectedItem.itemName} x${returnQty}`
    );
    setSelectedItemIdx(null);
    setSelectedLotId("");
    setSelectedImei("");
    setReturnQty(1);
    setReturnReason("");
    setRefundAmount(0);
  }

  function onExport() {
    if (purchaseReturns.length === 0) {
      toast.error("No returns to export");
      return;
    }
    exportRows(
      purchaseReturns.map((r) => {
        const vendor = vendors.find((v) => v.id === r.vendorId);
        const lot = stockLots.find((l) => l.id === r.lotId);
        return {
          "Return No": r.returnNo,
          Date: r.returnDate,
          "Purchase No": r.originalPurchaseNo,
          Vendor: vendor?.vendorName ?? r.vendorId,
          Item: r.itemName,
          Lot: lot?.lotNo ?? "-",
          IMEI: r.imei || "-",
          Qty: r.qty,
          "Refund Amount": r.refundAmount,
          Reason: r.reason || "-",
          Status: r.status,
        };
      }),
      "Purchase Returns",
      `BM_PurchaseReturns_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          Process Purchase Return
        </p>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label className="text-xs sm:text-sm">Purchase</Label>
            <Select
              value={selectedHeaderId}
              onValueChange={handleHeaderChange}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Select purchase..." />
              </SelectTrigger>
              <SelectContent>
                {purchaseHeaders.map((h) => {
                  const v = vendors.find((x) => x.id === h.vendorId);
                  return (
                    <SelectItem key={h.id} value={h.id}>
                      {h.purchaseNo} — {v?.vendorName ?? h.supplierName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Return Date</Label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        {selectedHeader && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Select item to return:
            </p>
            <div className="max-h-[200px] overflow-auto rounded-md border border-border">
              <table className="w-full text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Brand</th>
                    <th className="p-2 text-right">Purchased Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {headerItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-t border-border ${
                        selectedItemIdx === idx ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-2 font-medium">{item.itemName}</td>
                      <td className="p-2 text-muted-foreground">
                        {item.brand} · {item.model}
                      </td>
                      <td className="p-2 text-right">{item.qty}</td>
                      <td className="p-2 text-right">{money(item.rate)}</td>
                      <td className="p-2 text-right font-medium">
                        {money(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          size="sm"
                          variant={
                            selectedItemIdx === idx ? "default" : "outline"
                          }
                          className="h-9 text-xs"
                          onClick={() => handleReturnClick(idx)}
                        >
                          <RotateCcw className="mr-1 size-3" /> Return
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {headerItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No items found for this purchase.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedItemIdxResolved !== null && selectedItem && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Lot & IMEI Details:
            </p>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <Label className="text-xs sm:text-sm">Lot</Label>
                <Select
                  value={selectedLotId}
                  onValueChange={handleLotChange}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Select lot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {itemStockLots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.lotNo} — {lot.qty} units @{" "}
                        {money(lot.purchasePrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {itemImeis.length > 0 && (
                <div>
                  <Label className="text-xs sm:text-sm">IMEI</Label>
                  <Select
                    value={selectedImei}
                    onValueChange={setSelectedImei}
                  >
                    <SelectTrigger className="h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Select IMEI..." />
                    </SelectTrigger>
                    <SelectContent>
                      {itemImeis.map((imei) => (
                        <SelectItem key={imei.id} value={imei.imei}>
                          {imei.imei}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {itemImeis.length === 0 && (
                <div>
                  <Label className="text-xs sm:text-sm">
                    IMEI (optional)
                  </Label>
                  <Input
                    value={selectedImei}
                    onChange={(e) => setSelectedImei(e.target.value)}
                    placeholder="Enter IMEI..."
                    className="h-9 text-xs sm:text-sm"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs sm:text-sm">Return Qty</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedItem.qty}
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
                  onChange={(e) =>
                    setRefundAmount(Number(e.target.value))
                  }
                  className="h-9 text-xs sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs sm:text-sm">
                Return Reason *
              </Label>
              <Textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Describe the reason for return..."
                className="h-16 text-xs sm:text-sm mt-1"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handleReturn}
                disabled={saving}
                className="text-xs sm:text-sm"
              >
                {saving ? "Processing..." : "Process Return"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
              Return History ({purchaseReturns.length})
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="text-xs sm:text-sm"
            >
              <Download className="mr-1 size-3.5 sm:size-4" /> Export
            </Button>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[800px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Return No</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Purchase No</th>
                <th className="p-2.5">Vendor</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Lot</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Refund</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseReturns.map((r) => {
                const vendor = vendors.find((v) => v.id === r.vendorId);
                const lot = stockLots.find((l) => l.id === r.lotId);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-2.5 font-mono font-medium">
                      {r.returnNo}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      {r.returnDate}
                    </td>
                    <td className="p-2.5 font-mono">
                      {r.originalPurchaseNo}
                    </td>
                    <td className="p-2.5">
                      {vendor?.vendorName ?? "-"}
                    </td>
                    <td className="p-2.5">{r.itemName}</td>
                    <td className="p-2.5 text-muted-foreground">
                      {lot?.lotNo ?? "-"}
                    </td>
                    <td className="p-2.5 text-right">{r.qty}</td>
                    <td className="p-2.5 text-right font-medium">
                      {money(r.refundAmount)}
                    </td>
                    <td className="p-2.5">
                      <Badge
                        variant={
                          r.status === "COMPLETED"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {purchaseReturns.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-6 text-center text-muted-foreground"
                  >
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
