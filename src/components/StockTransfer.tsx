import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  type StockLot,
} from "@/lib/store";
import { money, numberToWords } from "@/lib/utils";
import { useStoreContext } from "@/lib/store-context";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const ALL_LOCATIONS = [
  { id: WAREHOUSE_ID, name: "Warehouse (Central)" },
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

export function StockTransfer() {
  const { stockLots, stock } = useStore();
  const { isAdmin, currentStoreId } = useStoreContext();

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
    if (!itemNameSearch.trim()) return [];
    const t = itemNameSearch.trim().toLowerCase();
    return stockLots.filter(
      (l) => l.storeId === fromStoreId && l.qty > 0 &&
        l.itemName.toLowerCase().includes(t)
    );
  }, [stockLots, fromStoreId, itemNameSearch]);

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
    const filtered = isAdmin ? t : t.filter((tr) => tr.toStoreId === currentStoreId);
    setTransfers(filtered);
    const itemsMap: Record<string, StockTransferItem[]> = {};
    for (const tr of filtered) {
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
    <div class="field">Prepared By: <span class="line">&nbsp;</span></div>
    <div class="field" style="text-align:right">Received By: <span class="line">&nbsp;</span></div>
  </div>
  <p class="footnote">Internal Transfer Note — ${esc(LOCATION_LABELS[transfer.fromStoreId ?? ""] || "B.M. Electronics")}</p>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
    w.document.close();
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden p-0">
          <div className="p-3 sm:p-4 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Incoming Transfers</p>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full min-w-[600px] text-xs sm:text-sm">
              <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                <tr>
                  <th className="p-2.5">Transfer No</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">From</th>
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
                      <td className="p-2.5">
                        <div className="space-y-0.5">
                          {items.map((it) => (
                            <div key={it.id} className="text-[11px]">
                              <span className="font-medium">{it.itemName}</span>
                              <span className="text-muted-foreground"> — {it.qty} pcs</span>
                              {it.imei && <span className="text-muted-foreground"> ({it.imei})</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <Badge variant={t.status === "COMPLETED" ? "outline" : "destructive"} className="text-[10px]">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-right">
                        <Button size="icon" variant="ghost" onClick={() => printTransferNote(t, items)} className="h-9 w-9" title="Print">
                          <Printer className="size-3.5 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      {loadingHistory ? "Loading..." : "No incoming transfers."}
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

  return (
    <div className="space-y-4">
      {/* CREATE TRANSFER */}
      <Card className="p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Create Stock Transfer</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div>
            <Label className="text-xs sm:text-sm">From *</Label>
            <Select value={fromStoreId} onValueChange={(v) => { setFromStoreId(v); setItemNameSearch(""); setSelectedLotId(""); }}>
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

        {/* ITEM ENTRY */}
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Item from Source</p>
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

        {/* DRAFT ITEMS */}
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

      {/* TRANSFER HISTORY */}
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
                    {loadingHistory ? "Loading..." : "No transfers yet."}
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
