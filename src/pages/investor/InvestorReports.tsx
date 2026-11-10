import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, Download, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label as ChartLabel,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import PortalLayout from "../../components/admin/AdminLayout";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../components/ui/chart";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { downloadContract } from "../../lib/contracts";
import { formatXafLabel } from "../../lib/format";
import {
  customRangeError,
  presetRange,
  type PeriodRange,
} from "../../lib/statementPeriods";
import { VEHICLE_TYPE_LABEL } from "../../lib/vehicles";
import {
  getInvestorReport,
  investorReportPdfPath,
} from "../../services/investorService";
import type {
  ForecastScenarioKey,
  InvestorReport,
  VehicleStanding,
} from "../../types/api";

type PeriodKey = "month" | "quarter" | "year" | "all" | "custom";

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "month", label: "Mois" },
  { key: "quarter", label: "Trimestre" },
  { key: "year", label: "Année" },
  { key: "all", label: "Tout" },
  { key: "custom", label: "Personnalisé" },
];

const STANDING_UI: Record<
  VehicleStanding,
  { label: string; variant: "green" | "orange" | "red" | "secondary" }
> = {
  PERFORMING: { label: "Performant", variant: "green" },
  WATCH: { label: "À surveiller", variant: "orange" },
  STOPPED: { label: "À l'arrêt", variant: "red" },
  CLOSED: { label: "Contrat résilié", variant: "secondary" },
};

const SCENARIOS: Array<{
  key: ForecastScenarioKey;
  label: string;
  hint: string;
}> = [
  {
    key: "CONTRACTUAL",
    label: "Contractuel",
    hint: "Les conducteurs versent chaque semaine l’intégralité de leur montant.",
  },
  {
    key: "OBSERVED",
    label: "Rythme observé",
    hint: "Moyenne de vos revenus des trois derniers mois complets.",
  },
  { key: "PRUDENT", label: "Prudent", hint: "75 % du rythme observé." },
];

const DONUT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const MAX_DONUT_PARTS = 5;

const day = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const barLabel = (key: string, granularity: "WEEK" | "MONTH") =>
  new Date(`${key}T12:00:00`).toLocaleDateString(
    "fr-FR",
    granularity === "WEEK"
      ? { day: "numeric", month: "short" }
      : { month: "short", year: "2-digit" },
  );
const signedXaf = (n: number) => `${n < 0 ? "−" : ""}${formatXafLabel(n)}`;
const pct = (n: number) => `${n.toLocaleString("fr-FR")} %`;

function Kpi(props: {
  title: string;
  value: string;
  hint: string;
  tone?: "positive" | "negative" | "muted";
}) {
  return (
    <Card className="px-6">
      <CardHeader className="p-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {props.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mt-2 whitespace-nowrap text-2xl font-extrabold tracking-tight tabular-nums text-foreground">
          {props.value}
        </div>
        <div
          className={[
            "mt-2 text-sm font-semibold",
            props.tone === "negative"
              ? "text-destructive"
              : props.tone === "positive"
                ? "text-success-foreground"
                : "text-muted-foreground",
          ].join(" ")}
        >
          {props.hint}
        </div>
      </CardContent>
    </Card>
  );
}

/** Répartition des revenus de la période entre les véhicules : les plus petits sont regroupés en « Autres ». */
function RevenueDonut({ vehicles }: { vehicles: InvestorReport["vehicles"] }) {
  const earning = useMemo(
    () => vehicles.filter((v) => v.receivedPeriod > 0),
    [vehicles],
  );
  const parts = useMemo(() => {
    const head = earning.slice(0, MAX_DONUT_PARTS);
    const rest = earning.slice(MAX_DONUT_PARTS);
    return [
      ...head.map((v, i) => ({
        key: `v${v.motoId}`,
        label: v.plate,
        value: v.receivedPeriod,
        share: v.sharePct,
        color: DONUT_COLORS[i],
      })),
      ...(rest.length > 0
        ? [
            {
              key: "others",
              label: `Autres (${rest.length})`,
              value: rest.reduce((s, v) => s + v.receivedPeriod, 0),
              share:
                Math.round(rest.reduce((s, v) => s + v.sharePct, 0) * 10) / 10,
              color: "var(--muted-foreground)",
            },
          ]
        : []),
    ];
  }, [earning]);
  const config = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        parts.map((p) => [p.key, { label: p.label, color: p.color }]),
      ),
    [parts],
  );
  if (earning.length === 0)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucun revenu sur cette période.
      </p>
    );
  const data = parts.map((p) => ({ ...p, fill: `var(--color-${p.key})` }));
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div
      className="flex flex-col items-center gap-4 @xl:flex-row @xl:justify-between @xl:gap-6"
      data-testid="revenue-donut"
    >
      <ChartContainer
        config={config}
        className="aspect-square size-44 shrink-0"
        role="img"
        aria-label="Répartition des revenus par véhicule"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="key"
                formatter={(value, _n, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{
                          background: (item.payload as { color: string }).color,
                        }}
                      />
                      {(item.payload as { label: string }).label}
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatXafLabel(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius={52}
            outerRadius={80}
            strokeWidth={3}
            paddingAngle={data.length > 1 ? 2 : 0}
            startAngle={90}
            endAngle={-270}
          >
            <ChartLabel
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 6}
                      className="fill-foreground text-base font-extrabold"
                    >
                      {formatXafLabel(total, true)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 14}
                      className="fill-muted-foreground text-[11px]"
                    >
                      perçus
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="w-full min-w-0 space-y-2 @xl:w-auto @xl:flex-1">
        {parts.map((p) => (
          <li
            key={p.key}
            className="flex flex-col gap-0.5 text-sm @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-3"
          >
            <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-foreground">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: p.color }}
              />
              <span className="truncate">{p.label}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap pl-[18px] font-bold tabular-nums @xl:pl-0">
              {pct(p.share)}{" "}
              <span className="font-medium text-muted-foreground">
                · {formatXafLabel(p.value, true)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VehicleName({ v }: { v: InvestorReport["vehicles"][number] }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-sm font-bold text-foreground">
        {VEHICLE_TYPE_LABEL[v.vehicleType]} {v.plate}
      </span>
      <span className="truncate text-xs font-semibold text-muted-foreground">
        {v.driverName ?? "Sans conducteur"}
      </span>
    </div>
  );
}

function Standing({ v }: { v: InvestorReport["vehicles"][number] }) {
  const ui = STANDING_UI[v.standing];
  return (
    <Badge variant={ui.variant} className="rounded-md">
      {ui.label}
      {v.lateWeeks > 0 ? ` · ${v.lateWeeks} sem.` : ""}
    </Badge>
  );
}

function VehiclesTable({ vehicles }: { vehicles: InvestorReport["vehicles"] }) {
  return (
    <>
      <div className="mt-4 hidden overflow-x-auto @3xl:block">
        <Table data-testid="vehicles-table">
          <TableHeader>
            <TableRow>
              {[
                "VÉHICULE / CONDUCTEUR",
                "INVESTI",
                "REVENUS (PÉRIODE)",
                "ROI",
                "RECOUVREMENT",
                "SITUATION",
              ].map((h) => (
                <TableHead
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.motoId} className="border-b border-border">
                <TableCell className="px-4 py-3.5">
                  <VehicleName v={v} />
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold tabular-nums">
                  {formatXafLabel(v.invested)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3.5 text-sm font-bold tabular-nums">
                  {formatXafLabel(v.receivedPeriod)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3.5 text-sm font-bold tabular-nums">
                  {pct(v.roiPeriodPct)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold tabular-nums">
                  {pct(v.recoveryPct)}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Standing v={v} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul
        className="mt-4 divide-y rounded-md border @3xl:hidden"
        aria-label="Rentabilité par véhicule"
        data-testid="vehicles-list"
      >
        {vehicles.map((v) => (
          <li key={v.motoId} className="space-y-2 px-3 py-3">
            <div className="flex flex-col items-start gap-1.5">
              <VehicleName v={v} />
              <Standing v={v} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Investi</dt>
              <dd className="text-right font-semibold tabular-nums">
                {formatXafLabel(v.invested)}
              </dd>
              <dt className="text-muted-foreground">Revenus (période)</dt>
              <dd className="text-right font-bold tabular-nums">
                {formatXafLabel(v.receivedPeriod)}
              </dd>
              <dt className="text-muted-foreground">ROI</dt>
              <dd className="text-right font-bold tabular-nums">
                {pct(v.roiPeriodPct)}
              </dd>
              <dt className="text-muted-foreground">Recouvrement</dt>
              <dd className="text-right font-semibold tabular-nums">
                {pct(v.recoveryPct)}
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

interface ChartRow {
  label: string;
  start: string;
  revenus: number;
  apports: number;
}

/** Barres des revenus : composant graphique shadcn, couleur issue de la configuration. */
const revenueChartConfig = {
  revenus: { label: "Revenus perçus", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface Loaded {
  key: string;
  report: InvestorReport | null;
  error: string | null;
}

export default function InvestorReports() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const onToggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  const [period, setPeriod] = useState<PeriodKey>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [scenario, setScenario] = useState<ForecastScenarioKey>("CONTRACTUAL");
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  // résultat rattaché à sa requête : changer de période n'affiche jamais l'ancien rapport
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [lastReport, setLastReport] = useState<InvestorReport | null>(null);

  const range: PeriodRange = useMemo(() => {
    const today = new Date();
    if (period === "month") return presetRange("MONTH", today);
    if (period === "quarter") return presetRange("QUARTER", today);
    if (period === "year") return presetRange("YEAR", today);
    if (period === "all") return {};
    return {
      ...(customFrom ? { from: customFrom } : {}),
      ...(customTo ? { to: customTo } : {}),
    };
  }, [period, customFrom, customTo]);
  const rangeError =
    period === "custom" && (customFrom || customTo)
      ? customRangeError(range)
      : null;
  const effective: PeriodRange = rangeError ? {} : range;
  const requestKey = `${effective.from ?? ""}|${effective.to ?? ""}|${reload}`;

  useEffect(() => {
    let cancelled = false;
    getInvestorReport({ from: effective.from, to: effective.to })
      .then((report) => {
        if (cancelled) return;
        setLoaded({ key: requestKey, report, error: null });
        setLastReport(report);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setLoaded({
            key: requestKey,
            report: null,
            error:
              err instanceof Error
                ? err.message
                : "Impossible de charger le rapport.",
          });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const current = loaded && loaded.key === requestKey ? loaded : null;
  const loading = current === null;
  const report = current?.report ?? null;
  const shown = report ?? lastReport;
  const chart = useMemo<ChartRow[]>(
    () =>
      (report?.series ?? []).map((s) => ({
        label: barLabel(s.start, report!.period.granularity),
        start: s.start,
        revenus: s.received,
        apports: s.invested,
      })),
    [report],
  );
  const hasChart = chart.some((c) => c.revenus > 0 || c.apports > 0);
  const forecast = shown?.forecast.scenarios.find((s) => s.key === scenario);

  const download = async () => {
    setBusy(true);
    await downloadContract(
      investorReportPdfPath({ from: effective.from, to: effective.to }),
      "rapport-investisseur.pdf",
    );
    setBusy(false);
  };

  const s = report?.summary;
  const periodText = report
    ? report.period.bounded
      ? `Du ${day(report.period.from)} au ${day(report.period.to)}`
      : `Depuis l'origine jusqu'au ${day(report.period.to)}`
    : " ";
  const delta = s?.deltaPct;

  return (
    <PortalLayout
      portal="investor"
      title="Rapports"
      hideHeading
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      <div className="flex-1 p-4 sm:p-6">
        <div className="@container space-y-5">
          <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-start @2xl:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </span>
                Rapports &amp; Analyses
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Consultez les performances détaillées de votre investissement.
              </p>
            </div>
            <Button
              variant="outline"
              type="button"
              className="@2xl:shrink-0"
              onClick={() => void download()}
              disabled={busy || loading}
            >
              <Download className="h-4 w-4" />
              {busy ? "Génération…" : "Télécharger le rapport (PDF)"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-foreground">
                Filtre de période
              </CardTitle>
              <div
                className="mt-2 flex flex-wrap gap-2"
                role="group"
                aria-label="Période du rapport"
              >
                {PERIODS.map((p) => (
                  <Button
                    key={p.key}
                    type="button"
                    size="sm"
                    variant={period === p.key ? "default" : "outline"}
                    aria-pressed={period === p.key}
                    onClick={() => setPeriod(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              {period === "custom" ? (
                <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="report-from">Du</Label>
                    <Input
                      id="report-from"
                      type="date"
                      value={customFrom}
                      max={customTo || undefined}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="report-to">Au</Label>
                    <Input
                      id="report-to"
                      type="date"
                      value={customTo}
                      min={customFrom || undefined}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                  {rangeError ? (
                    <p
                      className="col-span-2 text-xs font-semibold text-destructive"
                      role="alert"
                    >
                      {rangeError}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <CardDescription className="mt-2" data-testid="report-period">
                {periodText}
              </CardDescription>
            </CardHeader>
          </Card>

          {current?.error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{current.error}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setReload((n) => n + 1)}
                >
                  <RefreshCw />
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Synthèse */}
          <div
            className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-4"
            data-testid="report-kpis"
          >
            {loading || !s ? (
              [0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))
            ) : (
              <>
                <Kpi
                  title="Revenus de la période"
                  value={formatXafLabel(s.received)}
                  hint={
                    delta === null || delta === undefined
                      ? "Aucun revenu sur la période précédente"
                      : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta)} % vs période précédente`
                  }
                  tone={
                    delta === null || delta === undefined
                      ? "muted"
                      : delta < 0
                        ? "negative"
                        : "positive"
                  }
                />
                <Kpi
                  title="ROI de la période"
                  value={pct(s.roiPeriodPct)}
                  hint={`sur ${formatXafLabel(s.invested, true)} investis`}
                />
                <Kpi
                  title="Capital récupéré"
                  value={pct(s.recoveryPct)}
                  hint={`${formatXafLabel(s.receivedTotal, true)} perçus sur ${formatXafLabel(s.expectedTotal, true)} attendus`}
                  tone="muted"
                />
                <Kpi
                  title="Solde net"
                  value={signedXaf(s.net)}
                  hint={
                    s.loss > 0
                      ? `dont perte constatée : ${formatXafLabel(s.loss)}`
                      : s.net < 0
                        ? "capital pas encore récupéré"
                        : "capital récupéré"
                  }
                  tone={s.net < 0 ? "negative" : "positive"}
                />
              </>
            )}
          </div>

          {!loading && s && s.partsCount === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Vous n&apos;avez pas de part sur cette période.{" "}
              <Link
                to="/investor-market"
                className="font-semibold text-primary hover:underline"
              >
                Découvrir le marché des parts
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-2">
              {/* Revenus perçus et capital apporté */}
              <Card className="px-6">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Revenus perçus
                  </CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {report?.period.granularity === "WEEK"
                      ? "Par semaine"
                      : "Par mois"}
                    , sur la période choisie
                  </div>
                </CardHeader>
                <div className="mt-4 h-64 w-full" data-testid="report-chart">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : hasChart ? (
                    <ChartContainer
                      config={revenueChartConfig}
                      className="aspect-auto h-full w-full"
                    >
                      <BarChart
                        data={chart}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="4 4" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={44}
                          tickFormatter={(v: number) =>
                            v >= 1_000_000
                              ? `${v / 1_000_000}M`
                              : `${Math.round(v / 1000)}k`
                          }
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              formatter={(value, _name, item) => (
                                <div className="grid w-full gap-1">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                      <span
                                        className="size-2.5 shrink-0 rounded-[2px]"
                                        style={{
                                          background: "var(--color-revenus)",
                                        }}
                                      />
                                      Revenus perçus
                                    </span>
                                    <span className="font-mono font-medium tabular-nums text-foreground">
                                      {formatXafLabel(Number(value))}
                                    </span>
                                  </div>
                                  {(item.payload as ChartRow).apports > 0 ? (
                                    <div className="flex items-center justify-between gap-4 pl-[18px] text-muted-foreground">
                                      <span>Capital apporté</span>
                                      <span className="font-mono tabular-nums">
                                        {formatXafLabel(
                                          (item.payload as ChartRow).apports,
                                        )}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            />
                          }
                        />
                        <Bar
                          dataKey="revenus"
                          fill="var(--color-revenus)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                      Aucun revenu ni apport sur cette période.
                    </div>
                  )}
                </div>
                {report ? (
                  <p
                    className="mt-3 text-xs font-semibold text-muted-foreground"
                    data-testid="report-invested-period"
                  >
                    Capital apporté sur la période :{" "}
                    {formatXafLabel(report.summary.investedInPeriod)}
                  </p>
                ) : null}
              </Card>

              {/* Prévisions */}
              <Card className="px-6">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Prévisions du mois prochain
                  </CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Estimation selon le scénario choisi : ce ne sont pas des
                    garanties.
                  </div>
                </CardHeader>
                <div className="mt-4 space-y-4" data-testid="report-forecast">
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Scénario de prévision"
                  >
                    {SCENARIOS.map((sc) => (
                      <Button
                        key={sc.key}
                        type="button"
                        size="sm"
                        variant={scenario === sc.key ? "default" : "outline"}
                        aria-pressed={scenario === sc.key}
                        onClick={() => setScenario(sc.key)}
                      >
                        {sc.label}
                      </Button>
                    ))}
                  </div>
                  {forecast ? (
                    <>
                      <div className="rounded-lg bg-primary/10 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                          ESTIMATION DES REVENUS
                        </div>
                        <div className="mt-2 whitespace-nowrap text-2xl font-extrabold tabular-nums text-primary">
                          {formatXafLabel(forecast.monthly)}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-primary/90">
                          {SCENARIOS.find((sc) => sc.key === scenario)?.hint}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            RENDEMENT SUR 30 JOURS
                          </div>
                          <div className="mt-2 text-xl font-extrabold tabular-nums">
                            {pct(forecast.roi30Pct)}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            sur{" "}
                            {formatXafLabel(
                              shown?.forecast.openInvested ?? 0,
                              true,
                            )}{" "}
                            engagés
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            CAPITAL RÉCUPÉRÉ DANS
                          </div>
                          <div className="mt-2 text-xl font-extrabold tabular-nums">
                            {forecast.monthsToRecover === null
                              ? "Non estimable"
                              : forecast.monthsToRecover === 0
                                ? "Déjà fait"
                                : `≈ ${forecast.monthsToRecover} mois`}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            reste{" "}
                            {formatXafLabel(
                              shown?.forecast.capitalToRecover ?? 0,
                              true,
                            )}{" "}
                            à récupérer
                          </div>
                        </div>
                      </div>
                      {scenario === "OBSERVED" || scenario === "PRUDENT" ? (
                        <p className="text-xs text-muted-foreground">
                          {(shown?.forecast.observedMonths ?? 0) === 0
                            ? "Pas encore assez d'historique pour mesurer votre rythme."
                            : `Rythme mesuré sur ${shown?.forecast.observedMonths} mois complet${(shown?.forecast.observedMonths ?? 0) > 1 ? "s" : ""}.`}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <Skeleton className="h-40 w-full" />
                  )}
                </div>
              </Card>

              {/* Rentabilité par véhicule */}
              <Card className="px-6 @4xl:col-span-2">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Rentabilité par véhicule
                  </CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Classement par revenus de la période ; le ROI rapporte ces
                    revenus au capital investi dans le véhicule.
                  </div>
                </CardHeader>
                {loading ? (
                  <Skeleton className="mt-4 h-32 w-full" />
                ) : report && report.vehicles.length > 0 ? (
                  <VehiclesTable vehicles={report.vehicles} />
                ) : (
                  <p className="py-6 text-sm text-muted-foreground">
                    Aucun véhicule sur cette période.
                  </p>
                )}
              </Card>

              {/* Répartition des revenus */}
              <Card className="px-6 @4xl:col-span-2">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Répartition des revenus
                  </CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Part de chaque véhicule dans vos revenus de la période
                  </div>
                </CardHeader>
                <div className="mt-3">
                  {loading ? (
                    <Skeleton className="h-44 w-full" />
                  ) : report ? (
                    <RevenueDonut vehicles={report.vehicles} />
                  ) : null}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
