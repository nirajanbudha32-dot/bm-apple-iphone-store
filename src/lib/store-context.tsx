import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export type Store = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  pan: string;
  vatNumber: string;
  status: string;
  createdAt: string;
};

type StoreContextType = {
  stores: Store[];
  currentStoreId: string | null;
  currentStore: Store | null;
  setCurrentStoreId: (id: string | null) => void;
  isAdmin: boolean;
  loading: boolean;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === "admin" && profile?.storeId === null;

  useEffect(() => {
    async function fetchStores() {
      const { data, error } = await supabase.from("stores").select("*").eq("status", "active").order("name");
      if (!error && data) {
        setStores(data.map((r: any) => ({
          id: r.id,
          name: r.name,
          address: r.address ?? "",
          phone: r.phone ?? "",
          email: r.email ?? "",
          pan: r.pan ?? "",
          vatNumber: r.vat_number ?? "",
          status: r.status,
          createdAt: r.created_at,
        })));
      }
      setLoading(false);
    }
    fetchStores();
  }, []);

  useEffect(() => {
    if (!profile) {
      setCurrentStoreId(null);
      return;
    }
    if (isAdmin) {
      if (!currentStoreId && stores.length > 0) {
        setCurrentStoreId(null);
      }
    } else if (profile.storeId && currentStoreId === null) {
      setCurrentStoreId(profile.storeId);
    }
  }, [profile, isAdmin, stores, currentStoreId]);

  const handleSetCurrentStoreId = useCallback((id: string | null) => {
    setCurrentStoreId(id);
  }, []);

  const currentStore = stores.find((s) => s.id === currentStoreId) ?? null;

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStoreId,
        currentStore,
        setCurrentStoreId: handleSetCurrentStoreId,
        isAdmin,
        loading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used within StoreProvider");
  return ctx;
}
