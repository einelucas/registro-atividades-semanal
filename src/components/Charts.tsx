"use client";
import React, { useEffect, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import type { ApexOptions } from "apexcharts";
import type { Activity, ActivityStatus } from "../lib/types";

type ChartComponent = typeof import("react-apexcharts").default;
function useApex() {
  const [Component, setComponent] = useState<ChartComponent | null>(null);
  useEffect(() => {
    let active = true;
    import("react-apexcharts").then((mod) => {
      if (active) setComponent(() => mod.default);
    });
    return () => {
      active = false;
    };
  }, []);
  return Component;
}
const statusSlices = [
  { status: "DONE", label: "Concluídas", color: "#245b9b" },
  { status: "IN_PROGRESS", label: "Em andamento", color: "#eea51e" },
] as const;

export const chartGroupIds = {
  unit: "unitId",
  category: "categoryId",
  person: "personId",
} as const;

export function BarChart({
  rows,
  field,
  onSelect,
}: {
  rows: Activity[];
  field: keyof typeof chartGroupIds;
  onSelect: (id: string, label: string) => void;
}) {
  const groups = new Map<string, { id: string; label: string; count: number }>();
  for (const row of rows) {
    const id = row[chartGroupIds[field]];
    const group = groups.get(id);
    if (group) group.count++;
    else groups.set(id, { id, label: row[field], count: 1 });
  }
  const ranked = [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
  if (!ranked.length)
    return (
      <Typography color="text.secondary" sx={{ py: 5, textAlign: "center" }}>
        Sem dados neste período.
      </Typography>
    );
  const max = ranked[0].count;
  return (
    <Stack gap={0.5}>
      {ranked.map(({ id, label, count }) => (
        <ButtonBase
          key={id}
          onClick={() => onSelect(id, label)}
          aria-label={`${label}, ${count} ${count === 1 ? "registro" : "registros"}. Ver atividades`}
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr) minmax(3ch, auto)",
            gap: 1,
            minHeight: 44,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            textAlign: "left",
            "&:hover, &.Mui-focusVisible": { bgcolor: "action.hover" },
            "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
          }}
        >
          <Typography component="span" variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
            {label}
          </Typography>
          <Box component="span" aria-hidden="true" sx={{ bgcolor: "action.hover", height: 12, borderRadius: 1 }}>
            <Box component="span" sx={{ display: "block", bgcolor: "#245b9b", width: `${(count / max) * 100}%`, height: "100%", borderRadius: 1 }} />
          </Box>
          <Typography component="span" variant="body2" fontWeight={700} textAlign="right">
            {count}
          </Typography>
        </ButtonBase>
      ))}
    </Stack>
  );
}
export function DonutChart({ rows, onSelect }: {
  rows: Activity[];
  onSelect: (status: ActivityStatus, label: string) => void;
}) {
  const C = useApex();
  const done = rows.filter((r) => r.status === "DONE").length;
  const counts = [done, rows.length - done];
  const options: ApexOptions = {
    chart: {
      fontFamily: "inherit",
      events: {
        dataPointSelection: (_event, _chart, { dataPointIndex }) => {
          const slice = statusSlices[dataPointIndex];
          if (slice) onSelect(slice.status, slice.label);
        },
      },
    },
    labels: statusSlices.map((slice) => slice.label),
    colors: statusSlices.map((slice) => slice.color),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 2 },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Registros",
              formatter: () => String(rows.length),
            },
          },
        },
      },
    },
  };
  if (!rows.length)
    return (
      <Typography color="text.secondary" sx={{ py: 5, textAlign: "center" }}>
        Sem dados neste período.
      </Typography>
    );
  return (
    <Box sx={{ width: "100%", minHeight: 265, "& .apexcharts-pie-area": { cursor: "pointer" } }}>
      {C ? (
        <C
          type="donut"
          options={options}
          series={counts}
          height={225}
        />
      ) : (
        <Typography color="text.secondary" sx={{ py: 6 }}>
          Carregando gráfico...
        </Typography>
      )}
      <Stack direction="row" justifyContent="center" gap={1} flexWrap="wrap">
        {statusSlices.map(({ status, label, color }, index) => (
          <ButtonBase
            key={status}
            onClick={() => onSelect(status, label)}
            sx={{ gap: 0.75, minHeight: 44, px: 1, borderRadius: 1, "&:hover, &.Mui-focusVisible": { bgcolor: "action.hover" }, "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" } }}
          >
            <Box component="span" aria-hidden="true" sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color }} />
            <Typography component="span" variant="body2">{label} ({counts[index]})</Typography>
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
}
