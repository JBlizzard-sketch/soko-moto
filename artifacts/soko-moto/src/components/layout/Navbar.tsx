import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Ticket, Star } from "lucide-react";

const tierColors = {
  bronze: "text-amber-700",
  silver: "text-slate-500",
  gold: "text-yellow-500",
};

export default function Navbar() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  const { user, loading, openLogin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center px-4 md:px-8">
        <div className="flex gap-6 md:gap-10 w-full">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
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

            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 max-w-[160px]">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="flex flex-col gap-0.5">
                      <span className="font-medium truncate">{user.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">{user.phone}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/bookings" className="flex items-center gap-2 cursor-pointer">
                        <Ticket className="h-4 w-4" />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Star className={`h-4 w-4 ${tierColors[user.loyaltyTier]}`} />
                      <span className="capitalize">{user.loyaltyTier} · {user.loyaltyPoints} pts</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="gap-2 text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" onClick={openLogin}>
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
