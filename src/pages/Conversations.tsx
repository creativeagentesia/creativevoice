import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Clock, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface Conversation {
  id: string;
  customer_name: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export default function Conversations() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    avgDuration: 0,
  });

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setConversations(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter((c) => c.status === "active").length || 0;
      const completedWithDuration = data?.filter((c) => c.duration_seconds) || [];
      const avgDuration =
        completedWithDuration.length > 0
          ? completedWithDuration.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) /
            completedWithDuration.length
          : 0;

      setStats({ total, active, avgDuration: Math.round(avgDuration) });
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary/20 text-primary border-primary/30">{t("conversations.status.active")}</Badge>;
      case "completed":
        return <Badge variant="secondary">{t("conversations.status.completed")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <div className="mb-6 lg:mb-8 animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("conversations.title")}</h1>
          <p className="mt-2 text-sm lg:text-base text-muted-foreground">
            {t("conversations.subtitle")}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 lg:mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <StatsCard title={t("conversations.stats.totalCalls")} value={stats.total} icon={Phone} />
          <StatsCard title={t("conversations.stats.activeCalls")} value={stats.active} icon={Activity} />
          <StatsCard
            title={t("conversations.stats.avgDuration")}
            value={formatDuration(stats.avgDuration)}
            icon={Clock}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card animate-fade-in overflow-x-auto" style={{ animationDelay: "0.2s" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("conversations.table.customer")}</TableHead>
                <TableHead>{t("conversations.table.date")}</TableHead>
                <TableHead>{t("conversations.table.duration")}</TableHead>
                <TableHead>{t("conversations.table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t("conversations.loading")}
                  </TableCell>
                </TableRow>
              ) : conversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t("conversations.noConversations")}
                  </TableCell>
                </TableRow>
              ) : (
                conversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell className="font-medium">
                      {conversation.customer_name || t("conversations.unknown")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(conversation.created_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>{formatDuration(conversation.duration_seconds)}</TableCell>
                    <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
