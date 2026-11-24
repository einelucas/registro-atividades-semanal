"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Activity as ActivityIcon,
  BookOpen,
  Building2,
  CheckCheck,
  ClipboardCheck,
  Clock,
  Download,
  Edit3,
  FilePlus,
  FileStack,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  List,
  ListTodo,
  LogOut,
  MonitorPlay,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  UserRound,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import type {
  Activity,
  Bootstrap,
  Option,
  Person,
  ActivityStatus,
} from "../lib/types";
import { BarChart, chartGroupIds, DonutChart } from "./Charts";
import TodoWorkspace from "./todo/TodoWorkspace";
import { theme } from "../lib/theme";
const sectionIcons = [FilePlus, ListTodo, List, LayoutDashboard, UsersRound, Settings];

function categoryIcon(name: string) {
  const category = name.toLocaleUpperCase("pt-BR");

  if (/^(PROJETO\b|BRIEFING|ESTUDO)/.test(category)) return BookOpen;
  if (/^(VISITA|MEDIÇÃO)/.test(category)) return Building2;
  if (/^(LEVANTAMENTO|EQUALIZAÇÃO)/.test(category)) return ActivityIcon;
  if (/^(TREINAMENTOS|PALESTRAS)/.test(category)) return GraduationCap;
  if (/^(APOIO|CONTATO|REUNIÃO|ORIENTAÇÃO)/.test(category)) return UsersRound;
  if (/ORÇAMENTOS|PAGAMENTOS/.test(category)) return Wallet;
  if (category === "REVISÃO") return CheckCheck;
  if (category === "OUTROS") return Plus;
  if (/APROVA|PENDÊNCIAS/.test(category)) return ClipboardCheck;
  if (/CONTRAT|REQUISIÇÕES|MATERIAIS/.test(category)) return FileStack;

  return FileText;
}

type Page = "register" | "todo" | "mine" | "dashboard" | "all" | "settings";
type ChartSelection = {
  field: keyof typeof chartGroupIds | "status";
  id: string;
  label: string;
};
const navEntries: { id: Page; label: string; mobileLabel: string }[] = [
  { id: "register", label: "Registrar atividade", mobileLabel: "Registrar" },
  { id: "todo", label: "Tarefas", mobileLabel: "Tarefas" },
  { id: "mine", label: "Minhas atividades", mobileLabel: "Minhas" },
  { id: "dashboard", label: "Visão gerencial", mobileLabel: "Gráficos" },
  { id: "all", label: "Registros da equipe", mobileLabel: "Equipe" },
  { id: "settings", label: "Configurações", mobileLabel: "Ajustes" },
];
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const startWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const dateLabel = (v: string) =>
  new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR");
const statusLabel = (s: ActivityStatus) =>
  s === "DONE" ? "Concluído" : "Em andamento";
const statusChip = (s: ActivityStatus) => (
  <Chip
    size="small"
    label={statusLabel(s)}
    sx={{
      fontSize: 11,
      fontWeight: 800,
      bgcolor: s === "DONE" ? "#e7f7f0" : "#fff4df",
      color: s === "DONE" ? "#168267" : "#a56d12",
    }}
  />
);
const cardTitle = (title: string, extra?: React.ReactNode) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={{ mb: 2, gap: 1 }}
  >
    <Typography variant="h6" fontSize={16}>
      {title}
    </Typography>
    {extra}
  </Stack>
);
const Panel = ({
  title,
  extra,
  children,
}: {
  title?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card>
    <CardContent sx={{ p: { xs: 2.2, sm: 3 }, "&:last-child": { pb: 3 } }}>
      {title && cardTitle(title, extra)}
      {children}
    </CardContent>
  </Card>
);
const headline = (
  title: string,
  subtitle: string,
  action?: React.ReactNode,
) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    justifyContent="space-between"
    alignItems={{ xs: "stretch", sm: "center" }}
    sx={{ mb: 3, gap: 1.5 }}
  >
    <Box>
      <h1 className="page-title">{title}</h1>
      <Typography className="page-desc">{subtitle}</Typography>
    </Box>
    {action}
  </Stack>
);

function csvDownload(rows: Activity[]) {
  const escape = (x: string) => {
    const v = /^[=+@\-\t\r]/.test(x) ? `'${x}` : x;
    return `"${v.replaceAll('"', '""')}"`;
  };
  const lines = [
    ["Data", "Colaborador", "Unidade", "Categoria", "Descrição", "Situação"],
    ...rows.map((r) => [
      r.date,
      r.person,
      r.unit,
      r.category,
      r.description,
      statusLabel(r.status),
    ]),
  ];
  const csv =
    "\ufeff" + lines.map((row) => row.map(escape).join(";")).join("\r\n");
  const a = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  a.href = url;
  a.download = `inpasa_atividades_${today()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export default function App() {
  const [data, setData] = useState<Bootstrap | null>(null),
    [current, setCurrent] = useState<Person | null>(null),
    [page, setPage] = useState<Page>("register"),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [editing, setEditing] = useState<Activity | null>(null),
    [presentation, setPresentation] = useState(false),
    [token, setToken] = useState<string | null>(null);
  const [period, setPeriod] = useState("7"),
    [unitFilter, setUnitFilter] = useState("Todas"),
    [personFilter, setPersonFilter] = useState("Todos"),
    [search, setSearch] = useState(""),
    [mineSearch, setMineSearch] = useState(""),
    [mineStatus, setMineStatus] = useState("ALL");
  const [unitId, setUnitId] = useState(""),
    [categoryId, setCategoryId] = useState(""),
    [date, setDate] = useState(today()),
    [description, setDescription] = useState(""),
    [status, setStatus] = useState<ActivityStatus>("DONE");
  const [newUnit, setNewUnit] = useState(""),
    [newCategory, setNewCategory] = useState("");
  const [chartSelection, setChartSelection] = useState<ChartSelection | null>(null);
  const manager = current?.role === "MANAGER";
  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const base = "";
      const res = await fetch(`${base}/api${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",

        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Erro HTTP ${res.status}`);
      return json;
    },
    [],
  );
  const refresh = useCallback(async () => {
    const result = await request("/bootstrap");
    setData(result);

    setCurrent(
      () => result.people.find((p: Person) => p.id === result.currentUserId) || null,
    );
    return result as Bootstrap;
  }, [request]);
  useEffect(() => {
    let active = true;
    refresh().catch((e) => {if(!active)return;if(String(e.message).includes('Sessão expirada'))window.location.assign('/login');else setError(e.message||'Erro ao carregar dados');})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  const action = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
      setMessage(success);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar");
    } finally {
      setBusy(false);
    }
  };
  const mine = useMemo(
    () => data?.ownActivities ?? data?.activities.filter((r) => r.personId === current?.id) ?? [],
    [data, current],
  );
  const weekRecords = useMemo(
    () =>
      mine
        .filter((r) => r.date >= startWeek())
        .sort((a, b) => b.date.localeCompare(a.date)),
    [mine],
  );
  const filtered = useMemo(
    () =>
      data?.activities.filter(
        (r) =>
          (period === "all" || r.date >= daysAgo(period === "7" ? 6 : 29)) &&
          (unitFilter === "Todas" || r.unit === unitFilter) &&
          (personFilter === "Todos" || r.person === personFilter),
      ) || [],
    [data, period, unitFilter, personFilter],
  );
  const chartRecords = chartSelection
    ? filtered.filter((record) => {
        const key = chartSelection.field === "status" ? "status" : chartGroupIds[chartSelection.field];
        return record[key] === chartSelection.id;
      })
    : [];
  const visibleMine = useMemo(
    () =>
      mine
        .filter(
          (r) =>
            (mineStatus === "ALL" || r.status === mineStatus) &&
            `${r.description} ${r.unit} ${r.category}`
              .toLowerCase()
              .includes(mineSearch.toLowerCase()),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [mine, mineSearch, mineStatus],
  );
  const allRecords = useMemo(
    () =>
      filtered.filter((r) =>
        `${r.description} ${r.unit} ${r.category} ${r.person}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [filtered, search],
  );
  const categoryOptions: Option[] = data?.categories ?? [];
  const editableCategories =
    editing && !categoryOptions.some((category) => category.id === editing.categoryId)
      ? [...categoryOptions, { id: editing.categoryId, name: editing.category }]
      : categoryOptions;
  const selectedCategory = editableCategories.find((category) => category.id === categoryId) ?? null;
  const SelectedCategoryIcon = selectedCategory ? categoryIcon(selectedCategory.name) : null;
  const resetForm = () => {
    setEditing(null);
    setUnitId(data?.units[0]?.id || "");
    setCategoryId("");
    setDate(today());
    setDescription("");
    setStatus("DONE");
  };
  const edit = (record: Activity) => {
    setEditing(record);
    setUnitId(record.unitId);
    setCategoryId(record.categoryId);
    setDate(record.date);
    setDescription(record.description);
    setStatus(record.status);
    setPage("register");
  };
  useEffect(() => {
    if (data) {
      setUnitId((v) => v || data.units[0]?.id || "");
    }
  }, [data]);
  const saveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    await action(
      async () => {
        await request(`/activities${editing ? `/${editing.id}` : ""}`, {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            personId: current.id,
            unitId,
            categoryId,
            date,
            description: description.trim(),
            status,
          }),
        });
        resetForm();
      },
      editing ? "Atividade atualizada." : "Atividade registrada.",
    );
  };
  const repeat = (r: Activity) => {
    if (!categoryOptions.some((category) => category.id === r.categoryId)) {
      setEditing(null);
      setUnitId(r.unitId);
      setCategoryId("");
      setDate(today());
      setDescription(r.description);
      setStatus(r.status);
      setPage("register");
      return;
    }
    return action(
      () =>
        request("/activities", {
          method: "POST",
          body: JSON.stringify({
            personId: current?.id,
            unitId: r.unitId,
            categoryId: r.categoryId,
            date: today(),
            description: r.description,
            status: r.status,
          }),
        }),
      "Atividade repetida para hoje.",
    );
  };
  const remove = (r: Activity) => {
    if (!confirm(`Excluir a atividade "${r.description}"?`)) return;
    action(
      () =>
        request(
          `/activities/${r.id}?personId=${encodeURIComponent(current?.id || "")}`,
          { method: "DELETE" },
        ),
      "Atividade excluída.",
    );
  };
  const filters = (
    <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} sx={{ mb: 2.5 }}>
      <TextField
        select
        size="small"
        label="Período"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        sx={{ minWidth: 165 }}
      >
        <MenuItem value="7">Últimos 7 dias</MenuItem>
        <MenuItem value="30">Últimos 30 dias</MenuItem>
        <MenuItem value="all">Todo o período</MenuItem>
      </TextField>
      <TextField
        select
        size="small"
        label="Unidade"
        value={unitFilter}
        onChange={(e) => setUnitFilter(e.target.value)}
        sx={{ minWidth: 165 }}
      >
        <MenuItem value="Todas">Todas as unidades</MenuItem>
        {data?.units.map((u) => (
          <MenuItem key={u.id} value={u.name}>
            {u.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Colaborador"
        value={personFilter}
        onChange={(e) => setPersonFilter(e.target.value)}
        sx={{ minWidth: 170 }}
      >
        <MenuItem value="Todos">Toda a equipe</MenuItem>
        {data?.people
          .filter((p) => p.role !== "MANAGER")
          .map((p) => (
            <MenuItem key={p.id} value={p.name}>
              {p.name}
            </MenuItem>
          ))}
      </TextField>
    </Stack>
  );
  const stats = (rows: Activity[]) => (
    <div className="stat-grid">
      {[
        { icon: BookOpen, label: "Atividades registradas", value: rows.length },
        {
          icon: CheckCheck,
          label: "Concluídas",
          value: rows.filter((r) => r.status === "DONE").length,
        },
        {
          icon: Clock,
          label: "Em andamento",
          value: rows.filter((r) => r.status === "IN_PROGRESS").length,
        },
        {
          icon: UsersRound,
          label: "Pessoas com registros",
          value: new Set(rows.map((r) => r.personId)).size,
        },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent sx={{ p: 2.3 }}>
            <Box
              sx={{
                bgcolor: "#edf3fc",
                borderRadius: 2,
                display: "inline-flex",
                p: 1,
                mb: 2,
                color: "#173c75",
              }}
            >
              <s.icon size={20} />
            </Box>
            <Typography fontSize={12} color="text.secondary">
              {s.label}
            </Typography>
            <Typography fontSize={30} fontWeight={800}>
              {s.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  const chartCards = (rows: Activity[]) => (
    <div className="overview-grid">
      <Panel
        title="Atividades por unidade"
        extra={<Chip size="small" label="Distribuição" />}
      >
        <BarChart rows={rows} field="unit" onSelect={(id, label) => setChartSelection({ field: "unit", id, label })} />
      </Panel>
      <Panel
        title="Situação das atividades"
        extra={<Chip size="small" label="Resumo" />}
      >
        <DonutChart rows={rows} onSelect={(id, label) => setChartSelection({ field: "status", id, label })} />
      </Panel>
      <Panel
        title="Tipos de atividade"
        extra={<Chip size="small" label="Categorias" />}
      >
        <BarChart rows={rows} field="category" onSelect={(id, label) => setChartSelection({ field: "category", id, label })} />
      </Panel>
      <Panel
        title="Registros por colaborador"
        extra={<Chip size="small" label="Participação" />}
      >
        <BarChart rows={rows} field="person" onSelect={(id, label) => setChartSelection({ field: "person", id, label })} />
      </Panel>
    </div>
  );
  const table = (rows: Activity[], editable = false) => (
    <div className="table-scroller">
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                "Atividade",
                ...(editable ? [] : ["Colaborador"]),
                "Unidade",
                "Data",
                "Situação",
                ...(editable ? ["Ações"] : []),
              ].map((x) => (
                <TableCell
                  key={x}
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#8b98aa",
                    whiteSpace: "nowrap",
                  }}
                >
                  {x.toUpperCase()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length ? (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell sx={{ minWidth: 205 }}>
                    <span className="activity-description">
                      {r.description}
                    </span>
                    <span className="activity-cell-extra">{r.category}</span>
                  </TableCell>
                  {!editable && <TableCell>{r.person}</TableCell>}
                  <TableCell>{r.unit}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {dateLabel(r.date)}
                  </TableCell>
                  <TableCell>{statusChip(r.status)}</TableCell>
                  {editable && (
                    <TableCell>
                      <div className="actions">
                        <Tooltip title="Editar">
                          <IconButton
                            disabled={busy}
                            size="small"
                            onClick={() => edit(r)}
                          >
                            <Edit3 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Repetir para hoje">
                          <IconButton
                            disabled={busy}
                            size="small"
                            onClick={() => repeat(r)}
                          >
                            <RotateCcw size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            disabled={busy}
                            size="small"
                            color="error"
                            onClick={() => remove(r)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={editable ? 5 : 5}
                  align="center"
                  sx={{ py: 5, color: "text.secondary" }}
                >
                  Nenhuma atividade encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
  const management = () => (
    <>
      {headline(
        "Visão gerencial",
        "Acompanhe onde a equipe está concentrando esforços.",
        <Button
          variant="contained"
          startIcon={<MonitorPlay size={17} />}
          onClick={() => setPresentation(true)}
        >
          Modo apresentação
        </Button>,
      )}
      {filters}
      {stats(filtered)}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, mb: 1 }}>
        Selecione um item nos gráficos para ver seus registros.
      </Typography>
      {chartCards(filtered)}
      <Box sx={{ height: 20 }} />
      <Panel
        title="Atividades recentes"
        extra={
          <Button
            onClick={() => csvDownload(filtered)}
            size="small"
            startIcon={<Download size={16} />}
          >
            Exportar CSV
          </Button>
        }
      >
        {table(
          [...filtered]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8),
        )}
        <Typography fontSize={11} color="text.secondary" sx={{ mt: 2 }}>
          Indicadores representam registros de atividades, não horas trabalhadas
          ou desempenho individual.
        </Typography>
      </Panel>
    </>
  );
  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (loading)
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <CircularProgress />
          Carregando aplicativo...
        </Box>
      </ThemeProvider>
    );
  return (
    <ThemeProvider theme={theme}>
      <Snackbar
        open={!!message}
        autoHideDuration={3500}
        onClose={() => setMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setMessage("")}>
          {message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
      {!data ? (
        <Box sx={{ maxWidth: 620, mx: "auto", mt: 8 }}>
          <Alert severity="error">
            Não foi possível conectar à API. Verifique o backend, DATABASE_URL e
            configurações de acesso.{" "}
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </Alert>
        </Box>
      ) : !current ? (
        <Box sx={{p:4,textAlign:'center'}}>Carregando perfil...</Box>
      ) : (
        <>
          <header className="main-header">
            <Stack direction="row" alignItems="center" gap={2}>
              <img
                src="/logo-inpasa.png"
                alt="Inpasa"
                style={{ width: 118, height: 57, objectFit: "contain" }}
              />
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography fontSize={14} fontWeight={800}>
                  Projetos & Arquitetura
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  Gestão de atividades da equipe
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" gap={1.3}>
              <div className="topbar-person">
                <Typography fontSize={13}>
                  {current.name} • {manager ? "Gestora" : "Colaborador"}
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: "#e8f0fb",
                    color: "#173c75",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {current.name.slice(0, 2).toUpperCase()}
                </Avatar>
              </div>
              <Button size="small" href="/account" sx={{textTransform:'none'}}>Minha conta</Button><Tooltip title="Sair">
                <IconButton
                  onClick={async () => { await fetch('/api/auth/logout',{method:'POST'}); window.location.assign('/login'); }}
                >
                  <LogOut size={19} />
                </IconButton>
              </Tooltip>
            </Stack>
          </header>
          <div className={page === "todo" ? "app-shell app-shell--todo" : "app-shell"}>
            <aside className="side" aria-label="Navegação principal">
              <div className="nav-label">ÁREA DE TRABALHO</div>
              {navEntries
                .map((n) => {
                  const Icon = sectionIcons[navEntries.indexOf(n)];
                  return (
                    <Tooltip key={n.id} title={n.label} placement="right" arrow>
                      <Button
                        aria-label={n.label}
                        aria-current={page === n.id ? "page" : undefined}
                        onClick={() => navigate(n.id)}
                        fullWidth
                        sx={{
                          justifyContent: "center",
                          p: 1.5,
                          mb: 0.3,
                          color: page === n.id ? "#173c75" : "#64738b",
                          bgcolor: page === n.id ? "#eaf1fb" : "transparent",
                        }}
                      >
                        <Icon size={19} />
                      </Button>
                    </Tooltip>
                  );
                })}
              <Divider sx={{ my: 2 }} />
              <Typography className="hint" sx={{ px: 1.5 }}>
                INPASA • Projetos & Arquitetura
              </Typography>
            </aside>
            <main className="app-content">
               {page === "todo" && <TodoWorkspace personName={current.name} units={data.units} categories={data.categories} onActivityChange={refresh} />}
              {page === "register" && (
                <>
                  {headline(
                    editing ? "Editar atividade" : "Registrar atividade",
                    "Um registro rápido para dar visibilidade ao seu trabalho.",
                  )}
                  <div className="overview-grid">
                    <Panel>
                      <Box component="form" onSubmit={saveActivity}>
                        <Typography fontWeight={800} sx={{ mb: 2 }}>
                          1. O que você fez?
                        </Typography>
                        <Autocomplete
                          fullWidth
                          options={editableCategories}
                          getOptionLabel={(category) => category.name}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          value={selectedCategory}
                          onChange={(_, category) => setCategoryId(category?.id ?? "")}
                          noOptionsText="Nenhum tipo de atividade encontrado"
                          renderOption={(props, category) => {
                            const { key, ...optionProps } = props;
                            const Icon = categoryIcon(category.name);

                            return (
                              <li key={key} {...optionProps}>
                                <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                  <Icon size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
                                  {category.name}
                                </Box>
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Tipo de atividade"
                              required
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: SelectedCategoryIcon && (
                                  <InputAdornment position="start">
                                    <SelectedCategoryIcon size={18} aria-hidden="true" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          )}
                        />
                        <Divider sx={{ my: 3 }} />
                        <Typography fontWeight={800} sx={{ mb: 2 }}>
                          2. Onde e quando?
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                          <TextField
                            select
                            required
                            fullWidth
                            label="Unidade"
                            value={unitId}
                            onChange={(e) => setUnitId(e.target.value)}
                          >
                            {data.units.map((u) => (
                              <MenuItem key={u.id} value={u.id}>
                                {u.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            required
                            fullWidth
                            type="date"
                            label="Data"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Stack>
                        <Divider sx={{ my: 3 }} />
                        <Typography fontWeight={800} sx={{ mb: 2 }}>
                          3. Descreva sua entrega
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          label="Descrição curta"
                          placeholder="Ex.: Revisão da planta do refeitório..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          slotProps={{ htmlInput: { maxLength: 300 } }}
                          required
                        />
                        <Typography className="hint" sx={{ my: 1 }}>
                          Uma frase é suficiente. Máximo de 300 caracteres.
                        </Typography>
                        <Typography
                          fontWeight={700}
                          fontSize={13}
                          sx={{ mt: 2, mb: 1 }}
                        >
                          Situação
                        </Typography>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          <Button
                            type="button"
                            variant={
                              status === "DONE" ? "contained" : "outlined"
                            }
                            startIcon={<CheckCheck size={16} />}
                            onClick={() => setStatus("DONE")}
                          >
                            Concluído
                          </Button>
                          <Button
                            type="button"
                            variant={
                              status === "IN_PROGRESS"
                                ? "contained"
                                : "outlined"
                            }
                            startIcon={<Clock size={16} />}
                            onClick={() => setStatus("IN_PROGRESS")}
                          >
                            Em andamento
                          </Button>
                        </Stack>
                        <Stack
                          direction="row"
                          justifyContent="flex-end"
                          gap={1}
                          sx={{ mt: 4 }}
                        >
                          <Button disabled={busy} onClick={resetForm}>
                            Limpar
                          </Button>
                          <Button
                            variant="contained"
                            type="submit"
                            disabled={
                              busy ||
                              !unitId ||
                              !categoryId ||
                              !description.trim()
                            }
                            startIcon={<CheckCheck size={17} />}
                          >
                            {editing ? "Salvar alterações" : "Salvar atividade"}
                          </Button>
                        </Stack>
                      </Box>
                    </Panel>
                    <Stack gap={2}>
                      <Panel
                        title="Minha semana"
                        extra={
                          <Chip
                            size="small"
                            label={`${weekRecords.length} registros`}
                          />
                        }
                      >
                        <Typography className="hint" sx={{ mb: 2 }}>
                          Atividades registradas desde {dateLabel(startWeek())}.
                        </Typography>
                        {weekRecords.length ? (
                          weekRecords.slice(0, 6).map((r) => (
                            <Box
                              key={r.id}
                              sx={{
                                display: "flex",
                                gap: 1.5,
                                borderBottom: "1px solid #edf1f7",
                                py: 1.5,
                              }}
                            >
                              <span
                                className="status-dot"
                                style={{
                                  background:
                                    r.status === "DONE" ? "#2dbb96" : "#efac2e",
                                  marginTop: 7,
                                  flexShrink: 0,
                                }}
                              />
                              <Box>
                                <Typography fontWeight={700} fontSize={13}>
                                  {r.description}
                                </Typography>
                                <Typography
                                  fontSize={12}
                                  color="text.secondary"
                                  sx={{ my: 0.7 }}
                                >
                                  {r.unit} • {dateLabel(r.date)}
                                </Typography>
                                {statusChip(r.status)}
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Typography
                            sx={{ py: 4 }}
                            color="text.secondary"
                            textAlign="center"
                          >
                            Sua semana começa aqui. Registre sua primeira
                            atividade.
                          </Typography>
                        )}
                        <Button
                          fullWidth
                          sx={{ mt: 2 }}
                          variant="outlined"
                          onClick={() => navigate("mine")}
                        >
                          Ver todas as minhas atividades
                        </Button>
                      </Panel>
                      <div className="note">
                        <Lightbulb size={19} />
                        <Typography fontWeight={800} sx={{ mt: 1 }}>
                          Uma dica para facilitar
                        </Typography>
                        <Typography fontSize={13} sx={{ mt: 1 }}>
                          Registre ao terminar uma tarefa, sem esperar até
                          sexta-feira. Assim a apresentação semanal já fica
                          praticamente pronta.
                        </Typography>
                      </div>
                    </Stack>
                  </div>
                </>
              )}
              {page === "mine" && (
                <>
                  {headline(
                    "Minhas atividades",
                    "Consulte, repita ou edite o que você registrou.",
                    <Button
                      variant="contained"
                      onClick={() => {
                        resetForm();
                        navigate("register");
                      }}
                      startIcon={<Plus size={17} />}
                    >
                      Nova atividade
                    </Button>,
                  )}
                  <Panel>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      gap={1.5}
                      sx={{ mb: 2 }}
                    >
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Buscar atividade..."
                        value={mineSearch}
                        onChange={(e) => setMineSearch(e.target.value)}
                      />
                      <TextField
                        size="small"
                        select
                        label="Situação"
                        value={mineStatus}
                        onChange={(e) => setMineStatus(e.target.value)}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="ALL">Todas</MenuItem>
                        <MenuItem value="DONE">Concluído</MenuItem>
                        <MenuItem value="IN_PROGRESS">Em andamento</MenuItem>
                      </TextField>
                    </Stack>
                    {table(visibleMine, true)}
                  </Panel>
                </>
              )}
              {page === "dashboard" && management()}
              {page === "all" && (
                <>
                  {headline(
                    "Registros da equipe",
                    "Todas as atividades, com filtros para preparar a reunião.",
                    <Button
                      variant="contained"
                      onClick={() => csvDownload(allRecords)}
                      startIcon={<Download size={16} />}
                    >
                      Exportar CSV
                    </Button>,
                  )}
                  {filters}
                  <Panel>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Pesquisar por atividade, pessoa ou unidade..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    {table(allRecords)}
                    <Typography className="hint" sx={{ mt: 2 }}>
                      {allRecords.length} registros encontrados.
                    </Typography>
                  </Panel>
                </>
              )}
              {page === "settings" && (
                <>
                  {headline(
                    "Configurações",
                    manager
                      ? "Personalize as opções de preenchimento."
                      : "Consulte as unidades e os tipos de atividade. A gestão pode alterar essas opções.",
                  )}
                  <div className="overview-grid">
                    {(
                      [
                        {
                          kind: "units",
                          title: "Unidades",
                          items: data.units,
                          value: newUnit,
                          setValue: setNewUnit,
                        },
                        {
                          kind: "categories",
                          title: "Tipos de atividade",
                          items: data.categories,
                          value: newCategory,
                          setValue: setNewCategory,
                        },
                      ] as const
                    ).map((group) => (
                      <Panel key={group.kind} title={group.title}>
                        <Typography
                          fontSize={13}
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Itens disponíveis nos formulários.
                        </Typography>
                        <Stack
                          direction="row"
                          gap={1}
                          flexWrap="wrap"
                          sx={{ mb: 2 }}
                        >
                          {group.items.map((i) => (
                            <Chip
                              key={i.id}
                              label={i.name}
                              onDelete={
                                manager
                                  ? () => {
                                      if (group.items.length <= 1) {
                                        setError("Mantenha pelo menos uma opção.");
                                        return;
                                      }
                                      action(
                                        () =>
                                          request(
                                            `/settings?kind=${group.kind}&id=${i.id}&personId=${encodeURIComponent(current.id)}`,
                                            { method: "DELETE" },
                                          ),
                                        "Opção desativada.",
                                      );
                                    }
                                  : undefined
                              }
                            />
                          ))}
                        </Stack>
                        {manager && (
                          <Stack direction="row" gap={1}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Nova opção"
                              value={group.value}
                              onChange={(e) => group.setValue(e.target.value)}
                            />
                            <Button
                              disabled={busy || !group.value.trim()}
                              variant="contained"
                              onClick={() =>
                                action(async () => {
                                  await request("/settings", {
                                    method: "POST",
                                    body: JSON.stringify({
                                      kind: group.kind,
                                      name: group.value,
                                      personId: current.id,
                                    }),
                                  });
                                  group.setValue("");
                                }, "Opção adicionada.")
                              }
                            >
                              Adicionar
                            </Button>
                          </Stack>
                        )}
                      </Panel>
                    ))}
                  </div>
                </>
              )}
            </main>
          </div>
          <nav className="mobile-nav">
            {navEntries
              .map((n) => {
                const Icon = sectionIcons[navEntries.indexOf(n)];
                return (
                  <Button
                    key={n.id}
                    aria-label={n.label}
                    aria-current={page === n.id ? "page" : undefined}
                    onClick={() => navigate(n.id)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      fontSize: 10,
                      p: 0.5,
                      minWidth: 0,
                      color: page === n.id ? "#173c75" : "#78869a",
                    }}
                  >
                    <Icon size={18} />
                    {n.mobileLabel}
                  </Button>
                );
              })}
          </nav>
          {presentation && (
            <div className="pres-view">
              <div className="pres-inner">
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 4 }}
                >
                  <img src="/logo-inpasa.png" width={140} alt="Inpasa" />
                  <Button
                    className="no-print"
                    startIcon={<X size={17} />}
                    onClick={() => setPresentation(false)}
                  >
                    Fechar apresentação
                  </Button>
                </Stack>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  Projetos & Arquitetura / Resumo gerencial
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {period === "7"
                    ? "Últimos 7 dias"
                    : period === "30"
                      ? "Últimos 30 dias"
                      : "Todo o período"}{" "}
                  • {unitFilter} • {personFilter}
                </Typography>
                {stats(filtered)}
                <Box sx={{ height: 24 }} />
                {chartCards(filtered)}
                <Typography className="hint" sx={{ mt: 3 }}>
                  Indicadores de volume de registros, não de produtividade
                  individual.
                </Typography>
              </div>
            </div>
          )}
          <Dialog
            open={chartSelection !== null}
            onClose={() => setChartSelection(null)}
            aria-labelledby="chart-records-title"
            fullWidth
            maxWidth="md"
            scroll="paper"
          >
            <DialogTitle id="chart-records-title">{chartSelection?.label}</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {chartRecords.length === 1 ? "1 atividade encontrada" : `${chartRecords.length} atividades encontradas`}
              </Typography>
              {table(chartRecords)}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setChartSelection(null)}>Fechar</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </ThemeProvider>
  );
}
