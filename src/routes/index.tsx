import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Boxes, LogOut, PackagePlus, ReceiptText, Truck, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockManager } from "@/components/StockManager";
import { SalesRegister } from "@/components/SalesRegister";
import { StockSummary } from "@/components/StockSummary";
import { StockOutSummary } from "@/components/StockOutSummary";
import { PurchaseManager } from "@/components/PurchaseManager";
import { UserManager } from "@/components/UserManager";
import { useAuth, AUTH_ENABLED } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BM Apple Iphone Store Stock Management V1" },
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

function Index() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [userManagerOpen, setUserManagerOpen] = useState(false);

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

  const isAdmin = profile?.role === "admin";

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between sm:border-b-0 sm:pb-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">BM Apple Iphone Store Stock Management V1</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Stock management &amp; sales register</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          {AUTH_ENABLED && (
            <div className="flex items-center gap-2">
              <span className="max-w-[140px] truncate text-xs text-muted-foreground sm:max-w-none sm:text-sm" title={user.email || ""}>
                {user.email}
              </span>
              <Badge variant={isAdmin ? "default" : "secondary"} className="capitalize text-xs">
                {isAdmin ? "Admin" : "Salesman"}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
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
        <TabsList className="mb-6 grid h-auto w-full grid-cols-3 gap-1.5 p-1.5 sm:flex sm:h-10 sm:w-auto sm:grid-cols-none sm:gap-1 sm:p-1">
          <TabsTrigger value="sales" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <ReceiptText className="mr-1.5 size-3.5 sm:size-4" /> Sales register
          </TabsTrigger>
          <TabsTrigger value="purchases" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <PackagePlus className="mr-1.5 size-3.5 sm:size-4" /> Purchases
          </TabsTrigger>
          <TabsTrigger value="stock" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <Boxes className="mr-1.5 size-3.5 sm:size-4" /> Stock
          </TabsTrigger>
          <TabsTrigger value="stockout" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <Truck className="mr-1.5 size-3.5 sm:size-4" /> Stock Out
          </TabsTrigger>
          <TabsTrigger value="summary" className="py-2 text-xs sm:py-1.5 sm:text-sm">
            <BarChart3 className="mr-1.5 size-3.5 sm:size-4" /> Summary
          </TabsTrigger>
        </TabsList>
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
        <TabsContent value="summary">
          <StockSummary />
        </TabsContent>
      </Tabs>

      {isAdmin && <UserManager open={userManagerOpen} onOpenChange={setUserManagerOpen} />}
    </main>
  );
}
