import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Apple } from "lucide-react";

const AppleSignIn = () => {
  const { toast } = useToast();

  const handleAppleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-2"
      onClick={handleAppleSignIn}
    >
      <Apple className="w-5 h-5 mr-2" />
      Continue with Apple
    </Button>
  );
};

export default AppleSignIn;