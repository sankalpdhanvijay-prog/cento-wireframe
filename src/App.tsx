import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { POStoreProvider } from "@/context/POStoreContext";
import NotFound from "./pages/NotFound";

// Pages
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import NewPurchase from "./pages/procurements/NewPurchase";
import ReceivingLanding from "./pages/procurements/receiving/ReceivingLanding";
import CreateReceivingTypeSelect from "./pages/procurements/receiving/CreateReceivingTypeSelect";
import POBasedReceiving from "./pages/procurements/receiving/POBasedReceiving";
import DirectReceiving from "./pages/procurements/receiving/DirectReceiving";
import ViewReceiving from "./pages/procurements/receiving/ViewReceiving";
import AllOrders from "./pages/procurements/AllOrders";
import ViewOrderDetails from "./pages/procurements/orders/ViewOrderDetails";
import DispatchManagement from "./pages/operations/DispatchManagement";
import ProductionManagement from "./pages/operations/ProductionManagement";
import TransferManagement from "./pages/operations/TransferManagement";
import Inventory from "./pages/Inventory";
import Materials from "./pages/entities/Materials";
import Recipes from "./pages/entities/Recipes";
import Vendors from "./pages/entities/Vendors";
import Audits from "./pages/Audits";
import Wastage from "./pages/Wastage";
import Settings from "./pages/settings/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <POStoreProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/procurements" element={<Navigate to="/procurements/new-purchase" replace />} />
              <Route path="/procurements/new-purchase" element={<NewPurchase />} />
              <Route path="/procurements/new-receiving" element={<ReceivingLanding />} />
              <Route path="/procurements/new-receiving/create" element={<CreateReceivingTypeSelect />} />
              <Route path="/procurements/new-receiving/po" element={<POBasedReceiving />} />
              <Route path="/procurements/new-receiving/direct" element={<DirectReceiving />} />
              <Route path="/procurements/new-receiving/view/:id" element={<ViewReceiving />} />
              <Route path="/procurements/new-receiving/edit/:id" element={<POBasedReceiving />} />
              <Route path="/procurements/all-orders" element={<AllOrders />} />
              <Route path="/procurements/all-orders/:id" element={<ViewOrderDetails />} />
              <Route path="/operations" element={<Navigate to="/operations/dispatches" replace />} />
              <Route path="/operations/dispatches" element={<DispatchManagement />} />
              <Route path="/operations/productions" element={<ProductionManagement />} />
              <Route path="/operations/transfers" element={<TransferManagement />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/entities" element={<Navigate to="/entities/materials" replace />} />
              <Route path="/entities/materials" element={<Materials />} />
              <Route path="/entities/recipes" element={<Recipes />} />
              <Route path="/entities/vendors" element={<Vendors />} />
              <Route path="/audits" element={<Audits />} />
              <Route path="/wastage" element={<Wastage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/*" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </POStoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
