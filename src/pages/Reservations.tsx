import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CalendarDays, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isThisWeek, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  date: string;
  time: string;
  guests: number;
  status: string;
  created_at: string;
}

export default function Reservations() {
  const { t } = useTranslation();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    fetchReservations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;

      setReservations(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const today = data?.filter((r) => isToday(parseISO(r.date))).length || 0;
      const thisWeek = data?.filter((r) => isThisWeek(parseISO(r.date))).length || 0;

      setStats({ total, today, thisWeek });
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-primary/20 text-primary border-primary/30">{t("reservations.status.confirmed")}</Badge>;
      case "pending":
        return <Badge variant="outline">{t("reservations.status.pending")}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t("reservations.status.cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (time: string) => {
    // time is in HH:MM:SS format, convert to 12-hour
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">{t("reservations.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("reservations.subtitle")}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <StatsCard title={t("reservations.stats.total")} value={stats.total} icon={Calendar} />
          <StatsCard title={t("reservations.stats.today")} value={stats.today} icon={CalendarDays} />
          <StatsCard title={t("reservations.stats.thisWeek")} value={stats.thisWeek} icon={Users} />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reservations.table.guest")}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>{t("reservations.table.date")}</TableHead>
                <TableHead>{t("reservations.table.time")}</TableHead>
                <TableHead>{t("reservations.table.guests")}</TableHead>
                <TableHead>{t("reservations.table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t("reservations.loading")}
                  </TableCell>
                </TableRow>
              ) : reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t("reservations.noReservations")}
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">{reservation.name}</TableCell>
                    <TableCell className="text-muted-foreground">{reservation.email}</TableCell>
                    <TableCell>
                      {format(parseISO(reservation.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{formatTime(reservation.time)}</TableCell>
                    <TableCell>{reservation.guests}</TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
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
