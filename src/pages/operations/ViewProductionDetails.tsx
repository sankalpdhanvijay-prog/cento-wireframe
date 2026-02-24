import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Search, Eye } from "lucide-react";
import { useProductionStore, type ProductionPlanItem } from "@/context/ProductionStoreContext";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ViewProductionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduction } = useProductionStore();
  const [planSearch, setPlanSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [recipeModalItem, setRecipeModalItem] = useState<ProductionPlanItem | null>(null);

  const prod = id ? getProduction(id) : undefined;

  if (!prod) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Production not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/operations/productions")}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      </div>
    );
  }

  const filteredPlan = useMemo(() => {
    if (!planSearch.trim()) return prod.planItems;
    const q = planSearch.toLowerCase();
    return prod.planItems.filter((p) => p.materialName.toLowerCase().includes(q) || p.materialCode.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [prod.planItems, planSearch]);

  const filteredStock = useMemo(() => {
    if (!stockSearch.trim()) return prod.stockRequirements;
    const q = stockSearch.toLowerCase();
    return prod.stockRequirements.filter((s) => s.materialName.toLowerCase().includes(q) || s.materialCode.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  }, [prod.stockRequirements, stockSearch]);

  return (
    <div className="space-y-5 max-w-[1100px] pb-8">
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-4">
        <h2 className="cento-page-title">{prod.productionPlan}</h2>
        <span className="text-sm text-muted-foreground">({prod.id})</span>
      </div>

      {/* Production Plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Production Plan</CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} placeholder="Search plan..." className="pl-8 h-8 text-xs bg-background" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Material Code</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Production Qty</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="w-[80px]">Recipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlan.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No items found.</TableCell></TableRow>
              ) : filteredPlan.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.materialCode}</TableCell>
                  <TableCell className="font-medium">{item.materialName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.productionQty}</TableCell>
                  <TableCell className="text-muted-foreground">{item.batchName}</TableCell>
                  <TableCell className="text-muted-foreground">{item.expiryDate}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setRecipeModalItem(item)}>
                      <Eye className="h-3 w-3" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Requirement */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Stock Requirement</CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="Search stock..." className="pl-8 h-8 text-xs bg-background" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Material Code</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Cost/Unit</TableHead>
                <TableHead className="text-right">Stock Usage</TableHead>
                <TableHead className="text-right">Usage Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No items found.</TableCell></TableRow>
              ) : filteredStock.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.materialCode}</TableCell>
                  <TableCell className="font-medium">{item.materialName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{fmt(item.costPerUnit)}</TableCell>
                  <TableCell className="text-right">{item.stockUsage}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(item.usageCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recipe Modal */}
      <Dialog open={!!recipeModalItem} onOpenChange={(o) => { if (!o) setRecipeModalItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Items included in the recipe — {recipeModalItem?.materialName}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Material ID</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipeModalItem?.recipeItems.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.materialId}</TableCell>
                  <TableCell className="font-medium">{r.materialName}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.unit}</TableCell>
                  <TableCell className="text-right">{r.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
