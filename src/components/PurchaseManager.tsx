import { useMemo, useState } from "react";
import { Download, Trash2, Plus, Check, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addPurchase,
  deletePurchase,
  useStore,
  PAYMENT_METHODS,
  type PaymentMethod,
  type Purchase,
  type StockItem,
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
  qty: number;
  rate: number;
  amount: number;
  note: string;
  isNew: boolean;
};

const emptyDraft: PurchaseItemDraft = {
  itemCode: "",
  itemName: "",
  category: "",
  subCategory: "",
  brand: "",
  model: "",
  qty: 1,
  rate: 0,
  amount: 0,
  note: "",
  isNew: false,
};

export function PurchaseManager() {
  const { stock, purchases } = useStore();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [billNo, setBillNo] = useState("");
  const [supplier, setSupplier] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");

  const [itemName, setItemName] = useState("");
  const debouncedItemName = useDebounce(itemName, 150);
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState(0);
  const [itemNote, setItemNote] = useState("");

  const [isNewItem, setIsNewItem] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemDraft[]>([]);
  const [saving, setSaving] = useState(false);

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

  const purchaseTotal = useMemo(
    () => purchaseItems.reduce((a, i) => a + i.amount, 0),
    [purchaseItems],
  );

  function pick(name: string) {
    const item = stock.find((i) => i.name === name);
    setItemName(name);
    if (item) {
      setItemRate(item.purchasePrice || 0);
      setIsNewItem(false);
    }
  }

  function toggleNewItem() {
    const next = !isNewItem;
    setIsNewItem(next);
    if (next) {
      setNewCategory(matched?.category ?? "");
      setNewSubCategory(matched?.subCategory ?? "");
      setNewBrand(matched?.brand ?? "");
      setNewModel(matched?.model ?? "");
    }
  }

  function addToPurchase() {
    if (!itemName.trim()) {
      toast.error("Enter an item name");
      return;
    }
    if (itemQty <= 0) {
      toast.error("Enter valid quantity");
      return;
    }
    if (itemRate <= 0) {
      toast.error("Enter valid rate");
      return;
    }

    const cat = isNewItem ? newCategory.trim() : (matched?.category ?? "");
    const subCat = isNewItem ? newSubCategory.trim() : (matched?.subCategory ?? "");
    const brand = isNewItem ? newBrand.trim() : (matched?.brand ?? "");
    const model = isNewItem ? newModel.trim() : (matched?.model ?? "");

    if (isNewItem && (!cat || !brand)) {
      toast.error("Category and Brand are required for new items");
      return;
    }

    const amount = itemQty * itemRate;
    const newItem: PurchaseItemDraft = {
      itemCode: matched?.code ?? "",
      itemName: itemName.trim(),
      category: cat,
      subCategory: subCat,
      brand,
      model,
      qty: itemQty,
      rate: itemRate,
      amount,
      note: itemNote.trim(),
      isNew: isNewItem && !matched,
    };
    setPurchaseItems((prev) => [...prev, newItem]);
    setItemName("");
    setItemQty(1);
    setItemRate(0);
    setItemNote("");
    setIsNewItem(false);
    setNewCategory("");
    setNewSubCategory("");
    setNewBrand("");
    setNewModel("");
  }

  function removePurchaseItem(index: number) {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function savePurchase() {
    if (!supplier.trim()) {
      toast.error("Enter supplier name");
      return;
    }
    if (purchaseItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    let errors = 0;
    for (const item of purchaseItems) {
      const { error } = await addPurchase({
        billNo: billNo.trim() || `PUR-${Date.now()}`,
        date,
        supplier: supplier.trim(),
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category,
        subCategory: item.subCategory,
        brand: item.brand,
        model: item.model,
        qty: item.qty,
        rate: item.rate,
        amount: item.amount,
        paymentMethod,
        note: item.note,
      });
      if (error) {
        toast.error(`Failed to save ${item.itemName}: ${error.message}`);
        errors++;
      }
    }
    setSaving(false);
    if (errors === 0) {
      toast.success(`Purchase saved with ${purchaseItems.length} items`);
      setSupplier("");
      setBillNo("");
      setPurchaseItems([]);
      setPaymentMethod("Cash");
    }
  }

  function onExport() {
    if (purchases.length === 0) {
      toast.error("No purchases to export");
      return;
    }
    exportRows(
      purchases.map((p) => ({
        Date: p.date,
        "Bill No": p.billNo,
        Supplier: p.supplier,
        "Item Code": p.itemCode,
        Item: p.itemName,
        Category: p.category,
        "Sub Category": p.subCategory,
        Brand: p.brand,
        Model: p.model,
        Qty: p.qty,
        Rate: p.rate,
        Amount: p.amount,
        "Payment Method": p.paymentMethod,
        Note: p.note,
      })),
      "Purchases",
      `BM_Purchases_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  const PURCHASES_PER_PAGE = 50;
  const [purchasePage, setPurchasePage] = useState(0);
  const [purchaseFilter, setPurchaseFilter] = useState("");
  const debouncedFilter = useDebounce(purchaseFilter, 150);

  const filteredPurchases = useMemo(() => {
    const t = debouncedFilter.trim().toLowerCase();
    if (!t) return purchases;
    return purchases.filter((p) =>
      [p.date, p.billNo, p.supplier, p.itemName, p.category, p.brand, p.model, p.paymentMethod]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [purchases, debouncedFilter]);

  const totalPages = Math.ceil(filteredPurchases.length / PURCHASES_PER_PAGE);
  const pagedPurchases = filteredPurchases.slice(
    purchasePage * PURCHASES_PER_PAGE,
    (purchasePage + 1) * PURCHASES_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label htmlFor="p-date" className="text-xs sm:text-sm">Date</Label>
            <Input id="p-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="p-bill" className="text-xs sm:text-sm">Bill No (auto if empty)</Label>
            <Input id="p-bill" value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="e.g. INV-001" className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="p-supplier" className="text-xs sm:text-sm">Supplier</Label>
            <Input id="p-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" className="h-9 text-xs sm:text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">Add items to purchase</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-12">
            <div className="relative sm:col-span-6 md:col-span-4">
              <Label htmlFor="p-item" className="text-xs sm:text-sm">Item</Label>
              <Input
                id="p-item"
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  setIsNewItem(false);
                }}
                placeholder="Type item name to search..."
                autoComplete="off"
                className="h-9 text-xs sm:text-sm"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
                  {suggestions.map((s) => (
                    <li key={s.code + s.name}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-accent"
                        onClick={() => pick(s.name)}
                      >
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
            <div className="grid grid-cols-2 gap-2 sm:col-span-6 md:col-span-3">
              <div>
                <Label htmlFor="p-qty" className="text-xs sm:text-sm">Qty</Label>
                <Input id="p-qty" type="number" min="1" value={itemQty} onChange={(e) => setItemQty(Number(e.target.value))} className="h-9 text-xs sm:text-sm" />
              </div>
              <div>
                <Label htmlFor="p-rate" className="text-xs sm:text-sm">Rate</Label>
                <Input id="p-rate" type="number" min="0" step="0.01" value={itemRate} onChange={(e) => setItemRate(Number(e.target.value))} className="h-9 text-xs sm:text-sm" />
              </div>
            </div>
            <div className="sm:col-span-6 md:col-span-3">
              <Label htmlFor="p-note" className="text-xs sm:text-sm">Note (optional)</Label>
              <Input id="p-note" value={itemNote} onChange={(e) => setItemNote(e.target.value)} placeholder="e.g. color, size" className="h-9 text-xs sm:text-sm" />
            </div>
            <div className="flex items-end sm:col-span-12 md:col-span-2">
              <Button onClick={addToPurchase} className="h-9 w-full text-xs sm:text-sm">
                <Plus className="mr-1 size-3.5 sm:size-4" /> Add
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground sm:grid-cols-4 flex-1">
              <div>
                Category: <strong className="text-foreground">{matched?.category || (isNewItem ? newCategory || "-" : "-")}</strong>
              </div>
              <div>
                Sub Category: <strong className="text-foreground">{matched?.subCategory || (isNewItem ? newSubCategory || "-" : "-")}</strong>
              </div>
              <div>
                Brand: <strong className="text-foreground">{matched?.brand || (isNewItem ? newBrand || "-" : "-")}</strong>
              </div>
              <div>
                Model: <strong className="text-foreground">{matched?.model || (isNewItem ? newModel || "-" : "-")}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleNewItem}
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs sm:text-sm transition-colors shrink-0 ${
                isNewItem
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                isNewItem ? "border-primary bg-primary" : "border-muted-foreground"
              }`}>
                {isNewItem && <Check className="size-3" />}
              </div>
              New Item
            </button>
          </div>

          {isNewItem && (
            <div className="mt-3 grid gap-2 grid-cols-2 sm:grid-cols-4 rounded-md border border-dashed border-primary/40 bg-primary/5 p-2.5">
              <div>
                <Label className="text-[11px] sm:text-xs">Category *</Label>
                <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Cable" className="h-8 text-xs sm:text-sm" />
              </div>
              <div>
                <Label className="text-[11px] sm:text-xs">Sub Category</Label>
                <Input value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} placeholder="e.g. USB-C" className="h-8 text-xs sm:text-sm" />
              </div>
              <div>
                <Label className="text-[11px] sm:text-xs">Brand *</Label>
                <Input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="e.g. Apple" className="h-8 text-xs sm:text-sm" />
              </div>
              <div>
                <Label className="text-[11px] sm:text-xs">Model</Label>
                <Input value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="e.g. 1m" className="h-8 text-xs sm:text-sm" />
              </div>
            </div>
          )}
        </div>

        {purchaseItems.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
              Purchase items ({purchaseItems.length})
            </p>
            <div className="max-h-[35vh] overflow-x-auto overflow-y-auto rounded-md border border-border">
              <table className="w-full min-w-[600px] text-xs sm:text-sm">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr className="text-left">
                    <th className="p-2">#</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Brand</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Note</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseItems.map((item, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 font-medium">
                        {item.itemName}
                        {item.isNew && (
                          <span className="ml-1 inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            NEW
                          </span>
                        )}
                      </td>
                      <td className="p-2">{item.category}</td>
                      <td className="p-2">{item.brand}</td>
                      <td className="p-2 text-right font-semibold">{item.qty}</td>
                      <td className="p-2 text-right">{money(item.rate)}</td>
                      <td className="p-2 text-right">{money(item.amount)}</td>
                      <td className="p-2 text-muted-foreground">{item.note || "-"}</td>
                      <td className="p-2 text-right">
                        <Button size="icon" variant="ghost" onClick={() => removePurchaseItem(idx)} className="h-7 w-7">
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                <span>
                  Total: <strong>{money(purchaseTotal)}</strong>
                </span>
              </div>
              <div className="flex gap-2">
                <Button onClick={savePurchase} disabled={saving} className="flex-1 sm:flex-initial">
                  {saving ? "Saving..." : "Save Purchase"}
                </Button>
                <Button variant="outline" onClick={onExport} className="flex-1 sm:flex-initial">
                  <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
                </Button>
              </div>
            </div>
          </div>
        )}

        {purchaseItems.length === 0 && (
          <div className="mt-4 flex justify-end border-t border-border pt-4">
            <Button variant="outline" onClick={onExport} size="sm" className="text-xs sm:text-sm">
              <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
            </Button>
          </div>
        )}
      </Card>

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
          <table className="w-full min-w-[700px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Bill No</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Brand</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Rate</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Payment</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {pagedPurchases.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-2.5 whitespace-nowrap">{p.date}</td>
                  <td className="p-2.5 font-mono">{p.billNo}</td>
                  <td className="p-2.5 font-medium">{p.itemName}</td>
                  <td className="p-2.5">{p.category}</td>
                  <td className="p-2.5">{p.brand}</td>
                  <td className="p-2.5 text-right font-semibold">{p.qty}</td>
                  <td className="p-2.5 text-right">{money(p.rate)}</td>
                  <td className="p-2.5 text-right font-medium">{money(p.amount)}</td>
                  <td className="p-2.5">{p.supplier}</td>
                  <td className="p-2.5">{p.paymentMethod}</td>
                  <td className="p-2.5 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Delete purchase ${p.billNo} (${p.itemName})? This cannot be undone.`)) {
                          deletePurchase(p.id);
                          toast.success(`Deleted purchase ${p.billNo}`);
                        }
                      }}
                      className="h-7 w-7"
                    >
                      <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-muted-foreground">
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
            Showing {purchasePage * PURCHASES_PER_PAGE + 1}–{Math.min((purchasePage + 1) * PURCHASES_PER_PAGE, filteredPurchases.length)} of {filteredPurchases.length} purchases
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
