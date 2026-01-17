import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { tokens } from "../../theme";
import { performGetTotalsAll, getProductRealName, validateUser } from "../../data/fetchData";
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { useNavigate } from "react-router-dom"; 

import { useIsForcedMobile } from "../../hooks/useIsMobile";
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import RepeatOneRoundedIcon from '@mui/icons-material/RepeatOneRounded';
import TimerOffRoundedIcon from '@mui/icons-material/TimerOffRounded';

import HowToRegIcon from '@mui/icons-material/HowToReg';
// import AlarmAddIcon from '@mui/icons-material/AlarmAdd';
// import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
// import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
// import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
// import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
// import AssignmentIcon from '@mui/icons-material/Assignment';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import Filter1Icon from '@mui/icons-material/Filter1';
import Filter2Icon from '@mui/icons-material/Filter2';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import HourglassFullIcon from '@mui/icons-material/HourglassFull';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

import { useReload } from "../../context/ReloadContext";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import TimeAverageBox from "../../components/TimeAverageBox";
import PieChart from "../../components/PieChart";

let pieChartTotalAllData = [];

function createPieGraphicALL(matrix, categories) {
  let acc = [];

  // Remove duplicates
  let uniqueCategories = [...new Set(categories)];

  uniqueCategories.forEach((item, index) => {
    let totalTickets = matrix
      .filter(row => row[0] === item)
      .reduce((sum, row) => sum + Number(row[2]), 0);

    let unit = {
      id: `${item}-${index}`, // Unique ID for React keys
      label: item,
      value: totalTickets,
      productId: item, // Original ID for navigation
    };

    acc.push(unit);
  });

  return acc;
}

function createPieGraphicBU(matrix, bu) {

  // console.log(`matrix = ${JSON.stringify(matrix.filter(row => row[1] === 'skyvera_monetization'), null, 2)}`);
  let acc = [];
  let category = matrix
    .filter(row => row[0] === bu)
    .map(row => row[1]);

  // Remove duplicates
  let uniqueCategories = [...new Set(category)];

  uniqueCategories.forEach((item, index) => {
    let totalTickets = matrix
      .filter(row => row[1] === item)
      .reduce((sum, row) => sum + Number(row[2]), 0);

    let unit = {
      id: `${getProductRealName(item)}-${item}-${index}`, // Unique ID for React keys
      label: getProductRealName(item),
      value: totalTickets,
      productId: item, // Original ID for navigation
    };

    acc.push(unit);
  });

  return acc;
}

function convertSeconds(seconds) {
  const days = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];
  if (days > 0) { parts.push(`${days}d`); }
  if (hours > 0 || days > 0) { parts.push(`${hours}h`); }
  if (minutes > 0 || hours > 0 || days > 0) { parts.push(`${minutes}m`); }
  parts.push(`${seconds}s`);

  return parts.join(' : ');
}

const DashboardPassive = ({ bu_subset = "All", vpName = "All" }) => {
  vpName = localStorage.getItem("current-vp");

  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const userEmail = userInfo?.email || "";

  const globals = useConfigureGlobals();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  // Detect ONLY real mobile phones (< 600px)
  const isMobileWidth = useMediaQuery(theme.breakpoints.down('sm'));
  const isForcedMobile = useIsForcedMobile();
  const isPortraitMobile = isMobileWidth || isForcedMobile;

  let [dataMatrix, setDataMatrix] = useState([]);
  const { reloadKey } = useReload();

  useEffect(() => {
    if (!validateUser(userEmail)) {
      navigate("/login");
      alert("You are logged out. Please login again.");
      return;
    }

    if (!globals || Object.keys(globals).length === 0) {
      return;
    }

    const fetchDataAsync = async () => {
      try {
        let data = await performGetTotalsAll(globals);
        
        // Validate data structure - if invalid or missing CSAT columns, clear cache and retry
        if (!data || data === null || !Array.isArray(data) || data.length === 0) {
          console.warn('[DashboardPassive] Invalid or null data received, clearing cache and retrying...');
          const storageKey = `performGetTotalsAll-${globals.SHEET_ID}`;
          localStorage.removeItem(storageKey);
          
          // Retry fetch without cache
          data = await performGetTotalsAll(globals);
          
          if (!data || data === null) {
            console.error('[DashboardPassive] Data is still null after retry, setting empty array');
            setDataMatrix([]);
            return;
          }
        }
        
        // Validate that data has expected CSAT columns (should be 20 columns now)
        if (data.length > 0 && data[0].length < 20) {
          console.warn('[DashboardPassive] Data structure is outdated (missing CSAT columns), clearing cache and retrying...');
          const storageKey = `performGetTotalsAll-${globals.SHEET_ID}`;
          localStorage.removeItem(storageKey);
          
          // Retry fetch
          data = await performGetTotalsAll(globals);
        }
        
        setDataMatrix(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setDataMatrix([]);
      }
    };

    fetchDataAsync();
  }, [globals, reloadKey, navigate, userEmail]);

  /*- SIZES -*/
  const fullGridSizeHorizontal = 120;

    /*- Row 1 -*/
    const totalTicketsGrid = 20 ;
    const totalAIGrid = 20;
    const totalFcrGrid = 20;
    const totalSlaGrid = 20;
    const totalAvgInitialResponseGrid = 20;
    const totalAvgResolutionGrid = 20;

    /*- Row 2 -*/
    const totalAvgTimeOpenGrid = 20;
    const totalAvgTimePendingGrid = 20;
    const totalAvgTimeOnHoldGrid = 20;
    const totalAvgTimeSolvedGrid = 20;
    const totalAvgTimeL1Grid = 20;
    const totalAvgTimeL2Grid = 20;

    /*- Row 3 -*/
    const totalBUStatisticsGrid = 52;
    const totalBUStatisticsGridVertical = 5;
    const totalPieChartAllBUs = (fullGridSizeHorizontal - totalBUStatisticsGrid); // The rest of the grid
    const totalPieChartAllBUsVertical = 5;

  /*- SIZES -*/

  /*- SET VARIABLES -*/
  let totalTickets = 0;
  let totalTicketsPercentage = 0;

  let aiResolutionTotal = 0;
  let aiResolutionPercentage = 0;

  let slaFailuresTotal = 0;
  let slaFailuresPercentage = 0;

  let fcrResolutionTotal = 0;
  let fcrResolutionPercentage = 0;

  let averageInitialResponse = 0;
  let averageResolutionTime = 0;

  let averageTimeOpen = 0;
  let averageTimePending = 0;
  let averageTimeOnHold = 0;
  let averageTimeSolved = 0;
  let averageTimeL1 = 0;
  let averageTimeL2 = 0;

  let totalTickets_bu = 0;
  let aiResolutionTotal_bu = 0;
  let slaFailuresTotal_bu = 0;
  let fcrResolutionTotal_bu = 0;

  let averageInitialResponse_bu = 0;
  let averageResolutionTime_bu = 0;

  let averageTimeOpen_bu = 0;
  let averageTimePending_bu = 0;
  let averageTimeOnHold_bu = 0;
  let averageTimeSolved_bu = 0;
  let averageTimeL1_bu = 0;
  let averageTimeL2_bu = 0;

  let avgCsatScore = 0;
  let csatTicketCount = 0;
  let avgCsatScore_bu = 0;
  let csatTicketCount_bu = 0;

  let finalTotals;
  /*- SET VARIABLES -*/


  if (dataMatrix && dataMatrix.length !== 0 && !isNaN(dataMatrix.length)) {
    // console.log(`Datamatrix = ${dataMatrix}`);
    finalTotals = Number((dataMatrix.filter(row => row[0] === "Totals"))[0][2]);
    if (vpName !== "All") {
      let assignmentsPerVP = JSON.parse(localStorage.getItem("assignments"));
      let filteredAssignments = assignmentsPerVP.filter(row => row[2] === vpName);
      let mappedProducts = filteredAssignments.map(product => product[0]);
      dataMatrix = dataMatrix.filter(line => mappedProducts.some(product => line[1] === product));
    }

    let filteredRows = dataMatrix.filter(row => row[0] !== "Totals" && row[0] !== "bu"); //Saves the amount of rows to use it later.
    let businessUnits = [...new Set(dataMatrix.map(row => row[0]).filter(item => item !== "Totals" && item !== "bu"))];

    totalTickets = dataMatrix.filter(row => row[0] !== "Totals" && row[0] !== "bu").reduce((sum, row) => sum + Number(row[2]), 0);
    totalTicketsPercentage = totalTickets / totalTickets;

    aiResolutionTotal = dataMatrix.filter(row => row[0] !== "Totals" && row[0] !== "bu").reduce((sum, row) => sum + Number(row[7]), 0);
    aiResolutionPercentage = aiResolutionTotal / totalTickets;
    
    fcrResolutionTotal = dataMatrix.filter(row => row[0] !== "Totals" && row[0] !== "bu").reduce((sum, row) => sum + Number(row[9]), 0);
    fcrResolutionPercentage = fcrResolutionTotal / totalTickets;

    slaFailuresTotal = dataMatrix.filter(row => row[0] !== "Totals" && row[0] !== "bu").reduce((sum, row) => sum + Number(row[8]), 0);
    slaFailuresPercentage = slaFailuresTotal / totalTickets;

    averageInitialResponse = Math.round(filteredRows.reduce((sum, row) => sum + Number(row[16]), 0) / filteredRows.length);
    averageResolutionTime = Math.round(filteredRows.reduce((sum, row) => sum + Number(row[17]), 0) / filteredRows.length);
    
    averageTimeOpen = Math.round(filteredRows.reduce((sum, row) => sum + Number(row[10]), 0) / filteredRows.length);
    averageTimePending = Math.round(filteredRows.reduce((sum, row) => sum + Number(row[11]), 0) / filteredRows.length);
    averageTimeOnHold = Math.round(filteredRows.reduce((sum, row) => sum + Number(row[12]), 0) / filteredRows.length);
    averageTimeSolved = Math.round(filteredRows.reduce((sum, row) => sum + Number(row[13]), 0) / filteredRows.length);
    averageTimeL1 = Math.round(filteredRows.reduce((sum, row) => sum + Number(row[14]), 0) / filteredRows.length);
    averageTimeL2 = Math.round(filteredRows.reduce((sum, row) => sum + Number(row[15]), 0) / filteredRows.length);

    // Calculate CSAT (row[18] = avg_ai_csat_score, row[19] = csat_ticket_count)
    const rowsWithCsat = filteredRows.filter(row => row[18] && row[18] !== '' && row[19] && Number(row[19]) > 0);
    csatTicketCount = rowsWithCsat.reduce((sum, row) => sum + Number(row[19]), 0);
    if (csatTicketCount > 0) {
      const weightedCsatSum = rowsWithCsat.reduce((sum, row) => sum + (Number(row[18]) * Number(row[19])), 0);
      avgCsatScore = Number((weightedCsatSum / csatTicketCount).toFixed(2));
    }

    if (bu_subset !== "All") {
      
      filteredRows = dataMatrix.filter(row => row[0] === bu_subset); //Changes the amount of rows based on the bu.

        totalTickets_bu = dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[2]), 0);
        totalTicketsPercentage = totalTickets_bu / totalTickets;

        aiResolutionTotal_bu = dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[7]), 0);
        aiResolutionPercentage = aiResolutionTotal_bu / totalTickets_bu;

        slaFailuresTotal_bu = dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[8]), 0);
        slaFailuresPercentage = slaFailuresTotal_bu / totalTickets_bu;

        fcrResolutionTotal_bu = dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[9]), 0);
        fcrResolutionPercentage = fcrResolutionTotal_bu / totalTickets_bu;

        averageInitialResponse_bu = Math.round(dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[16]), 0) / filteredRows.length);
        averageResolutionTime_bu = Math.round(dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[17]), 0) / filteredRows.length);

        averageTimeOpen_bu = Math.round(dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[10]), 0) / filteredRows.length);
        averageTimePending_bu = Math.round(dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[11]), 0) / filteredRows.length);
        averageTimeOnHold_bu = Math.round(dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[12]), 0) / filteredRows.length);
        averageTimeSolved_bu = Math.round(dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[13]), 0) / filteredRows.length);
        averageTimeL1_bu = Math.round(dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[14]), 0) / filteredRows.length);
        averageTimeL2_bu = Math.round(dataMatrix.filter(row => row[0] === bu_subset).reduce((sum, row) => sum + Number(row[15]), 0) / filteredRows.length);

        // Calculate CSAT for BU subset
        const rowsWithCsat_bu = filteredRows.filter(row => row[18] && row[18] !== '' && row[19] && Number(row[19]) > 0);
        csatTicketCount_bu = rowsWithCsat_bu.reduce((sum, row) => sum + Number(row[19]), 0);
        if (csatTicketCount_bu > 0) {
          const weightedCsatSum_bu = rowsWithCsat_bu.reduce((sum, row) => sum + (Number(row[18]) * Number(row[19])), 0);
          avgCsatScore_bu = Number((weightedCsatSum_bu / csatTicketCount_bu).toFixed(2));
        }

      pieChartTotalAllData = createPieGraphicBU(dataMatrix, bu_subset);
    } else {
      pieChartTotalAllData = createPieGraphicALL(dataMatrix, businessUnits);
    }
  }

  let timeframeText = '';
  let timeframe = localStorage.getItem("current-timeframe");
  const realDate4w = localStorage.getItem("last-update-4w");
  const realDate1w = localStorage.getItem("last-update-1w");
  const realDate1d = localStorage.getItem("last-update-1d");

  if (timeframe) {
    switch (timeframe) {
      case '4 Weeks':
        timeframeText = realDate4w ? `Last updated: ${realDate4w.slice(0, 2)}-${realDate4w.slice(3, 5)}-${realDate4w.slice(6, 10)} [ ${realDate4w.slice(11, 19)} ] GMT` : 'Last 4 Weeks';
        break;
      case '1 Week':
        timeframeText = realDate1w ? `Last updated: ${realDate1w.slice(0, 2)}-${realDate1w.slice(3, 5)}-${realDate1w.slice(6, 10)} [ ${realDate1w.slice(11, 19)} ] GMT` : 'Last Week';
        break;
      case '1 Day':
        timeframeText = realDate1d ? `Last updated: ${realDate1d.slice(0, 2)}-${realDate1d.slice(3, 5)}-${realDate1d.slice(6, 10)} [ ${realDate1d.slice(11, 19)} ] GMT` : 'Today';
        break;
      default:
        timeframeText = 'custom timeframe';
        let datesChoosen = localStorage.getItem("datesChoosen");
        if (datesChoosen) {
          timeframeText = `from ${datesChoosen.split("***")[0]} to ${datesChoosen.split("***")[1]}`;
        }
        break;
    }
  }

  let currentPath = window.location.pathname;
  currentPath = currentPath.replace(/\/passive/, '');
  // console.log(`currentPath = ${currentPath}`)

  return (
    <Box m={isPortraitMobile ? "10px" : "20px"}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={isPortraitMobile ? "15px" : "20px"}>
        <Header 
          title={`Central Support ( ${vpName === "All" ? "All VPs" : vpName} )`} 
          subtitle={`${bu_subset === "All" ? "All" : bu_subset} statistics for ${vpName === "All" ? "All VPs" : vpName} (${timeframeText})`} 
        />
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns={isPortraitMobile ? "repeat(3, 1fr)" : `repeat(${fullGridSizeHorizontal}, 1fr)`}
        gridAutoRows={isPortraitMobile ? "auto" : "90px"}
        gap={isPortraitMobile ? "8px" : "10px"}
      >
        {/* -------------------------------------------------------------------------------------------------------------------------- */}
        {/* ROW 1 */}
        {/* -------------------------------------------------------------------------------------------------------------------------- */}
        
        {/* Total Tickets Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalTicketsGrid}`}
          gridRow="span 1"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <StatBox
            title={`${(bu_subset === "All") ? totalTickets : totalTickets_bu} tickets`}
            subtitle={`Total Tickets (${bu_subset})`}
            progress={totalTicketsPercentage}
            increase={`${(100 * totalTicketsPercentage).toFixed(2)}%`}
            icon={
              <ConfirmationNumberRoundedIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* AI Resolution Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAIGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <StatBox
            title={`${(bu_subset === "All") ? aiResolutionTotal : aiResolutionTotal_bu} tickets`}
            subtitle={`Total AI Resolution (${bu_subset})`}
            progress={aiResolutionPercentage}
            increase={`${(100 * aiResolutionPercentage).toFixed(2)}%`}
            icon={
              <SmartToyRoundedIcon
                sx={{ color: colors.greenAccent[300], fontSize: isPortraitMobile ? "18px" : "25px"}}
              />
            }
          />
        </Box>

        {/* FCR Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalFcrGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <StatBox
            title={`${(bu_subset === "All") ? fcrResolutionTotal : fcrResolutionTotal_bu} tickets`}
            subtitle={`Total FCR (${bu_subset})`}
            progress={fcrResolutionPercentage}
            increase={`${(100 * fcrResolutionPercentage).toFixed(2)}%`}
            icon={
              <RepeatOneRoundedIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* SLA Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalSlaGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <StatBox
            title={`${(bu_subset === "All") ? slaFailuresTotal : slaFailuresTotal_bu} tickets`}
            subtitle={`Total SLA Failures (${bu_subset})`}
            progress={slaFailuresPercentage}
            increase={`${(100 * slaFailuresPercentage).toFixed(2)}%`}
            icon={
              <TimerOffRoundedIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* Avg Initial Response Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAvgInitialResponseGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <TimeAverageBox
            colorx={colors.greenAccent[300]}
            title={`${(bu_subset === "All") ? convertSeconds(averageInitialResponse) : convertSeconds(averageInitialResponse_bu)}` /*- add convertSeconds before the parenthesys -*/ } 
            subtitle={`Average Initial Response (${bu_subset})`}
            icon={
              <ElectricBoltIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* Avg Resolution Time Widget 2 */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAvgResolutionGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <TimeAverageBox
            colorx={colors.greenAccent[300]}
            title={`${(bu_subset === "All") ? convertSeconds(averageResolutionTime) : convertSeconds(averageResolutionTime_bu)}`}
            subtitle={`Average Resolution Time (${bu_subset})`}
            icon={
              <HowToRegIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* -------------------------------------------------------------------------------------------------------------------------- */}
        {/* ROW 2 */}
        {/* -------------------------------------------------------------------------------------------------------------------------- */}

        {/* Average time OPEN Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAvgTimeOpenGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <TimeAverageBox
            colorx={colors.greenAccent[300]}
            title={`${(bu_subset === "All") ? convertSeconds(averageTimeOpen) : convertSeconds(averageTimeOpen_bu)}`}
            subtitle={`Average time OPEN (${bu_subset})`}
            icon={
              <HourglassEmptyIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* Average time PENDING Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAvgTimePendingGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <TimeAverageBox
            colorx={colors.greenAccent[300]}
            title={`${(bu_subset === "All") ? convertSeconds(averageTimePending) : convertSeconds(averageTimePending_bu)}`}
            subtitle={`Average time PENDING (${bu_subset})`}
            icon={
              <HourglassTopIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* Average time ON HOLD Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAvgTimeOnHoldGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <TimeAverageBox
            colorx={colors.greenAccent[300]}
            title={`${(bu_subset === "All") ? convertSeconds(averageTimeOnHold) : convertSeconds(averageTimeOnHold_bu)}`}
            subtitle={`Average time ON HOLD (${bu_subset})`}
            icon={
              <HourglassBottomIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* Average time SOLVED Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAvgTimeSolvedGrid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <TimeAverageBox
            colorx={colors.greenAccent[300]}
            title={`${(bu_subset === "All") ? convertSeconds(averageTimeSolved) : convertSeconds(averageTimeSolved_bu)}`}
            subtitle={`Average time SOLVED (${bu_subset})`}
            icon={
              <HourglassFullIcon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* Average time L1 Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAvgTimeL1Grid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <TimeAverageBox
            colorx={colors.greenAccent[300]}
            title={`${(bu_subset === "All") ? convertSeconds(averageTimeL1) : convertSeconds(averageTimeL1_bu)}`}
            subtitle={`Average time L1 (${bu_subset})`}
            icon={
              <Filter1Icon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* Average time L2 Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${totalAvgTimeL2Grid}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          <TimeAverageBox
            colorx={colors.greenAccent[300]}
            title={`${(bu_subset === "All") ? convertSeconds(averageTimeL2) : convertSeconds(averageTimeL2_bu)}`}
            subtitle={`Average time L2 (${bu_subset})`}
            icon={
              <Filter2Icon
                sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
              />
            }
          />
        </Box>

        {/* -------------------------------------------------------------------------------------------------------------------------- */}
        {/* ROW 2.5 - AI CSAT Score */}
        {/* -------------------------------------------------------------------------------------------------------------------------- */}

        {/* AI CSAT Coverage Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span 60`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          {((bu_subset === "All" && csatTicketCount > 0) || (bu_subset !== "All" && csatTicketCount_bu > 0)) ? (
            <StatBox
              title={`${(bu_subset === "All") ? csatTicketCount : csatTicketCount_bu} tickets (${(bu_subset === "All") ? ((csatTicketCount / totalTickets) * 100).toFixed(1) : ((csatTicketCount_bu / totalTickets_bu) * 100).toFixed(1)}% of the total)`}
              subtitle={`AI CSAT Coverage (${bu_subset})`}
              progress={(bu_subset === "All") ? (csatTicketCount / totalTickets) : (csatTicketCount_bu / totalTickets_bu)}
              increase={`${(bu_subset === "All") ? ((csatTicketCount / totalTickets) * 100).toFixed(1) : ((csatTicketCount_bu / totalTickets_bu) * 100).toFixed(1)}%`}
              icon={
                <ConfirmationNumberRoundedIcon
                  sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
                />
              }
            />
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%">
              <Typography variant={isPortraitMobile ? "body2" : "h6"} fontWeight="600" color={colors.grey[100]} mb="5px">
                No data
              </Typography>
              <Typography fontSize={isPortraitMobile ? "9px" : "11px"} textAlign="center" color={colors.grey[400]}>
                No tickets have AI CSAT score in this period
              </Typography>
            </Box>
          )}
        </Box>

        {/* AI CSAT Average Score Widget */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span 60`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          p={isPortraitMobile ? "12px 8px" : "10px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
        >
          {((bu_subset === "All" && csatTicketCount > 0) || (bu_subset !== "All" && csatTicketCount_bu > 0)) ? (
            <StatBox
              title={`${(bu_subset === "All") ? avgCsatScore.toFixed(2) : avgCsatScore_bu.toFixed(2)} / 5.00`}
              subtitle={`AI CSAT Average Score (${bu_subset})`}
              progress={(bu_subset === "All") ? (avgCsatScore / 5) : (avgCsatScore_bu / 5)}
              increase={`${(bu_subset === "All") ? avgCsatScore.toFixed(2) : avgCsatScore_bu.toFixed(2)} avg`}
              icon={
                <SentimentSatisfiedAltIcon
                  sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
                />
              }
            />
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%">
              <Typography variant={isPortraitMobile ? "body2" : "h6"} fontWeight="600" color={colors.grey[100]} mb="5px">
                No data
              </Typography>
              <Typography fontSize={isPortraitMobile ? "9px" : "11px"} textAlign="center" color={colors.grey[400]}>
                No tickets have AI CSAT score in this period
              </Typography>
            </Box>
          )}
        </Box>

        {/* -------------------------------------------------------------------------------------------------------------------------- */}
        {/* ROW 3 */}
        {/* -------------------------------------------------------------------------------------------------------------------------- */}

        {/* Tickets Closed Pie Chart - MOBILE ONLY (before BU Statistics) */}
        {isPortraitMobile && (
          <Box
            gridColumn="span 3"
            gridRow="span 1"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
            borderRadius="12px"
            boxShadow="0 2px 8px rgba(0,0,0,0.2)"
            sx={{
              minHeight: "450px",
              height: "450px",
              overflow: "hidden",
            }}
          >
            <Box
              position="absolute"
              top={12}
              left={12}
              padding="8px"
              zIndex="2"
            >
              <Typography 
                fontSize="16px"
                display="flex" 
                variant="h3"
                fontWeight="600"
              >
                Tickets Closed
              </Typography>
              
              <Typography 
                variant="body2"
                sx={{ color: colors.greenAccent[300] }}
              >
                  Statistics per {(bu_subset === "All") ? "BU" : "Product"}
              </Typography>
            </Box>

            <PieChart 
              dataArray={pieChartTotalAllData}
              view={(bu_subset === "All") ? "total" : "product"}
            />
          </Box>
        )}
        
        {/* BU Statistics */}
        <Box
          gridColumn={isPortraitMobile ? "span 3" : `span ${totalBUStatisticsGrid}`}
          gridRow={isPortraitMobile ? "span 1" : `span ${totalBUStatisticsGridVertical}`}
          backgroundColor={colors.primary[400]}
          overflow={isPortraitMobile ? "visible" : "auto"}
          borderRadius={isPortraitMobile ? "12px" : "8px"}
          boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : "none"}
          sx={{
            maxHeight: isPortraitMobile ? "none" : "100%",
            WebkitOverflowScrolling: isPortraitMobile ? 'auto' : 'touch',
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            colors={colors.grey[100]}
            p={isPortraitMobile ? "12px" : "15px"}
            position={isPortraitMobile ? "relative" : "sticky"}
            top={isPortraitMobile ? "auto" : "0"}
            backgroundColor={colors.primary[400]}
            zIndex={isPortraitMobile ? "auto" : "1"}
          >
            <Typography 
              color={colors.grey[100]}
              variant={isPortraitMobile ? "h5" : "h4"}
              fontWeight="600"
              sx={{ textAlign: 'justify', width: '100%' }}
            >
              {`Statistics for ${(bu_subset === "All" ? `All` : `${bu_subset}'s`)} ${bu_subset === "All" ? `BUs` : `Products`}`}
            </Typography>
          </Box>

          { /*- console.log(`dataMatrix (${dataMatrix.length}})= ${JSON.stringify(dataMatrix, null, 2)}`) -*/}

          {(dataMatrix) ?

            (bu_subset === "All") ? 
            
              (
                Object.entries(
                  dataMatrix
                    .filter(row => row[0] !== "bu" && row[0] !== "Totals")
                    .reduce((acc, row) => {
                      const bu = row[0]; 
                      const numberOfTickets = Number(row[2]);
                      const ai = Number(row[7]);
                      const slaBreach = Number(row[8]);
                      const fcr = Number(row[9]);
                      
                      const avgOPEN = Number(row[10]);
                      const avgPEND = Number(row[11]);
                      const avgHOLD = Number(row[12]);
                      const avgSOLV = Number(row[13]);
                      const avgL1 = Number(row[14]);
                      const avgL2 = Number(row[15]);

                      const avgIRT = Number(row[16]);
                      const avgResT = Number(row[17]);

                      if (!acc[bu]) {
                        acc[bu] = {
                          totalTickets: 0,
                          totalFCR: 0,
                          totalAI: 0,
                          totalSLABreach: 0,
                          
                          totalAvgOPEN: 0,
                          totalAvgPEND: 0,
                          totalAvgHOLD: 0,
                          totalAvgSOLV: 0,
                          totalAvgL1: 0,
                          totalAvgL2: 0,
                          totalAvgIRT: 0,
                          totalAvgResT: 0,

                          avgIterationsCount: 0,
                          
                          totalCsatSum: 0,
                          totalCsatCount: 0,
                        };
                      }

                      acc[bu].totalTickets += numberOfTickets;
                      acc[bu].totalFCR += fcr;
                      acc[bu].totalAI += ai;
                      acc[bu].totalSLABreach += slaBreach;

                      acc[bu].totalAvgOPEN += avgOPEN;
                      acc[bu].totalAvgPEND += avgPEND;
                      acc[bu].totalAvgHOLD += avgHOLD;
                      acc[bu].totalAvgSOLV += avgSOLV;
                      acc[bu].totalAvgL1 += avgL1;
                      acc[bu].totalAvgL2 += avgL2;

                      acc[bu].totalAvgIRT += avgIRT;

                      // console.log(`avgResT (${typeof avgResT}) = ${avgResT}`);
                      acc[bu].totalAvgResT += Number(avgResT);
                      // console.log(`acc[bu].totalAvgResT (${typeof acc[bu].totalAvgResT}) = ${acc[bu].totalAvgResT}`);

                      acc[bu].avgIterationsCount += 1;

                      // Accumulate CSAT (row[18] = avg_ai_csat_score, row[19] = csat_ticket_count)
                      const rowCsatScore = row[18];
                      const rowCsatCount = Number(row[19]) || 0;
                      if (rowCsatScore && rowCsatScore !== '' && rowCsatCount > 0) {
                        acc[bu].totalCsatSum += Number(rowCsatScore) * rowCsatCount;
                        acc[bu].totalCsatCount += rowCsatCount;
                      }

                      return acc;
                    }, {})
                )
                .sort(([buA], [buB]) => buA.localeCompare(buB))
                .map(([bu, metrics], i) => {
                  const fcrPercentage = (metrics.totalFCR / metrics.totalTickets) * 100;
                  const aiPercentage = (metrics.totalAI / metrics.totalTickets) * 100;
                  const totalSLA = ((metrics.totalTickets - metrics.totalSLABreach) / metrics.totalTickets) * 100;

                  const avgOPEN = (metrics.totalAvgOPEN / metrics.avgIterationsCount); 
                  const avgPEND = (metrics.totalAvgPEND / metrics.avgIterationsCount); 
                  const avgHOLD = (metrics.totalAvgHOLD / metrics.avgIterationsCount); 
                  const avgSOLV = (metrics.totalAvgSOLV / metrics.avgIterationsCount); 
                  const avgL1 = (metrics.totalAvgL1 / metrics.avgIterationsCount); 
                  const avgL2 = (metrics.totalAvgL2 / metrics.avgIterationsCount);

                  const avgIRT = (metrics.totalAvgIRT / metrics.avgIterationsCount); 
                  const avgResT = (metrics.totalAvgResT / metrics.avgIterationsCount);

                  const buCsatScore = metrics.totalCsatCount > 0 ? (metrics.totalCsatSum / metrics.totalCsatCount).toFixed(2) : null;
                  const buCsatCount = metrics.totalCsatCount || 0; 

                  return (
                    <Box
                      key={`${bu}-${i}`}
                      borderBottom={`4px solid ${colors.primary[500]}`}
                      p={isPortraitMobile ? "12px" : "15px"}
                      onClick={() => {
                        let cleanedPath = `${currentPath}/${bu.toLowerCase().replace('/', '-').replace(' ', '')}`;
                        navigate(cleanedPath);
                      }}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: colors.primary[500],
                        },
                      }}
                    >
                      <Typography 
                        color={colors.greenAccent[300]}
                        variant={isPortraitMobile ? "h5" : "h4"}
                        fontWeight="600"
                        sx={{ marginBottom: isPortraitMobile ? "8px" : "10px" }}
                      >
                        {`${bu}`}
                      </Typography>

                      <Box
                        display="grid"
                        gridTemplateColumns={isPortraitMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)"} 
                        columnGap={isPortraitMobile ? "10px" : "20px"}
                        rowGap={isPortraitMobile ? "8px" : "4px"}
                      >
                        {/* Columna 1 */}
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.grey[100]}>
                          Tickets: {metrics.totalTickets}{" "}
                          <span
                            style={{
                              color: colors.primary[200],
                              fontSize: isPortraitMobile ? "9px" : "0.5rem",
                              fontWeight: "bold",
                            }}
                          >
                            {` (${((metrics.totalTickets / finalTotals) * 100).toFixed(2)}%)`}
                          </span>
                        </Typography>
                  
                        {/* Columna 2 */}
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.greenAccent[300]} >
                          AI-Solved: {aiPercentage.toFixed(2)}%
                        </Typography>
                  
                        {/* Columna 3 */}
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.blueAccent[300]}>
                        FCR: {fcrPercentage.toFixed(2)}%
                        </Typography>
                  
                        {/* Columna 4 */}
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.redAccent[300]}>
                          SLA: {totalSLA.toFixed(2)}%
                        </Typography>
                  
                        {/* Segunda fila de estadísticas */}
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.grey[100]}>
                          Avg-Open: [ {convertSeconds(Math.round(avgOPEN))} ]
                        </Typography>
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.greenAccent[300]}>
                          Avg-Pend: [ {convertSeconds(Math.round(avgPEND))} ]
                        </Typography>
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.blueAccent[300]}>
                          Avg-Hold: [ {convertSeconds(Math.round(avgHOLD))} ]
                        </Typography>
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.redAccent[300]}>
                          Avg-Solv: [ {convertSeconds(Math.round(avgSOLV))} ]
                        </Typography>
                  
                        {/* Tercera fila de estadísticas */}
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.grey[100]}>
                          Avg-L1: [ {convertSeconds(Math.round(avgL1))} ]
                        </Typography>
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.greenAccent[300]}>
                          Avg-L2: [ {convertSeconds(Math.round(avgL2))} ]
                        </Typography>
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.blueAccent[300]}>
                          Avg-IRT: [ {convertSeconds(Math.round(avgIRT))} ]
                        </Typography>
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.redAccent[300]}>
                          Avg-Res: [ {convertSeconds(Math.round(avgResT))} ]
                        </Typography>

                        {/* Fourth row - CSAT */}
                        <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.grey[100]} sx={{ gridColumn: "span 2" }}>
                          AI-CSAT: {buCsatScore !== null ? `${buCsatScore} (${buCsatCount} tickets)` : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                  
                })
              ) 
              : //Else
              ( //if bu-subset is not "All" (if there is a bu chosen)
                dataMatrix
                  .filter(row => row[0] === bu_subset && row[0] !== "Totals")
                  .map((row, i) => {
                    const productName = row[1];
                    const numberOfTickets = Number(row[2]);
                    const ai = Number(row[7]);
                    const slaBreach = Number(row[8]);
                    const fcr = Number(row[9]);

                    const avgOPEN = Number(row[10]);
                    const avgPEND = Number(row[11]);
                    const avgHOLD = Number(row[12]);
                    const avgSOLV = Number(row[13]);
                    const avgL1 = Number(row[14]);
                    const avgL2 = Number(row[15]);

                    const avgIRT = Number(row[16]);
                    const avgResT = Number(row[17]);

                    const productCsatScore = row[18] && row[18] !== '' ? Number(row[18]).toFixed(2) : null;
                    const productCsatCount = Number(row[19]) || 0;

                    const totalSLA = ((numberOfTickets - slaBreach) / numberOfTickets) * 100;
                    const fcrPercentage = (fcr / numberOfTickets) * 100;
                    const aiPercentage = (ai / numberOfTickets) * 100;

                    return (
                      <Box
                        key={`${productName}-${i}`}
                        borderBottom={`4px solid ${colors.primary[500]}`}
                        p={isPortraitMobile ? "12px" : "15px"}
                        onClick={() => {
                          let cleanedPath = `${currentPath}/${productName.toLowerCase().replace(' ', '')}`;
                          navigate(cleanedPath);
                        }}
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: colors.primary[500],
                          },
                        }}
                      >
                        <Typography 
                        color={colors.greenAccent[300]}
                        variant={isPortraitMobile ? "h5" : "h4"}
                        fontWeight="600"
                        sx={{ marginBottom: isPortraitMobile ? "8px" : "10px" }}
                      >
                          {getProductRealName(productName)}
                          <span
                            style={{
                              marginLeft: "1px",
                              fontWeight: "400",
                              fontSize: isPortraitMobile ? "10px" : "0.5rem",
                            }}
                          >
                            ({productName})
                          </span>
                        </Typography>
                    
                        <Box
                          display="grid"
                          gridTemplateColumns={isPortraitMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)"} 
                          columnGap={isPortraitMobile ? "10px" : "20px"}
                          rowGap={isPortraitMobile ? "8px" : "4px"}
                        >
                          {/* Primera fila de estadísticas */}
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.grey[100]}>
                            Tickets: {numberOfTickets}
                            <span
                            style={{
                              color: colors.primary[200],
                              fontSize: isPortraitMobile ? "9px" : "0.5rem",
                              fontWeight: "bold",
                            }}
                          >
                              {` (${((numberOfTickets / totalTickets_bu) * 100).toFixed(2)}%)`}
                            </span>
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.greenAccent[300]}>
                            AI-Solved: {aiPercentage.toFixed(2)}%
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.blueAccent[300]}>
                            FCR: {fcrPercentage.toFixed(2)}%
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.redAccent[300]}>
                            SLA: {totalSLA.toFixed(2)}%
                          </Typography>
                    
                          {/* Segunda fila de estadísticas */}
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.grey[100]}>
                            Avg-Open: [ {convertSeconds(Math.round(avgOPEN))} ]
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.greenAccent[300]}>
                            Avg-Pend: [ {convertSeconds(Math.round(avgPEND))} ]
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.blueAccent[300]}>
                            Avg-Hold: [ {convertSeconds(Math.round(avgHOLD))} ]
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.redAccent[300]}>
                            Avg-Solv: [ {convertSeconds(Math.round(avgSOLV))} ]
                          </Typography>
                    
                          {/* Tercera fila de estadísticas */}
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.grey[100]}>
                            Avg-L1: [ {convertSeconds(Math.round(avgL1))} ]
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.greenAccent[300]}>
                            Avg-L2: [ {convertSeconds(Math.round(avgL2))} ]
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.blueAccent[300]}>
                            Avg-IRT: [ {convertSeconds(Math.round(avgIRT))} ]
                          </Typography>
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.redAccent[300]}>
                            Avg-Res: [ {convertSeconds(Math.round(avgResT))} ]
                          </Typography>

                          {/* Fourth row - CSAT */}
                          <Typography fontSize={isPortraitMobile ? "10px" : "8px"} color={colors.grey[100]} sx={{ gridColumn: "span 2" }}>
                            AI-CSAT: {productCsatScore !== null ? `${productCsatScore} (${productCsatCount} tickets)` : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                    
                  })
              )

          : 
          
          console.log(`No DataMatrix`)}

        </Box> {/*- This one closes the main box (under the BU statistics title) -*/}

        {/* Tickets Closed Pie Chart - LANDSCAPE ONLY (after BU Statistics) */}
        {!isPortraitMobile && (
          <Box
            gridColumn={`span ${totalPieChartAllBUs}`}
            gridRow={`span ${totalPieChartAllBUsVertical}`}
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
            borderRadius="8px"
            sx={{
              minHeight: "100%",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <Box
              position="absolute"
              top={10}
              left={10}
              padding="10px"
              zIndex="2"
            >
              <Typography 
                fontSize="14px"
                display="flex" 
                variant="h2"
                fontWeight="600"
              >
                Tickets Closed
              </Typography>
              
              <Typography 
                variant="h5"
                sx={{ color: colors.greenAccent[300] }}
              >
                  Statistics per {(bu_subset === "All") ? "BU" : "Product"}
              </Typography>
            </Box>

            <PieChart 
              dataArray={pieChartTotalAllData}
              view={(bu_subset === "All") ? "total" : "product"}
            />
          </Box>
        )}

      </Box>
    </Box>
  );
};

export default DashboardPassive;
