import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

// --- Types ---
export interface ReceivingMaterialRow {
  id: string;
  materialId: string;
  name: string;
  unit: string;
  orderedQty: number;
  previouslyReceived: number;
  pendingQty: number;
  acceptedQty: number;
  damagedQty: number;
  cases: number;
  receivingQty: number;
  damagedRemarks: string;
  hasError: boolean;
  remarksRequired: boolean;
}

export function createEmptyRow(overrides: Partial<ReceivingMaterialRow> & { id: string; materialId: string; name: string; unit: string }): ReceivingMaterialRow {
  return {
    orderedQty: 0,
    previouslyReceived: 0,
    pendingQty: 0,
    acceptedQty: 0,
    damagedQty: 0,
    cases: 0,
    receivingQty: 0,
    damagedRemarks: "",
    hasError: false,
    remarksRequired: false,
    ...overrides,
  };
}

export function recalcRow(row: ReceivingMaterialRow, hasPending: boolean): ReceivingMaterialRow {
  const receivingQty = row.acceptedQty + row.damagedQty;
  const hasError = hasPending ? receivingQty > row.pendingQty : false;
  const remarksRequired = row.damagedQty > 0 && !row.damagedRemarks.trim();
  return { ...row, receivingQty, hasError, remarksRequired };
}

// --- Material Row Component ---
interface MaterialRowProps {
  row: ReceivingMaterialRow;
  showPOColumns: boolean;
  readOnly: boolean;
  expandedDamaged: string | null;
  onToggleDamaged: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ReceivingMaterialRow>) => void;
  onRemove?: (id: string) => void;
}

export function MaterialRow({ row, showPOColumns, readOnly, expandedDamaged, onToggleDamaged, onUpdate, onRemove }: MaterialRowProps) {
  const isExpanded = expandedDamaged === row.id || row.damagedQty > 0;

  return (
    <div className={cn("border-b border-border/40", row.hasError && "bg-destructive/5 border-destructive/20")}>
      <div className={cn(
        "grid gap-3 px-4 py-3 items-center",
        showPOColumns
          ? "grid-cols-[1.5fr_70px_80px_80px_80px_90px_90px_70px_80px]"
          : "grid-cols-[1.5fr_70px_90px_90px_70px_80px_40px]"
      )}>
        <div>
          <span className="text-sm font-medium text-foreground">{row.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{row.unit}</span>

        {showPOColumns && (
          <>
            <span className="text-sm text-muted-foreground text-right">{row.orderedQty}</span>
            <span className="text-sm text-muted-foreground text-right">{row.previouslyReceived}</span>
            <span className="text-sm font-medium text-foreground text-right">{row.pendingQty}</span>
          </>
        )}

        <Input
          type="number"
          min={0}
          value={row.acceptedQty || ""}
          onChange={(e) => onUpdate(row.id, { acceptedQty: parseFloat(e.target.value) || 0 })}
          disabled={readOnly}
          className="h-8 text-sm text-right bg-card w-full"
        />
        <Input
          type="number"
          min={0}
          value={row.damagedQty || ""}
          onChange={(e) => onUpdate(row.id, { damagedQty: parseFloat(e.target.value) || 0 })}
          disabled={readOnly}
          className="h-8 text-sm text-right bg-card w-full"
        />
        <Input
          type="number"
          min={0}
          value={row.cases || ""}
          onChange={(e) => onUpdate(row.id, { cases: parseFloat(e.target.value) || 0 })}
          disabled={readOnly}
          className="h-8 text-sm text-right bg-card w-full"
          placeholder="—"
        />
        <span className="text-sm font-semibold text-foreground text-right">{row.receivingQty}</span>

        {!showPOColumns && !readOnly && onRemove && (
          <button onClick={() => onRemove(row.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {row.hasError && (
        <div className="px-4 pb-2 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          <span className="text-xs text-destructive">Receiving quantity exceeds pending quantity</span>
        </div>
      )}

      {/* Damaged remarks expansion */}
      {isExpanded && row.damagedQty > 0 && (
        <div className="px-4 pb-3 pt-1">
          <div className="bg-muted/40 rounded-lg p-3 ml-4">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Damaged Remarks <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={row.damagedRemarks}
              onChange={(e) => onUpdate(row.id, { damagedRemarks: e.target.value })}
              disabled={readOnly}
              placeholder="Describe the damage..."
              className={cn(
                "min-h-[60px] text-sm resize-none bg-card",
                row.remarksRequired && "border-destructive"
              )}
            />
            {row.remarksRequired && (
              <p className="text-xs text-destructive mt-1">Remarks are required when damaged quantity is entered</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Summary Block ---
interface SummaryBlockProps {
  totalAccepted: number;
  totalDamaged: number;
  totalReceiving: number;
}

export function SummaryBlock({ totalAccepted, totalDamaged, totalReceiving }: SummaryBlockProps) {
  return (
    <div className="bg-muted/30 rounded-xl border border-border p-5">
      <h3 className="cento-section-header mb-4">Receiving Summary</h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Accepted</p>
          <p className="text-xl font-semibold text-foreground">{totalAccepted}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Damaged</p>
          <p className="text-xl font-semibold text-destructive">{totalDamaged}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Receiving</p>
          <p className="text-xl font-semibold text-foreground">{totalReceiving}</p>
        </div>
      </div>
    </div>
  );
}
