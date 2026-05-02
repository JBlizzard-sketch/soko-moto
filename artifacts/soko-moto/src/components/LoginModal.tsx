import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, KeyRound, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "phone" | "otp" | "name";

export default function LoginModal() {
  const { isLoginOpen, closeLogin, requestOtp, verifyOtp } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | undefined>();
  const [isNewUser, setIsNewUser] = useState(false);

  const reset = () => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setName("");
    setDevHint(undefined);
    setIsNewUser(false);
  };

  const handleClose = () => {
    reset();
    closeLogin();
  };

  const handleRequestOtp = async () => {
    const cleaned = phone.trim().replace(/\s/g, "");
    if (!cleaned) return;
    setLoading(true);
    try {
      const result = await requestOtp(cleaned);
      setDevHint(result.devHint);
      setStep("otp");
      if (result.devMode) {
        toast({ title: "Dev Mode", description: "Use code 123456 to log in" });
      }
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await verifyOtp(phone.trim(), otp.trim(), name.trim() || undefined);
      reset();
      toast({ title: "Welcome to Soko Moto!", description: "You're now signed in." });
    } catch (err) {
      const msg = String(err);
      if (msg.includes("Invalid")) {
        toast({ title: "Wrong Code", description: "That code didn't work. Try again.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isLoginOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-secondary">
            Sign in to Soko Moto
          </DialogTitle>
          <DialogDescription>
            {step === "phone" && "Enter your Kenyan mobile number to receive a one-time code."}
            {step === "otp" && `We sent a code to ${phone}. Enter it below.`}
            {step === "name" && "Just one more thing — what's your name?"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254 712 345 678"
                    className="pl-10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">Kenya numbers only. Standard SMS rates apply.</p>
              </div>
              <Button className="w-full" onClick={handleRequestOtp} disabled={loading || phone.length < 9}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Code
              </Button>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {devHint && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{devHint}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    className="pl-10 tracking-[0.5em] text-center font-mono text-lg"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && handleVerifyOtp()}
                    autoFocus
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify & Sign In
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setStep("phone")}>
                Change phone number
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
