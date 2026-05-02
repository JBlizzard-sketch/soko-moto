import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center px-4 md:px-8">
        <div className="flex gap-6 md:gap-10 w-full">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-serif font-bold text-2xl text-secondary">Soko Moto</span>
          </Link>
          {isAdmin ? (
            <nav className="flex gap-6 items-center flex-1">
              <Link href="/admin" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-primary" : "text-muted-foreground"}`}>
                Dashboard
              </Link>
              <Link href="/admin/venues" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin/venues" ? "text-primary" : "text-muted-foreground"}`}>
                Venues
              </Link>
              <Link href="/admin/deals" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin/deals" ? "text-primary" : "text-muted-foreground"}`}>
                Deals
              </Link>
            </nav>
          ) : (
            <nav className="flex gap-6 items-center flex-1">
              <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
                Discover
              </Link>
              <Link href="/venues" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/venues" ? "text-primary" : "text-muted-foreground"}`}>
                Venues
              </Link>
              <Link href="/bookings" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/bookings" ? "text-primary" : "text-muted-foreground"}`}>
                My Bookings
              </Link>
            </nav>
          )}
          <div className="flex items-center gap-2">
            {!isAdmin ? (
              <Link href="/admin">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="ghost" size="sm">Exit Admin</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
