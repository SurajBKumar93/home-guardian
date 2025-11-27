import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Premium = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    setIsProcessing(true);
    
    // This is where you'd integrate with RevenueCat or your payment processor
    toast({
      title: "Coming Soon!",
      description: "Premium subscriptions will be available soon. We'll notify you when ready!",
    });
    
    setIsProcessing(false);
  };

  const features = {
    free: [
      "Up to 20 items",
      "Basic warranty tracking",
      "Photo storage (limited)",
      "Email support",
    ],
    premium: [
      "Unlimited items",
      "Unlimited photo storage",
      "Priority warranty alerts",
      "PDF & CSV export",
      "Multi-device sync",
      "Premium themes",
      "Advanced analytics",
      "Priority support",
      "Ad-free experience",
    ],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          Upgrade to Premium
        </h1>
        <p className="text-muted-foreground">
          Unlock unlimited features and take full control of your inventory
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {features.free.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full border-2" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="border-2 shadow-lg border-primary relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
            <Zap className="w-3 h-3 mr-1" />
            MOST POPULAR
          </Badge>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Premium
            </CardTitle>
            <CardDescription>Everything you need and more</CardDescription>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$4.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                or $49.99/year (save 17%)
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {features.premium.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Button
                className="w-full shadow-sm"
                onClick={() => handleSubscribe("monthly")}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Subscribe Monthly"}
              </Button>
              <Button
                variant="outline"
                className="w-full border-2"
                onClick={() => handleSubscribe("yearly")}
                disabled={isProcessing}
              >
                Subscribe Yearly (Save 17%)
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No hidden fees.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Why Go Premium?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Unlimited Everything</h3>
              <p className="text-sm text-muted-foreground">
                No limits on items, photos, or storage. Track everything you own.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Advanced Features</h3>
              <p className="text-sm text-muted-foreground">
                Export reports, sync across devices, and get priority alerts.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Premium Support</h3>
              <p className="text-sm text-muted-foreground">
                Get priority help when you need it, with dedicated support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Premium;