import { useMemo, useState } from "react";
import { Plus, Download, Search, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStore,
  addVendorPayment,
  nextVendorPaymentNo,
  getVendorPurchases,
  type Vendor,
  type PurchaseHeader,
} from "@/lib/store";
import { money } from "@/lib/utils";
import { exportRows } from "@/lib/excel";
import { PAYMENT_METHODS } from "@/lib/store";
import { toast } from "sonner";

type AllocationEntry = {
  purchaseHeaderId: string;
  amount: number;
};

export function VendorPayments() {
  const { vendors, vendorPayments, purchaseHeaders } = useStore();

  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [paymentNo, setPaymentNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amount, setAmount] = useState<number>(0);
  const [bankName, setBankName] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [allocations, setAllocations] = useState<AllocationEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const showBankFields = paymentMethod === "Bank" || paymentMethod === "Card";

  const unpaidBills = useMemo(() => {
    if (!selectedVendorId) return [];
    return getVendorPurchases(selectedVendorId).filter(
      (h) => h.remainingBalance > 0
    );
  }, [selectedVendorId, purchaseHeaders]);

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  const totalAllocated = useMemo(
    () => allocations.reduce((sum, a) => sum + a.amount, 0),
    [allocations]
  );

  const allocationDifference = useMemo(
    () => amount - totalAllocated,
    [amount, totalAllocated]
  );

  function handleVendorChange(vendorId: string) {
    setSelectedVendorId(vendorId);
    setAllocations([]);
    setAmount(0);
    setBankName("");
    setReferenceNo("");
    setRemarks("");
    nextVendorPaymentNo().then((no) => setPaymentNo(no));
  }

  function handleAmountChange(newAmount: number) {
    setAmount(newAmount);
    autoAllocate(newAmount);
  }

  function autoAllocate(totalAmount: number) {
    let remaining = totalAmount;
    const newAllocations: AllocationEntry[] = [];
    for (const bill of unpaidBills) {
      if (remaining <= 0) break;
      const toAllocate = Math.min(remaining, bill.remainingBalance);
      newAllocations.push({
        purchaseHeaderId: bill.id,
        amount: Math.round(toAllocate * 100) / 100,
      });
      remaining -= toAllocate;
    }
    setAllocations(newAllocations);
  }

  function handleAllocationChange(purchaseHeaderId: string, value: string) {
    const num = parseFloat(value) || 0;
    setAllocations((prev) => {
      const existing = prev.find((a) => a.purchaseHeaderId === purchaseHeaderId);
      if (existing) {
        return prev.map((a) =>
          a.purchaseHeaderId === purchaseHeaderId
            ? { ...a, amount: Math.round(num * 100) / 100 }
            : a
        );
      }
      return [
        ...prev,
        { purchaseHeaderId, amount: Math.round(num * 100) / 100 },
      ];
    });
  }

  function getAllocatedAmount(purchaseHeaderId: string): number {
    return allocations.find((a) => a.purchaseHeaderId === purchaseHeaderId)
      ?.amount ?? 0;
  }

  async function handleSave() {
    if (!selectedVendorId) {
      toast.error("Please select a vendor.");
      return;
    }
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero.");
      return;
    }
    if (!paymentDate) {
      toast.error("Please select a payment date.");
      return;
    }
    if (Math.abs(allocationDifference) > 0.01) {
      toast.error(
        `Allocation total (${money(totalAllocated)}) must equal payment amount (${money(amount)}).`
      );
      return;
    }
    for (const alloc of allocations) {
      if (alloc.amount > 0) {
        const bill = unpaidBills.find((b) => b.id === alloc.purchaseHeaderId);
        if (bill && alloc.amount > bill.remainingBalance + 0.01) {
          toast.error(
            `Allocation for ${bill.purchaseNo} exceeds remaining balance.`
          );
          return;
        }
      }
    }

    setSaving(true);
    try {
      const allocData = allocations.filter((a) => a.amount > 0);
      const result = await addVendorPayment(
        selectedVendorId,
        paymentDate,
        paymentMethod,
        amount,
        showBankFields ? bankName : "",
        referenceNo,
        remarks,
        allocData
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payment saved successfully!");
        resetForm();
      }
    } catch (err) {
      toast.error("Failed to save payment.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSelectedVendorId("");
    setPaymentNo("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("Cash");
    setAmount(0);
    setBankName("");
    setReferenceNo("");
    setRemarks("");
    setAllocations([]);
  }

  function onExport() {
    const rows = filteredPayments.map((p) => {
      const vendor = vendors.find((v) => v.id === p.vendorId);
      return {
        "Payment No": p.paymentNo,
        Date: p.paymentDate,
        Vendor: vendor?.vendorName ?? "",
        Method: p.paymentMethod,
        Amount: p.amount,
        "Bank Name": p.bankName,
        Reference: p.referenceNo,
        Remarks: p.remarks,
      };
    });
    if (rows.length === 0) {
      toast.info("No payments to export.");
      return;
    }
    exportRows(
      rows,
      "Vendor Payments",
      `Vendor_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  const filteredPayments = useMemo(() => {
    if (!searchTerm) return vendorPayments;
    const term = searchTerm.toLowerCase();
    return vendorPayments.filter((p) => {
      const vendor = vendors.find((v) => v.id === p.vendorId);
      return (
        p.paymentNo.toLowerCase().includes(term) ||
        (vendor?.vendorName ?? "").toLowerCase().includes(term) ||
        p.paymentMethod.toLowerCase().includes(term) ||
        p.referenceNo.toLowerCase().includes(term)
      );
    });
  }, [vendorPayments, vendors, searchTerm]);

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          <h2 className="text-base font-semibold sm:text-lg">
            Vendor Payment Entry
          </h2>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div className="sm:col-span-2 md:col-span-1">
            <Label className="text-xs sm:text-sm">Vendor *</Label>
            <Select value={selectedVendorId} onValueChange={handleVendorChange}>
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
            <Label className="text-xs sm:text-sm">Payment No</Label>
            <Input
              value={paymentNo}
              readOnly
              placeholder="Auto-generated"
              className="h-9 bg-muted text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Payment Date *</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Amount *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount || ""}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              className="h-9 text-xs sm:text-sm"
              placeholder="0.00"
            />
          </div>
          {showBankFields && (
            <div>
              <Label className="text-xs sm:text-sm">Bank Name</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="h-9 text-xs sm:text-sm"
                placeholder="Enter bank name"
              />
            </div>
          )}
          <div>
            <Label className="text-xs sm:text-sm">Reference No</Label>
            <Input
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="h-9 text-xs sm:text-sm"
              placeholder="Cheque / Transaction ID"
            />
          </div>
          <div className="sm:col-span-2 md:col-span-3">
            <Label className="text-xs sm:text-sm">Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="h-16 text-xs sm:text-sm"
              placeholder="Optional remarks..."
            />
          </div>
        </div>

        {selectedVendorId && unpaidBills.length > 0 && amount > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs font-semibold sm:text-sm">
                Bill-wise Allocation
              </Label>
              <Badge
                variant={
                  Math.abs(allocationDifference) < 0.01 ? "default" : "destructive"
                }
              >
                {Math.abs(allocationDifference) < 0.01
                  ? "Fully Allocated"
                  : `Remaining: ${money(allocationDifference)}`}
              </Badge>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold">
                      Purchase No
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Grand Total
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">Paid</th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Remaining
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Allocate Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">
                        {bill.purchaseNo}
                      </td>
                      <td className="px-3 py-2">{bill.date}</td>
                      <td className="px-3 py-2 text-right">
                        {money(bill.grandTotal)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {money(bill.paidAmount)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-600">
                        {money(bill.remainingBalance)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          max={bill.remainingBalance}
                          step="0.01"
                          value={
                            getAllocatedAmount(bill.id) || ""
                          }
                          onChange={(e) =>
                            handleAllocationChange(bill.id, e.target.value)
                          }
                          className="h-8 w-28 text-right text-xs sm:text-sm"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                    <td className="px-3 py-2" colSpan={5}>
                      Total Allocated
                    </td>
                    <td className="px-3 py-2 text-right">
                      {money(totalAllocated)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-8 text-xs sm:text-sm"
          >
            <Plus className="mr-1 size-3.5 sm:size-4" />{" "}
            {saving ? "Saving..." : "Save Payment"}
          </Button>
          <Button
            variant="outline"
            onClick={resetForm}
            className="h-8 text-xs sm:text-sm"
          >
            Clear
          </Button>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold sm:text-base">Payment History</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search payments..."
                className="h-8 w-48 pl-7 text-xs sm:text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={filteredPayments.length === 0}
              className="h-8 text-xs sm:text-sm"
            >
              <Download className="mr-1 size-3.5 sm:size-4" /> Export
            </Button>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No payments found.
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold">
                    Payment No
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Vendor</th>
                  <th className="px-3 py-2 text-left font-semibold">Method</th>
                  <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const vendor = vendors.find((v) => v.id === p.vendorId);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">
                        {p.paymentNo}
                      </td>
                      <td className="px-3 py-2">{p.paymentDate}</td>
                      <td className="px-3 py-2">
                        {vendor?.vendorName ?? "-"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {p.paymentMethod}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {money(p.amount)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {p.referenceNo || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                  <td className="px-3 py-2" colSpan={4}>
                    Total ({filteredPayments.length} payments)
                  </td>
                  <td className="px-3 py-2 text-right">
                    {money(
                      filteredPayments.reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </td>
                  <td className="px-3 py-2" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
