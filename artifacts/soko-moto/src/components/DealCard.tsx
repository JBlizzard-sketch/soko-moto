import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, MapPin, Users } from "lucide-react";
import type { DealWithVenue } from "@workspace/api-client-react";

export default function DealCard({ deal }: { deal: DealWithVenue }) {
  const getUrgencyColor = (available: number) => {
    if (available <= 2) return "text-destructive font-bold";
    if (available <= 5) return "text-yellow-600 font-medium";
    return "text-muted-foreground";
  };

  const getUrgencyProgressColor = (available: number, total: number) => {
    const percent = (available / total) * 100;
    if (percent <= 20) return "bg-destructive";
    if (percent <= 50) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <Link href={`/deals/${deal.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer group flex flex-col h-full transition-all duration-300 border-border hover:border-primary/50 bg-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {deal.venue?.imageUrl ? (
            <img 
              src={deal.venue.imageUrl} 
              alt={deal.venue.name} 
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/10">
              <span className="text-secondary/50 font-serif text-2xl">{deal.venue?.name}</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="default" className="bg-primary text-primary-foreground font-bold shadow-md">
              {deal.discountPercent}% OFF
            </Badge>
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground shadow-sm capitalize">
              {deal.dealType}
            </Badge>
          </div>
        </div>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-serif font-bold text-xl leading-tight line-clamp-1">{deal.venue?.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="truncate">{deal.venue?.neighborhood}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg leading-tight text-foreground">KES {deal.dealPrice}</div>
              {deal.originalPrice && (
                <div className="text-xs text-muted-foreground line-through">KES {deal.originalPrice}</div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-end">
          <h4 className="font-medium text-sm mb-3 line-clamp-2">{deal.title}</h4>
          
          <div className="flex items-center text-sm text-muted-foreground mb-3 bg-secondary/5 px-2 py-1.5 rounded-md">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            <span>
              {format(parseISO(deal.validFrom), "h:mm a")} - {format(parseISO(deal.validUntil), "h:mm a")} today
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          <div className="flex justify-between items-center w-full text-sm">
            <div className={`flex items-center ${getUrgencyColor(deal.availableSlots)}`}>
              <Users className="w-4 h-4 mr-1" />
              <span>{deal.availableSlots} {deal.availableSlots === 1 ? 'slot' : 'slots'} left</span>
            </div>
          </div>
          <Progress 
            value={((deal.totalSlots - deal.availableSlots) / deal.totalSlots) * 100} 
            className="h-1.5 bg-secondary/10"
          />
        </CardFooter>
      </Card>
    </Link>
  );
}
