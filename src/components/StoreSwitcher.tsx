import { Store, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreContext } from "@/lib/store-context";

export function StoreSwitcher() {
  const { stores, currentStoreId, currentStore, setCurrentStoreId, isSuperAdmin } = useStoreContext();

  if (!isSuperAdmin && stores.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <Store className="size-3.5 sm:size-4" />
        <span className="max-w-[120px] truncate sm:max-w-none">{currentStore?.name ?? "No Store"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Store className="size-3.5 sm:size-4 text-muted-foreground" />
      <Select
        value={currentStoreId ?? "__all__"}
        onValueChange={(v) => setCurrentStoreId(v === "__all__" ? null : v)}
      >
        <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs sm:h-9 sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {isSuperAdmin && (
            <SelectItem value="__all__">All Stores</SelectItem>
          )}
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
