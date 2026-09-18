import { useEffect, useMemo, useState } from "react";
import { Download, Printer, ArrowRightLeft, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useStore, getTransfers, getTransferItems, LOCATION_LABELS, type StockTransfer, type StockTransferItem } from "@/lib/store";
import { useStoreContext } from "@/lib/store-context";
import { exportRows } from "@/lib/excel";
import { money } from "@/lib/utils";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function TransferHistory() {
  const { currentStoreId } = useStoreContext();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, StockTransferItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
    load();
  }, [currentStoreId]);

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

  function printNote(t: StockTransfer, items: StockTransferItem[]) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Transfer ${esc(t.transferNo)}</title>
<style>
  body{font-family:Arial,sans-serif;padding:20px;font-size:13px;color:#222}
  h2{margin:0 0 4px;font-size:16px}table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px}
  th{background:#f3f4f6}.meta{color:#555;font-size:12px}.footnote{margin-top:16px;font-size:11px;color:#888}
</style></head><body>
<h2>${esc(t.transferNo)} — Internal Transfer Note</h2>
<p class="meta">Date: ${esc(t.date)} &nbsp;|&nbsp; Status: ${esc(t.status)}${t.remarks ? ` &nbsp;|&nbsp; Remarks: ${esc(t.remarks)}` : ""}</p>
<table><thead><tr><th>#</th><th>Item</th><th>Code</th><th>Qty</th><th>Rate</th><th>Amount</th><th>IMEI</th></tr></thead><tbody>
${items.map((it, i) => `<tr><td>${i + 1}</td><td>${esc(it.itemName)}</td><td>${esc(it.itemCode)}</td><td>${it.qty}</td><td>${money(it.purchasePrice)}</td><td>${money(it.qty * it.purchasePrice)}</td><td>${esc(it.imei || "")}</td></tr>`).join("")}
</tbody></table>
<p class="meta" style="margin-top:10px"><strong>From:</strong> ${esc(LOCATION_LABELS[t.fromStoreId ?? ""] || "Unknown")} &nbsp;→&nbsp; <strong>To:</strong> ${esc(LOCATION_LABELS[t.toStoreId ?? ""] || "Unknown")}</p>
<p class="footnote">Internal Transfer Note — ${esc(LOCATION_LABELS[t.fromStoreId ?? ""] || "B.M. Electronics")}</p>
<script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
  }

  function onExport() {
    const rows: any[] = [];
    for (const t of filtered) {
      const items = itemsMap[t.id] || [];
      for (const it of items) {
        rows.push({
          "Transfer No": t.transferNo,
          Date: t.date,
          From: LOCATION_LABELS[t.fromStoreId ?? ""] || "Unknown",
          To: LOCATION_LABELS[t.toStoreId ?? ""] || "Unknown",
          "Item Code": it.itemCode,
          Item: it.itemName,
          Qty: it.qty,
          Rate: it.purchasePrice,
          Amount: it.qty * it.purchasePrice,
          IMEI: it.imei || "",
          Status: t.status,
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
                            <Badge variant={t.status === "COMPLETED" ? "outline" : "destructive"} className="text-[10px]">
                              {t.status}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-right">
                            <Button size="icon" variant="ghost" onClick={() => printNote(t, items)} className="h-8 w-8" title="Print">
                              <Printer className="size-3.5" />
                            </Button>
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
