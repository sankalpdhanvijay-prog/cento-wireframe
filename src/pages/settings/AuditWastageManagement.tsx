import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

function ReasonEditor({ title, initialReasons }: { title: string; initialReasons: string[] }) {
  const [reasons, setReasons] = useState<string[]>(initialReasons);
  const [saved, setSaved] = useState(false);

  const addReason = () => {
    setReasons([...reasons, ""]);
    setSaved(false);
  };

  const removeReason = (idx: number) => {
    setReasons(reasons.filter((_, i) => i !== idx));
    setSaved(false);
  };

  const updateReason = (idx: number, value: string) => {
    setReasons(reasons.map((r, i) => i === idx ? value : r));
    setSaved(false);
  };

  const saveReasons = () => {
    const cleaned = reasons.filter((r) => r.trim());
    setReasons(cleaned);
    setSaved(true);
    toast({ title: "Reasons Saved", description: `${cleaned.length} reason(s) saved successfully.` });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="space-y-2">
        {reasons.map((reason, idx) => (
          <div key={idx} className="flex items-center gap-2 max-w-lg">
            <Input
              value={reason}
              onChange={(e) => updateReason(idx, e.target.value)}
              className="h-9 text-sm"
              placeholder={`Reason ${idx + 1}`}
            />
            <button onClick={() => removeReason(idx)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors shrink-0">
              <X className="h-3.5 w-3.5 text-destructive/70" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addReason} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <Plus className="h-3.5 w-3.5" /> Add Reason
      </button>
      <div className="pt-2">
        <Button variant="cento" size="sm" onClick={saveReasons}>Save Reasons</Button>
        {saved && <span className="text-xs text-green-600 ml-3">✓ Saved</span>}
      </div>
    </div>
  );
}

export default function AuditWastageManagement() {
  return (
    <div className="space-y-6">
      <h2 className="cento-page-title">Audit & Wastage Management</h2>

      <Tabs defaultValue="audits" className="w-full">
        <TabsList>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="wastage">Wastage</TabsTrigger>
        </TabsList>

        <TabsContent value="audits">
          <div className="cento-card mt-4">
            <ReasonEditor
              title="Predefined Reasons for Audit Variance"
              initialReasons={[
                "Spillage during preparation",
                "Measurement error",
                "Theft / pilferage",
                "Damaged goods",
                "Natural wastage / evaporation",
                "Recording error",
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="wastage">
          <div className="cento-card mt-4">
            <ReasonEditor
              title="Predefined Reasons for Material Wastage"
              initialReasons={[
                "Expired stock",
                "Damaged packaging",
                "Quality issue on receipt",
                "Preparation waste",
                "Storage failure",
                "Pest contamination",
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
