import { Layout } from "@/components/Layout";
import { VoiceInterface } from "@/components/VoiceInterface";
import { useTranslation } from "react-i18next";

export default function LiveDemo() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="gradient-mesh min-h-screen">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="mb-16 text-center animate-fade-in">
            <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground">
              {t("liveDemo.title")}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t("liveDemo.subtitle")}
            </p>
          </div>

          {/* Voice Interface */}
          <div className="flex justify-center animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <VoiceInterface />
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
            <FeatureCard
              title={t("liveDemo.features.naturalConversation.title")}
              description={t("liveDemo.features.naturalConversation.description")}
              delay="0.3s"
            />
            <FeatureCard
              title={t("liveDemo.features.realtimeResponse.title")}
              description={t("liveDemo.features.realtimeResponse.description")}
              delay="0.4s"
            />
            <FeatureCard
              title={t("liveDemo.features.smartReservations.title")}
              description={t("liveDemo.features.smartReservations.description")}
              delay="0.5s"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FeatureCard({ title, description, delay }: { title: string; description: string; delay: string }) {
  return (
    <div 
      className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <h3 className="mb-2 text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
