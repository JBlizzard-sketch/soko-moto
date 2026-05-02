import { useState } from "react";
import { useListVenues, useUpdateVenue, getListVenuesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ChevronLeft, MapPin, Search, CheckCircle2, XCircle, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function AdminVenues() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "suspended" | "all">("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: venues, isLoading } = useListVenues(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );

  const updateVenue = useUpdateVenue();

  const handleUpdateStatus = (id: number, status: "approved" | "suspended" | "pending") => {
    updateVenue.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Venue ${status}`, description: `Status updated to ${status}.` });
          queryClient.invalidateQueries({ queryKey: getListVenuesQueryKey() });
        },
        onError: () => toast({ title: "Error", description: "Failed to update status.", variant: "destructive" }),
      }
    );
  };

  const filtered = venues?.filter((v) =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.neighborhood.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
      case "suspended": return <Badge className="bg-red-100 text-red-700 border-red-200">Suspended</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const STATUSES = ["all", "pending", "approved", "suspended"] as const;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold text-secondary">Venue Management</h1>
          <p className="text-muted-foreground text-sm">Review and approve venue applications</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search venues..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-admin-venues"
          />
        </div>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <Badge
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              className="cursor-pointer capitalize px-3 py-1"
              onClick={() => setStatusFilter(s)}
              data-testid={`badge-status-${s}`}
            >
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No venues found.</div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {filtered.map((venue) => (
            <motion.div key={venue.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
              <Card className="border-border bg-card">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {venue.imageUrl ? (
                      <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                        <span className="font-serif text-xl text-secondary/40">{venue.name[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-lg">{venue.name}</h3>
                      {statusBadge(venue.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{venue.neighborhood}
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">{venue.category}</Badge>
                      <Badge variant="outline" className="capitalize text-xs">{venue.priceRange}</Badge>
                      {venue.averageRating && venue.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{venue.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {venue.status !== "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(venue.id, "approved")}
                        disabled={updateVenue.isPending}
                        data-testid={`button-approve-venue-${venue.id}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </Button>
                    )}
                    {venue.status !== "suspended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(venue.id, "suspended")}
                        disabled={updateVenue.isPending}
                        data-testid={`button-suspend-venue-${venue.id}`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Suspend
                      </Button>
                    )}
                    {venue.status === "suspended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                        onClick={() => handleUpdateStatus(venue.id, "pending")}
                        disabled={updateVenue.isPending}
                        data-testid={`button-review-venue-${venue.id}`}
                      >
                        <Clock className="w-3.5 h-3.5" /> Review
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
