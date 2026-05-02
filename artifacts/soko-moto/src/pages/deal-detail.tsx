import { useRoute, useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { useGetDeal, useCreateBooking } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Users, CheckCircle2, ChevronLeft, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";

export default function DealDetail() {
  const [, params] = useRoute("/deals/:id");
  const dealId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [covers, setCovers] = useState(1);
  
  const { data: deal, isLoading } = useGetDeal(dealId, {
    query: {
      enabled: !!dealId
    }
  });

  const createBooking = useCreateBooking();

  const handleBook = () => {
    if (!deal) return;
    
    // In a real app, we'd have a logged in user. Mocking user ID 1 for now.
    createBooking.mutate(
      {
        data: {
          userId: 1,
          dealId: deal.id,
          covers,
          paymentMethod: "mpesa"
        }
      },
      {
        onSuccess: (booking) => {
          toast({
            title: "Booking Confirmed!",
            description: "Your spot has been secured. Show your confirmation at the venue.",
          });
          setLocation("/bookings");
        },
        onError: () => {
          toast({
            title: "Booking Failed",
            description: "Could not secure your booking. The deal might be sold out.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif font-bold mb-2">Deal Not Found</h2>
        <p className="text-muted-foreground mb-6">This deal may have expired or been removed.</p>
        <Link href="/">
          <Button>Back to Discovery</Button>
        </Link>
      </div>
    );
  }

  // Note: the backend API schema lists 'venueId' but the response for useGetDeal includes 'venue' via join in typical Drizzle setups if implemented,
  // but looking at the type `Deal`, it doesn't explicitly have `venue`. We'll assume the API returns it or we use placeholder for now.
  // We'll cast to any to access venue for this mockup based on the `DealWithVenue` type existing.
  const dealWithVenue = deal as any;
  const venue = dealWithVenue.venue;

  const isAvailable = deal.availableSlots > 0 && deal.status === "live";

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Discovery
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Header Image */}
          <div className="relative rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] lg:aspect-[16/9] bg-muted shadow-lg">
            {venue?.imageUrl ? (
              <img src={venue.imageUrl} alt={venue?.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                <Building2 className="w-20 h-20 text-secondary/20" />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary text-primary-foreground font-bold text-lg px-4 py-1.5 shadow-lg">
                {deal.discountPercent}% OFF
              </Badge>
            </div>
          </div>

          {/* Title & Info */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="outline" className="capitalize text-sm border-secondary/20 text-secondary font-medium">
                {deal.category}
              </Badge>
              <Badge variant="outline" className="capitalize text-sm border-primary/20 text-primary font-medium">
                {deal.dealType}
              </Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
              {deal.title}
            </h1>
            
            {venue && (
              <Link href={`/venues/${venue.id}`} className="inline-flex items-center text-lg text-secondary font-medium hover:underline group">
                {venue.name}
                <MapPin className="w-4 h-4 ml-2 mr-1 text-muted-foreground group-hover:text-secondary transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-secondary transition-colors">{venue.neighborhood}</span>
              </Link>
            )}
          </div>

          <Separator />

          {/* Description */}
          {deal.description && (
            <div>
              <h3 className="text-xl font-serif font-bold mb-3">About this Deal</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {deal.description}
              </p>
            </div>
          )}

          {/* Venue Info if we have it */}
          {venue?.description && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-serif font-bold mb-2">About {venue.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {venue.description}
              </p>
              {venue.address && (
                <div className="flex items-start text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" />
                  <span>{venue.address}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="border-secondary/20 shadow-xl overflow-hidden">
              <div className="bg-secondary p-6 text-secondary-foreground text-center">
                <div className="text-sm font-medium mb-1 opacity-90">Deal Price</div>
                <div className="text-4xl font-bold font-serif mb-1">KES {deal.dealPrice}</div>
                {deal.originalPrice && (
                  <div className="text-sm opacity-70 line-through">Regularly KES {deal.originalPrice}</div>
                )}
              </div>
              
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                  <div className="flex items-center text-sm font-medium">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    Valid Today
                  </div>
                  <div className="text-sm font-bold">
                    {format(parseISO(deal.validFrom), "h:mm a")} - {format(parseISO(deal.validUntil), "h:mm a")}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available Slots</span>
                    <span className={`font-bold ${deal.availableSlots <= 2 ? 'text-destructive' : 'text-foreground'}`}>
                      {deal.availableSlots} of {deal.totalSlots}
                    </span>
                  </div>
                  
                  {isAvailable ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Number of People</label>
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button 
                            className="px-4 py-2 bg-muted hover:bg-secondary/10 transition-colors disabled:opacity-50"
                            onClick={() => setCovers(Math.max(1, covers - 1))}
                            disabled={covers <= 1}
                          >
                            -
                          </button>
                          <div className="flex-1 text-center font-medium">{covers}</div>
                          <button 
                            className="px-4 py-2 bg-muted hover:bg-secondary/10 transition-colors disabled:opacity-50"
                            onClick={() => setCovers(Math.min(deal.availableSlots, covers + 1))}
                            disabled={covers >= deal.availableSlots}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex justify-between text-sm mb-4">
                          <span>Total to pay</span>
                          <span className="font-bold text-lg">KES {deal.dealPrice * covers}</span>
                        </div>
                        <Button 
                          className="w-full text-lg h-12 font-bold" 
                          size="lg"
                          onClick={handleBook}
                          disabled={createBooking.isPending}
                        >
                          {createBooking.isPending ? "Confirming..." : "Book Now"}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-3">
                          You will be charged via M-PESA
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <div className="font-bold text-muted-foreground mb-1">
                        {deal.status === "sold_out" ? "Sold Out" : "Not Available"}
                      </div>
                      <p className="text-xs text-muted-foreground">This deal is no longer accepting bookings.</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t">
                  <div className="flex items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>Show confirmation screen to host upon arrival</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>Valid only during specified hours</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>Non-refundable if cancelled within 1 hour</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
