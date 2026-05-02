import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type PayStatus = "idle" | "pushing" | "polling" | "success" | "failed";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookingId: number;
  bookingReference: string;
  amount: number;
  defaultPhone: string;
}

export default function MpesaPayModal({ open, onClose, onSuccess, bookingId, bookingReference, amount, defaultPhone }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [phone, setPhone] = useState(defaultPhone);
  const [status, setStatus] = useState<PayStatus>("idle");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    if (!open) {
      setStatus("idle");
      setCheckoutId(null);
    }
  }, [open]);

  useEffect(() => {
    setPhone(defaultPhone);
  }, [defaultPhone]);

  useEffect(() => {
    if (status !== "polling" || !checkoutId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/api/payments/mpesa/status/${checkoutId}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json() as { status: string };
        if (data.status === "completed") {
          setStatus("success");
          clearInterval(interval);
          setTimeout(onSuccess, 1500);
        } else if (data.status === "failed" || data.status === "cancelled") {
          setStatus("failed");
          clearInterval(interval);
        }
      } catch {}
    }, 3000);

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (status === "polling") setStatus("failed");
    }, 120_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, checkoutId, onSuccess]);

  const handlePay = async () => {
    setStatus("pushing");
    try {
      const res = await fetch(`${BASE}/api/payments/mpesa/stk-push`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, phone: phone.trim().replace(/\s/g, "") }),
      });
      const data = await res.json() as { checkoutRequestId?: string; devMode?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Payment initiation failed");

      setCheckoutId(data.checkoutRequestId ?? null);
      setDevMode(!!data.devMode);

      if (data.devMode) {
        setStatus("success");
        setTimeout(onSuccess, 1500);
      } else {
        setStatus("polling");
      }
    } catch (err) {
      setStatus("failed");
      toast({ title: "Payment Failed", description: String(err), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-secondary">Pay via M-Pesa</DialogTitle>
          <DialogDescription>Ref: {bookingReference} · KES {amount.toLocaleString()}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="space-y-2">
                <Label>M-Pesa Number</Label>
                <Input
                  type="tel"
                  placeholder="+254 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">We'll send an STK push to this number.</p>
              </div>
              <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold font-serif text-secondary">KES {amount.toLocaleString()}</div>
              </div>
              <Button className="w-full" onClick={handlePay}>
                <Smartphone className="mr-2 h-4 w-4" />
                Send STK Push
              </Button>
            </motion.div>
          )}

          {status === "pushing" && (
            <motion.div key="pushing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-secondary mx-auto" />
              <p className="text-sm font-medium">Initiating payment…</p>
            </motion.div>
          )}

          {status === "polling" && (
            <motion.div key="polling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center space-y-3">
              <Smartphone className="h-12 w-12 text-secondary mx-auto" />
              <p className="font-semibold">Check your phone</p>
              <p className="text-sm text-muted-foreground">Enter your M-Pesa PIN on {phone} to complete payment.</p>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
              <Button variant="ghost" size="sm" onClick={() => setStatus("failed")}>Cancel</Button>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="font-semibold text-green-700">Payment Confirmed!</p>
              {devMode && <p className="text-xs text-amber-600">Dev mode — no real charge</p>}
            </motion.div>
          )}

          {status === "failed" && (
            <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="font-semibold">Payment Failed</p>
              <p className="text-sm text-muted-foreground">The payment was not completed. Please try again.</p>
              <Button className="w-full" onClick={() => setStatus("idle")}>Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
