import React, { useState, useEffect } from "react";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { performFetchLastData, performFetchFullStats } from "../../data/fetchData";
// import { performFetchLastData, performFetchLastStats, performFetchFullStats } from '../data/fetchData';
import useConfigureGlobals from '../../hooks/useConfigureGlobals';


import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import ProgressCircle from "../../components/ProgressCircle";
import StatBox from "../../components/StatBox";
import PieChart from "../../components/PieChart";
import BarChart from "../../components/BarChart";


function getKeys(obj) {
  return Object.keys(obj).filter(key => !key.endsWith('Color') && !key.endsWith('dates'));
}

let barChartStatusHistoricData = [ { dates: "Loading", open: 0, openColor: "hsl(229, 70%, 50%)", pending: 0, pendingColor: "hsl(296, 70%, 50%)", onhold: 0, onholdColor: "hsl(97, 70%, 50%)", new: 0, newColor: "hsl(340, 70%, 50%)" } ];

let pieChartStatusData = [ ]
let pieChartPriorityData = [ ]
let lineChartStatusHistoricData = [ ];

function createLineGraphObject(matrix) {

  const categories = [ "new", "open", "pending", "on-hold", ];

  const lineGraphData = categories.map(category => {
    let colorKey;
    switch (category) {
      case "new":
        colorKey = "greenAccent"; //Yellow
        break;
      case "open":
        colorKey = "redAccent"; //redAccent
        break;
      case "pending":
        colorKey = "blueAccent"; //blueAccent
        break;
      case "onhold":
        colorKey = "primary"; //primary
        break;
      default:
        colorKey = "grey";
    }
    return {
      id: category.charAt(0).toUpperCase() + category.slice(1),
      color: tokens("dark")[colorKey][category === "new" ? 500 : category === "open" ? 300 : 200],
      data: []
    };
  });

  // Loop through the matrix rows (skip the header)
  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i];
    const date = row[0];

    // Add data points to the corresponding category in the line graph data
    lineGraphData.forEach((categoryData, index) => {
      categoryData.data.push({
        x: date.split(' ')[1],
        y: parseInt(row[index + 2])  // +2 because the first two columns are date and total_tickets
      });
    });
  }

  return lineGraphData;
}

function createPieGraphObject(matrix, categories, index) {

  // index = 
  // 0 Ticket ID	
  // 1 Status	
  // 2 Group Name	
  // 3 BU	
  // 4 Product	
  // 5 Title	
  // 6 Requester	
  // 7 Customer	
  // 8 Priority	
  // 9 Created	
  // 10 Updated	
  // 11 External Team	
  // 12 Reason	
  // 13 Tags	
  // 14 AI Tags	
  // 15 SLA	
  // 16 JIRA	
  // 17 FCR	
  // 18 L1 FCR	
  // 19 L2 FCR	
  // 20 Date Refreshed	
  // 21 Team	
  // 22 BUZD	
  // 23 GHI	
  // 24 Raw Data

  let acc = [];

  categories.forEach(item => {

    let unit = {
      id: item,
      label: item,
      value: matrix.filter(row => row[index] === item).length,
    };

    switch (item) {
      case "New":
        unit.color = "hsl(229, 70%, 50%)"; 
        break;
      case "Open":
        unit.color = "hsl(162, 70%, 50%)"; 
        break;
      case "Pending":
        unit.color = "hsl(291, 70%, 50%)"; 
        break;
      case "On-Hold":
        unit.color = "hsl(104, 70%, 50%)"; 
        break;

      default:
        unit.color = "hsl(229, 70%, 50%)";
    }

    acc.push(unit);
  });

  return acc;
}

function createBarGraphObject(matrix) {
  // Define the colors for each category
  const colors = {
    open: "hsl(229, 70%, 50%)",
    pending: "hsl(296, 70%, 50%)",
    onhold: "hsl(97, 70%, 50%)",
    new: "hsl(340, 70%, 50%)",
  };

  const [header, ...rows] = matrix;

  return rows.map((row) => {
    return {
      dates: row[0].split(' ')[1],
      open: parseInt(row[header.indexOf("open")]),
      openColor: colors.open,
      pending: parseInt(row[header.indexOf("pending")]),
      pendingColor: colors.pending,
      onhold: parseInt(row[header.indexOf("onhold")]),
      onholdColor: colors.onhold,
      new: parseInt(row[header.indexOf("new")]),
      newColor: colors.new,
    };
  });
}

const Dashboard = () => {
  const globals = useConfigureGlobals();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [dataMatrix, setDataMatrix] = useState([]);
  const [statsMatrix, setStatsMatrix] = useState({});

  useEffect(() => {
    if (!globals || Object.keys(globals).length === 0) {
      return; // Si globals no está definido, no ejecutar el efecto
    }
  
    const fetchDataAsync = async () => {
      try {
        let data = await performFetchLastData(globals); // Pasar globals aquí
        data = data.values; 
        setDataMatrix(data);
  
        let stats = await performFetchFullStats(globals); // Pasar globals aquí
        setStatsMatrix(stats);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchDataAsync();
  }, [globals]); // Solo ejecutar cuando globals cambia, pero no cuando globals está indefinido

  let categoriesStatus;
  let column;
  let dataMatrixSLA = [ ];


  let fromDate = "~";
  let toDate = "~";
  let totalTickets = 0;
  let totalTicketsPercentage = 0;

  let aiResolutionTotal = 0;
  let aiResolutionPercentage = 0;

  let slaFailuresTotal = 0;
  let slaFailuresPercentage = 0;

  let fcrResolutionTotal = 0;
  let fcrResolutionPercentage = 0;

  let slaFailuresRecentTotal = 0;
  let slaFailuresRecentPercentage = 0;

  let fcrForLevel1Total = 0;
  let fcrForLevel1Percentage = 0;

  let fcrForLevel2Total = 0;
  let fcrForLevel2Percentage = 0;

  if (dataMatrix && dataMatrix.length !== 0 && !isNaN(dataMatrix.length)) { 
    // console.log(`== dataMatrix useEffect = ${JSON.stringify(dataMatrix[1])} ==`); 
  }

  if (statsMatrix.length !== 0 && !isNaN(statsMatrix.length)) { 
    // console.log(`== matrix: ${JSON.stringify(statsMatrix)}`);
    // console.log(`== statsMatrix (${statsMatrix.length-1}) useEffect = ${JSON.stringify(statsMatrix)} ==`); 
    fromDate = statsMatrix[1][0];
    toDate = statsMatrix[statsMatrix.length-1][0];
    console.log(`From (${fromDate}) to (${toDate})`)

    /*-- Assign a value to each variable --*/
    totalTickets = statsMatrix[statsMatrix.length-1][1];
    totalTicketsPercentage = 1
    
    aiResolutionTotal = statsMatrix[statsMatrix.length-1][12];
    aiResolutionPercentage = aiResolutionTotal / totalTickets ;

    slaFailuresTotal = statsMatrix[statsMatrix.length-1][13];
    slaFailuresPercentage = slaFailuresTotal / totalTickets ;

    fcrResolutionTotal = statsMatrix[statsMatrix.length-1][14];
    fcrResolutionPercentage = fcrResolutionTotal / totalTickets;

    //Line Graph Data
    lineChartStatusHistoricData = createLineGraphObject(statsMatrix);
    
    //Pie Chart Data
    categoriesStatus = [ "New", "Open", "Pending", "On-hold" ];
    column = 1
    pieChartStatusData = createPieGraphObject(dataMatrix, categoriesStatus, column);

    column = 8
    categoriesStatus = [ "low", "normal", "high", "urgent" ];
    pieChartPriorityData = createPieGraphObject(dataMatrix, categoriesStatus, column);

    barChartStatusHistoricData = createBarGraphObject(statsMatrix);

    fcrForLevel1Total = dataMatrix.filter( row => row[18] == 1).length;
    fcrForLevel1Percentage = fcrForLevel1Total / totalTickets ;
  
    fcrForLevel2Total = dataMatrix.filter( row => row[19] == 1).length;
    fcrForLevel2Percentage = fcrForLevel2Total / totalTickets ;

    fcrForLevel2Total = dataMatrix.filter( row => row[19] == 1).length;
    fcrForLevel2Percentage = fcrForLevel2Total / totalTickets ;

    dataMatrixSLA = dataMatrix.filter( row => row[15] == 1); 

  }

  /*- Size definition -*/

  const fullGridSize = 12;
  const totalPieChartStatusGrid = 4;
  const totalPieChartStatusGridVertical = 2;
  const totalPieChartPriorityGrid = 4;
  const totalPieChartPriorityGridVertical = 2;
  const totalTicketsGrid = 4;
  const totalSlaGrid = 4;
  const totalFcrGrid = 4;
  const totalBacklogHealthGrid = 8;
  const totalSlaFailuresGrid = 2;
  const totalStatusGraphicGrid = 10;
  const totalStatusGraphicGridVertical = 2
  const totalAnotherGraphicGrid = 4;
  const totalSlaRecentFailuresGrid = 4;

  /*- Size definition -*/

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header 
          title={`Central Support`} 
          subtitle={`Welcome to Central Support's dashboard ${(dataMatrix.length > 3) ? `(Last updated: ${dataMatrix[1][20].split('T')[0]} - ${dataMatrix[1][20].split('T')[1].split('.')[0]} GMT)` : ''}`} 
          />

      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns={`repeat(${fullGridSize}, 1fr)`}
        gridAutoRows="140px"
        gap="20px"
      >

        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}

        {/* ROW 1 */}

          {/* Staus History Widget */}
          <Box
            gridColumn={`span ${totalStatusGraphicGrid}`}
            gridRow={`span ${totalStatusGraphicGridVertical}`}
            backgroundColor={colors.primary[400]}
          >

            <Typography
              variant="h5"
              fontWeight="600"
              sx={{ padding: "30px 30px 0 30px" }}
            >
              Status History
            </Typography>

            <Box height="250px" mt="-20px">
              <BarChart 
                dataArray={barChartStatusHistoricData}
                keys={getKeys(barChartStatusHistoricData[0])}
                isDashboard={true} 
              />
            </Box>

          </Box>

          {/* SLA Failures Graphic */}
          <Box
            gridColumn={`span ${totalSlaFailuresGrid}`}
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
            p="30px"
          >
            <Typography variant="h5" fontWeight="600">
              SLA Failures
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt="25px"
            >
              <ProgressCircle
                progress={slaFailuresPercentage}
                size="150"
              />
              <Typography
                variant="h5"
                color={colors.greenAccent[500]}
                sx={{ mt: "15px" }}
              >
                {(100 * slaFailuresPercentage).toFixed(2)}%
              </Typography>
              <Typography>
                {slaFailuresTotal === 0 ? `No ticket failed in this period` : `${slaFailuresTotal} Ticket(s) failed in this period`}
              </Typography>
            </Box>
          </Box>

        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}

        {/* ROW 2 */}

          {/* Current Status Pie Chart */}
          <Box
            gridColumn={`span ${totalPieChartStatusGrid}`}
            gridRow={`span ${totalPieChartStatusGridVertical}`}
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative" 
          >
            <Box
            position="absolute"
            top={10}
            left={10}
            padding="10px" 
            >
              <Typography 
                display="flex" 
                variant="h2" 
                fontWeight="600"
              >
                
              </Typography>
              
              <Typography variant="h5" sx={{ color: colors.greenAccent[500] }}>
              Status
              </Typography>
            </Box>
            <Box
            position="absolute"
            top={20}
            left={20}
            padding="10px" 
            >

            </Box>
            <PieChart 
              dataArray={pieChartStatusData}
            />
          </Box>

          {/* Current Priority Pie Chart */}
          <Box
            gridColumn={`span ${totalPieChartPriorityGrid}`}
            gridRow={`span ${totalPieChartPriorityGridVertical}`}
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative" 
          >
            <Box
            position="absolute"
            top={10}
            left={10}
            padding="10px" 
            >
              <Typography 
                display="flex" 
                variant="h2" 
                fontWeight="600"
              >
              {/* INSERT TEXT */}
              </Typography>
              
              <Typography variant="h5" sx={{ color: colors.greenAccent[500] }}>
              Priority
              </Typography>
            </Box>
            <PieChart 
              dataArray={pieChartPriorityData}
            />
          </Box>

        {/* SLA Recent Failures */}
        <Box
          gridColumn={`span ${totalSlaRecentFailuresGrid}`}
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            colors={colors.grey[100]}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              SLA Recent Failures {`- ${dataMatrixSLA.length} Tickets`}
            </Typography>
          </Box>

          {dataMatrixSLA.map((ticket, i) => (

          // console.log(`ticket = ${ticket[0]}`),
            
            <Box
              key={`${ticket[0]}-${i}`}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Box>
                <Typography 
                  color={colors.greenAccent[500]} 
                  variant="h5" 
                  fontWeight="600"
                >
                    {ticket[0]} ({ticket[4]})</Typography>
                <Typography color={colors.grey[100]}>{ticket.title}</Typography>
              </Box>

              {/* <Box color={colors.grey[100]}>{ticket.created.split('T')[0]}</Box> */}

              <Box>
                <a href={`https://central-supportdesk.zendesk.com/agent/tickets/${ticket[0]}`} target="_blank" style={{ textDecoration: 'none' }}>
                  <Box backgroundColor={colors.greenAccent[700]} p="5px 10px" borderRadius="4px" color={colors.grey[100]}>
                    Link
                  </Box>
                </a>
              </Box>
            </Box>
          ))}
        </Box>

        {/* FCR Widget //Probably wrong */} 
        {/* <Box
          gridColumn={`span ${totalFcrGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={`${fcrResolutionTotal} tickets`}
            subtitle="FCR Total Rate"
            progress={fcrResolutionPercentage}
            increase={`${(100 * fcrResolutionPercentage).toFixed(2)}%`}
            icon={
              <PointOfSaleIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box> */}

        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}

        {/* ROW 3 */}

          {/* Total Tickets */}
          <Box
            gridColumn={`span ${totalTicketsGrid}`}
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={`${totalTickets} tickets`}
              subtitle="Total Tickets"
              progress={totalTicketsPercentage}
              increase={`${(100 * totalTicketsPercentage).toFixed(2)}%`}
              icon={
                <EmailIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              }
            />
          </Box>

          {/* AI Resolution Widget */}
          <Box
            gridColumn={`span ${totalSlaGrid}`}
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={`${aiResolutionTotal} tickets`}
              subtitle="AI Resolution Rate"
              progress={aiResolutionPercentage}
              increase={`${(100 * aiResolutionPercentage).toFixed(2)}%`}
              icon={
                <EmailIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              }
            />
          </Box>

          {/* Current L1 FCR Chart */}
          <Box
            gridColumn={`span 2`}
            gridRow="span 1"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={`${fcrForLevel1Total} tickets`}
              subtitle="FCR for Level 1"
              progress={fcrForLevel1Percentage}
              increase={`${(100 * fcrForLevel1Percentage).toFixed(2)}%`}
              icon={
                <PointOfSaleIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              }
            />
          </Box>

          {/* Current L2 FCR Chart */}
          <Box
            gridColumn={`span 2`}
            gridRow="span 1"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={`${fcrForLevel2Total} tickets`}
              subtitle="FCR for Level 2"
              progress={fcrForLevel2Percentage}
              increase={`${(100 * fcrForLevel2Percentage).toFixed(2)}%`}
              icon={
                <PointOfSaleIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              }
            />
          </Box>


        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}

        {/* ROW X */}


        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        {/* ------------------------------------------------------------------------------------------------------ */}
        
        {/* ROW 3 */}

      </Box>
    </Box>
  );

};

export default Dashboard;
