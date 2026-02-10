import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "./pages/NotFound";

// Pages
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import NewPurchase from "./pages/procurements/NewPurchase";
import NewReceiving from "./pages/procurements/NewReceiving";
import AllOrders from "./pages/procurements/AllOrders";
import DispatchManagement from "./pages/operations/DispatchManagement";
import ProductionManagement from "./pages/operations/ProductionManagement";
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
            <Route path="/procurements/new-receiving" element={<NewReceiving />} />
            <Route path="/procurements/all-orders" element={<AllOrders />} />
            <Route path="/operations" element={<Navigate to="/operations/dispatch" replace />} />
            <Route path="/operations/dispatch" element={<DispatchManagement />} />
            <Route path="/operations/production" element={<ProductionManagement />} />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
