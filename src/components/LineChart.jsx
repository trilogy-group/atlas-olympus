import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const LineChart = ({
  isCustomLineColors = false,
  isDashboard = false,
  dataArray,
  yTickStep,          // <-- NUEVO: paso entre ticks (p.ej. 1000)
  yMaxTicks = 5,      // <-- fallback si no pasas yTickStep
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Calcular min/max y ticks a partir de los datos
  const values = Array.isArray(dataArray)
    ? dataArray.flatMap(s =>
        Array.isArray(s.data) ? s.data.map(p => (typeof p.y === "number" ? p.y : Number(p.y) || 0)) : []
      )
    : [];
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 0;

  const tickValues = yTickStep
    ? (() => {
        const step = Math.max(1, yTickStep);
        const start = Math.floor(rawMin / step) * step;
        const end = Math.ceil(rawMax / step) * step;
        const ticks = [];
        for (let v = start; v <= end; v += step) ticks.push(v);
        return ticks;
      })()
    : yMaxTicks; // número aproximado de ticks si no especificas paso

  return (
    <ResponsiveLine
      data={dataArray}
      theme={{
        axis: {
          domain: { line: { stroke: colors.grey[100] } },
          legend: { text: { fill: colors.grey[100] } },
          ticks: {
            line: { stroke: colors.grey[100], strokeWidth: 1 },
            text: { fill: colors.grey[100] },
          },
        },
        legends: { text: { fill: colors.grey[100] } },
        tooltip: {
          container: {
            background: colors.grey[800],
            color: colors.grey[100],
            fontSize: "14px",
          },
        },
      }}
      colors={isDashboard ? { datum: "color" } : { scheme: "nivo" }}
      margin={{ top: 80, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: true,
        reverse: false,
      }}
      groupMode="grouped"
      yFormat=" >-.2f"
      curve="catmullRom"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: undefined,
        legendOffset: 36,
        legendPosition: "middle",
      }}
      axisLeft={{
        orient: "left",
        tickValues,                // <-- usamos los ticks calculados
        tickSize: 3,
        tickPadding: 5,
        tickRotation: 0,
        legend: undefined,
        legendOffset: -40,
        legendPosition: "middle",
      }}
      enableGridX={false}
      enableGridY={false}
      pointSize={8}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: "left-to-right",
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: { itemBackground: "rgba(0, 0, 0, .03)", itemOpacity: 1 },
            },
          ],
        },
      ]}
    />
  );
};

export default LineChart;
