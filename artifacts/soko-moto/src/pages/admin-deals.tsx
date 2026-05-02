import { useState } from "react";
import { useListDeals, useUpdateDeal, getListDealsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronLeft, Clock, CheckCircle2, XCircle, Zap, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type DealStatus = "draft" | "live" | "filling" | "sold_out" | "expired" | "completed";
const ALL_STATUSES: DealStatus[] = ["live", "filling", "sold_out", "expired", "completed", "draft"];

export default function AdminDeals() {
  const [statusFilter, setStatusFilter] = useState<DealStatus | "all">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deals, isLoading } = useListDeals(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );
  const updateDeal = useUpdateDeal();

  const handleUpdateStatus = (id: number, status: DealStatus) => {
    updateDeal.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Deal updated", description: `Status changed to ${status}.` });
          queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
        },
        onError: () => toast({ title: "Error", description: "Update failed.", variant: "destructive" }),
      }
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      live: "bg-green-100 text-green-700 border-green-200",
      filling: "bg-amber-100 text-amber-700 border-amber-200",
      sold_out: "bg-blue-100 text-blue-700 border-blue-200",
      expired: "bg-muted text-muted-foreground",
      completed: "bg-secondary/10 text-secondary border-secondary/20",
      draft: "bg-background text-foreground border-border",
    };
    return (
      <Badge className={`capitalize ${map[status] ?? ""}`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold text-secondary">Deal Management</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage all platform deals</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...ALL_STATUSES] as const).map((s) => (
          <Badge
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            className="cursor-pointer capitalize px-3 py-1"
            onClick={() => setStatusFilter(s)}
            data-testid={`badge-deal-status-${s}`}
          >
            {s.replace("_", " ")}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !deals || deals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No deals found for this filter.</div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {deals.map((deal) => (
            <motion.div key={deal.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
              <Card className="border-border bg-card">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {statusBadge(deal.status)}
                      <Badge variant="outline" className="capitalize text-xs border-primary/20 text-primary">
                        {deal.discountPercent}% OFF
                      </Badge>
                      <Badge variant="outline" className="capitalize text-xs">{deal.dealType}</Badge>
                    </div>
                    <h3 className="font-serif font-bold truncate">{deal.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {deal.bookedSlots}/{deal.totalSlots} booked
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(deal.validFrom), "h:mm a")} – {format(parseISO(deal.validUntil), "h:mm a")}
                      </div>
                      <span className="font-medium text-foreground">KES {deal.dealPrice}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {deal.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(deal.id, "live")}
                        disabled={updateDeal.isPending}
                        data-testid={`button-publish-deal-${deal.id}`}
                      >
                        <Zap className="w-3.5 h-3.5" /> Publish
                      </Button>
                    )}
                    {(deal.status === "live" || deal.status === "filling") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(deal.id, "expired")}
                        disabled={updateDeal.isPending}
                        data-testid={`button-expire-deal-${deal.id}`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Expire
                      </Button>
                    )}
                    {deal.status === "sold_out" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-secondary/20 text-secondary hover:bg-secondary/10"
                        onClick={() => handleUpdateStatus(deal.id, "completed")}
                        disabled={updateDeal.isPending}
                        data-testid={`button-complete-deal-${deal.id}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
