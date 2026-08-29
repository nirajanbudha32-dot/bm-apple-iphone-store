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
    <th>Source Code</th>
    <th>Dest Code</th>
    <th class="text-right" style="width:60px">Qty</th>
    <th class="text-right" style="width:80px">Rate</th>
    <th class="text-right" style="width:90px">IMEI</th>
  </tr></thead>
  <tbody>
  ${items.map((it, i) => `<tr>
    <td class="text-center">${i + 1}</td>
    <td>${esc(it.destItemName || it.itemName)}</td>
    <td>${esc(it.itemCode)}</td>
    <td>${esc(it.destItemCode || it.itemCode)}</td>
    <td class="text-right">${it.qty}</td>
    <td class="text-right">${money(it.purchasePrice)}</td>
    <td class="text-right" style="font-family:monospace;font-size:10px">${esc(it.imei || "-")}</td>
  </tr>`).join("")}
  </tbody>
</table>
<div class="signatures">
  <div class="sig-box"><div class="sig-line">Prepared By<div class="sig-sub">Admin</div></div></div>
  <div class="sig-box"><div class="sig-line">Received By<div class="sig-sub">${esc(toName)}</div></div></div>
</div>
<div class="footer"><div class="footer-note">Internal Transfer Note — ${esc(LOCATION_LABELS[transfer.fromStoreId ?? ""] || "BM Apple iPhone Store")}</div></div>
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
