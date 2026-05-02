import { useListBookings } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, MapPin, CalendarDays, Clock, QrCode } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Bookings() {
  // Assuming logged in user is ID 1 for mockup
  const { data: bookings, isLoading } = useListBookings({ userId: 1 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold">My Bookings</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-secondary text-secondary-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'cancelled': 
      case 'no_show': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-secondary">My Bookings</h1>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-secondary/50" />
          </div>
          <h3 className="text-xl font-serif font-bold mb-2">No bookings yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You haven't snagged any dead hour deals yet. Discover what's available right now.
          </p>
          <Link href="/">
            <Button>Explore Deals</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            // Using cast for relation data that Drizzle would provide
            const deal = booking.deal as any;
            const venue = deal?.venue;

            return (
              <Card key={booking.id} className="overflow-hidden border-border bg-card shadow-sm hover-elevate transition-all">
                <div className="flex flex-col sm:flex-row">
                  {/* Left side - visual/qr placeholder */}
                  <div className="sm:w-48 bg-secondary/5 flex flex-col items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-border">
                    <QrCode className="w-16 h-16 text-secondary/40 mb-3" />
                    <div className="text-xs font-mono tracking-widest text-muted-foreground bg-background px-2 py-1 rounded border">
                      {booking.bookingReference}
                    </div>
                  </div>
                  
                  {/* Right side - details */}
                  <div className="flex-1 flex flex-col">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                      <div>
                        <Badge className={`${getStatusColor(booking.status)} mb-2 capitalize shadow-sm`}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                        <h3 className="font-serif font-bold text-xl leading-tight">
                          {deal?.title || "Deal Title"}
                        </h3>
                        <div className="font-medium text-secondary mt-1">
                          {venue?.name || "Venue Name"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">KES {booking.totalPaid}</div>
                        <div className="text-sm text-muted-foreground">{booking.covers} {booking.covers === 1 ? 'person' : 'people'}</div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-2 mt-auto">
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                          {format(parseISO(booking.createdAt), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-primary" />
                          {deal?.validFrom ? format(parseISO(deal.validFrom), "h:mm a") : ""} - 
                          {deal?.validUntil ? format(parseISO(deal.validUntil), "h:mm a") : ""}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-primary" />
                          {venue?.neighborhood || "Location"}
                        </div>
                      </div>
                      
                      {booking.status === 'confirmed' && (
                        <div className="mt-4 pt-4 border-t border-border flex justify-end">
                          <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground">
                            Cancel Booking
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
