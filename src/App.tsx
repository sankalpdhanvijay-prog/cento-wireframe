import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { POStoreProvider } from "@/context/POStoreContext";
import { TransferStoreProvider } from "@/context/TransferStoreContext";
import { DispatchStoreProvider } from "@/context/DispatchStoreContext";
import { ProductionStoreProvider } from "@/context/ProductionStoreContext";
import NotFound from "./pages/NotFound";

// Pages
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import NewPurchase from "./pages/procurements/NewPurchase";
import Purchases from "./pages/procurements/Purchases";
import Receivings from "./pages/procurements/Receivings";
import ClosedOrders from "./pages/procurements/ClosedOrders";
import ViewClosedOrderDetails from "./pages/procurements/orders/ViewClosedOrderDetails";
import DirectReceiving from "./pages/procurements/receiving/DirectReceiving";
import ReceiveOrder from "./pages/procurements/receiving/ReceiveOrder";
import ViewReceivingOrder from "./pages/procurements/receiving/ViewReceivingOrder";
import ViewReceivingDetail from "./pages/procurements/receivings/ViewReceivingDetail";
import AllOrders from "./pages/procurements/AllOrders";
import ViewOrderDetails from "./pages/procurements/orders/ViewOrderDetails";

// Operations
import Dispatches from "./pages/operations/Dispatches";
import ViewDispatchDetails, { NewDispatch } from "./pages/operations/DispatchPages";
import Transfers from "./pages/operations/Transfers";
import NewTransfer from "./pages/operations/NewTransfer";
import ViewTransferDetails from "./pages/operations/ViewTransferDetails";
import Productions from "./pages/operations/Productions";
import NewProduction from "./pages/operations/NewProduction";
import ViewProductionDetails from "./pages/operations/ViewProductionDetails";

import Inventory from "./pages/Inventory";
import Materials from "./pages/entities/Materials";
import Recipes from "./pages/entities/Recipes";
import Vendors from "./pages/entities/Vendors";
import Audits from "./pages/Audits";
import NewAudit from "./pages/audits/NewAudit";
import AuditDetails from "./pages/audits/AuditDetails";
import Wastage from "./pages/Wastage";
import NewWastage from "./pages/wastage/NewWastage";
import WastageDetails from "./pages/wastage/WastageDetails";
import Settings from "./pages/settings/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <POStoreProvider>
        <TransferStoreProvider>
          <DispatchStoreProvider>
            <ProductionStoreProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/reports" element={<Reports />} />

                    {/* Procurements */}
                    <Route path="/procurements" element={<Navigate to="/procurements/purchases" replace />} />
                    <Route path="/procurements/purchases" element={<Purchases />} />
                    <Route path="/procurements/purchases/:id" element={<ViewOrderDetails />} />
                    <Route path="/procurements/new-purchase" element={<NewPurchase />} />
                    <Route path="/procurements/receivings" element={<Receivings />} />
                    <Route path="/procurements/receivings/:id" element={<ViewReceivingDetail />} />
                    <Route path="/procurements/closed-orders" element={<ClosedOrders />} />
                    <Route path="/procurements/closed-orders/:id" element={<ViewClosedOrderDetails />} />

                    {/* Receiving flow routes */}
                    <Route path="/procurements/receiving/direct" element={<DirectReceiving />} />
                    <Route path="/procurements/receiving/receive/:id" element={<ReceiveOrder />} />
                    <Route path="/procurements/receiving/view/:id" element={<ViewReceivingOrder />} />

                    {/* Legacy redirects */}
                    <Route path="/procurements/new-receiving" element={<Navigate to="/procurements/receivings" replace />} />
                    <Route path="/procurements/new-receiving/*" element={<Navigate to="/procurements/receivings" replace />} />

                    {/* Legacy all-orders redirect */}
                    <Route path="/procurements/all-orders" element={<Navigate to="/procurements/closed-orders" replace />} />
                    <Route path="/procurements/all-orders/:id" element={<ViewOrderDetails />} />

                    {/* Operations */}
                    <Route path="/operations" element={<Navigate to="/operations/dispatches" replace />} />
                    <Route path="/operations/dispatches" element={<Dispatches />} />
                    <Route path="/operations/dispatches/new-dispatch" element={<NewDispatch />} />
                    <Route path="/operations/dispatches/:id" element={<ViewDispatchDetails />} />
                    <Route path="/operations/transfers" element={<Transfers />} />
                    <Route path="/operations/transfers/new-transfer" element={<NewTransfer />} />
                    <Route path="/operations/transfers/:id" element={<ViewTransferDetails />} />
                    <Route path="/operations/productions" element={<Productions />} />
                    <Route path="/operations/productions/new-production" element={<NewProduction />} />
                    <Route path="/operations/productions/:id" element={<ViewProductionDetails />} />

                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/entities" element={<Navigate to="/entities/materials" replace />} />
                    <Route path="/entities/materials" element={<Materials />} />
                    <Route path="/entities/recipes" element={<Recipes />} />
                    <Route path="/entities/vendors" element={<Vendors />} />
                    <Route path="/audits" element={<Audits />} />
                    <Route path="/audits/new" element={<NewAudit />} />
                    <Route path="/audits/:id" element={<AuditDetails />} />
                    <Route path="/wastage" element={<Wastage />} />
                    <Route path="/wastage/new" element={<NewWastage />} />
                    <Route path="/wastage/:id" element={<WastageDetails />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/*" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ProductionStoreProvider>
          </DispatchStoreProvider>
        </TransferStoreProvider>
      </POStoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
