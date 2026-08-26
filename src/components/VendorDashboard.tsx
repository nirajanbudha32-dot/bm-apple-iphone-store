import { useState, useMemo } from "react";
import {
  useStore,
  getVendorBalance,
  getVendorPurchases,
  getVendorPayments,
  type Vendor,
} from "@/lib/store";
import { money } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";

function StatusBadge({ outstanding }: { outstanding: number }) {
  if (outstanding <= 0) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
        Paid in full
      </Badge>
    );
  }
  if (outstanding > 0 && outstanding <= 50000) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
        Has balance due
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
      Overdue
    </Badge>
  );
}

export function VendorDashboard() {
  const {
    vendors,
    purchaseHeaders,
    vendorPayments,
    purchaseReturns,
    vendorTransactions,
  } = useStore();

  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  const vendorPurchases = useMemo(() => {
    if (!selectedVendorId) return [];
    return getVendorPurchases(selectedVendorId);
  }, [selectedVendorId, purchaseHeaders]);

  const vendorPayList = useMemo(() => {
    if (!selectedVendorId) return [];
    return getVendorPayments(selectedVendorId);
  }, [selectedVendorId, vendorPayments]);

  const vendorReturns = useMemo(() => {
    if (!selectedVendorId) return [];
    return purchaseReturns.filter((r) => r.vendorId === selectedVendorId);
  }, [selectedVendorId, purchaseReturns]);

  const vendorTxns = useMemo(() => {
    if (!selectedVendorId) return [];
    return vendorTransactions
      .filter((t) => t.vendorId === selectedVendorId)
      .sort(
        (a, b) =>
          b.transactionDate.localeCompare(a.transactionDate) ||
          b.createdAt.localeCompare(a.createdAt)
      );
  }, [selectedVendorId, vendorTransactions]);

  const totalPurchases = useMemo(
    () => vendorPurchases.reduce((sum, p) => sum + p.grandTotal, 0),
    [vendorPurchases]
  );

  const totalPayments = useMemo(
    () => vendorPayList.reduce((sum, p) => sum + p.amount, 0),
    [vendorPayList]
  );

  const totalReturns = useMemo(
    () => vendorReturns.reduce((sum, r) => sum + r.refundAmount, 0),
    [vendorReturns]
  );

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId) ?? null,
    [vendors, selectedVendorId]
  );

  const openingBalance = selectedVendor?.openingBalance ?? 0;

  const outstandingPayable = useMemo(
    () => openingBalance + totalPurchases - totalPayments - totalReturns,
    [openingBalance, totalPurchases, totalPayments, totalReturns]
  );

  const currentBalance = useMemo(() => {
    if (!selectedVendorId) return 0;
    return getVendorBalance(selectedVendorId);
  }, [selectedVendorId, vendorTransactions]);

  const recentTransactions = vendorTxns.slice(0, 10);

  const allVendorOverviews = useMemo(() => {
    return vendors.map((v) => {
      const balance = getVendorBalance(v.id);
      const purchases = getVendorPurchases(v.id);
      const payments = getVendorPayments(v.id);
      const returns = purchaseReturns.filter((r) => r.vendorId === v.id);
      const totalP = purchases.reduce((s, p) => s + p.grandTotal, 0);
      const totalPay = payments.reduce((s, p) => s + p.amount, 0);
      const totalR = returns.reduce((s, r) => s + r.refundAmount, 0);
      const outstanding =
        v.openingBalance + totalP - totalPay - totalR;
      return {
        vendor: v,
        totalPurchases: totalP,
        totalPayments: totalPay,
        totalReturns: totalR,
        openingBalance: v.openingBalance,
        outstanding,
        balance,
      };
    });
  }, [vendors, purchaseHeaders, vendorPayments, purchaseReturns]);

  if (!selectedVendorId) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">BM Apple iPhone Store — Vendor Overview</h2>
            </div>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="size-10 mb-2 opacity-40" />
              <p>No vendors found. Add vendors first.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
              <table className="w-full min-w-[750px] text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr className="text-left">
                    <th className="p-2.5">Vendor</th>
                    <th className="p-2.5 text-right">Opening Balance</th>
                    <th className="p-2.5 text-right">Total Purchases</th>
                    <th className="p-2.5 text-right">Total Payments</th>
                    <th className="p-2.5 text-right">Returns</th>
                    <th className="p-2.5 text-right">Outstanding</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allVendorOverviews.map((row) => (
                    <tr
                      key={row.vendor.id}
                      className="border-t border-border hover:bg-muted/40 cursor-pointer"
                      onClick={() => setSelectedVendorId(row.vendor.id)}
                    >
                      <td className="p-2.5">
                        <div className="font-medium">{row.vendor.vendorName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {row.vendor.vendorCode} · {row.vendor.phone || "-"}
                        </div>
                      </td>
                      <td className="p-2.5 text-right">{money(row.openingBalance)}</td>
                      <td className="p-2.5 text-right">{money(row.totalPurchases)}</td>
                      <td className="p-2.5 text-right">{money(row.totalPayments)}</td>
                      <td className="p-2.5 text-right">{money(row.totalReturns)}</td>
                      <td
                        className={`p-2.5 text-right font-semibold ${
                          row.outstanding > 0 ? "text-destructive" : "text-green-600"
                        }`}
                      >
                        {money(row.outstanding)}
                      </td>
                      <td className="p-2.5 text-center">
                        <StatusBadge outstanding={row.outstanding} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vendor Selector */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {selectedVendor?.vendorName ?? "Vendor Dashboard"}
            </h2>
            {selectedVendor && (
              <span className="text-xs text-muted-foreground">
                ({selectedVendor.vendorCode})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge outstanding={outstandingPayable} />
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Switch vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Purchases</span>
          </div>
          <div className="text-xl font-bold">{money(totalPurchases)}</div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingDown className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Payments</span>
          </div>
          <div className="text-xl font-bold">{money(totalPayments)}</div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertCircle className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Purchase Returns</span>
          </div>
          <div className="text-xl font-bold">{money(totalReturns)}</div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Wallet className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Opening Balance</span>
          </div>
          <div className="text-xl font-bold">{money(openingBalance)}</div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ShoppingCart className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Outstanding Payable</span>
          </div>
          <div
            className={`text-xl font-bold ${
              outstandingPayable > 0 ? "text-destructive" : "text-green-600"
            }`}
          >
            {money(outstandingPayable)}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Transactions (Last 10)
          </h3>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ShoppingCart className="size-8 mb-2 opacity-40" />
            <p className="text-sm">No transactions recorded for this vendor yet.</p>
          </div>
        ) : (
          <div className="max-h-[40vh] overflow-auto rounded-md border border-border">
            <table className="w-full min-w-[700px] text-xs sm:text-sm">
              <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                <tr className="text-left">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Reference</th>
                  <th className="p-2.5 text-right">Debit</th>
                  <th className="p-2.5 text-right">Credit</th>
                  <th className="p-2.5 text-right">Balance</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="border-t border-border">
                    <td className="p-2.5 whitespace-nowrap">{txn.transactionDate}</td>
                    <td className="p-2.5">
                      <Badge variant="outline" className="text-[10px]">
                        {txn.transactionType}
                      </Badge>
                    </td>
                    <td className="p-2.5 font-mono text-xs">{txn.referenceNo || "-"}</td>
                    <td className="p-2.5 text-right">
                      {txn.debit > 0 ? (
                        <span className="font-medium">{money(txn.debit)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      {txn.credit > 0 ? (
                        <span className="font-medium text-green-600">{money(txn.credit)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-semibold">{money(txn.balance)}</td>
                    <td className="p-2.5 text-muted-foreground max-w-[200px] truncate">
                      {txn.remarks || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Vendor Details */}
      {selectedVendor && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Vendor Details
            </h3>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">Contact Person: </span>
              <span className="font-medium">{selectedVendor.contactPerson || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Phone: </span>
              <span className="font-medium">{selectedVendor.phone || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email: </span>
              <span className="font-medium">{selectedVendor.email || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Address: </span>
              <span className="font-medium">{selectedVendor.address || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">PAN: </span>
              <span className="font-medium">{selectedVendor.pan || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">VAT: </span>
              <span className="font-medium">{selectedVendor.vatNumber || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Payment Terms: </span>
              <span className="font-medium">{selectedVendor.paymentTerms}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Credit Limit: </span>
              <span className="font-medium">{money(selectedVendor.creditLimit)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
