import { useState, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Building2,
  Download,
  Upload,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useStore,
  addVendor,
  updateVendor,
  nextVendorCode,
  addVendorDocument,
  deleteVendorDocument,
  type Vendor,
  type VendorDocument,
} from "@/lib/store";
import { money } from "@/lib/utils";
import { exportRows } from "@/lib/excel";

type VendorDraft = {
  vendorCode: string;
  vendorName: string;
  vendorType: string;
  pan: string;
  vatNumber: string;
  vatStatus: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: string;
  creditLimit: number;
  bankName: string;
  bankAccountNo: string;
  openingBalance: number;
  openingBalanceDate: string;
  status: string;
  remarks: string;
};

const emptyDraft = (): VendorDraft => ({
  vendorCode: "",
  vendorName: "",
  vendorType: "Local Supplier",
  pan: "",
  vatNumber: "",
  vatStatus: "PAN Only",
  address: "",
  contactPerson: "",
  phone: "",
  email: "",
  paymentTerms: "Cash",
  creditLimit: 0,
  bankName: "",
  bankAccountNo: "",
  openingBalance: 0,
  openingBalanceDate: "",
  status: "Active",
  remarks: "",
});

const VENDOR_TYPES = [
  "Local Supplier",
  "Import Supplier",
  "Distributor",
  "Manufacturer",
  "Service Provider",
  "Other",
];

const PAYMENT_TERMS_OPTIONS = ["Cash", "Net 15", "Net 30", "Net 45", "Net 60", "Other"];

const STATUS_OPTIONS = ["Active", "Inactive", "Blocked"];

const VAT_STATUS_OPTIONS = ["VAT Registered", "PAN Only"];

const PER_PAGE = 50;

export function VendorMaster() {
  const { vendors, vendorDocuments } = useStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [draft, setDraft] = useState<VendorDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateCode = useCallback(async () => {
    const code = await nextVendorCode();
    return code;
  }, []);

  const openAddDialog = useCallback(async () => {
    const code = await generateCode();
    setEditingVendor(null);
    setDraft({ ...emptyDraft(), vendorCode: code });
    setDialogOpen(true);
  }, [generateCode]);

  const openEditDialog = useCallback((vendor: Vendor) => {
    setEditingVendor(vendor);
    setDraft({
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      vendorType: vendor.vendorType,
      pan: vendor.pan,
      vatNumber: vendor.vatNumber,
      vatStatus: vendor.vatStatus,
      address: vendor.address,
      contactPerson: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email,
      paymentTerms: vendor.paymentTerms,
      creditLimit: vendor.creditLimit,
      bankName: vendor.bankName,
      bankAccountNo: vendor.bankAccountNo,
      openingBalance: vendor.openingBalance,
      openingBalanceDate: vendor.openingBalanceDate,
      status: vendor.status,
      remarks: vendor.remarks,
    });
    setDialogOpen(true);
  }, []);

  const openDetailDialog = useCallback((vendor: Vendor) => {
    setDetailVendor(vendor);
    setDetailOpen(true);
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailVendor(null);
    setDetailOpen(false);
  }, []);

  async function handleSave() {
    if (!draft.vendorName.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    setSaving(true);

    const payload = {
      vendorCode: draft.vendorCode,
      vendorName: draft.vendorName.trim(),
      vendorType: draft.vendorType,
      pan: draft.pan.trim(),
      vatNumber: draft.vatNumber.trim(),
      vatStatus: draft.vatStatus,
      address: draft.address.trim(),
      contactPerson: draft.contactPerson.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      paymentTerms: draft.paymentTerms,
      creditLimit: Number(draft.creditLimit) || 0,
      bankName: draft.bankName.trim(),
      bankAccountNo: draft.bankAccountNo.trim(),
      openingBalance: Number(draft.openingBalance) || 0,
      openingBalanceDate: draft.openingBalanceDate,
      status: draft.status,
      remarks: draft.remarks.trim(),
      createdBy: editingVendor?.createdBy ?? "",
    };

    let result;
    if (editingVendor) {
      result = await updateVendor(editingVendor.id, payload);
    } else {
      result = await addVendor(payload);
    }

    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editingVendor ? "Vendor updated" : "Vendor added");
    setDialogOpen(false);
    setEditingVendor(null);
    setDraft(emptyDraft());
  }

  function updateDraft(field: keyof VendorDraft, value: string | number) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  const filteredVendors = useMemo(() => {
    let list = vendors;
    const t = search.trim().toLowerCase();
    if (t) {
      list = list.filter((v) =>
        [v.vendorCode, v.vendorName, v.pan, v.contactPerson, v.phone, v.email]
          .join(" ")
          .toLowerCase()
          .includes(t),
      );
    }
    if (statusFilter !== "All") {
      list = list.filter((v) => v.status === statusFilter);
    }
    return list;
  }, [vendors, search, statusFilter]);

  const totalPages = Math.ceil(filteredVendors.length / PER_PAGE);
  const pagedVendors = filteredVendors.slice(
    page * PER_PAGE,
    (page + 1) * PER_PAGE,
  );

  function onExport() {
    if (filteredVendors.length === 0) {
      toast.error("No vendors to export");
      return;
    }
    const rows: Record<string, string | number>[] = filteredVendors.map((v) => ({
      "Vendor Code": v.vendorCode,
      "Vendor Name": v.vendorName,
      "Vendor Type": v.vendorType,
      PAN: v.pan,
      "VAT Number": v.vatNumber,
      "VAT Status": v.vatStatus,
      Address: v.address,
      "Contact Person": v.contactPerson,
      Phone: v.phone,
      Email: v.email,
      "Payment Terms": v.paymentTerms,
      "Credit Limit": v.creditLimit,
      "Bank Name": v.bankName,
      "Bank Account No": v.bankAccountNo,
      "Opening Balance": v.openingBalance,
      "Opening Balance Date": v.openingBalanceDate,
      Status: v.status,
      Remarks: v.remarks,
    }));
    exportRows(rows, "Vendors", `BM_Vendors_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !detailVendor) return;
    let loaded = 0;
    const total = files.length;
    for (let i = 0; i < total; i++) {
      const file = files[i]!;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        loaded++;
        continue;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const result = await addVendorDocument(
          detailVendor.id,
          file.name,
          file.type,
          file.size,
          reader.result as string,
        );
        if (result.error) {
          toast.error(result.error);
        }
        loaded++;
        if (loaded === total) {
          toast.success(`${total} document(s) uploaded`);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteDoc(doc: VendorDocument) {
    if (!window.confirm(`Delete document "${doc.fileName}"?`)) return;
    const result = await deleteVendorDocument(doc.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Document deleted");
    if (detailVendor) {
      setDetailVendor((prev) => (prev ? { ...prev } : null));
    }
  }

  const detailDocs = useMemo(() => {
    if (!detailVendor) return [];
    return vendorDocuments.filter((d) => d.vendorId === detailVendor.id);
  }, [detailVendor, vendorDocuments]);

  function statusBadge(status: string) {
    const cls =
      status === "Active"
        ? "bg-green-100 text-green-700 border-green-200"
        : status === "Inactive"
          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
          : "bg-red-100 text-red-700 border-red-200";
    return (
      <Badge variant="outline" className={`text-[10px] font-medium ${cls}`}>
        {status}
      </Badge>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground sm:text-base">
              Vendor Master
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] sm:min-w-0 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="h-9 pl-8 text-xs sm:text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 w-28 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm" onClick={onExport}>
              <Download className="mr-1 size-3.5" /> Export
            </Button>
            <Button size="sm" className="h-9 text-xs sm:text-sm" onClick={openAddDialog}>
              <Plus className="mr-1 size-3.5" /> Add Vendor
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[65vh] overflow-x-auto">
          <Table className="min-w-[900px] text-xs sm:text-sm">
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead className="p-2.5">Code</TableHead>
                <TableHead className="p-2.5">Name</TableHead>
                <TableHead className="p-2.5">Type</TableHead>
                <TableHead className="p-2.5">PAN</TableHead>
                <TableHead className="p-2.5">Phone</TableHead>
                <TableHead className="p-2.5">Status</TableHead>
                <TableHead className="p-2.5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedVendors.map((v) => (
                <TableRow key={v.id} className="border-t border-border">
                  <TableCell className="p-2.5 font-mono font-medium text-primary">
                    {v.vendorCode}
                  </TableCell>
                  <TableCell className="p-2.5 font-medium">{v.vendorName}</TableCell>
                  <TableCell className="p-2.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {v.vendorType}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-2.5 font-mono text-muted-foreground">
                    {v.pan || "-"}
                  </TableCell>
                  <TableCell className="p-2.5">{v.phone || "-"}</TableCell>
                  <TableCell className="p-2.5">{statusBadge(v.status)}</TableCell>
                  <TableCell className="p-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        title="View Details"
                        onClick={() => openDetailDialog(v)}
                      >
                        <Eye className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        title="Edit Vendor"
                        onClick={() => openEditDialog(v)}
                      >
                        <Edit className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pagedVendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-6 text-center text-muted-foreground">
                    No vendors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>
            Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filteredVendors.length)} of {filteredVendors.length} vendors
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-8 text-xs">
              Prev
            </Button>
            <span className="flex items-center px-2 text-xs">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="h-8 text-xs">
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingVendor ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Vendor Code</Label>
              <Input
                value={draft.vendorCode}
                readOnly
                className="h-9 text-xs bg-muted/50 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Vendor Name *</Label>
              <Input
                value={draft.vendorName}
                onChange={(e) => updateDraft("vendorName", e.target.value)}
                placeholder="Enter vendor name"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Vendor Type</Label>
              <Select value={draft.vendorType} onValueChange={(v) => updateDraft("vendorType", v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">PAN</Label>
              <Input
                value={draft.pan}
                onChange={(e) => updateDraft("pan", e.target.value)}
                placeholder="PAN number"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">VAT Number</Label>
              <Input
                value={draft.vatNumber}
                onChange={(e) => updateDraft("vatNumber", e.target.value)}
                placeholder="VAT number"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">VAT Status</Label>
              <Select value={draft.vatStatus} onValueChange={(v) => updateDraft("vatStatus", v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VAT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Address</Label>
              <Input
                value={draft.address}
                onChange={(e) => updateDraft("address", e.target.value)}
                placeholder="Full address"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Contact Person</Label>
              <Input
                value={draft.contactPerson}
                onChange={(e) => updateDraft("contactPerson", e.target.value)}
                placeholder="Contact person name"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                value={draft.phone}
                onChange={(e) => updateDraft("phone", e.target.value)}
                placeholder="Phone number"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={draft.email}
                onChange={(e) => updateDraft("email", e.target.value)}
                placeholder="Email address"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Payment Terms</Label>
              <Select value={draft.paymentTerms} onValueChange={(v) => updateDraft("paymentTerms", v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Credit Limit</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.creditLimit}
                onChange={(e) => updateDraft("creditLimit", Number(e.target.value))}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Bank Name</Label>
              <Input
                value={draft.bankName}
                onChange={(e) => updateDraft("bankName", e.target.value)}
                placeholder="Bank name"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Bank Account No</Label>
              <Input
                value={draft.bankAccountNo}
                onChange={(e) => updateDraft("bankAccountNo", e.target.value)}
                placeholder="Account number"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Opening Balance</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.openingBalance}
                onChange={(e) => updateDraft("openingBalance", Number(e.target.value))}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Opening Balance Date</Label>
              <Input
                type="date"
                value={draft.openingBalanceDate}
                onChange={(e) => updateDraft("openingBalanceDate", e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={draft.status} onValueChange={(v) => updateDraft("status", v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Remarks</Label>
              <Textarea
                value={draft.remarks}
                onChange={(e) => updateDraft("remarks", e.target.value)}
                placeholder="Additional notes..."
                className="h-16 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="h-9 text-xs">
              {saving ? "Saving..." : editingVendor ? "Update Vendor" : "Add Vendor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) closeDetailDialog(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              {detailVendor?.vendorName}
            </DialogTitle>
          </DialogHeader>

          {detailVendor && (
            <div className="space-y-4">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 rounded-md border border-border p-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Vendor Code</Label>
                  <div className="font-mono text-sm font-medium text-primary">{detailVendor.vendorCode}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Vendor Type</Label>
                  <div className="text-sm">{detailVendor.vendorType}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Status</Label>
                  <div className="text-sm">{statusBadge(detailVendor.status)}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">PAN</Label>
                  <div className="font-mono text-sm">{detailVendor.pan || "-"}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">VAT Number</Label>
                  <div className="font-mono text-sm">{detailVendor.vatNumber || "-"}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">VAT Status</Label>
                  <div className="text-sm">{detailVendor.vatStatus}</div>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <Label className="text-[11px] text-muted-foreground">Address</Label>
                  <div className="text-sm">{detailVendor.address || "-"}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Contact Person</Label>
                  <div className="text-sm">{detailVendor.contactPerson || "-"}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Phone</Label>
                  <div className="text-sm">{detailVendor.phone || "-"}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Email</Label>
                  <div className="text-sm">{detailVendor.email || "-"}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Payment Terms</Label>
                  <div className="text-sm">{detailVendor.paymentTerms}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Credit Limit</Label>
                  <div className="text-sm font-medium">{money(detailVendor.creditLimit)}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Bank Name</Label>
                  <div className="text-sm">{detailVendor.bankName || "-"}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Bank Account No</Label>
                  <div className="font-mono text-sm">{detailVendor.bankAccountNo || "-"}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Opening Balance</Label>
                  <div className="text-sm font-medium">{money(detailVendor.openingBalance)}</div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Opening Balance Date</Label>
                  <div className="text-sm">{detailVendor.openingBalanceDate || "-"}</div>
                </div>
                {detailVendor.remarks && (
                  <div className="col-span-2 sm:col-span-3">
                    <Label className="text-[11px] text-muted-foreground">Remarks</Label>
                    <div className="text-sm">{detailVendor.remarks}</div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Documents ({detailDocs.length})</Label>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={handleDocUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1 size-3.5" /> Upload
                    </Button>
                  </div>
                </div>
                {detailDocs.length > 0 ? (
                  <div className="space-y-1.5">
                    {detailDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate font-medium">{doc.fileName}</span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            ({(doc.fileSize / 1024).toFixed(0)}KB)
                          </span>
                          <span className="text-muted-foreground">{doc.fileType}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.fileData && (
                            <a
                              href={doc.fileData}
                              download={doc.fileName}
                              className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent"
                              title="Download"
                            >
                              <Download className="size-3.5 text-muted-foreground" />
                            </a>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9"
                            title="Delete"
                            onClick={() => handleDeleteDoc(doc)}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
                    No documents uploaded yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
