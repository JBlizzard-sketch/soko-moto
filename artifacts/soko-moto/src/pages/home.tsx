import { useState } from "react";
import { useGetTrendingDeals, useGetLiveFeed } from "@workspace/api-client-react";
import DealCard from "@/components/DealCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Flame, Clock } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = ["all", "restaurant", "spa", "fitness", "bar", "experience"];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: trendingDeals, isLoading: isLoadingTrending } = useGetTrendingDeals();
  const { data: liveDeals, isLoading: isLoadingLive } = useGetLiveFeed({
    category: activeCategory === "all" ? undefined : activeCategory,
    neighborhood: search || undefined
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-secondary mb-4 tracking-tight">
          Nairobi's Best Venues.<br/>
          <span className="text-primary">Perfect Timing.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Exclusive same-day access to premium experiences. Book instantly before slots vanish.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Search neighborhoods (e.g. Westlands, Karen)..." 
              className="pl-10 h-12 bg-card border-secondary/20 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {CATEGORIES.map(category => (
            <Badge 
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              className={`cursor-pointer capitalize px-4 py-1.5 text-sm ${
                activeCategory === category 
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                  : "bg-background hover:bg-secondary/10 border-secondary/20"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </section>

      {/* Trending Deals */}
      {(!isLoadingTrending && trendingDeals && trendingDeals.length > 0 && activeCategory === "all" && !search) && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-6 h-6 text-primary fill-primary/20" />
            <h2 className="text-2xl font-serif font-bold">Trending Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingDeals.slice(0, 3).map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {/* Live Feed */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-secondary" />
          <h2 className="text-2xl font-serif font-bold">Live Deals</h2>
        </div>

        {isLoadingLive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : liveDeals && liveDeals.length > 0 ? (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {liveDeals.map(deal => (
              <motion.div key={deal.id} variants={item}>
                <DealCard deal={deal} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-border border-dashed">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-secondary/50" />
            </div>
            <h3 className="text-xl font-serif font-bold mb-2">No active deals right now</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Venues typically post deals during their off-peak hours. Check back soon or adjust your filters.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
