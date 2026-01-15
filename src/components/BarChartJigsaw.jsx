import React, { useEffect, useState } from 'react';
import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";
import { performFetchLastStats } from "../data/fetchData";


// const fetchStatusFromDynamo = async () => {
//   const url = 'https://2ncqsudpekcpsu6joptx3eyrqm0kicqj.lambda-url.us-east-1.on.aws/';

//   try {
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log('API response:', data);
//     return data.message;
//   } catch (error) {
//     console.error('Error fetching data from DynamoDB:', error);
//     throw error;
//   }
// };

const BarChart = ({ isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State to store the fetched data
  const [historic, setHistoric] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect to fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await performFetchLastStats();
        // console.log(`datadatadata = ${JSON.stringify(data)}`)
        setHistoric(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!historic || !historic.length) {
    return <div>No data available</div>;
  }

  let indexVariable = "date_refreshed";
  let barChart = historic; // Here you should filter by product if needed

  // Verify if barChart[0] is available before accessing its properties
  let dateRefreshed = barChart[barChart.length-1]?.["date_refreshed"]?.slice(0, -5).replace(' ', ' (') + ')';
  console.log(`dateRefreshed = ${dateRefreshed}`);

  // let graphicData = historic;
  let graphicData = [];
  let graphData = { };
  let constantObject = {
    NewColor: "hsl(97, 70%, 50%)",
    OpenColor: "hsl(275, 70%, 50%)",
    PendingColor: "hsl(135, 70%, 50%)",
    OnholdColor: "hsl(200, 70%, 50%)",
    SolvedColor: "hsl(045, 70%, 50%)",
    ClosedColor: "hsl(075, 70%, 50%)",
  }

  historic.forEach(bar => {
    graphData = { ...bar, ...constantObject };
    graphicData.push(graphData);
  });

  // console.log(`graphicData = ${JSON.stringify(graphicData)}`);

  return (
    <ResponsiveBar
      data={graphicData}
      theme={{
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
      }}
      keys={["Onhold", "Open", "New", "Pending"]}
      indexBy={indexVariable}
      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      valueScale={{ type: "linear" }}
      indexScale={{ type: "band", round: true }}
      colors={{ scheme: "nivo" }}
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
        legend: isDashboard ? undefined : "TimeStamp", // changed
        legendPosition: "middle",
        legendOffset: 32,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Status", // changed
        legendPosition: "middle",
        legendOffset: -40,
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
          itemHeight: 20,
          itemDirection: "left-to-right",
          itemOpacity: 0.85,
          symbolSize: 20,
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
      role="application"
      barAriaLabel={function (e) {
        return e.id + ": " + e.formattedValue + " THIS IS LINE 227: " + e.indexValue;
      }}
    />
  );
};

export default BarChart;
