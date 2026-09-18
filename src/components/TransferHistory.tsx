import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Printer, ArrowDownRight, ArrowUpRight, Plus, Trash2, ArrowRightLeft } from "lucide-react";
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
  getStoreStock,
  useStore,
  WAREHOUSE_ID,
  LOCATION_LABELS,
  type StockTransfer,
  type StockTransferItem,
} from "@/lib/store";
import { useStoreContext } from "@/lib/store-context";
import { exportRows } from "@/lib/excel";
import { money } from "@/lib/utils";

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

export function TransferHistory() {
  const { currentStoreId, isAdmin } = useStoreContext();
  const { stockLots, stock } = useStore();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, StockTransferItem[]>>({});
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [fromStoreId, setFromStoreId] = useState(currentStoreId || WAREHOUSE_ID);
  const [toStoreId, setToStoreId] = useState("");
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
  const [destOpen, setDestOpen] = useState(false);

  const myStoreId = currentStoreId || null;
  const canCreateTransfer = myStoreId !== null || isAdmin;

  const otherStores = useMemo(
    () => ALL_LOCATIONS.filter((l) => l.id !== fromStoreId),
    [fromStoreId]
  );

  useEffect(() => {
    if (myStoreId && !toStoreId) {
      const firstOther = ALL_LOCATIONS.find((l) => l.id !== myStoreId);
      if (firstOther) setToStoreId(firstOther.id);
    }
  }, [myStoreId]);

  useEffect(() => {
    if (myStoreId) setFromStoreId(myStoreId);
  }, [myStoreId]);

  const availableLots = useMemo(() => {
    const sourceLots = stockLots.filter((l) => l.storeId === fromStoreId && l.qty > 0);
    if (!itemNameSearch.trim()) return sourceLots.slice(0, 50);
    const t = itemNameSearch.trim().toLowerCase();
    return sourceLots.filter((l) => l.itemName.toLowerCase().includes(t) || l.itemCode.toLowerCase().includes(t));
  }, [stockLots, itemNameSearch, fromStoreId]);

  const selectedLot = useMemo(() => stockLots.find((l) => l.id === selectedLotId), [stockLots, selectedLotId]);

  // Fetch destination store stock via RPC (bypasses RLS for salesmen)
  const [destStoreItems, setDestStoreItems] = useState<{ code: string; name: string }[]>([]);
  const loadDestStock = useCallback(async (storeId: string) => {
    if (!storeId) return;
    const items = await getStoreStock(storeId);
    setDestStoreItems(items);
  }, []);
  useEffect(() => { loadDestStock(toStoreId); }, [toStoreId, loadDestStock]);

  const destItems = useMemo(() => {
    if (!destItemSearch.trim()) return destStoreItems.slice(0, 30);
    const t = destItemSearch.trim().toLowerCase();
    return destStoreItems.filter((s) => s.name.toLowerCase().includes(t) || s.code.toLowerCase().includes(t));
  }, [destStoreItems, destItemSearch]);

  async function loadTransfers() {
    setLoading(true);
    try {
      const all = await getTransfers();
      const filtered = all.filter((t) => {
        if (currentStoreId) return t.fromStoreId === currentStoreId || t.toStoreId === currentStoreId;
        return true;
      });
      setTransfers(filtered);
      const map: Record<string, StockTransferItem[]> = {};
      for (const t of filtered) {
        map[t.id] = await getTransferItems(t.id);
      }
      setItemsMap(map);
    } catch (err) {
      console.error("[TransferHistory] load failed:", err);
      toast.error("Failed to load transfers");
    }
    setLoading(false);
  }

  useEffect(() => { loadTransfers(); }, [currentStoreId]);

  const incoming = useMemo(() => currentStoreId ? transfers.filter((t) => t.toStoreId === currentStoreId) : transfers, [transfers, currentStoreId]);
  const outgoing = useMemo(() => currentStoreId ? transfers.filter((t) => t.fromStoreId === currentStoreId) : transfers, [transfers, currentStoreId]);

  const filtered = useMemo(() => {
    let rows = tab === "incoming" ? incoming : tab === "outgoing" ? outgoing : transfers;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      rows = rows.filter((r) =>
        r.transferNo.toLowerCase().includes(t) ||
        (LOCATION_LABELS[r.fromStoreId ?? ""] || "").toLowerCase().includes(t) ||
        (LOCATION_LABELS[r.toStoreId ?? ""] || "").toLowerCase().includes(t)
      );
    }
    return rows;
  }, [transfers, incoming, outgoing, tab, q]);

  function addLotToTransfer() {
    if (!selectedLot) { toast.error("Select a lot first"); return; }
    if (transferQty <= 0 || transferQty > selectedLot.qty) { toast.error(`Qty must be 1-${selectedLot.qty}`); return; }
    if (draftItems.find((d) => d.lotId === selectedLot.id)) { toast.error("This lot is already in the transfer"); return; }
    setDraftItems((prev) => [...prev, {
      itemName: selectedLot.itemName, itemCode: selectedLot.itemCode,
      destItemName: selectedDestItemName || selectedLot.itemName, destItemCode: selectedDestItemCode || selectedLot.itemCode,
      lotId: selectedLot.id, lotNo: selectedLot.lotNo, qty: transferQty, maxQty: selectedLot.qty,
      imei: transferImei.trim(), purchasePrice: selectedLot.purchasePrice,
    }]);
    setItemNameSearch(""); setSelectedLotId(""); setTransferQty(1); setTransferImei("");
    setDestItemSearch(""); setSelectedDestItemCode(""); setSelectedDestItemName("");
  }

  function removeDraftItem(idx: number) { setDraftItems((prev) => prev.filter((_, i) => i !== idx)); }

  async function handleTransfer() {
    if (fromStoreId === toStoreId) { toast.error("Source and destination must be different"); return; }
    if (draftItems.length === 0) { toast.error("Add at least one item"); return; }
    setSaving(true);
    const result = await createTransfer(fromStoreId, toStoreId,
      draftItems.map((d) => ({
        itemCode: d.itemCode, itemName: d.itemName, destItemCode: d.destItemCode, destItemName: d.destItemName,
        lotId: d.lotId, qty: d.qty, ...(d.imei ? { imei: d.imei } : {}), purchasePrice: d.purchasePrice,
      })), remarks.trim());
    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${result.transferNo} created successfully`);
    setDraftItems([]); setRemarks(""); setShowForm(false);
    loadTransfers();
  }

  async function handleDelete(transferId: string) {
    if (!window.confirm("Delete this transfer? Stock will be reversed.")) return;
    const result = await deleteTransfer(transferId);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Transfer deleted and stock reversed");
    loadTransfers();
  }

  function printNote(t: StockTransfer, items: StockTransferItem[]) {
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;
    const fromName = LOCATION_LABELS[t.fromStoreId ?? ""] || "Unknown";
    const toName = LOCATION_LABELS[t.toStoreId ?? ""] || "Unknown";
    w.document.write(`<!DOCTYPE html><html><head><title>Transfer ${esc(t.transferNo)}</title>
<style>
  body{font-family:Arial,sans-serif;padding:20px;font-size:13px;color:#222}
  h2{margin:0 0 4px;font-size:16px}table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px}
  th{background:#f3f4f6}.meta{color:#555;font-size:12px}.footnote{margin-top:16px;font-size:11px;color:#888}
</style></head><body>
<h2>${esc(t.transferNo)} — Internal Transfer Note</h2>
<p class="meta">Date: ${esc(t.date)} | Status: ${esc(t.status)}${t.remarks ? ` | Remarks: ${esc(t.remarks)}` : ""}</p>
<table><thead><tr><th>#</th><th>Item</th><th>Code</th><th>Qty</th><th>Rate</th><th>Amount</th><th>IMEI</th></tr></thead><tbody>
${items.map((it, i) => `<tr><td>${i + 1}</td><td>${esc(it.itemName)}</td><td>${esc(it.itemCode)}</td><td>${it.qty}</td><td>${money(it.purchasePrice)}</td><td>${money(it.qty * it.purchasePrice)}</td><td>${esc(it.imei || "")}</td></tr>`).join("")}
</tbody></table>
<p class="meta" style="margin-top:10px"><strong>From:</strong> ${esc(fromName)} → <strong>To:</strong> ${esc(toName)}</p>
<p class="footnote">Internal Transfer Note — ${esc(fromName)}</p>
<script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
  }

  function onExport() {
    const rows: any[] = [];
    for (const t of filtered) {
      const items = itemsMap[t.id] || [];
      for (const it of items) {
        rows.push({
          "Transfer No": t.transferNo, Date: t.date,
          From: LOCATION_LABELS[t.fromStoreId ?? ""] || "Unknown",
          To: LOCATION_LABELS[t.toStoreId ?? ""] || "Unknown",
          "Item Code": it.itemCode, Item: it.itemName, Qty: it.qty,
          Rate: it.purchasePrice, Amount: it.qty * it.purchasePrice,
          IMEI: it.imei || "", Status: t.status,
        });
      }
    }
    if (rows.length === 0) { toast.error("No data to export"); return; }
    exportRows(rows, "Transfer History", `TransferHistory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground text-sm">Loading transfers...</p></div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {canCreateTransfer && (
        <Card className="p-3 sm:p-4">
          {!showForm ? (
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground">Transfer stock from your store to another store</p>
              <Button size="sm" onClick={() => setShowForm(true)} className="h-8 text-xs sm:text-sm">
                <ArrowRightLeft className="mr-1 size-3.5" /> New Transfer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Stock Transfer</p>
                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setDraftItems([]); }} className="h-7 text-xs">Cancel</Button>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <div>
                  <Label className="text-xs sm:text-sm">From *</Label>
                  <Select value={fromStoreId} onValueChange={(v) => { setFromStoreId(v); setItemNameSearch(""); setSelectedLotId(""); setDraftItems([]); }} disabled={!isAdmin}>
                    <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_LOCATIONS.filter((l) => !isAdmin ? l.id === myStoreId : true).map((l) => (
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
                      {otherStores.map((l) => (
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

              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Item</p>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-12">
                  <div className="relative sm:col-span-3">
                    <Label className="text-xs sm:text-sm">Search Item</Label>
                    <Input value={itemNameSearch} onChange={(e) => { setItemNameSearch(e.target.value); setSelectedLotId(""); }} placeholder="Type item name..." className="h-9 text-xs sm:text-sm" />
                    {itemNameSearch && !selectedLotId && availableLots.length > 0 && (
                      <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                        {availableLots.map((l) => (
                          <li key={l.id}>
                            <button type="button" className="w-full px-3 py-2 text-left text-xs hover:bg-accent"
                              onClick={() => { setSelectedLotId(l.id); setItemNameSearch(l.itemName); setTransferQty(1); }}>
                              <span className="font-medium">{l.itemName}</span>
                              <span className="block text-[11px] text-muted-foreground">{l.lotNo} — Qty: {l.qty} — Rate: {money(l.purchasePrice)}</span>
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
                      onFocus={() => setDestOpen(true)}
                      onBlur={() => setTimeout(() => setDestOpen(false), 250)}
                      placeholder="Map to dest item..."
                      className="h-9 text-xs sm:text-sm"
                      disabled={!selectedLotId}
                    />
                    {destOpen && !selectedDestItemCode && destItems.length > 0 && (
                      <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                        {destItems.map((s) => (
                          <li key={s.code}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-xs hover:bg-accent"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedDestItemCode(s.code);
                                setSelectedDestItemName(s.name);
                                setDestItemSearch(`${s.code} - ${s.name}`);
                                setDestOpen(false);
                              }}
                            >
                              <span className="font-mono text-primary">{s.code}</span>
                              <span className="ml-1 font-medium">{s.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {selectedLotId && !selectedDestItemCode && <p className="text-[10px] text-muted-foreground mt-0.5">Blank = use source code</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs sm:text-sm">Qty</Label>
                    <Input type="number" min="1" max={selectedLot?.qty || 1} value={transferQty}
                      onChange={(e) => setTransferQty(Number(e.target.value))} className="h-9 text-xs sm:text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs sm:text-sm">IMEI (optional)</Label>
                    <Input value={transferImei} onChange={(e) => setTransferImei(e.target.value)} placeholder="15-digit IMEI" maxLength={15} className="h-9 text-xs sm:text-sm font-mono" />
                  </div>
                  <div className="flex items-end sm:col-span-2">
                    <Button onClick={addLotToTransfer} className="h-9 w-full text-xs sm:text-sm"><Plus className="mr-1 size-3.5" /> Add</Button>
                  </div>
                </div>
              </div>

              {draftItems.length > 0 && (
                <div className="mt-2">
                  <div className="max-h-[30vh] overflow-auto rounded-md border border-border">
                    <table className="w-full min-w-[600px] text-xs sm:text-sm">
                      <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Item (Source)</th>
                          <th className="p-2">Item (Dest)</th>
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
                            <td className="p-2"><span className="font-mono text-[11px] text-muted-foreground">{d.itemCode}</span> <span className="ml-1 font-medium text-[11px]">{d.itemName}</span></td>
                            <td className="p-2"><span className="font-mono text-[11px] text-primary">{d.destItemCode}</span> <span className="ml-1 font-medium text-[11px]">{d.destItemName}</span></td>
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
                      {saving ? "Transferring..." : `Transfer ${draftItems.length} Item(s)`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Transfer no, store name..." className="h-9 text-xs" /></div>
          <div className="flex items-end"><ExportBtn onExport={onExport} /></div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-9 w-full overflow-x-auto p-0.5 sm:w-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">All ({transfers.length})</TabsTrigger>
          <TabsTrigger value="incoming" className="text-xs sm:text-sm px-2 sm:px-3"><ArrowDownRight className="mr-1 size-3" /> Incoming ({incoming.length})</TabsTrigger>
          <TabsTrigger value="outgoing" className="text-xs sm:text-sm px-2 sm:px-3"><ArrowUpRight className="mr-1 size-3" /> Outgoing ({outgoing.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {filtered.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-sm text-muted-foreground">No transfers found.</p></Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                    <tr>
                      <th className="p-2.5 text-left">Transfer No</th>
                      <th className="p-2.5 text-left">Date</th>
                      <th className="p-2.5 text-left">From</th>
                      <th className="p-2.5 text-left">To</th>
                      <th className="p-2.5 text-left">Items</th>
                      <th className="p-2.5 text-right">Value</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => {
                      const items = itemsMap[t.id] || [];
                      const totalValue = items.reduce((a, it) => a + it.qty * it.purchasePrice, 0);
                      const totalQty = items.reduce((a, it) => a + it.qty, 0);
                      return (
                        <tr key={t.id} className="border-t border-border">
                          <td className="p-2.5 font-mono font-medium">{t.transferNo}</td>
                          <td className="p-2.5 whitespace-nowrap">{t.date}</td>
                          <td className="p-2.5">{LOCATION_LABELS[t.fromStoreId ?? ""] || "Unknown"}</td>
                          <td className="p-2.5">{LOCATION_LABELS[t.toStoreId ?? ""] || "Unknown"}</td>
                          <td className="p-2.5">
                            <div className="space-y-0.5">
                              {items.map((it) => (
                                <div key={it.id} className="text-[11px]">
                                  <span className="font-medium">{it.itemName}</span>
                                  <span className="text-muted-foreground"> — {it.qty} pcs</span>
                                  {it.imei && <span className="text-muted-foreground"> ({it.imei})</span>}
                                </div>
                              ))}
                              {items.length === 0 && <span className="text-muted-foreground">—</span>}
                            </div>
                          </td>
                          <td className="p-2.5 text-right">{money(totalValue)}<br /><span className="text-[10px] text-muted-foreground">{totalQty} units</span></td>
                          <td className="p-2.5 text-center">
                            <Badge variant={t.status === "COMPLETED" ? "outline" : "destructive"} className="text-[10px]">{t.status}</Badge>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => printNote(t, items)} className="h-8 w-8" title="Print">
                                <Printer className="size-3.5" />
                              </Button>
                              {(isAdmin || t.fromStoreId === currentStoreId) && (
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} className="h-8 w-8" title="Delete">
                                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExportBtn({ onExport }: { onExport: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onExport} className="h-9 text-xs sm:text-sm">
      <Download className="mr-1 size-3.5 sm:size-4" /> Export
    </Button>
  );
}
