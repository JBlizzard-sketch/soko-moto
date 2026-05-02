import { useState } from "react";
import { useListVenues } from "@workspace/api-client-react";
import VenueCard from "@/components/VenueCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = ["all", "restaurant", "spa", "fitness", "bar", "experience"];
const NEIGHBORHOODS = ["all", "Westlands", "Kilimani", "Karen", "CBD"];

export default function Venues() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeNeighborhood, setActiveNeighborhood] = useState("all");
  const [search, setSearch] = useState("");

  const { data: venues, isLoading } = useListVenues({
    category: activeCategory === "all" ? undefined : activeCategory as "restaurant" | "spa" | "fitness" | "bar" | "experience",
    neighborhood: activeNeighborhood === "all" ? undefined : activeNeighborhood,
    status: "approved",
  });

  const filtered = venues?.filter((v) =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.cuisineOrType?.toLowerCase().includes(search.toLowerCase())
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-10 pb-12">
      <div>
        <h1 className="text-4xl font-serif font-bold text-secondary mb-2">Curated Venues</h1>
        <p className="text-muted-foreground text-lg">Every venue on Soko Moto is hand-picked for quality and experience.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search venues..."
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-venues"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className={`cursor-pointer capitalize px-3 py-1 text-sm ${activeCategory === cat ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/10"}`}
            onClick={() => setActiveCategory(cat)}
            data-testid={`badge-category-${cat}`}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {NEIGHBORHOODS.map((n) => (
          <Badge
            key={n}
            variant={activeNeighborhood === n ? "secondary" : "outline"}
            className={`cursor-pointer text-sm px-3 py-1 ${activeNeighborhood === n ? "" : "hover:bg-accent"}`}
            onClick={() => setActiveNeighborhood(n)}
            data-testid={`badge-neighborhood-${n}`}
          >
            {n}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-secondary/40" />
          </div>
          <h3 className="text-xl font-serif font-bold mb-2">No venues found</h3>
          <p className="text-muted-foreground">Try adjusting your filters.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {filtered.map((venue) => (
            <motion.div key={venue.id} variants={item}>
              <VenueCard venue={venue} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
