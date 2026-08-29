import { useEffect, useMemo, useState } from "react";
import { Download, Trash2, Plus, Printer, ArrowRightLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTransfer,
  deleteTransfer,
  getTransfers,
  getTransferItems,
  useStore,
  WAREHOUSE_ID,
  LOCATION_LABELS,
  type StockTransfer,
  type StockTransferItem,
} from "@/lib/store";
import { money } from "@/lib/utils";
import { exportRows } from "@/lib/excel";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const STORE_LOCATIONS = [
  { id: "a0000000-0000-0000-0000-000000000001", name: "BM Apple Iphone Store" },
  { id: "a0000000-0000-0000-0000-000000000002", name: "BM Iphone Store" },
  { id: "a0000000-0000-0000-0000-000000000003", name: "BM Electronic" },
];

type TransferDraftItem = {
  itemName: string;
  itemCode: string;
  lotId: string;
  lotNo: string;
  qty: number;
  maxQty: number;
  imei: string;
  purchasePrice: number;
};

export function WarehouseView() {
  const { stockLots } = useStore();
  const [subTab, setSubTab] = useState("stock");
  const [q, setQ] = useState("");

  const warehouseStock = useMemo(() => {
    const lotMap = new Map<string, { itemName: string; itemCode: string; totalQty: number; purchasePrice: number; lotCount: number }>();
    for (const lot of stockLots) {
      if (lot.storeId !== WAREHOUSE_ID || lot.qty <= 0) continue;
      const key = lot.itemName;
      const existing = lotMap.get(key);
      if (existing) {
        existing.totalQty += lot.qty;
        existing.lotCount += 1;
      } else {
        lotMap.set(key, {
          itemName: lot.itemName,
          itemCode: lot.itemCode,
          totalQty: lot.qty,
          purchasePrice: lot.purchasePrice,
          lotCount: 1,
        });
      }
    }
    let items = Array.from(lotMap.values());
    const t = q.trim().toLowerCase();
    if (t) {
      items = items.filter((i) =>
        i.itemName.toLowerCase().includes(t) || i.itemCode.toLowerCase().includes(t)
      );
    }
    return items;
  }, [stockLots, q]);

  const totalItems = warehouseStock.length;
  const totalQty = warehouseStock.reduce((a, i) => a + i.totalQty, 0);
  const totalValue = warehouseStock.reduce((a, i) => a + i.totalQty * i.purchasePrice, 0);

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <h2 className="text-sm font-semibold sm:text-base">Warehouse Stock</h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{totalItems}</strong> items</span>
            <span><strong className="text-foreground">{totalQty}</strong> units</span>
            <span>Value: <strong className="text-foreground">{money(totalValue)}</strong></span>
          </div>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <div>
            <Label htmlFor="wh-search" className="text-xs sm:text-sm">Search</Label>
            <Input
              id="wh-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search items..."
              className="h-9 text-xs sm:text-sm"
            />
          </div>
        </div>
      </Card>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="stock" className="text-xs sm:text-sm">
            <Package className="mr-1.5 size-3.5 sm:size-4" /> Stock
          </TabsTrigger>
          <TabsTrigger value="transfer" className="text-xs sm:text-sm">
            <ArrowRightLeft className="mr-1.5 size-3.5 sm:size-4" /> Transfer to Store
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <WarehouseStockTable items={warehouseStock} />
        </TabsContent>

        <TabsContent value="transfer">
          <WarehouseTransferSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WarehouseStockTable({ items }: { items: { itemName: string; itemCode: string; totalQty: number; purchasePrice: number; lotCount: number }[] }) {
  function onExport() {
    if (items.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportRows(
      items.map((i) => ({
        "Item Code": i.itemCode,
        "Item Name": i.itemName,
        Qty: i.totalQty,
        "Purchase Price": i.purchasePrice,
        Value: i.totalQty * i.purchasePrice,
        Lots: i.lotCount,
      })),
      "Warehouse Stock",
      `BM_Warehouse_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Warehouse Items</p>
        <Button variant="outline" size="sm" onClick={onExport} className="h-8 text-xs">
          <Download className="mr-1 size-3.5" /> Export
        </Button>
      </div>
      <div className="max-h-[50vh] overflow-auto">
        <table className="w-full min-w-[500px] text-xs sm:text-sm">
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr>
              <th className="p-2.5 text-left">Item Code</th>
              <th className="p-2.5 text-left">Item Name</th>
              <th className="p-2.5 text-right">Qty</th>
              <th className="p-2.5 text-right">Purchase Price</th>
              <th className="p-2.5 text-right">Value</th>
              <th className="p-2.5 text-right">Lots</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.itemCode} className="border-t border-border">
                <td className="p-2.5 font-mono">{item.itemCode}</td>
                <td className="p-2.5 font-medium">{item.itemName}</td>
                <td className="p-2.5 text-right font-semibold">{item.totalQty}</td>
                <td className="p-2.5 text-right">{money(item.purchasePrice)}</td>
                <td className="p-2.5 text-right font-medium">{money(item.totalQty * item.purchasePrice)}</td>
                <td className="p-2.5 text-right text-muted-foreground">{item.lotCount}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No items in warehouse.
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="sticky bottom-0 bg-muted">
              <tr className="border-t border-border font-semibold">
                <td className="p-2.5" colSpan={2}>Total</td>
                <td className="p-2.5 text-right">{items.reduce((a, i) => a + i.totalQty, 0)}</td>
                <td className="p-2.5 text-right" colSpan={2}>{money(items.reduce((a, i) => a + i.totalQty * i.purchasePrice, 0))}</td>
                <td className="p-2.5 text-right">{items.reduce((a, i) => a + i.lotCount, 0)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}

function WarehouseTransferSection() {
  const { stockLots } = useStore();
  const [toStoreId, setToStoreId] = useState("a0000000-0000-0000-0000-000000000001");
  const [remarks, setRemarks] = useState("");
  const [draftItems, setDraftItems] = useState<TransferDraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [itemNameSearch, setItemNameSearch] = useState("");
  const [selectedLotId, setSelectedLotId] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [transferImei, setTransferImei] = useState("");
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [historyItems, setHistoryItems] = useState<Record<string, StockTransferItem[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  const availableLots = useMemo(() => {
    if (!itemNameSearch.trim()) return [];
    const t = itemNameSearch.trim().toLowerCase();
    return stockLots.filter(
      (l) => l.storeId === WAREHOUSE_ID && l.qty > 0 &&
        l.itemName.toLowerCase().includes(t)
    );
  }, [stockLots, itemNameSearch]);

  const selectedLot = useMemo(
    () => stockLots.find((l) => l.id === selectedLotId),
    [stockLots, selectedLotId]
  );

  function addLotToTransfer() {
    if (!selectedLot) {
      toast.error("Select a lot first");
      return;
    }
    if (transferQty <= 0 || transferQty > selectedLot.qty) {
      toast.error(`Qty must be 1-${selectedLot.qty}`);
      return;
    }
    const existing = draftItems.find((d) => d.lotId === selectedLot.id);
    if (existing) {
      toast.error("This lot is already in the transfer");
      return;
    }
    setDraftItems((prev) => [
      ...prev,
      {
        itemName: selectedLot.itemName,
        itemCode: selectedLot.itemCode,
        lotId: selectedLot.id,
        lotNo: selectedLot.lotNo,
        qty: transferQty,
        maxQty: selectedLot.qty,
        imei: transferImei.trim(),
        purchasePrice: selectedLot.purchasePrice,
      },
    ]);
    setItemNameSearch("");
    setSelectedLotId("");
    setTransferQty(1);
    setTransferImei("");
  }

  function removeDraftItem(idx: number) {
    setDraftItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleTransfer() {
    if (draftItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    const result = await createTransfer(
      WAREHOUSE_ID,
      toStoreId,
      draftItems.map((d) => ({
        itemCode: d.itemCode,
        itemName: d.itemName,
        lotId: d.lotId,
        qty: d.qty,
        ...(d.imei ? { imei: d.imei } : {}),
        purchasePrice: d.purchasePrice,
      })),
      remarks.trim()
    );
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.transferNo} created successfully`);
    setDraftItems([]);
    setRemarks("");
    loadHistory();
  }

  async function loadHistory() {
    setLoadingHistory(true);
    const t = await getTransfers();
    const warehouseTransfers = t.filter(
      (tr) => tr.fromStoreId === WAREHOUSE_ID || tr.toStoreId === WAREHOUSE_ID
    );
    setTransfers(warehouseTransfers);
    const itemsMap: Record<string, StockTransferItem[]> = {};
    for (const tr of warehouseTransfers) {
      itemsMap[tr.id] = await getTransferItems(tr.id);
    }
    setHistoryItems(itemsMap);
    setLoadingHistory(false);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleDelete(transferId: string) {
    if (!window.confirm("Delete this transfer? Stock will be reversed.")) return;
    const result = await deleteTransfer(transferId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Transfer deleted and stock reversed");
    loadHistory();
  }

  function printTransferNote(transfer: StockTransfer, items: StockTransferItem[]) {
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) { toast.error("Pop-up blocked"); return; }
    const fromName = LOCATION_LABELS[transfer.fromStoreId ?? ""] || "Unknown";
    const toName = LOCATION_LABELS[transfer.toStoreId ?? ""] || "Unknown";

    w.document.write(`<!DOCTYPE html>
<html><head><title>Transfer ${esc(transfer.transferNo)}</title>
<style>
  @page { margin: 15mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11.5px; color: #1f2937; padding: 30px 40px; line-height: 1.5; }
  .header { text-align: center; margin-bottom: 24px; }
  .title { font-size: 20px; font-weight: 700; color: #16a34a; }
  .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .bar { width: 60px; height: 3px; background: #16a34a; margin: 10px auto 0; border-radius: 2px; }
  .info-grid { display: flex; gap: 20px; margin-bottom: 20px; }
  .info-card { flex: 1; border: 1px solid #e5e7eb; border-left: 3px solid #16a34a; border-radius: 6px; padding: 12px 14px; background: #fafafa; }
  .info-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin-bottom: 6px; }
  .info-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
  .info-row .lbl { color: #6b7280; }
  .info-row .val { font-weight: 600; color: #111827; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
  thead th { background: #16a34a; color: #fff; font-weight: 600; font-size: 10.5px; text-transform: uppercase; padding: 9px 8px; text-align: left; }
  tbody td { padding: 7px 8px; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
  .sig-box { width: 200px; text-align: center; }
  .sig-line { border-top: 1px solid #374151; margin-top: 50px; padding-top: 6px; font-size: 11px; font-weight: 600; }
  .sig-sub { font-size: 9.5px; color: #6b7280; font-weight: 400; }
  .footer { text-align: center; padding-top: 16px; border-top: 2px solid #e5e7eb; margin-top: 20px; }
  .footer-note { font-size: 9.5px; color: #9ca3af; font-style: italic; }
  @media print { body { padding: 0; } }
</style></head><body>
<div class="header">
  <div class="title">STOCK TRANSFER NOTE</div>
  <div class="subtitle">${esc(transfer.transferNo)}</div>
  <div class="bar"></div>
</div>
<div class="info-grid">
  <div class="info-card">
    <div class="info-label">Transfer Details</div>
    <div class="info-row"><span class="lbl">Transfer No</span><span class="val">${esc(transfer.transferNo)}</span></div>
    <div class="info-row"><span class="lbl">Date</span><span class="val">${esc(transfer.date)}</span></div>
    <div class="info-row"><span class="lbl">Status</span><span class="val">${esc(transfer.status)}</span></div>
  </div>
  <div class="info-card">
    <div class="info-label">Locations</div>
    <div class="info-row"><span class="lbl">From</span><span class="val">${esc(fromName)}</span></div>
    <div class="info-row"><span class="lbl">To</span><span class="val">${esc(toName)}</span></div>
    ${transfer.remarks ? `<div class="info-row"><span class="lbl">Remarks</span><span class="val">${esc(transfer.remarks)}</span></div>` : ""}
  </div>
</div>
<table>
  <thead><tr>
    <th class="text-center" style="width:32px">#</th>
    <th>Item</th>
    <th>Code</th>
    <th class="text-right" style="width:60px">Qty</th>
    <th class="text-right" style="width:80px">Rate</th>
    <th class="text-right" style="width:90px">IMEI</th>
  </tr></thead>
  <tbody>
  ${items.map((it, i) => `<tr>
    <td class="text-center">${i + 1}</td>
    <td>${esc(it.itemName)}</td>
    <td>${esc(it.itemCode)}</td>
    <td class="text-right">${it.qty}</td>
    <td class="text-right">${money(it.purchasePrice)}</td>
    <td class="text-right" style="font-family:monospace;font-size:10px">${esc(it.imei || "-")}</td>
  </tr>`).join("")}
  </tbody>
</table>
<div class="signatures">
  <div class="sig-box"><div class="sig-line">Dispatched By<div class="sig-sub">Warehouse</div></div></div>
  <div class="sig-box"><div class="sig-line">Received By<div class="sig-sub">${esc(toName)}</div></div></div>
</div>
<div class="footer"><div class="footer-note">Internal Transfer Note — Warehouse Dispatch</div></div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
    w.document.close();
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Transfer from Warehouse</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <div>
            <Label className="text-xs sm:text-sm">To Store *</Label>
            <Select value={toStoreId} onValueChange={setToStoreId}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STORE_LOCATIONS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Remarks</Label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" className="h-9 text-xs sm:text-sm" />
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Item from Warehouse</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-12">
            <div className="relative sm:col-span-4">
              <Label className="text-xs sm:text-sm">Search Item</Label>
              <Input
                value={itemNameSearch}
                onChange={(e) => { setItemNameSearch(e.target.value); setSelectedLotId(""); }}
                placeholder="Type item name..."
                className="h-9 text-xs sm:text-sm"
              />
              {itemNameSearch && !selectedLotId && availableLots.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                  {availableLots.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() => { setSelectedLotId(l.id); setItemNameSearch(l.itemName); setTransferQty(1); }}
                      >
                        <span className="font-medium">{l.itemName}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {l.lotNo} — Qty: {l.qty} — Rate: {money(l.purchasePrice)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="sm:col-span-3">
              <Label className="text-xs sm:text-sm">Qty</Label>
              <Input
                type="number"
                min="1"
                max={selectedLot?.qty || 1}
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <Label className="text-xs sm:text-sm">IMEI (optional)</Label>
              <Input
                value={transferImei}
                onChange={(e) => setTransferImei(e.target.value)}
                placeholder="15-digit IMEI"
                maxLength={15}
                className="h-9 text-xs sm:text-sm font-mono"
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button onClick={addLotToTransfer} className="h-9 w-full text-xs sm:text-sm">
                <Plus className="mr-1 size-3.5" /> Add
              </Button>
            </div>
          </div>
        </div>

        {draftItems.length > 0 && (
          <div className="mt-3">
            <div className="max-h-[30vh] overflow-auto rounded-md border border-border">
              <table className="w-full min-w-[500px] text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Lot</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2">IMEI</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {draftItems.map((d, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 font-medium">{d.itemName}</td>
                      <td className="p-2 text-muted-foreground">{d.lotNo}</td>
                      <td className="p-2 text-right font-semibold">{d.qty}</td>
                      <td className="p-2 text-right">{money(d.purchasePrice)}</td>
                      <td className="p-2 font-mono text-[11px]">{d.imei || "-"}</td>
                      <td className="p-2 text-right">
                        <Button size="icon" variant="ghost" onClick={() => removeDraftItem(idx)} className="h-7 w-7">
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={handleTransfer} disabled={saving} className="px-6">
                {saving ? "Transferring..." : `Transfer ${draftItems.length} Item(s) to ${STORE_LOCATIONS.find(l => l.id === toStoreId)?.name || "Store"}`}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="p-3 sm:p-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Warehouse Transfer History</p>
        </div>
        <div className="max-h-[40vh] overflow-auto">
          <table className="w-full min-w-[600px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Transfer No</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Direction</th>
                <th className="p-2.5">Store</th>
                <th className="p-2.5">Items</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => {
                const items = historyItems[t.id] || [];
                const isOutgoing = t.fromStoreId === WAREHOUSE_ID;
                const otherStoreId = isOutgoing ? t.toStoreId : t.fromStoreId;
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="p-2.5 font-mono font-medium">{t.transferNo}</td>
                    <td className="p-2.5 whitespace-nowrap">{t.date}</td>
                    <td className="p-2.5">
                      <Badge variant={isOutgoing ? "default" : "secondary"} className="text-[10px]">
                        {isOutgoing ? "OUT" : "IN"}
                      </Badge>
                    </td>
                    <td className="p-2.5">{LOCATION_LABELS[otherStoreId ?? ""] || "Unknown"}</td>
                    <td className="p-2.5">{items.length} item(s)</td>
                    <td className="p-2.5">
                      <Badge variant={t.status === "COMPLETED" ? "outline" : "destructive"} className="text-[10px]">
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => printTransferNote(t, items)} className="h-7 w-7" title="Print">
                          <Printer className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} className="h-7 w-7" title="Delete">
                          <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    {loadingHistory ? "Loading..." : "No warehouse transfers yet."}
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
