import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

interface AgentConfig {
  id: string;
  restaurant_name: string;
  restaurant_hours: string;
  menu: string;
  instructions: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AgentConfig | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("agent_config")
        .update({
          restaurant_name: config.restaurant_name,
          restaurant_hours: config.restaurant_hours,
          menu: config.menu,
          instructions: config.instructions,
        })
        .eq("id", config.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your agent configuration has been updated.",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure your AI voice agent's behavior and knowledge
          </p>
        </div>

        <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Restaurant Name */}
          <div className="space-y-2">
            <Label htmlFor="restaurant_name">Restaurant Name</Label>
            <Input
              id="restaurant_name"
              value={config?.restaurant_name || ""}
              onChange={(e) =>
                setConfig((prev) => prev && { ...prev, restaurant_name: e.target.value })
              }
              placeholder="Enter restaurant name"
            />
          </div>

          {/* Restaurant Hours */}
          <div className="space-y-2">
            <Label htmlFor="restaurant_hours">Restaurant Hours</Label>
            <Textarea
              id="restaurant_hours"
              value={config?.restaurant_hours || ""}
              onChange={(e) =>
                setConfig((prev) => prev && { ...prev, restaurant_hours: e.target.value })
              }
              placeholder="Enter operating hours"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Example: Monday-Friday: 11am-10pm, Saturday-Sunday: 10am-11pm
            </p>
          </div>

          {/* Menu */}
          <div className="space-y-2">
            <Label htmlFor="menu">Menu</Label>
            <Textarea
              id="menu"
              value={config?.menu || ""}
              onChange={(e) =>
                setConfig((prev) => prev && { ...prev, menu: e.target.value })
              }
              placeholder="Enter menu items"
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              List your menu items, specials, and prices
            </p>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Custom Instructions</Label>
            <Textarea
              id="instructions"
              value={config?.instructions || ""}
              onChange={(e) =>
                setConfig((prev) => prev && { ...prev, instructions: e.target.value })
              }
              placeholder="Enter custom instructions for the AI agent"
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Customize how the AI behaves, its personality, and any special rules
            </p>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
