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

const ALL_LOCATIONS = [
  { id: WAREHOUSE_ID, name: "Warehouse" },
  { id: "a0000000-0000-0000-0000-000000000001", name: "BM Apple Iphone Store" },
  { id: "a0000000-0000-0000-0000-000000000002", name: "BM Iphone Store" },
  { id: "a0000000-0000-0000-0000-000000000003", name: "BM Electronic" },
];

type TransferDraftItem = {
  itemName: string;
  itemCode: string;
  destItemName: string;
  destItemCode: string;
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
  const { stockLots, stock } = useStore();
  const [fromStoreId, setFromStoreId] = useState(WAREHOUSE_ID);
  const [toStoreId, setToStoreId] = useState("a0000000-0000-0000-0000-000000000001");
  const [remarks, setRemarks] = useState("");
  const [draftItems, setDraftItems] = useState<TransferDraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [itemNameSearch, setItemNameSearch] = useState("");
  const [selectedLotId, setSelectedLotId] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [transferImei, setTransferImei] = useState("");
  const [destItemSearch, setDestItemSearch] = useState("");
  const [selectedDestItemCode, setSelectedDestItemCode] = useState("");
  const [selectedDestItemName, setSelectedDestItemName] = useState("");
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [historyItems, setHistoryItems] = useState<Record<string, StockTransferItem[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  const availableLots = useMemo(() => {
    const sourceLots = stockLots.filter(
      (l) => l.storeId === fromStoreId && l.qty > 0
    );
    if (!itemNameSearch.trim()) return sourceLots.slice(0, 50);
    const t = itemNameSearch.trim().toLowerCase();
    return sourceLots.filter(
      (l) => l.itemName.toLowerCase().includes(t) || l.itemCode.toLowerCase().includes(t)
    );
  }, [stockLots, itemNameSearch, fromStoreId]);

  const selectedLot = useMemo(
    () => stockLots.find((l) => l.id === selectedLotId),
    [stockLots, selectedLotId]
  );

  const destItems = useMemo(() => {
    const items = stock.filter((s) => s.storeId === toStoreId);
    if (!destItemSearch.trim()) return items.slice(0, 30);
    const t = destItemSearch.trim().toLowerCase();
    return items.filter((s) => s.name.toLowerCase().includes(t) || s.code.toLowerCase().includes(t));
  }, [stock, toStoreId, destItemSearch]);

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
        destItemName: selectedDestItemName || selectedLot.itemName,
        destItemCode: selectedDestItemCode || selectedLot.itemCode,
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
    setDestItemSearch("");
    setSelectedDestItemCode("");
    setSelectedDestItemName("");
  }

  function removeDraftItem(idx: number) {
    setDraftItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleTransfer() {
    if (fromStoreId === toStoreId) {
      toast.error("Source and destination must be different");
      return;
    }
    if (draftItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    const result = await createTransfer(
      fromStoreId,
      toStoreId,
      draftItems.map((d) => ({
        itemCode: d.itemCode,
        itemName: d.itemName,
        destItemCode: d.destItemCode,
        destItemName: d.destItemName,
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
    setTransfers(t);
    const itemsMap: Record<string, StockTransferItem[]> = {};
    for (const tr of t) {
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
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; background: #eceeef; margin: 0; padding: 24px; color: #111; }
  .sheet { max-width: 850px; margin: 0 auto; background: #fff; padding: 40px 55px; }
  .company-header { display: flex; align-items: center; gap: 18px; justify-content: center; text-align: center; }
  .company-header .logo { width: 64px; height: 64px; border-radius: 50%; border: 1px solid #999; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
  .company-header .logo img { width: 100%; height: 100%; object-fit: cover; }
  .company-header .company-text h1 { margin: 0; font-size: 26px; text-decoration: underline; font-weight: bold; }
  .company-header .company-text p { margin: 4px 0 0; font-size: 13px; }
  .doc-title { text-align: center; font-size: 17px; font-weight: bold; margin: 22px 0 18px; }
  .meta { display: flex; justify-content: space-between; font-size: 13.5px; gap: 30px; }
  .meta table { border-collapse: collapse; }
  .meta td { padding: 1.5px 6px 1.5px 0; vertical-align: top; }
  .meta td.label { font-weight: normal; white-space: nowrap; }
  .meta td.colon { padding: 0 6px; }
  .meta td.value { font-weight: bold; }
  table.items { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-top: 26px; }
  table.items th, table.items td { border: 1px solid #333; padding: 7px 10px; }
  table.items th { text-align: left; font-weight: bold; }
  table.items th.num, table.items td.num { text-align: right; }
  table.items td.center, table.items th.center { text-align: center; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 60px; font-size: 13.5px; }
  .sign-row .field { width: 300px; }
  .sign-row .field .line { border-bottom: 1px solid #333; display: inline-block; min-width: 180px; }
  .footnote { margin-top: 30px; font-size: 12.5px; font-style: italic; }
  @media print { body { background: #fff; padding: 0; } .sheet { max-width: 100%; padding: 0; } }
</style></head><body>
<div class="sheet">
  <div class="company-header">
    <div class="logo"><img src="/bm-logo.jpeg" alt="BM Logo" /></div>
    <div class="company-text">
      <h1>B.M. Electronics</h1>
      <p>Birendranagar, Surkhet, Nepal</p>
      <p>Ph. No.: 9767510622</p>
    </div>
  </div>
  <div class="doc-title">STOCK TRANSFER NOTE</div>
  <div class="meta">
    <div class="meta-col">
      <table>
        <tr><td class="label">Transfer No</td><td class="colon">:</td><td class="value">${esc(transfer.transferNo)}</td></tr>
        <tr><td class="label">Date</td><td class="colon">:</td><td class="value">${esc(transfer.date)}</td></tr>
        <tr><td class="label">Status</td><td class="colon">:</td><td class="value">${esc(transfer.status)}</td></tr>
      </table>
    </div>
    <div class="meta-col">
      <table>
        <tr><td class="label">From</td><td class="colon">:</td><td class="value">${esc(fromName)}</td></tr>
        <tr><td class="label">To</td><td class="colon">:</td><td class="value">${esc(toName)}</td></tr>
        ${transfer.remarks ? `<tr><td class="label">Remarks</td><td class="colon">:</td><td class="value">${esc(transfer.remarks)}</td></tr>` : ""}
      </table>
    </div>
  </div>
  <table class="items">
    <thead><tr>
      <th class="center" style="width:6%">Sn</th>
      <th>Item</th>
      <th>Source Code</th>
      <th>Dest Code</th>
      <th class="num" style="width:10%">Qty</th>
      <th class="num" style="width:15%">Rate</th>
      <th class="num" style="width:18%">IMEI</th>
    </tr></thead>
    <tbody>
    ${items.map((it, i) => `<tr>
      <td class="center">${i + 1}</td>
      <td>${esc(it.destItemName || it.itemName)}</td>
      <td>${esc(it.itemCode)}</td>
      <td>${esc(it.destItemCode || it.itemCode)}</td>
      <td class="num">${it.qty}</td>
      <td class="num">${money(it.purchasePrice)}</td>
      <td class="num" style="font-family:monospace;font-size:11px">${esc(it.imei || "-")}</td>
    </tr>`).join("")}
    </tbody>
  </table>
  <div class="sign-row">
    <div class="field">Dispatched By: <span class="line">&nbsp;</span></div>
    <div class="field" style="text-align:right">Received By: <span class="line">&nbsp;</span></div>
  </div>
  <p class="footnote">Internal Transfer Note — Warehouse Dispatch. This is a computer-generated document.</p>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
    w.document.close();
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Stock Transfer</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div>
            <Label className="text-xs sm:text-sm">From *</Label>
            <Select value={fromStoreId} onValueChange={(v) => { setFromStoreId(v); setItemNameSearch(""); setSelectedLotId(""); setDraftItems([]); }}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_LOCATIONS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">To *</Label>
            <Select value={toStoreId} onValueChange={setToStoreId}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_LOCATIONS.filter((l) => l.id !== fromStoreId).map((l) => (
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Item</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-12">
            <div className="relative sm:col-span-3">
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
            <div className="relative sm:col-span-3">
              <Label className="text-xs sm:text-sm">Dest. Item (optional)</Label>
              <Input
                value={destItemSearch}
                onChange={(e) => { setDestItemSearch(e.target.value); setSelectedDestItemCode(""); setSelectedDestItemName(""); }}
                placeholder="Map to dest item..."
                className="h-9 text-xs sm:text-sm"
                disabled={!selectedLotId}
              />
              {destItemSearch && !selectedDestItemCode && destItems.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                  {destItems.map((s) => (
                    <li key={s.code}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() => { setSelectedDestItemCode(s.code); setSelectedDestItemName(s.name); setDestItemSearch(`${s.code} - ${s.name}`); }}
                      >
                        <span className="font-mono text-primary">{s.code}</span>
                        <span className="ml-1 font-medium">{s.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedLotId && !selectedDestItemCode && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Blank = use source code</p>
              )}
            </div>
            <div className="sm:col-span-2">
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
            <div className="sm:col-span-2">
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
              <table className="w-full min-w-[700px] text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Item (Source)</th>
                    <th className="p-2">Item (Dest)</th>
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
                      <td className="p-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{d.itemCode}</span>
                        <span className="ml-1 font-medium text-[11px]">{d.itemName}</span>
                      </td>
                      <td className="p-2">
                        <span className="font-mono text-[11px] text-primary">{d.destItemCode}</span>
                        <span className="ml-1 font-medium text-[11px]">{d.destItemName}</span>
                      </td>
                      <td className="p-2 text-muted-foreground">{d.lotNo}</td>
                      <td className="p-2 text-right font-semibold">{d.qty}</td>
                      <td className="p-2 text-right">{money(d.purchasePrice)}</td>
                      <td className="p-2 font-mono text-[11px]">{d.imei || "-"}</td>
                      <td className="p-2 text-right">
                        <Button size="icon" variant="ghost" onClick={() => removeDraftItem(idx)} className="h-9 w-9">
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
                {saving ? "Transferring..." : `Transfer ${draftItems.length} Item(s)`}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="p-3 sm:p-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Transfer History</p>
        </div>
        <div className="max-h-[40vh] overflow-auto">
          <table className="w-full min-w-[600px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-2.5">Transfer No</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">From</th>
                <th className="p-2.5">To</th>
                <th className="p-2.5">Items</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => {
                const items = historyItems[t.id] || [];
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="p-2.5 font-mono font-medium">{t.transferNo}</td>
                    <td className="p-2.5 whitespace-nowrap">{t.date}</td>
                    <td className="p-2.5">{LOCATION_LABELS[t.fromStoreId ?? ""] || "Unknown"}</td>
                    <td className="p-2.5">{LOCATION_LABELS[t.toStoreId ?? ""] || "Unknown"}</td>
                    <td className="p-2.5">{items.length} item(s)</td>
                    <td className="p-2.5">
                      <Badge variant={t.status === "COMPLETED" ? "outline" : "destructive"} className="text-[10px]">
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => printTransferNote(t, items)} className="h-9 w-9" title="Print">
                          <Printer className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} className="h-9 w-9" title="Delete">
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
