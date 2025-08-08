import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Index = () => {
  const { toast } = useToast();
  const [isUpdatingCache, setIsUpdatingCache] = useState(false);

  const handleUpdateCache = async () => {
    setIsUpdatingCache(true);
    try {
      const { data, error } = await supabase.functions.invoke('secure-run-update-football-cache');
      
      if (error) {
        toast({
          title: "Error",
          description: `Failed to update cache: ${error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Football cache updated successfully!"
        });
      }
    } catch (err) {
      toast({
        title: "Error", 
        description: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingCache(false);
    }
  };

  return (
    <main>
      <section className="min-h-screen relative flex items-center justify-center bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background to-background">
          {/* Subtle radial glow signature moment */}
          <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(50%_50%_at_50%_30%,black,transparent)] bg-gradient-to-tr from-primary/20 to-accent/20" />
        </div>

        <article className="container mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Betadona — Social Betting Leagues
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Create leagues, place friendly bets, and track live odds together. Fair, fun, and transparent.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button variant="hero" size="lg" aria-label="Get Started with Betadona">
              Get Started
            </Button>
            <Button variant="outline" size="lg" aria-label="Learn more about Betadona">
              Learn More
            </Button>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={handleUpdateCache}
              disabled={isUpdatingCache}
              variant="outline"
              size="sm"
            >
              {isUpdatingCache ? "Updating..." : "Test Cache Update"}
            </Button>
          </div>
        </article>
      </section>

      <section className="container mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-foreground">Leagues</h2>
          <p className="mt-2 text-muted-foreground">Create private or public leagues for friends or communities.</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-foreground">Bets</h2>
          <p className="mt-2 text-muted-foreground">Place friendly bets with virtual budgets and transparent scoring.</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-foreground">Live Odds</h2>
          <p className="mt-2 text-muted-foreground">Follow cached odds for upcoming matches, refreshed periodically.</p>
        </div>
      </section>
    </main>
  );
};

export default Index;
