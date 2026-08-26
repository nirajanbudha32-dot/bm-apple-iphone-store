import { useMemo, useState, useRef } from "react";
import { Download, Trash2, Plus, Check, PackagePlus, Upload, X, Smartphone, ChevronDown, ChevronUp } from "lucide-react";
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
  addPurchaseHeader,
  deletePurchaseHeader,
  addPurchaseAttachment,
  useStore,
  PAYMENT_METHODS,
  VAT_RATE,
  type PaymentMethod,
  type PurchaseHeader,
  type PurchaseItem,
  type StockItem,
  type Vendor,
} from "@/lib/store";
import { exportRows } from "@/lib/excel";
import { useDebounce } from "@/lib/use-debounce";
import { money } from "@/lib/utils";

type PurchaseItemDraft = {
  itemCode: string;
  itemName: string;
  category: string;
  subCategory: string;
  brand: string;
  model: string;
  unit: string;
  qty: number;
  rate: number;
  discount: number;
  amount: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  lotNo: string;
  imeis: string[];
  isNew: boolean;
};

function calcItemAmounts(qty: number, rate: number, discount: number, vatRate: number) {
  const amount = qty * rate - discount;
  const taxableAmount = amount;
  const vatAmount = taxableAmount * vatRate / 100;
  const total = taxableAmount + vatAmount;
  return { amount, taxableAmount, vatAmount, total };
}

const emptyDraft = (): PurchaseItemDraft => ({
  itemCode: "",
  itemName: "",
  category: "",
  subCategory: "",
  brand: "",
  model: "",
  unit: "PCS",
  qty: 1,
  rate: 0,
  discount: 0,
  amount: 0,
  taxableAmount: 0,
  vatRate: 13,
  vatAmount: 0,
  total: 0,
  lotNo: "",
  imeis: [],
  isNew: false,
});

export function PurchaseManager() {
  const { stock, purchaseHeaders, purchaseItems, purchaseImeis, purchaseAttachments, vendors } = useStore();

  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierPan, setSupplierPan] = useState("");
  const [supplierVat, setSupplierVat] = useState("");
  const [purchaseType, setPurchaseType] = useState<"Cash" | "Credit">("Cash");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [remarks, setRemarks] = useState("");
  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [draft, setDraft] = useState<PurchaseItemDraft>(emptyDraft());
  const [draftQty, setDraftQty] = useState(1);
  const [draftRate, setDraftRate] = useState(0);
  const [draftDiscount, setDraftDiscount] = useState(0);
  const [draftLotNo, setDraftLotNo] = useState("");
  const [draftImei, setDraftImei] = useState("");
  const [showImeiInput, setShowImeiInput] = useState(false);

  const [isNewItem, setIsNewItem] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");

  const [purchaseItemsDraft, setPurchaseItemsDraft] = useState<PurchaseItemDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const [attachments, setAttachments] = useState<{ file: File; data: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [itemName, setItemName] = useState("");
  const debouncedItemName = useDebounce(itemName, 150);

  const suggestions = useMemo(() => {
    const t = debouncedItemName.trim().toLowerCase();
    if (!t) return [];
    const exact = stock.some((i) => i.name.toLowerCase() === t);
    if (exact) return [];
    return stock.filter((i) =>
      [i.name, i.subCategory, i.brand, i.model, i.code]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [stock, debouncedItemName]);

  const matched = useMemo(
    () => stock.find((i) => i.name.toLowerCase() === itemName.trim().toLowerCase()),
    [stock, itemName],
  );

  const draftAmounts = useMemo(
    () => calcItemAmounts(draftQty, draftRate, draftDiscount, 13),
    [draftQty, draftRate, draftDiscount],
  );

  const headerTotals = useMemo(() => {
    const grossAmount = purchaseItemsDraft.reduce((a, i) => a + i.amount, 0);
    const totalVat = purchaseItemsDraft.reduce((a, i) => a + i.vatAmount, 0);
    const taxableAmount = grossAmount;
    const vatAmount = totalVat;
    const grandTotal = taxableAmount + vatAmount + otherCharges - headerDiscount;
    const remainingBalance = grandTotal - paidAmount;
    return { grossAmount, taxableAmount, vatAmount, grandTotal, remainingBalance };
  }, [purchaseItemsDraft, headerDiscount, otherCharges, paidAmount]);

  function pick(name: string) {
    const item = stock.find((i) => i.name === name);
    setItemName(name);
    if (item) {
      setDraftRate(item.purchasePrice || 0);
      setIsNewItem(false);
      setDraft((d) => ({
        ...d,
        itemCode: item.code,
        itemName: item.name,
        category: item.category,
        subCategory: item.subCategory,
        brand: item.brand,
        model: item.model,
        unit: item.unit || "PCS",
        isNew: false,
      }));
    }
  }

  function addToPurchase() {
    const name = itemName.trim() || draft.itemName.trim();
    if (!name) {
      toast.error("Enter an item name");
      return;
    }
    if (draftQty <= 0) {
      toast.error("Enter valid quantity");
      return;
    }
    if (draftRate <= 0) {
      toast.error("Enter valid rate");
      return;
    }

    const cat = isNewItem ? newCategory.trim() : (matched?.category ?? draft.category);
    const subCat = isNewItem ? newSubCategory.trim() : (matched?.subCategory ?? draft.subCategory);
    const brand = isNewItem ? newBrand.trim() : (matched?.brand ?? draft.brand);
    const model = isNewItem ? newModel.trim() : (matched?.model ?? draft.model);

    if (isNewItem && (!cat || !brand)) {
      toast.error("Category and Brand are required for new items");
      return;
    }

    const { amount, taxableAmount, vatAmount, total } = calcItemAmounts(draftQty, draftRate, draftDiscount, 13);

    const newItem: PurchaseItemDraft = {
      itemCode: matched?.code ?? draft.itemCode ?? "",
      itemName: name,
      category: cat,
      subCategory: subCat,
      brand,
      model,
      unit: matched?.unit || draft.unit || "PCS",
      qty: draftQty,
      rate: draftRate,
      discount: draftDiscount,
      amount,
      taxableAmount,
      vatRate: 13,
      vatAmount,
      total,
      lotNo: draftLotNo.trim(),
      imeis: showImeiInput && draftImei.trim() ? [draftImei.trim()] : [],
      isNew: isNewItem && !matched,
    };

    setPurchaseItemsDraft((prev) => [...prev, newItem]);
    setItemName("");
    setDraft(emptyDraft());
    setDraftQty(1);
    setDraftRate(0);
    setDraftDiscount(0);
    setDraftLotNo("");
    setDraftImei("");
    setShowImeiInput(false);
    setIsNewItem(false);
    setNewCategory("");
    setNewSubCategory("");
    setNewBrand("");
    setNewModel("");
  }

  function addImeiToItem(itemIdx: number, imei: string) {
    if (!imei.trim()) return;
    if (!/^\d{15}$/.test(imei.trim())) {
      toast.error("IMEI must be 15 digits");
      return;
    }
    setPurchaseItemsDraft((prev) =>
      prev.map((item, i) =>
        i === itemIdx ? { ...item, imeis: [...item.imeis, imei.trim()] } : item,
      ),
    );
  }

  function removeImeiFromItem(itemIdx: number, imeiIdx: number) {
    setPurchaseItemsDraft((prev) =>
      prev.map((item, i) =>
        i === itemIdx ? { ...item, imeis: item.imeis.filter((_, j) => j !== imeiIdx) } : item,
      ),
    );
  }

  function removePurchaseItem(index: number) {
    setPurchaseItemsDraft((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: { file: File; data: string }[] = [];
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
      reader.onload = () => {
        newAttachments.push({ file, data: reader.result as string });
        loaded++;
        if (loaded === total) {
          setAttachments((prev) => [...prev, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function savePurchase() {
    if (!supplierName.trim()) {
      toast.error("Enter supplier name");
      return;
    }
    if (purchaseItemsDraft.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);

    const items: Omit<PurchaseItem, "id" | "purchaseHeaderId">[] = purchaseItemsDraft.map((item, idx) => ({
      sn: idx + 1,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      subCategory: item.subCategory,
      brand: item.brand,
      model: item.model,
      unit: item.unit,
      qty: item.qty,
      rate: item.rate,
      discount: item.discount,
      amount: item.amount,
      taxableAmount: item.taxableAmount,
      vatRate: item.vatRate,
      vatAmount: item.vatAmount,
      total: item.total,
      lotNo: item.lotNo,
    }));

    const imeisByItem: Record<number, string[]> = {};
    purchaseItemsDraft.forEach((item, idx) => {
      if (item.imeis.length > 0) {
        imeisByItem[idx] = item.imeis;
      }
    });

    const header: Omit<PurchaseHeader, "id" | "createdAt"> = {
      purchaseNo: "",
      supplierInvoiceNo: supplierInvoiceNo.trim(),
      date,
      supplierName: supplierName.trim(),
      supplierAddress: supplierAddress.trim(),
      supplierPan: supplierPan.trim(),
      supplierVat: supplierVat.trim(),
      purchaseType,
      dueDate: purchaseType === "Credit" ? dueDate : "",
      remarks: remarks.trim(),
      paymentMethod,
      grossAmount: headerTotals.grossAmount,
      discount: headerDiscount,
      taxableAmount: headerTotals.taxableAmount,
      vatRate: 13,
      vatAmount: headerTotals.vatAmount,
      otherCharges,
      grandTotal: headerTotals.grandTotal,
      paidAmount,
      remainingBalance: headerTotals.remainingBalance,
      vendorId: selectedVendorId || "",
    };

    const result = await addPurchaseHeader(header, items, imeisByItem);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    // Save attachments if any
    if (result.headerId && attachments.length > 0) {
      for (const att of attachments) {
        const { error } = await addPurchaseAttachment(
          result.headerId,
          att.file.name,
          att.file.type,
          att.file.size,
          att.data,
        );
        if (error) toast.error(`Attachment failed: ${error}`);
      }
    }

    toast.success(`Purchase saved with ${purchaseItemsDraft.length} items`);
    setSelectedVendorId("");
    setSupplierName("");
    setSupplierInvoiceNo("");
    setSupplierAddress("");
    setSupplierPan("");
    setSupplierVat("");
    setPurchaseType("Cash");
    setDueDate("");
    setPaymentMethod("Cash");
    setRemarks("");
    setHeaderDiscount(0);
    setOtherCharges(0);
    setPaidAmount(0);
    setPurchaseItemsDraft([]);
    setAttachments([]);
  }

  function onExport() {
    if (purchaseHeaders.length === 0) {
      toast.error("No purchases to export");
      return;
    }
    const rows: Record<string, string | number>[] = [];
    for (const h of purchaseHeaders) {
      const items = purchaseItems.filter((pi) => pi.purchaseHeaderId === h.id);
      if (items.length === 0) continue;
      for (const item of items) {
        rows.push({
          "Purchase No": h.purchaseNo,
          Date: h.date,
          "Supplier Invoice": h.supplierInvoiceNo,
          Supplier: h.supplierName,
          "Purchase Type": h.purchaseType,
          "Payment Method": h.paymentMethod,
          SN: item.sn,
          Item: item.itemName,
          Category: item.category,
          Brand: item.brand,
          Model: item.model,
          Unit: item.unit,
          Qty: item.qty,
          Rate: item.rate,
          Discount: item.discount,
          Amount: item.amount,
          "VAT 13%": item.vatAmount,
          Total: item.total,
          "Grand Total": h.grandTotal,
          "Paid Amount": h.paidAmount,
          Remaining: h.remainingBalance,
        });
      }
    }
    exportRows(rows, "Purchases", `BM_Purchases_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const PER_PAGE = 50;
  const [purchasePage, setPurchasePage] = useState(0);
  const [purchaseFilter, setPurchaseFilter] = useState("");
  const debouncedFilter = useDebounce(purchaseFilter, 150);

  const groupedHeaders = useMemo(() => {
    const map = new Map<string, { header: PurchaseHeader; items: PurchaseItem[] }>();
    for (const h of purchaseHeaders) {
      map.set(h.id, { header: h, items: [] });
    }
    for (const pi of purchaseItems) {
      const g = map.get(pi.purchaseHeaderId);
      if (g) g.items.push(pi);
    }
    return Array.from(map.values());
  }, [purchaseHeaders, purchaseItems]);

  const filteredHeaders = useMemo(() => {
    const t = debouncedFilter.trim().toLowerCase();
    if (!t) return groupedHeaders;
    return groupedHeaders.filter((g) => {
      const h = g.header;
      const itemText = g.items.map((i) => i.itemName + " " + i.category + " " + i.brand).join(" ");
      return [h.purchaseNo, h.date, h.supplierName, h.supplierInvoiceNo, h.paymentMethod, itemText]
        .join(" ")
        .toLowerCase()
        .includes(t);
    });
  }, [groupedHeaders, debouncedFilter]);

  const totalPages = Math.ceil(filteredHeaders.length / PER_PAGE);
  const pagedHeaders = filteredHeaders.slice(purchasePage * PER_PAGE, (purchasePage + 1) * PER_PAGE);

  return (
    <div className="space-y-4">
      {/* PURCHASE HEADER FORM */}
      <Card className="p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Purchase Header</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label className="text-xs sm:text-sm">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Select Vendor</Label>
            <Select value={selectedVendorId} onValueChange={(v) => {
              setSelectedVendorId(v);
              const vendor = vendors.find(vend => vend.id === v);
              if (vendor) {
                setSupplierName(vendor.vendorName);
                setSupplierAddress(vendor.address || "");
                setSupplierPan(vendor.pan || "");
                setSupplierVat(vendor.vatNumber || "");
              }
            }}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue placeholder="Select vendor (optional)" /></SelectTrigger>
              <SelectContent>
                {vendors.filter(v => v.status === "Active").map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.vendorCode} - {v.vendorName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Purchase No</Label>
            <Input value="Auto-generated" readOnly className="h-9 text-xs sm:text-sm bg-muted/50 font-mono" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Supplier Invoice No</Label>
            <Input value={supplierInvoiceNo} onChange={(e) => setSupplierInvoiceNo(e.target.value)} placeholder="Supplier's bill no" className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Supplier Name *</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier name" className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Supplier Address</Label>
            <Input value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} placeholder="Address" className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Supplier PAN</Label>
            <Input value={supplierPan} onChange={(e) => setSupplierPan(e.target.value)} placeholder="PAN number" className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Supplier VAT No</Label>
            <Input value={supplierVat} onChange={(e) => setSupplierVat(e.target.value)} placeholder="VAT number" className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Purchase Type</Label>
            <Select value={purchaseType} onValueChange={(v) => setPurchaseType(v as "Cash" | "Credit")}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {purchaseType === "Credit" && (
            <div>
              <Label className="text-xs sm:text-sm">Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-xs sm:text-sm" />
            </div>
          )}
          <div>
            <Label className="text-xs sm:text-sm">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs sm:text-sm">Remarks</Label>
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes..." className="h-16 text-xs sm:text-sm mt-1" />
        </div>
      </Card>

      {/* ITEM ENTRY */}
      <Card className="p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Add Items</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-12">
          <div className="relative sm:col-span-4">
            <Label className="text-xs sm:text-sm">Item *</Label>
            <Input
              value={itemName}
              onChange={(e) => { setItemName(e.target.value); setIsNewItem(false); }}
              placeholder="Type item name..."
              autoComplete="off"
              className="h-9 text-xs sm:text-sm"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.code + s.name}>
                    <button type="button" className="w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-accent" onClick={() => pick(s.name)}>
                      <span className="font-medium">{s.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {s.subCategory} · {s.category} · {s.brand} · stock {s.qty}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-4">
            <div>
              <Label className="text-xs sm:text-sm">Qty *</Label>
              <Input type="number" min="1" value={draftQty} onChange={(e) => setDraftQty(Number(e.target.value))} className="h-9 text-xs sm:text-sm" />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Rate *</Label>
              <Input type="number" min="0" step="0.01" value={draftRate} onChange={(e) => setDraftRate(Number(e.target.value))} className="h-9 text-xs sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-4">
            <div>
              <Label className="text-xs sm:text-sm">Discount</Label>
              <Input type="number" min="0" step="0.01" value={draftDiscount} onChange={(e) => setDraftDiscount(Number(e.target.value))} className="h-9 text-xs sm:text-sm" />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Supplier Lot No</Label>
              <Input value={draftLotNo} onChange={(e) => setDraftLotNo(e.target.value)} placeholder="Batch/Lot" className="h-9 text-xs sm:text-sm" />
            </div>
          </div>
        </div>

        {/* IMEI Entry */}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImeiInput(!showImeiInput)}
            className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
              showImeiInput ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            <Smartphone className="size-3.5" />
            Add IMEI
          </button>
          {showImeiInput && (
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input
                value={draftImei}
                onChange={(e) => setDraftImei(e.target.value)}
                placeholder="15-digit IMEI"
                maxLength={15}
                className="h-8 text-xs font-mono"
              />
            </div>
          )}
        </div>

        {/* New Item Fields */}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground sm:grid-cols-4 flex-1">
            <div>Category: <strong className="text-foreground">{matched?.category || (isNewItem ? newCategory || "-" : draft.category || "-")}</strong></div>
            <div>Sub Category: <strong className="text-foreground">{matched?.subCategory || (isNewItem ? newSubCategory || "-" : draft.subCategory || "-")}</strong></div>
            <div>Brand: <strong className="text-foreground">{matched?.brand || (isNewItem ? newBrand || "-" : draft.brand || "-")}</strong></div>
            <div>Model: <strong className="text-foreground">{matched?.model || (isNewItem ? newModel || "-" : draft.model || "-")}</strong></div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !isNewItem;
              setIsNewItem(next);
              if (next) {
                setNewCategory(matched?.category ?? draft.category ?? "");
                setNewSubCategory(matched?.subCategory ?? draft.subCategory ?? "");
                setNewBrand(matched?.brand ?? draft.brand ?? "");
                setNewModel(matched?.model ?? draft.model ?? "");
              }
            }}
            className={`flex h-8 items-center gap-2 rounded-md border px-3 text-xs transition-colors shrink-0 ${
              isNewItem ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isNewItem ? "border-primary bg-primary" : "border-muted-foreground"}`}>
              {isNewItem && <Check className="size-3" />}
            </div>
            New Item
          </button>
        </div>

        {isNewItem && (
          <div className="mt-3 grid gap-2 grid-cols-2 sm:grid-cols-4 rounded-md border border-dashed border-primary/40 bg-primary/5 p-2.5">
            <div>
              <Label className="text-[11px] sm:text-xs">Category *</Label>
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Phone" className="h-8 text-xs sm:text-sm" />
            </div>
            <div>
              <Label className="text-[11px] sm:text-xs">Sub Category</Label>
              <Input value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} placeholder="e.g. iPhone" className="h-8 text-xs sm:text-sm" />
            </div>
            <div>
              <Label className="text-[11px] sm:text-xs">Brand *</Label>
              <Input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="e.g. Apple" className="h-8 text-xs sm:text-sm" />
            </div>
            <div>
              <Label className="text-[11px] sm:text-xs">Model</Label>
              <Input value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="e.g. 16 Pro" className="h-8 text-xs sm:text-sm" />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Amount: <strong className="text-foreground">{money(draftAmounts.amount)}</strong>
            <span className="mx-1">|</span>
            VAT 13%: <strong className="text-foreground">{money(draftAmounts.vatAmount)}</strong>
            <span className="mx-1">|</span>
            Total: <strong className="text-foreground">{money(draftAmounts.total)}</strong>
          </div>
          <Button onClick={addToPurchase} className="h-9 text-xs sm:text-sm">
            <Plus className="mr-1 size-3.5" /> Add to Purchase
          </Button>
        </div>
      </Card>

      {/* PURCHASE ITEMS TABLE */}
      {purchaseItemsDraft.length > 0 && (
        <Card className="p-3 sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
            Purchase Items ({purchaseItemsDraft.length})
          </p>
          <div className="max-h-[35vh] overflow-x-auto overflow-y-auto rounded-md border border-border">
            <table className="w-full min-w-[900px] text-xs sm:text-sm">
              <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                <tr className="text-left">
                  <th className="p-2">#</th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Disc</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-right">VAT</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2">Lot No</th>
                  <th className="p-2"></th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {purchaseItemsDraft.map((item, idx) => (
                  <>
                    <tr key={idx} className="border-t border-border">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 font-medium">
                        {item.itemName}
                        {item.isNew && (
                          <span className="ml-1 inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">NEW</span>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">{item.unit}</td>
                      <td className="p-2 text-right font-semibold">{item.qty}</td>
                      <td className="p-2 text-right">{money(item.rate)}</td>
                      <td className="p-2 text-right text-muted-foreground">{item.discount > 0 ? money(item.discount) : "-"}</td>
                      <td className="p-2 text-right">{money(item.amount)}</td>
                      <td className="p-2 text-right text-muted-foreground">{money(item.vatAmount)}</td>
                      <td className="p-2 text-right font-medium">{money(item.total)}</td>
                      <td className="p-2 text-muted-foreground">{item.lotNo || "-"}</td>
                      <td className="p-2 text-right">
                        {item.imeis.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{item.imeis.length} IMEI</Badge>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex gap-1">
                          {item.imeis.length === 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                              className="h-7 w-7"
                              title="Add IMEI"
                            >
                              <Smartphone className="size-3 text-muted-foreground" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => removePurchaseItem(idx)} className="h-7 w-7">
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {item.imeis.length > 0 && (
                      <tr key={`${idx}-imeis`} className="border-t border-border bg-muted/30">
                        <td colSpan={11} className="p-2">
                          <div className="flex flex-wrap gap-1.5">
                            {item.imeis.map((imei, ii) => (
                              <span key={ii} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-mono">
                                {imei}
                                <button onClick={() => removeImeiFromItem(idx, ii)} className="text-muted-foreground hover:text-destructive">
                                  <X className="size-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    {expandedItem === idx && item.imeis.length === 0 && (
                      <tr key={`${idx}-imei-input`} className="border-t border-border bg-muted/30">
                        <td colSpan={11} className="p-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Enter 15-digit IMEI"
                              maxLength={15}
                              className="h-8 text-xs font-mono max-w-xs"
                              id={`imei-input-${idx}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => {
                                const input = document.getElementById(`imei-input-${idx}`) as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  addImeiToItem(idx, input.value.trim());
                                  input.value = "";
                                }
                              }}
                            >
                              Add
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setExpandedItem(null)}>
                              Close
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS BAR */}
          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm">
              <div>
                <Label className="text-[11px] text-muted-foreground">Gross Amount</Label>
                <div className="font-semibold">{money(headerTotals.grossAmount)}</div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Header Discount</Label>
                <Input type="number" min="0" step="0.01" value={headerDiscount} onChange={(e) => setHeaderDiscount(Number(e.target.value))} className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Other Charges</Label>
                <Input type="number" min="0" step="0.01" value={otherCharges} onChange={(e) => setOtherCharges(Number(e.target.value))} className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Taxable Amount</Label>
                <div className="font-semibold">{money(headerTotals.taxableAmount)}</div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">VAT 13%</Label>
                <div className="font-semibold">{money(headerTotals.vatAmount)}</div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Grand Total</Label>
                <div className="text-lg font-bold text-primary">{money(headerTotals.grandTotal)}</div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Paid Amount</Label>
                <Input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Remaining Balance</Label>
                <div className={`font-semibold ${headerTotals.remainingBalance > 0 ? "text-destructive" : "text-green-600"}`}>
                  {money(headerTotals.remainingBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* ATTACHMENTS */}
          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs sm:text-sm">Attachments</Label>
              <div>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1 size-3.5" /> Upload File
                </Button>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs">
                    <span className="truncate max-w-[150px]">{att.file.name}</span>
                    <span className="text-muted-foreground">({(att.file.size / 1024).toFixed(0)}KB)</span>
                    <button onClick={() => removeAttachment(idx)} className="text-muted-foreground hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground">
              <span>Items: <strong className="text-foreground">{purchaseItemsDraft.length}</strong></span>
              <span>Total Qty: <strong className="text-foreground">{purchaseItemsDraft.reduce((a, i) => a + i.qty, 0)}</strong></span>
            </div>
            <div className="flex gap-2">
              <Button onClick={savePurchase} disabled={saving} className="flex-1 sm:flex-initial">
                <PackagePlus className="mr-1 size-3.5" /> {saving ? "Saving..." : "Save Purchase"}
              </Button>
              <Button variant="outline" onClick={onExport} className="flex-1 sm:flex-initial">
                <Download className="mr-1 size-3.5" /> Export Excel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {purchaseItemsDraft.length === 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onExport} size="sm" className="text-xs sm:text-sm">
            <Download className="mr-1 size-3.5" /> Export Excel
          </Button>
        </div>
      )}

      {/* PURCHASE HISTORY */}
      <Card className="overflow-hidden p-0">
        <div className="p-2.5 border-b border-border">
          <Input
            placeholder="Search purchases..."
            value={purchaseFilter}
            onChange={(e) => { setPurchaseFilter(e.target.value); setPurchasePage(0); }}
            className="h-9 text-xs sm:text-sm"
          />
        </div>
        <div className="max-h-[50vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[850px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Purchase No</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5 text-right">Items</th>
                <th className="p-2.5 text-right">Grand Total</th>
                <th className="p-2.5 text-right">Paid</th>
                <th className="p-2.5 text-right">Remaining</th>
                <th className="p-2.5">Payment</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {pagedHeaders.map((g) => (
                <tr key={g.header.id} className="border-t border-border">
                  <td className="p-2.5 font-mono font-medium text-primary">{g.header.purchaseNo}</td>
                  <td className="p-2.5 whitespace-nowrap">{g.header.date}</td>
                  <td className="p-2.5 font-medium">{g.header.supplierName}</td>
                  <td className="p-2.5">
                    <Badge variant={g.header.purchaseType === "Credit" ? "destructive" : "secondary"} className="text-[10px]">
                      {g.header.purchaseType}
                    </Badge>
                  </td>
                  <td className="p-2.5 text-right">{g.items.length}</td>
                  <td className="p-2.5 text-right font-semibold">{money(g.header.grandTotal)}</td>
                  <td className="p-2.5 text-right">{money(g.header.paidAmount)}</td>
                  <td className={`p-2.5 text-right font-medium ${g.header.remainingBalance > 0 ? "text-destructive" : ""}`}>
                    {money(g.header.remainingBalance)}
                  </td>
                  <td className="p-2.5">
                    <Badge variant="outline" className="text-[10px]">{g.header.paymentMethod}</Badge>
                  </td>
                  <td className="p-2.5 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Delete purchase ${g.header.purchaseNo}? This will restore ${g.items.length} item(s) from stock. This cannot be undone.`)) {
                          deletePurchaseHeader(g.header.id).then((res) => {
                            if (res.error) toast.error(res.error);
                            else toast.success(`Deleted ${g.header.purchaseNo}`);
                          });
                        }
                      }}
                      className="h-7 w-7"
                    >
                      <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredHeaders.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-muted-foreground">
                    No purchases recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>
            Showing {purchasePage * PER_PAGE + 1}–{Math.min((purchasePage + 1) * PER_PAGE, filteredHeaders.length)} of {filteredHeaders.length} purchases
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={purchasePage === 0} onClick={() => setPurchasePage((p) => p - 1)} className="h-8 text-xs">
              Prev
            </Button>
            <span className="flex items-center px-2 text-xs">
              {purchasePage + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={purchasePage >= totalPages - 1} onClick={() => setPurchasePage((p) => p + 1)} className="h-8 text-xs">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
