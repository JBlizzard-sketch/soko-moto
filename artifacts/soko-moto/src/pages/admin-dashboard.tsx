import { useGetFeedSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, TrendingUp, Zap, Building2, Clock, CheckCircle2, Star, ArrowRight } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetFeedSummary();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity();

  const statCards = summary ? [
    { label: "Live Deals", value: summary.liveDealsCount, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active Venues", value: summary.totalVenues, icon: Building2, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Bookings Today", value: summary.bookingsToday, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "All-Time Bookings", value: summary.totalBookingsAllTime, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Avg Fill Rate", value: `${Math.round(summary.averageFillRate * 100)}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Top Neighborhood", value: summary.topNeighborhood ?? "—", icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
  ] : [];

  const activityIcon = (type: string) => {
    switch (type) {
      case "booking_confirmed": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "deal_live": return <Zap className="w-4 h-4 text-primary" />;
      case "deal_sold_out": return <Star className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-secondary">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and real-time activity</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/venues">
            <Button variant="outline" size="sm" className="gap-2">
              <Building2 className="w-4 h-4" /> Manage Venues
            </Button>
          </Link>
          <Link href="/admin/deals">
            <Button variant="outline" size="sm" className="gap-2">
              <Zap className="w-4 h-4" /> Manage Deals
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="bg-card border-border h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="text-2xl font-bold font-serif leading-tight">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        {summary?.dealsByCategory && summary.dealsByCategory.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Deals by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.dealsByCategory.map(({ category, count }) => {
                const max = Math.max(...summary.dealsByCategory.map((d) => d.count));
                const pct = max > 0 ? (count / max) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <div className="w-24 text-sm capitalize text-muted-foreground">{category}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <div className="w-6 text-sm font-medium text-right">{count}</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Activity Feed */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !activity || activity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5">{activityIcon(a.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{a.venueName}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.message}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(parseISO(a.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/venues">
          <Card className="border-border hover-elevate cursor-pointer group transition-all hover:border-secondary/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="font-serif font-bold text-lg mb-1">Manage Venues</div>
                <div className="text-sm text-muted-foreground">Approve, suspend, or review venue applications</div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/deals">
          <Card className="border-border hover-elevate cursor-pointer group transition-all hover:border-primary/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="font-serif font-bold text-lg mb-1">Manage Deals</div>
                <div className="text-sm text-muted-foreground">Monitor all active, expired and draft deals</div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
