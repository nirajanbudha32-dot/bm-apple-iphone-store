import { useMemo } from "react";
import {
  useStore,
  getVendorBalance,
  getVendorPurchases,
  getVendorPayments,
  type Vendor,
  type PurchaseHeader,
  type VendorPayment,
} from "@/lib/store";
import { money } from "@/lib/utils";
import { exportRows } from "@/lib/excel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Download, FileText, AlertCircle, TrendingUp } from "lucide-react";

function daysDiff(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function StatusBadge({ outstanding }: { outstanding: number }) {
  if (outstanding <= 0) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
        Paid
      </Badge>
    );
  }
  if (outstanding <= 50000) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
        Due
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
      Overdue
    </Badge>
  );
}

export function VendorReports() {
  const {
    vendors,
    purchaseHeaders,
    vendorPayments,
    purchaseReturns,
  } = useStore();

  const vendorPayableData = useMemo(() => {
    return vendors
      .map((v) => {
        const purchases = getVendorPurchases(v.id);
        const payments = getVendorPayments(v.id);
        const returns = purchaseReturns.filter((r) => r.vendorId === v.id);
        const totalPurchases = purchases.reduce((s, p) => s + p.grandTotal, 0);
        const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
        const totalReturns = returns.reduce((s, r) => s + r.refundAmount, 0);
        const outstanding = getVendorBalance(v.id);
        return {
          vendorCode: v.vendorCode,
          vendorName: v.vendorName,
          openingBalance: v.openingBalance,
          totalPurchases,
          totalPayments,
          totalReturns,
          outstanding,
          overdue: outstanding > 0,
        };
      })
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [vendors, purchaseHeaders, vendorPayments, purchaseReturns]);

  const billOutstandingData = useMemo(() => {
    return purchaseHeaders
      .filter((p) => p.remainingBalance > 0)
      .map((p) => ({
        purchaseNo: p.purchaseNo,
        date: p.date,
        vendor: p.supplierName,
        grandTotal: p.grandTotal,
        paid: p.paidAmount,
        remaining: p.remainingBalance,
        daysOutstanding: daysDiff(p.date),
        daysText: p.dueDate ? daysDiff(p.dueDate) + " days overdue" : "",
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [purchaseHeaders]);

  const vendorPurchaseSummary = useMemo(() => {
    const map = new Map<string, { count: number; total: number; vendor: Vendor }>();
    for (const v of vendors) {
      const purchases = getVendorPurchases(v.id);
      if (purchases.length > 0) {
        map.set(v.id, {
          count: purchases.length,
          total: purchases.reduce((s, p) => s + p.grandTotal, 0),
          vendor: v,
        });
      }
    }
    return Array.from(map.values())
      .map((entry) => ({
        vendorCode: entry.vendor.vendorCode,
        vendorName: entry.vendor.vendorName,
        numberOfPurchases: entry.count,
        totalAmount: entry.total,
        averagePurchaseValue: entry.total / entry.count,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [vendors, purchaseHeaders]);

  const vendorListData = useMemo(() => {
    return vendors.map((v) => ({
      code: v.vendorCode,
      name: v.vendorName,
      type: v.vendorType,
      pan: v.pan,
      phone: v.phone,
      email: v.email,
      status: v.status,
    }));
  }, [vendors]);

  const exportPayable = () => {
    exportRows(
      vendorPayableData.map((r) => ({
        "Vendor Code": r.vendorCode,
        "Vendor Name": r.vendorName,
        "Opening Balance": r.openingBalance,
        "Total Purchases": r.totalPurchases,
        "Total Payments": r.totalPayments,
        "Purchase Returns": r.totalReturns,
        "Outstanding Balance": r.outstanding,
      })),
      "Vendor Payable Report",
      "vendor_payable_report.xlsx"
    );
  };

  const exportBillOutstanding = () => {
    exportRows(
      billOutstandingData.map((r) => ({
        "Purchase No": r.purchaseNo,
        "Date": r.date,
        "Vendor": r.vendor,
        "Grand Total": r.grandTotal,
        "Paid": r.paid,
        "Remaining": r.remaining,
        "Days Outstanding": r.daysOutstanding,
      })),
      "Bill Outstanding Report",
      "bill_outstanding_report.xlsx"
    );
  };

  const exportPurchaseSummary = () => {
    exportRows(
      vendorPurchaseSummary.map((r) => ({
        "Vendor Code": r.vendorCode,
        "Vendor Name": r.vendorName,
        "Number of Purchases": r.numberOfPurchases,
        "Total Amount": r.totalAmount,
        "Average Purchase Value": r.averagePurchaseValue,
      })),
      "Vendor Purchase Report",
      "vendor_purchase_report.xlsx"
    );
  };

  const exportVendorList = () => {
    exportRows(
      vendorListData.map((r) => ({
        Code: r.code,
        Name: r.name,
        Type: r.type,
        PAN: r.pan,
        Phone: r.phone,
        Email: r.email,
        Status: r.status,
      })),
      "Vendor List",
      "vendor_list.xlsx"
    );
  };

  const totalPayable = vendorPayableData.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h2 className="text-xl font-bold">Vendor Reports</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Total Payable: <span className="font-semibold text-foreground">{money(totalPayable)}</span>
        </div>
      </div>

      <Tabs defaultValue="payable" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payable">Vendor Payable</TabsTrigger>
          <TabsTrigger value="outstanding">Bill Outstanding</TabsTrigger>
          <TabsTrigger value="purchases">Purchase Summary</TabsTrigger>
          <TabsTrigger value="list">Vendor List</TabsTrigger>
        </TabsList>

        <TabsContent value="payable">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Vendor Payable Report
              </h3>
              <Button variant="outline" size="sm" onClick={exportPayable}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Vendor Code</th>
                    <th className="text-left p-2 font-medium">Vendor Name</th>
                    <th className="text-right p-2 font-medium">Opening Balance</th>
                    <th className="text-right p-2 font-medium">Total Purchases</th>
                    <th className="text-right p-2 font-medium">Total Payments</th>
                    <th className="text-right p-2 font-medium">Purchase Returns</th>
                    <th className="text-right p-2 font-medium">Outstanding</th>
                    <th className="text-center p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorPayableData.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b hover:bg-muted/50 ${r.overdue && r.outstanding > 50000 ? "bg-red-50" : ""}`}
                    >
                      <td className="p-2">{r.vendorCode}</td>
                      <td className="p-2">{r.vendorName}</td>
                      <td className="p-2 text-right">{money(r.openingBalance)}</td>
                      <td className="p-2 text-right">{money(r.totalPurchases)}</td>
                      <td className="p-2 text-right">{money(r.totalPayments)}</td>
                      <td className="p-2 text-right">{money(r.totalReturns)}</td>
                      <td className={`p-2 text-right font-semibold ${r.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                        {money(r.outstanding)}
                      </td>
                      <td className="p-2 text-center">
                        <StatusBadge outstanding={r.outstanding} />
                      </td>
                    </tr>
                  ))}
                  {vendorPayableData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-muted-foreground">
                        No vendor data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Bill Outstanding Report
              </h3>
              <Button variant="outline" size="sm" onClick={exportBillOutstanding}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Purchase No</th>
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Vendor</th>
                    <th className="text-right p-2 font-medium">Grand Total</th>
                    <th className="text-right p-2 font-medium">Paid</th>
                    <th className="text-right p-2 font-medium">Remaining</th>
                    <th className="text-right p-2 font-medium">Days Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {billOutstandingData.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b hover:bg-muted/50 ${r.daysOutstanding > 30 ? "bg-red-50" : ""}`}
                    >
                      <td className="p-2">{r.purchaseNo}</td>
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">{r.vendor}</td>
                      <td className="p-2 text-right">{money(r.grandTotal)}</td>
                      <td className="p-2 text-right">{money(r.paid)}</td>
                      <td className="p-2 text-right font-semibold text-red-600">{money(r.remaining)}</td>
                      <td className={`p-2 text-right font-medium ${r.daysOutstanding > 30 ? "text-red-600" : "text-orange-600"}`}>
                        {r.daysOutstanding} days
                      </td>
                    </tr>
                  ))}
                  {billOutstandingData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        No outstanding bills
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Vendor Purchase Summary
              </h3>
              <Button variant="outline" size="sm" onClick={exportPurchaseSummary}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Vendor Code</th>
                    <th className="text-left p-2 font-medium">Vendor Name</th>
                    <th className="text-right p-2 font-medium">Number of Purchases</th>
                    <th className="text-right p-2 font-medium">Total Amount</th>
                    <th className="text-right p-2 font-medium">Average Purchase Value</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorPurchaseSummary.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2">{r.vendorCode}</td>
                      <td className="p-2">{r.vendorName}</td>
                      <td className="p-2 text-right">{r.numberOfPurchases}</td>
                      <td className="p-2 text-right font-semibold">{money(r.totalAmount)}</td>
                      <td className="p-2 text-right">{money(r.averagePurchaseValue)}</td>
                    </tr>
                  ))}
                  {vendorPurchaseSummary.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No purchase data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Complete Vendor List
              </h3>
              <Button variant="outline" size="sm" onClick={exportVendorList}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Code</th>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">PAN</th>
                    <th className="text-left p-2 font-medium">Phone</th>
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-center p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorListData.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2">{r.code}</td>
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.type}</td>
                      <td className="p-2">{r.pan}</td>
                      <td className="p-2">{r.phone}</td>
                      <td className="p-2">{r.email}</td>
                      <td className="p-2 text-center">
                        <Badge
                          variant={r.status === "Active" ? "default" : "secondary"}
                          className={r.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                        >
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {vendorListData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        No vendors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
