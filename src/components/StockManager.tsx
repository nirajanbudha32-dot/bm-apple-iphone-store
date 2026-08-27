import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { deleteStock, nextItemCode, upsertStock, useStore, type StockItem } from "@/lib/store";
import { exportRows } from "@/lib/excel";

const empty: StockItem = {
  code: "",
  name: "",
  category: "",
  subCategory: "",
  brand: "",
  subBrand: "",
  model: "",
  unit: "PCS",
  qty: 0,
  purchasePrice: 0,
  sellingPrice: 0,
};

export function StockManager({ role = "admin" }: { role?: "admin" | "salesman" }) {
  const { stock } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<StockItem>(empty);
  const [editingCode, setEditingCode] = useState<string | undefined>();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return stock;
    return stock.filter((i) =>
      [i.name, i.brand, i.model, i.category, i.subCategory, i.code]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [stock, q]);

  const totalQty = filtered.reduce((s, i) => s + i.qty, 0);

  async function startAdd() {
    const code = await nextItemCode();
    setDraft({ ...empty, code });
    setEditingCode(undefined);
    setOpen(true);
  }

  function startEdit(item: StockItem) {
    setDraft(item);
    setEditingCode(item.code);
    setOpen(true);
  }

  async function save() {
    if (!draft.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    await upsertStock(draft, editingCode);
    setOpen(false);
    toast.success(editingCode ? "Item updated" : "Item added");
  }

  function onExport() {
    exportRows(
      filtered.map((i) => ({
        "Item Code": i.code,
        "Item Name": i.name,
        Category: i.category,
        "Sub-Category": i.subCategory,
        Brand: i.brand,
        Model: i.model,
        Unit: i.unit,
        Qty: i.qty,
        "Purchase Price": i.purchasePrice,
        "Selling Price": i.sellingPrice,
      })),
      "Stock",
      `BM_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  const isAdmin = role === "admin";

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="w-full">
          <Label htmlFor="stock-search" className="text-xs sm:text-sm">Search stock</Label>
          <Input
            id="stock-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Item, brand, model, category..."
            className="h-9 text-xs sm:text-sm"
          />
        </div>
      )}
      {isAdmin && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full flex-1">
            <Label htmlFor="stock-search" className="text-xs sm:text-sm">Search stock</Label>
            <Input
              id="stock-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Item, brand, model, category..."
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={startAdd} className="h-9 flex-1 text-xs sm:flex-initial sm:text-sm">
                  <Plus className="mr-1 size-3.5 sm:size-4" /> Add item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto rounded-lg p-4 sm:max-w-lg sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">{editingCode ? "Edit item" : "Add item"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["code", "Item code"],
                      ["name", "Item name"],
                      ["category", "Category"],
                      ["subCategory", "Sub-category"],
                      ["brand", "Brand"],
                      ["subBrand", "Sub-brand"],
                      ["model", "Model"],
                      ["unit", "Unit"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className={key === "name" ? "col-span-1 sm:col-span-2" : ""}>
                      <Label htmlFor={`f-${key}`} className="text-xs sm:text-sm">{label}</Label>
                      <Input
                        id={`f-${key}`}
                        value={draft[key]}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                        className="h-9 text-xs sm:text-sm"
                      />
                    </div>
                  ))}
                  {(
                    [
                      ["qty", "Quantity"],
                      ["purchasePrice", "Purchase price"],
                      ["sellingPrice", "Selling price"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={`f-${key}`} className="text-xs sm:text-sm">{label}</Label>
                      <Input
                        id={`f-${key}`}
                        type="number"
                        value={draft[key]}
                        onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
                        readOnly={key === "qty"}
                        className={`h-9 text-xs sm:text-sm${key === "qty" ? " bg-muted cursor-not-allowed" : ""}`}
                        title={key === "qty" ? "Quantity is managed by stock lots. Use Purchases to add stock." : ""}
                      />
                    </div>
                  ))}
                </div>
                <DialogFooter className="mt-2">
                  <Button onClick={save} className="w-full sm:w-auto">Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={onExport} className="h-9 flex-1 text-xs sm:flex-initial sm:text-sm">
              <Download className="mr-1 size-3.5 sm:size-4" /> Export Excel
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
        <span><strong className="text-foreground">{filtered.length}</strong> items</span>
        <span><strong className="text-foreground">{totalQty}</strong> units in stock</span>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[700px] text-xs sm:text-sm">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr className="text-left">
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Sub Category</th>
                <th className="p-2.5">Brand</th>
                <th className="p-2.5">Model</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Purchase</th>
                <th className="p-2.5 text-right">Selling</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.code + i.name} className="border-t border-border">
                  <td className="p-2.5 font-mono">{i.code}</td>
                  <td className="p-2.5 font-medium">{i.name}</td>
                  <td className="p-2.5">{i.category}</td>
                  <td className="p-2.5">{i.subCategory}</td>
                  <td className="p-2.5">{i.brand}</td>
                  <td className="p-2.5">{i.model}</td>
                  <td className={`p-2.5 text-right font-semibold ${i.qty <= 0 ? "text-destructive" : ""}`}>
                    {i.qty}
                  </td>
                  <td className="p-2.5 text-right">{i.purchasePrice || "-"}</td>
                  <td className="p-2.5 text-right">{i.sellingPrice || "-"}</td>
                  <td className="p-2.5">
                    {isAdmin && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(i)} className="h-7 w-7">
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            if (window.confirm(`Delete stock item "${i.name}"? This cannot be undone.`)) {
                              await deleteStock(i.code);
                              toast.success("Item deleted");
                            }
                          }}
                          className="h-7 w-7"
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-muted-foreground">
                    No items found.
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
