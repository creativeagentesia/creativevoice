import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AgentConfig {
  id: string;
  restaurant_name: string;
  restaurant_hours: string;
  menu: string;
  instructions: string;
}

export default function Settings() {
  const { t } = useTranslation();
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
        description: t("settings.error"),
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
        title: t("settings.success"),
        description: t("settings.success"),
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: t("settings.error"),
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
      <div className="container mx-auto max-w-2xl px-4 lg:px-6 py-8 lg:py-12">
        <div className="mb-6 lg:mb-8 animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="mt-2 text-sm lg:text-base text-muted-foreground">
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="space-y-6 lg:space-y-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Restaurant Name */}
          <div className="space-y-2">
            <Label htmlFor="restaurant_name">{t("settings.form.restaurantName")}</Label>
            <Input
              id="restaurant_name"
              value={config?.restaurant_name || ""}
              onChange={(e) =>
                setConfig((prev) => prev && { ...prev, restaurant_name: e.target.value })
              }
              placeholder={t("settings.form.restaurantNamePlaceholder")}
            />
          </div>

          {/* Restaurant Hours */}
          <div className="space-y-2">
            <Label htmlFor="restaurant_hours">{t("settings.form.restaurantHours")}</Label>
            <Textarea
              id="restaurant_hours"
              value={config?.restaurant_hours || ""}
              onChange={(e) =>
                setConfig((prev) => prev && { ...prev, restaurant_hours: e.target.value })
              }
              placeholder={t("settings.form.restaurantHoursPlaceholder")}
              rows={3}
            />
          </div>

          {/* Menu */}
          <div className="space-y-2">
            <Label htmlFor="menu">{t("settings.form.menu")}</Label>
            <Textarea
              id="menu"
              value={config?.menu || ""}
              onChange={(e) =>
                setConfig((prev) => prev && { ...prev, menu: e.target.value })
              }
              placeholder={t("settings.form.menuPlaceholder")}
              rows={5}
            />
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">{t("settings.form.instructions")}</Label>
            <Textarea
              id="instructions"
              value={config?.instructions || ""}
              onChange={(e) =>
                setConfig((prev) => prev && { ...prev, instructions: e.target.value })
              }
              placeholder={t("settings.form.instructionsPlaceholder")}
              rows={5}
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("settings.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("settings.save")}
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
