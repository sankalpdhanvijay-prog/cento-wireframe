import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, PackagePlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReceivingType = "po" | "direct" | null;

export default function CreateReceivingTypeSelect() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ReceivingType>(null);

  const cards: { type: ReceivingType; title: string; desc: string; icon: React.ElementType }[] = [
    {
      type: "po",
      title: "From Purchase Order",
      desc: "Receive items against an existing purchase order. Quantities will be matched to ordered amounts.",
      icon: FileText,
    },
    {
      type: "direct",
      title: "Direct Receiving",
      desc: "Log a delivery without a purchase order. Ideal for spot purchases or vendor drops.",
      icon: PackagePlus,
    },
  ];

  const handleContinue = () => {
    if (selected === "po") navigate("/procurements/new-receiving/po");
    if (selected === "direct") navigate("/procurements/new-receiving/direct");
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button
        onClick={() => navigate("/procurements/new-receiving")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Receivings
      </button>

      <h2 className="cento-page-title text-xl mb-1">Create Receiving</h2>
      <p className="text-sm text-muted-foreground mb-8">Select the type of receiving you'd like to create.</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = selected === card.type;
          return (
            <button
              key={card.type}
              onClick={() => setSelected(card.type)}
              className={cn(
                "relative text-left rounded-xl border-2 p-6 transition-all",
                isSelected
                  ? "border-cento-yellow bg-cento-yellow-tint shadow-md"
                  : "border-border bg-card hover:border-border hover:shadow-sm"
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center mb-4",
                  isSelected ? "bg-cento-yellow-tint-strong" : "bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-cento-yellow" : "text-muted-foreground"
                  )}
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{card.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              {isSelected && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-cento-yellow flex items-center justify-center">
                  <svg className="h-3 w-3 text-cento-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button variant="cento" disabled={!selected} onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
