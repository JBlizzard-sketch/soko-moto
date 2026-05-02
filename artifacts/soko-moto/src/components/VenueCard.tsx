import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";
import type { Venue } from "@workspace/api-client-react";

export default function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Link href={`/venues/${venue.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer group flex h-32 transition-all duration-300 border-border hover:border-primary/50">
        <div className="w-32 h-full shrink-0 overflow-hidden bg-muted">
          {venue.imageUrl ? (
            <img 
              src={venue.imageUrl} 
              alt={venue.name} 
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/10">
              <span className="text-secondary/50 font-serif text-2xl">{venue.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-serif font-bold text-lg truncate pr-2">{venue.name}</h3>
              {venue.averageRating && (
                <div className="flex items-center text-sm font-medium bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  {venue.averageRating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate">{venue.neighborhood}</span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="capitalize text-xs font-normal">
              {venue.category}
            </Badge>
            <Badge variant="outline" className="capitalize text-xs font-normal border-primary/20 text-primary">
              {venue.priceRange}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
