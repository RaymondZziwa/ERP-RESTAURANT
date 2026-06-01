import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRestaurant } from "@/lib/restaurant-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (tableId: number) => void;
}

export function SelectTableDialog({ open, onOpenChange, onSelect }: Props) {
  const { tables, bills, employeeId } = useRestaurant();
  const eligible = tables.filter((t) => {
    if (t.status === "FREE") return true;
    const bill = bills.find((b) => b.id === t.currentBillId);
    return bill && bill.employeeId === employeeId && bill.status === "PENDING";
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Table</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {eligible.map((t) => (
            <Button
              key={t.id}
              variant={t.status === "FREE" ? "outline" : "secondary"}
              className="h-16 flex-col gap-0.5"
              onClick={() => {
                onSelect(t.id);
                onOpenChange(false);
              }}
            >
              <span className="text-lg font-bold">{t.number}</span>
              <span className="text-[10px] text-muted-foreground">
                {t.status === "FREE" ? "FREE" : "YOURS"}
              </span>
            </Button>
          ))}
        </div>
        {eligible.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No tables available.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
