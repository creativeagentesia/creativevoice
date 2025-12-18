import { Layout } from "@/components/Layout";
import { VoiceInterface } from "@/components/VoiceInterface";
import { useTranslation } from "react-i18next";

export default function LiveDemo() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="gradient-mesh gradient-hero min-h-[calc(100vh-3.5rem)]">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Hero Section */}
          <div className="mb-12 lg:mb-16 text-center animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-primary font-medium">
                {t("liveDemo.badge")}
              </span>
            </div>
            
            <h1 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {t("liveDemo.title")}
            </h1>
            <p className="mx-auto max-w-2xl text-base lg:text-lg text-muted-foreground px-4">
              {t("liveDemo.subtitle")}
            </p>
          </div>

          {/* Voice Interface */}
          <div className="flex justify-center animate-scale-in px-4" style={{ animationDelay: "0.2s" }}>
            <VoiceInterface />
          </div>

          {/* Features */}
          <div className="mt-12 lg:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 px-4">
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
      className="rounded-xl border border-border bg-card/50 p-4 lg:p-6 backdrop-blur-sm animate-fade-in hover:bg-card/70 transition-colors"
      style={{ animationDelay: delay }}
    >
      <h3 className="mb-2 text-base lg:text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
