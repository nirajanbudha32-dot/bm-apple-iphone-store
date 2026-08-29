import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStore,
  getVendorBalance,
  getVendorLedger,
  type Vendor,
  type VendorTransaction,
} from "@/lib/store";
import { money } from "@/lib/utils";
import { exportRows } from "@/lib/excel";
import { useStoreContext } from "@/lib/store-context";

const DEFAULT_COMPANY = {
  name: "BM Apple iPhone Store",
  address: "Pokhara, Nepal",
  pan: "123456789",
  vatNo: "123456789",
};

const TYPE_LABELS: Record<string, string> = {
  OPENING_BALANCE: "Opening Balance",
  PURCHASE: "Purchase",
  PURCHASE_RETURN: "Purchase Return",
  PAYMENT: "Payment",
  ADVANCE_APPLIED: "Advance Applied",
  CREDIT_NOTE: "Credit Note",
  DEBIT_NOTE: "Debit Note",
  ADJUSTMENT: "Adjustment",
};

export function VendorLedger() {
  const { vendors } = useStore();
  const { currentStore } = useStoreContext();
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const COMPANY = {
    name: DEFAULT_COMPANY.name,
    address: currentStore?.address || DEFAULT_COMPANY.address,
    pan: currentStore?.pan || DEFAULT_COMPANY.pan,
    vatNo: currentStore?.vatNumber || DEFAULT_COMPANY.vatNo,
  };

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  const allTransactions = useMemo(() => {
    if (!selectedVendorId) return [];
    return getVendorLedger(selectedVendorId);
  }, [selectedVendorId]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (fromDate && t.transactionDate < fromDate) return false;
      if (toDate && t.transactionDate > toDate) return false;
      return true;
    });
  }, [allTransactions, fromDate, toDate]);

  const ledgerRows = useMemo(() => {
    if (!selectedVendor) return [];
    let runningBalance = 0;
    return filteredTransactions.map((t) => {
      runningBalance = runningBalance + t.debit - t.credit;
      return { ...t, runningBalance };
    });
  }, [filteredTransactions, selectedVendor]);

  const totalDebit = useMemo(
    () => ledgerRows.reduce((a, r) => a + r.debit, 0),
    [ledgerRows]
  );
  const totalCredit = useMemo(
    () => ledgerRows.reduce((a, r) => a + r.credit, 0),
    [ledgerRows]
  );
  const closingBalance = useMemo(() => {
    if (!selectedVendor) return 0;
    return getVendorBalance(selectedVendorId);
  }, [selectedVendorId, selectedVendor]);

  function onExport() {
    if (ledgerRows.length === 0) return;
    exportRows(
      ledgerRows.map((r) => ({
        Date: r.transactionDate,
        Type: TYPE_LABELS[r.transactionType] || r.transactionType,
        "Reference No": r.referenceNo,
        Remarks: r.remarks,
        Debit: r.debit,
        Credit: r.credit,
        Balance: r.runningBalance,
      })),
      "Vendor Ledger",
      `Vendor_Ledger_${selectedVendor?.vendorName ?? "Report"}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  function onPrint() {
    if (ledgerRows.length === 0) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Vendor Ledger</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#333}
  .header{text-align:center;margin-bottom:16px}
  .header h2{margin:0 0 4px;font-size:16px}
  .header p{margin:2px 0;font-size:11px;color:#666}
  .info{display:flex;justify-content:space-between;margin-bottom:12px;font-size:11px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;font-size:11px}
  th{background:#f5f5f5;font-weight:600}
  td.num{text-align:right}
  .footer{margin-top:12px;font-size:11px}
  .footer-row{display:flex;justify-content:flex-end;gap:32px;padding:3px 0}
  .footer-row span{font-weight:600}
  @media print{body{margin:10px}}
</style></head><body>
<div class="header">
  <h2>${esc(COMPANY.name)}</h2>
  <p>${esc(COMPANY.address)}</p>
  <p>PAN: ${esc(COMPANY.pan)} | VAT: ${esc(COMPANY.vatNo)}</p>
  <h3 style="margin-top:10px">Vendor Ledger Statement</h3>
</div>
<div class="info">
  <div><strong>Vendor:</strong> ${esc(selectedVendor?.vendorName ?? "")} (${esc(selectedVendor?.vendorCode ?? "")})</div>
  <div><strong>Address:</strong> ${esc(selectedVendor?.address ?? "")}</div>
  <div><strong>Phone:</strong> ${esc(selectedVendor?.phone ?? "")}</div>
  <div><strong>Date Range:</strong> ${fromDate || "All"} to ${toDate || "All"}</div>
</div>
<table>
  <thead><tr>
    <th>Date</th><th>Type</th><th>Reference No</th><th>Remarks</th>
    <th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th>
  </tr></thead>
  <tbody>
    ${ledgerRows.map((r) => `<tr>
      <td>${esc(r.transactionDate)}</td>
      <td>${esc(TYPE_LABELS[r.transactionType] || r.transactionType)}</td>
      <td>${esc(r.referenceNo)}</td>
      <td>${esc(r.remarks)}</td>
      <td class="num">${r.debit > 0 ? money(r.debit) : "-"}</td>
      <td class="num">${r.credit > 0 ? money(r.credit) : "-"}</td>
      <td class="num">${money(r.runningBalance)}</td>
    </tr>`).join("")}
  </tbody>
</table>
<div class="footer">
  <div class="footer-row"><span>Total Debit:</span> <span>${money(totalDebit)}</span></div>
  <div class="footer-row"><span>Total Credit:</span> <span>${money(totalCredit)}</span></div>
  <div class="footer-row"><span>Closing Balance:</span> <span>${money(closingBalance)}</span></div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
    w.document.close();
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <Label className="text-xs sm:text-sm">Vendor</Label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.vendorName} ({v.vendorCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vl-from" className="text-xs sm:text-sm">From Date</Label>
            <Input
              id="vl-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="vl-to" className="text-xs sm:text-sm">To Date</Label>
            <Input
              id="vl-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        {selectedVendor && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">Vendor Code: </span>
              <span className="font-medium">{selectedVendor.vendorCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Contact: </span>
              <span className="font-medium">{selectedVendor.contactPerson || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Phone: </span>
              <span className="font-medium">{selectedVendor.phone || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Opening Balance: </span>
              <span className="font-medium">{money(selectedVendor.openingBalance)}</span>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={!selectedVendorId || ledgerRows.length === 0}
            className="h-8 text-xs sm:text-sm"
          >
            <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            disabled={!selectedVendorId || ledgerRows.length === 0}
            className="h-8 text-xs sm:text-sm"
          >
            <Printer className="mr-1 size-3.5 sm:size-4" /> Print
          </Button>
        </div>
      </Card>

      {!selectedVendorId && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Select a vendor to view their ledger.
        </Card>
      )}

      {selectedVendorId && ledgerRows.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No transactions found for the selected filters.
        </Card>
      )}

      {selectedVendorId && ledgerRows.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Type</th>
                  <th className="px-3 py-2 text-left font-semibold">Reference No</th>
                  <th className="px-3 py-2 text-left font-semibold">Remarks</th>
                  <th className="px-3 py-2 text-right font-semibold">Debit</th>
                  <th className="px-3 py-2 text-right font-semibold">Credit</th>
                  <th className="px-3 py-2 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2">{r.transactionDate}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:text-xs">
                        {TYPE_LABELS[r.transactionType] || r.transactionType}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">{r.referenceNo}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate text-muted-foreground">{r.remarks}</td>
                    <td className="px-3 py-2 text-right font-medium text-red-600">
                      {r.debit > 0 ? money(r.debit) : "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">
                      {r.credit > 0 ? money(r.credit) : "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{money(r.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                  <td className="px-3 py-2" colSpan={4}>Summary</td>
                  <td className="px-3 py-2 text-right text-red-600">{money(totalDebit)}</td>
                  <td className="px-3 py-2 text-right text-green-600">{money(totalCredit)}</td>
                  <td className="px-3 py-2 text-right">{money(closingBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
