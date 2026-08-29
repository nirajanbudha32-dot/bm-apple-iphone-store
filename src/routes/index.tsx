import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Boxes, History, LogOut, PackageMinus, PackagePlus, ReceiptText, RotateCcw, ShieldAlert, TrendingUp, Truck, Users, LayoutDashboard, BookOpen, CreditCard, FileText, Building2, Warehouse } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockManager } from "@/components/StockManager";
import { SalesRegister } from "@/components/SalesRegister";
import { StockSummary } from "@/components/StockSummary";
import { StockOutSummary } from "@/components/StockOutSummary";
import { StockInSummary } from "@/components/StockInSummary";
import { PurchaseManager } from "@/components/PurchaseManager";
import { UserManager } from "@/components/UserManager";
import { LotStockReport } from "@/components/LotStockReport";
import { LotHistory } from "@/components/LotHistory";
import { StockAdjustments } from "@/components/StockAdjustments";
import { ProfitReport } from "@/components/ProfitReport";
import { SalesReturns } from "@/components/SalesReturns";
import { VendorMaster } from "@/components/VendorMaster";
import { VendorDashboard } from "@/components/VendorDashboard";
import { VendorLedger } from "@/components/VendorLedger";
import { VendorPayments } from "@/components/VendorPayments";
import { PurchaseReturns } from "@/components/PurchaseReturns";
import { VendorReports } from "@/components/VendorReports";
import { StoreSwitcher } from "@/components/StoreSwitcher";
import { StoreManager } from "@/components/StoreManager";
import { CrossStoreSummary } from "@/components/CrossStoreSummary";
import { WarehouseView } from "@/components/WarehouseView";
import { StoreProvider, useStoreContext } from "@/lib/store-context";
import { setCurrentStoreIdForStore } from "@/lib/store";
import { useAuth, AUTH_ENABLED } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BM Apple Iphone Store" },
      {
        name: "description",
        content:
          "Manage store inventory and record sales with auto invoice numbers, 13% VAT and Excel export.",
      },
      { property: "og:title", content: "BM Apple Iphone Store Stock Management V1" },
      {
        property: "og:description",
        content:
          "Stock management and sales register with auto invoice numbering, 13% VAT and Excel export.",
      },
    ],
  }),
  component: Index,
});

function IndexInner() {
  const { user, profile, loading, signOut } = useAuth();
  const { currentStoreId, currentStore, isAdmin } = useStoreContext();
  const navigate = useNavigate();
  const [userManagerOpen, setUserManagerOpen] = useState(false);
  const [storeManagerOpen, setStoreManagerOpen] = useState(false);
  const [vendorSubTab, setVendorSubTab] = useState("dashboard");

  useEffect(() => {
    setCurrentStoreIdForStore(currentStoreId);
  }, [currentStoreId]);

  useEffect(() => {
    if (AUTH_ENABLED && !loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = profile?.role === "admin" ? "Admin" : "Salesman";

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between sm:border-b-0 sm:pb-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{currentStore ? currentStore.name : "All Stores"}</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {currentStore ? currentStore.name : "All Stores"} — Stock management &amp; sales register
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <StoreSwitcher />
          {AUTH_ENABLED && (
            <div className="flex items-center gap-2">
              <span className="max-w-[140px] truncate text-xs text-muted-foreground sm:max-w-none sm:text-sm" title={user.email || ""}>
                {user.email}
              </span>
              <Badge variant={isAdmin ? "default" : "secondary"} className="capitalize text-xs">
                {roleLabel}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setStoreManagerOpen(true)} className="h-8 text-xs sm:h-9 sm:text-sm">
                <Building2 className="mr-1 size-3.5 sm:size-4" /> Stores
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setUserManagerOpen(true)} className="h-8 text-xs sm:h-9 sm:text-sm">
                <Users className="mr-1 size-3.5 sm:size-4" /> Users
              </Button>
            )}
            {AUTH_ENABLED && (
              <Button variant="ghost" size="sm" onClick={signOut} className="h-8 text-xs sm:h-9 sm:text-sm">
                <LogOut className="mr-1 size-3.5 sm:size-4" /> Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      <Tabs defaultValue="sales">
        <TabsList className="mb-6 grid h-auto w-full grid-cols-4 gap-1.5 p-1.5 sm:flex sm:h-10 sm:w-auto sm:grid-cols-none sm:gap-1 sm:p-1">
          {isAdmin && (
            <TabsTrigger value="crossstore" className="py-2 text-xs sm:py-1.5 sm:text-sm">
              <Building2 className="mr-1.5 size-3.5 sm:size-4" /> All Stores
            </TabsTrigger>
          )}
          <TabsTrigger value="sales" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <ReceiptText className="mr-1.5 size-3.5 sm:size-4" /> Sales
          </TabsTrigger>
          <TabsTrigger value="purchases" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <PackagePlus className="mr-1.5 size-3.5 sm:size-4" /> Purchases
          </TabsTrigger>
          <TabsTrigger value="stock" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <Boxes className="mr-1.5 size-3.5 sm:size-4" /> Stock
          </TabsTrigger>
          <TabsTrigger value="stockin" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <PackageMinus className="mr-1.5 size-3.5 sm:size-4" /> Stock In
          </TabsTrigger>
          <TabsTrigger value="stockout" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <Truck className="mr-1.5 size-3.5 sm:size-4" /> Stock Out
          </TabsTrigger>
          <TabsTrigger value="lots" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <Boxes className="mr-1.5 size-3.5 sm:size-4" /> Lot Report
          </TabsTrigger>
          <TabsTrigger value="lothistory" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <History className="mr-1.5 size-3.5 sm:size-4" /> Lot History
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <ShieldAlert className="mr-1.5 size-3.5 sm:size-4" /> Adjustments
          </TabsTrigger>
          <TabsTrigger value="profit" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <TrendingUp className="mr-1.5 size-3.5 sm:size-4" /> Profit
          </TabsTrigger>
          <TabsTrigger value="returns" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <RotateCcw className="mr-1.5 size-3.5 sm:size-4" /> Returns
          </TabsTrigger>
          <TabsTrigger value="summary" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <BarChart3 className="mr-1.5 size-3.5 sm:size-4" /> Summary
          </TabsTrigger>
          <TabsTrigger value="vendors" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <Truck className="mr-1.5 size-3.5 sm:size-4" /> Vendors
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="warehouse" className="py-2 text-xs sm:py-1.5 sm:text-sm">
              <Warehouse className="mr-1.5 size-3.5 sm:size-4" /> Warehouse
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <TabsContent value="crossstore">
            <CrossStoreSummary />
          </TabsContent>
        )}
        <TabsContent value="sales">
          <SalesRegister />
        </TabsContent>
        <TabsContent value="purchases">
          <PurchaseManager />
        </TabsContent>
        <TabsContent value="stock">
          <StockManager role={isAdmin ? "admin" : "salesman"} />
        </TabsContent>
        <TabsContent value="stockout">
          <StockOutSummary />
        </TabsContent>
        <TabsContent value="stockin">
          <StockInSummary />
        </TabsContent>
        <TabsContent value="lots">
          <LotStockReport />
        </TabsContent>
        <TabsContent value="lothistory">
          <LotHistory />
        </TabsContent>
        <TabsContent value="adjustments">
          <StockAdjustments />
        </TabsContent>
        <TabsContent value="profit">
          <ProfitReport />
        </TabsContent>
        <TabsContent value="returns">
          <SalesReturns />
        </TabsContent>
        <TabsContent value="summary">
          <StockSummary />
        </TabsContent>
        <TabsContent value="vendors">
          <div className="flex flex-wrap gap-1 border-b border-border/60 pb-2 mb-4">
            <Button variant={vendorSubTab === "dashboard" ? "default" : "ghost"} size="sm" onClick={() => setVendorSubTab("dashboard")} className="h-8 text-xs sm:text-sm">
              <LayoutDashboard className="mr-1 size-3.5" /> Dashboard
            </Button>
            <Button variant={vendorSubTab === "master" ? "default" : "ghost"} size="sm" onClick={() => setVendorSubTab("master")} className="h-8 text-xs sm:text-sm">
              <Users className="mr-1 size-3.5" /> Master
            </Button>
            <Button variant={vendorSubTab === "ledger" ? "default" : "ghost"} size="sm" onClick={() => setVendorSubTab("ledger")} className="h-8 text-xs sm:text-sm">
              <BookOpen className="mr-1 size-3.5" /> Ledger
            </Button>
            <Button variant={vendorSubTab === "payments" ? "default" : "ghost"} size="sm" onClick={() => setVendorSubTab("payments")} className="h-8 text-xs sm:text-sm">
              <CreditCard className="mr-1 size-3.5" /> Payments
            </Button>
            <Button variant={vendorSubTab === "returns" ? "default" : "ghost"} size="sm" onClick={() => setVendorSubTab("returns")} className="h-8 text-xs sm:text-sm">
              <RotateCcw className="mr-1 size-3.5" /> Returns
            </Button>
            <Button variant={vendorSubTab === "reports" ? "default" : "ghost"} size="sm" onClick={() => setVendorSubTab("reports")} className="h-8 text-xs sm:text-sm">
              <FileText className="mr-1 size-3.5" /> Reports
            </Button>
          </div>
          {vendorSubTab === "dashboard" && <VendorDashboard />}
          {vendorSubTab === "master" && <VendorMaster />}
          {vendorSubTab === "ledger" && <VendorLedger />}
          {vendorSubTab === "payments" && <VendorPayments />}
          {vendorSubTab === "returns" && <PurchaseReturns />}
          {vendorSubTab === "reports" && <VendorReports />}
        </TabsContent>
        {isAdmin && (
          <TabsContent value="warehouse">
            <WarehouseView />
          </TabsContent>
        )}
      </Tabs>

      {isAdmin && <UserManager open={userManagerOpen} onOpenChange={setUserManagerOpen} />}
      {isAdmin && <StoreManager open={storeManagerOpen} onOpenChange={setStoreManagerOpen} />}
    </main>
  );
}

function Index() {
  return (
    <StoreProvider>
      <IndexInner />
    </StoreProvider>
  );
}
