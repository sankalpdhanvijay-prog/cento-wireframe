import { useState, useMemo } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface UnitRow {
  name: string;
  code: string;
}

const INITIAL_UNITS: UnitRow[] = [
  { name: "Kilogram", code: "KG" },
  { name: "Gram", code: "GM" },
  { name: "Litre", code: "LTR" },
  { name: "Millilitre", code: "ML" },
  { name: "Pieces", code: "PCS" },
  { name: "Dozen", code: "DOZ" },
  { name: "Packet", code: "PKT" },
  { name: "Box", code: "BOX" },
];

export default function UnitManagement() {
  const [units, setUnits] = useState<UnitRow[]>(INITIAL_UNITS);

  // Edit modal
  const [editUnit, setEditUnit] = useState<UnitRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  // Add form
  const [addName, setAddName] = useState("");
  const [addCode, setAddCode] = useState("");

  const openEdit = (u: UnitRow) => {
    setEditUnit(u); setEditName(u.name); setEditCode(u.code);
  };

  const saveEdit = () => {
    if (!editUnit) return;
    setUnits(units.map((u) => u.code === editUnit.code ? { name: editName, code: editCode } : u));
    toast({ title: "Unit Updated", description: `${editName} (${editCode}) updated.` });
    setEditUnit(null);
  };

  const addUnit = () => {
    setUnits([...units, { name: addName, code: addCode.toUpperCase() }]);
    toast({ title: "Unit Added", description: `${addName} (${addCode.toUpperCase()}) created.` });
    setAddName(""); setAddCode("");
  };

  const canAdd = addName.trim() && addCode.trim();

  return (
    <div className="space-y-8">
      <h2 className="cento-page-title">Unit Management</h2>

      {/* Section 1: All Units */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-4">All Units</h3>
        <div className="border border-border rounded-lg overflow-hidden max-w-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs text-right w-16">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.code}>
                  <TableCell className="text-sm font-medium">{u.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.code}</TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-muted/60 transition-colors">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section 2: Add Unit */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-4">Add Unit</h3>
        <div className="space-y-4 max-w-sm">
          <div>
            <Label className="text-xs">Custom Unit Name</Label>
            <Input value={addName} onChange={(e) => setAddName(e.target.value)} className="mt-1 h-9 text-sm" placeholder="e.g. Bottle" />
          </div>
          <div>
            <Label className="text-xs">Code</Label>
            <Input value={addCode} onChange={(e) => setAddCode(e.target.value)} className="mt-1 h-9 text-sm" placeholder="e.g. BTL" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setAddName(""); setAddCode(""); }}>Cancel</Button>
            <Button variant="cento" size="sm" disabled={!canAdd} onClick={addUnit}>Add Unit</Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editUnit} onOpenChange={() => setEditUnit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update Custom Unit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Custom Unit Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Code</Label>
              <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditUnit(null)}>Cancel</Button>
            <Button variant="cento" size="sm" onClick={saveEdit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
