import { useRoute } from "wouter";
import { Link } from "wouter";
import { useGetVenue, useGetVenueStats, useListDeals, useListRatings, getGetVenueQueryKey, getGetVenueStatsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DealCard from "@/components/DealCard";
import { MapPin, Phone, Star, TrendingUp, ChevronLeft, BarChart3, Users, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function VenueDetail() {
  const [, params] = useRoute("/venues/:id");
  const venueId = params?.id ? parseInt(params.id) : 0;

  const { data: venue, isLoading: loadingVenue } = useGetVenue(venueId, {
    query: { enabled: !!venueId, queryKey: getGetVenueQueryKey(venueId) },
  });
  const { data: stats } = useGetVenueStats(venueId, {
    query: { enabled: !!venueId, queryKey: getGetVenueStatsQueryKey(venueId) },
  });
  const { data: deals } = useListDeals({ venueId, status: "live" });
  const { data: ratings } = useListRatings({ venueId });

  if (loadingVenue) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif font-bold mb-2">Venue Not Found</h2>
        <Link href="/venues" className="text-primary hover:underline">Back to venues</Link>
      </div>
    );
  }

  const statCards = [
    { label: "Total Deals", value: stats?.totalDeals ?? 0, icon: BarChart3 },
    { label: "Total Bookings", value: stats?.totalBookings ?? 0, icon: Users },
    { label: "Avg Fill Rate", value: stats ? `${Math.round(stats.averageFillRate * 100)}%` : "—", icon: TrendingUp },
    { label: "Revenue Recovered", value: stats ? `KES ${stats.revenueRecovered.toLocaleString()}` : "—", icon: DollarSign },
  ];

  return (
    <div className="pb-16 max-w-5xl mx-auto">
      <Link href="/venues" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        All Venues
      </Link>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-muted mb-8 shadow-lg">
        {venue.imageUrl ? (
          <img src={venue.imageUrl} alt={venue.name} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
            <span className="text-secondary/30 font-serif text-6xl">{venue.name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <h1 className="text-4xl font-serif font-bold text-white mb-1">{venue.name}</h1>
          <div className="flex items-center gap-3 text-white/80">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{venue.neighborhood}</span>
            </div>
            {venue.averageRating && venue.averageRating > 0 && (
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{venue.averageRating.toFixed(1)}</span>
                <span className="text-xs text-white/70">({venue.totalRatings})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div>
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="capitalize border-secondary/20 text-secondary">{venue.category}</Badge>
              <Badge variant="outline" className="capitalize border-primary/20 text-primary">{venue.priceRange}</Badge>
              {venue.cuisineOrType && <Badge variant="outline">{venue.cuisineOrType}</Badge>}
            </div>
            {venue.description && <p className="text-muted-foreground leading-relaxed">{venue.description}</p>}
          </div>

          <Separator />

          {/* Stats */}
          {stats && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-4">Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon }) => (
                  <Card key={label} className="bg-card border-border">
                    <CardContent className="p-4 flex flex-col gap-1">
                      <Icon className="w-4 h-4 text-primary mb-1" />
                      <div className="text-xl font-bold font-serif">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Live Deals */}
          {deals && deals.length > 0 && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-4">Live Deals Today</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={{ ...deal, venue }} />
                ))}
              </div>
            </div>
          )}

          {/* Ratings */}
          {ratings && ratings.length > 0 && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-4">Recent Reviews</h2>
              <motion.div className="space-y-3" initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
                {ratings.slice(0, 5).map((r) => (
                  <motion.div key={r.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        {r.review && <p className="text-sm text-muted-foreground">{r.review}</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card className="border-border sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {venue.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{venue.address}</span>
                </div>
              )}
              {venue.contactPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{venue.contactPhone}</span>
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground">
                Verified Soko Moto partner venue
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
