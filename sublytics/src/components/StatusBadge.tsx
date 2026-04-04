import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "active" | "pending" | "cancelled" | "paid" | "overdue" | "draft" | "sent" | "expired" | "converted";

const statusStyles: Record<Status, string> = {
  active: "bg-success/10 text-success border-success/20",
  paid: "bg-success/10 text-success border-success/20",
  converted: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  sent: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("capitalize font-medium text-xs", statusStyles[status])}>
      {status}
    </Badge>
  );
}
