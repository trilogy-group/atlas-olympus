
import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";
import React, { useMemo } from "react";

const BarChart = ({ isDashboard = false, dataArray = [], keys = [], yTicks = 5 }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const maxY = useMemo(() => {
    if (!Array.isArray(dataArray) || !dataArray.length) return 0;
    return Math.max(0, ...dataArray.flatMap(d => (keys || []).map(k => Number(d?.[k]) || 0)));
  }, [dataArray, keys]);

  // yTicks = nº de divisiones. Habrá yTicks+1 etiquetas (incluye el 0)
  const divisions = Math.max(2, Number(yTicks) || 5);
  const niceMax = useMemo(() => {
    if (!maxY) return divisions;
    const step = Math.ceil(maxY / divisions);
    return step * divisions;
  }, [maxY, divisions]);

  const yTickValues = useMemo(
    () => Array.from({ length: divisions + 1 }, (_, i) => Math.round((niceMax * i) / divisions)),
    [niceMax, divisions]
  );

  const keyColorMap = {
    "Automation %": colors.redAccent[400],
    "Failures": colors.redAccent[400],
    "Success": colors.greenAccent[400],
    "Failure": colors.redAccent[400],
  };

  return (
    <ResponsiveBar
      data={dataArray}
      theme={{
        // added
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
            },
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.grey[100],
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
          },
        },
        tooltip: {
          container: {
            background: colors.grey[800], 
            color: colors.grey[100],         
            fontSize: '14px',                
          },
        },
      }}
      keys={keys}
      indexBy="dates"
      margin={{ top: 60, right: 130, bottom: 50, left: 60 }}
      padding={0.7}
      groupMode="grouped"
      valueScale={{ type: "linear", min: 0, max: niceMax }}
      indexScale={{ type: "band", round: true }}
      colors={({ id }) => keyColorMap[id] || colors.blueAccent[500]}
      defs={[
        {
          id: "dots",
          type: "patternDots",
          background: "inherit",
          color: "#38bcb2",
          size: 4,
          padding: 1,
          stagger: true,
        },
        {
          id: "lines",
          type: "patternLines",
          background: "inherit",
          color: "#eed312",
          rotation: -45,
          lineWidth: 6,
          spacing: 10,
        },
      ]}
      borderColor={{
        from: "color",
        modifiers: [["darker", "1.6"]],
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: undefined,
        legendPosition: "middle",
        legendOffset: 32,
        format: v => (typeof v === "string" && v.length > 11 ? v.slice(0, 11) + "..." : v),
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: undefined,
        legendPosition: "middle",
        legendOffset: -40,
        tickValues: yTickValues
      }}
      enableLabel={false}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{
        from: "color",
        modifiers: [["darker", 1.6]],
      }}
      legends={[
        {
          dataFrom: "keys",
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 120,
          translateY: 0,
          itemsSpacing: 2,
          itemWidth: 100,
          itemHeight: -65,
          itemDirection: "left-to-right",
          itemOpacity: 0.85,
          symbolSize: 10,
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
                itemTextColor: '#000'
              },
            },
          ],
        },
      ]}
      role="application"
      barAriaLabel={function (e) {
        return e.id + ": " + e.formattedValue + " in country: " + e.indexValue;
      }}
    />
  );
};

export default BarChart;
