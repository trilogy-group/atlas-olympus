import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { performGetAutomations, getProductRealName, validateUser } from "../../data/fetchData";
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { useNavigate } from "react-router-dom"; 
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import { useReload } from "../../context/ReloadContext";
import Header from "../../components/Header";
import Selector from "../../components/Selector";
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import PieChart from "../../components/PieChart";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import StatBox from "../../components/StatBox";
import StatBoxSpecial from "../../components/StatBoxSpecial";

function pickInitialWeek() {
  try {
    const raw = localStorage.getItem("automations-history-data");
    if (raw) {
      const parsed = JSON.parse(raw);
      const headers = parsed[0] || [];
      const weekIdx = headers.indexOf("week");
      if (weekIdx !== -1) {
        const weeks = Array.from(new Set(parsed.slice(1).map(r => r?.[weekIdx]).filter(Boolean)));
        const re = /^(\d{4})-?W?(\d{1,2})$/;
        weeks.sort((a, b) => {
          const [, ya, wa] = String(a).match(re) || [];
          const [, yb, wb] = String(b).match(re) || [];
          const yA = parseInt(ya, 10) || 0;
          const wA = parseInt(wa, 10) || 0;
          const yB = parseInt(yb, 10) || 0;
          const wB = parseInt(wb, 10) || 0;
          return yA !== yB ? yA - yB : wA - wB;
        });
        const trimmed = weeks.length > 12 ? weeks.slice(-12) : weeks;
        if (trimmed.length) return String(trimmed[trimmed.length - 1]); // última
      }
    }
  } catch {
    console.log("Error picking initial week (pickInitialWeek)");
  }
  return null;
}

function getWeekOptionsFromMatrix(matrix, limit = 12) {
  if (!Array.isArray(matrix) || matrix.length < 2) return [];
  const headers = matrix[0];
  const weekIdx = headers.indexOf("week");
  if (weekIdx === -1) return [];
  const rawWeeks = matrix.slice(1).map(r => r[weekIdx]).filter(Boolean);
  const unique = Array.from(new Set(rawWeeks));
  const re = /^(\d{4})-?W?(\d{1,2})$/;
  unique.sort((a, b) => {
    const [, ya, wa] = String(a).match(re) || [];
    const [, yb, wb] = String(b).match(re) || [];
    const yA = parseInt(ya, 10) || 0;
    const wA = parseInt(wa, 10) || 0;
    const yB = parseInt(yb, 10) || 0;
    const wB = parseInt(wb, 10) || 0;
    return yA !== yB ? yA - yB : wA - wB;
  });
  const trimmed = limit && unique.length > limit ? unique.slice(-limit) : unique;
  return trimmed.map(w => {
    const m = String(w).match(re);
    const yr = m ? m[1] : "";
    const wk = m ? m[2] : w;
    return { label: `Week ${wk} (${yr})`, value: String(w) };
  });
}

function formatWeekLabel(week) {
  if (!week) return "";
  const re = /^(\d{4})-?W?(\d{1,2})$/;
  const m = String(week).match(re);
  return m ? `Week ${m[2]} - ${m[1]}` : `Week ${week}`;
}

const NUMS = [
  "all_tickets","automated_tickets",
  "voiceflow_success","voiceflow_failure",
  "voicebot_success","voicebot_failure",
  "intent_capture_failure","intent_capture_success",
  "athena_failure","athena_success",
  "automation_success","automation_failure",
  "cc_success","cc_failure"
];

function matrixToRows(matrix) {
  if (!Array.isArray(matrix) || matrix.length < 2) return [];
  const h = matrix[0];
  return matrix.slice(1).map(r => {
    const o = {};
    h.forEach((k,i) => { o[k] = NUMS.includes(k) ? parseInt(r[i] || "0",10) : r[i]; });
    return o;
  });
}

function scopeRows(rows, { bu="All", product="All" } = {}) {
  let out = rows;
  if (bu !== "All") out = out.filter(x => x.bu === bu);
  if (product !== "All") out = out.filter(x => x.product === product);
  return out;
}

function sumBy(rows, key) { return rows.reduce((a,b)=>a+(b[key]||0),0); }

function pct(num, den) { return den>0 ? num/den : 0; }

function buildAgg(rows) {
  const agg = {};
  NUMS.forEach(k => agg[k] = sumBy(rows,k));
  agg.total = agg.all_tickets || 0;
  agg.pct_automation = pct(agg.automated_tickets, agg.total);
  const vfDen = agg.voiceflow_success + agg.voiceflow_failure;
  const vbDen = agg.voicebot_success + agg.voicebot_failure;
  const icDen = agg.intent_capture_success + agg.intent_capture_failure;
  const atDen = agg.athena_success + agg.athena_failure;
  const auDen = agg.automation_success + agg.automation_failure;
  agg.pct_vf = pct(agg.voiceflow_success, vfDen);
  agg.pct_vb = pct(agg.voicebot_success, vbDen);
  agg.pct_intent = pct(agg.intent_capture_success, icDen);
  agg.pct_athena = pct(agg.athena_success, atDen);
  agg.pct_autoFlows = pct(agg.automation_success, auDen);
  return agg;
}

function buildTrend(matrix) {
  const rows = matrixToRows(matrix);
  const byWeek = {};
  rows.forEach(r=>{
    if (!byWeek[r.week]) byWeek[r.week] = { all:0, auto:0 };
    byWeek[r.week].all += r.all_tickets||0;
    byWeek[r.week].auto += r.automated_tickets||0;
  });
  const weeks = Object.keys(byWeek).sort((a,b)=>a.localeCompare(b)).slice(-12);
  return {
    tickets: weeks.length ? [{ id: "Tickets", data: weeks.map(w=>({ x:w, y: byWeek[w].all })) }] : [],
    automationRate: weeks.length ? [{ id: "Automation %", data: weeks.map(w=>{
      const den = byWeek[w].all || 0;
      const num = byWeek[w].auto || 0;
      return { x:w, y: den>0 ? +(num/den*100).toFixed(1) : 0 };
    }) }] : []
  };
}

function topBUsByAutomation(matrix) {
  const rows = matrixToRows(matrix);
  const byBU = {};
  rows.forEach(r=>{
    if (!byBU[r.bu]) byBU[r.bu] = { all:0, auto:0 };
    byBU[r.bu].all += r.all_tickets||0;
    byBU[r.bu].auto += r.automated_tickets||0;
  });
  const arr = Object.entries(byBU).map(([bu,v]) => ({
    bu,
    Pct: v.all>0 ? +(v.auto/v.all*100).toFixed(1) : 0
  })).filter(x=>x.bu && x.bu!=="Totals");
  return arr.sort((a,b)=>b.Pct-a.Pct).slice(0,5);
}

function topProductsByFailures(matrix, { bu="All" } = {}) {
  let rows = matrixToRows(matrix);
  if (bu!=="All") rows = rows.filter(r=>r.bu===bu);
  const map = rows.reduce((acc,r)=>{
    const f = (r.voiceflow_failure||0)+(r.voicebot_failure||0)+(r.intent_capture_failure||0)+(r.athena_failure||0)+(r.automation_failure||0)+(r.cc_failure||0);
    if (!acc[r.product]) acc[r.product] = 0;
    acc[r.product]+=f;
    return acc;
  },{});
  return Object.entries(map)
    .map(([product,Failures])=>({product,Failures}))
    .sort((a,b)=>b.Failures-a.Failures)
    .slice(0,5);
}

const DashboardAutomations = ({ bu_subset = "All", vpName = "All", productChosen = "All" }) => {
  vpName = localStorage.getItem("current-vp");
  const [selectedWeek, setSelectedWeek] = useState(() => pickInitialWeek());
  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const userEmail = userInfo?.email || "";
  const globals = useConfigureGlobals();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate(); 
  let [dataMatrix, setDataMatrix] = useState([]);
  const [totalWeeksData, setTotalWeeksData] = useState([]);
  const { reloadKey } = useReload();

  useEffect(() => {
    if (!validateUser(userEmail)) {
      navigate("/login");
      alert("You are logged out. Please login again.");
      return;
    }
    if (!globals || Object.keys(globals).length === 0) return;
    const fetchDataAsync = async () => {
      try {
        let data = await performGetAutomations(globals);
        setDataMatrix(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } 
    };
    fetchDataAsync();
  }, [globals, reloadKey, navigate, userEmail]);

  useEffect(() => {
    if (totalWeeksData.length === 0) {
      const mock = Array.from({ length: 12 }, (_, i) => ({ Week: `Week ${i + 1}`, Total: Math.floor(Math.random() * 1000) }));
      setTotalWeeksData(mock);
    }
  }, []);

  const [heatMapData, setHeatMapData] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem("automations-history-data");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const headers = parsed[0];
      const dataRows = parsed.slice(1);
      const weekIndex = headers.indexOf("week");
      const successIndex = headers.indexOf("automation_success");
      const weekTotals = {};
      dataRows.forEach(row => {
        const week = row[weekIndex];
        const weekNumber = week?.split("-")[1];
        const success = parseInt(row[successIndex] || "0", 10);
        if (!weekTotals[weekNumber]) weekTotals[weekNumber] = 0;
        weekTotals[weekNumber] += success;
      });
      const sortedWeeks = Object.keys(weekTotals).sort((a, b) => parseInt(a) - parseInt(b)).slice(-12);
      const heatMapFormatted = sortedWeeks.map(week => ({ x: `#${week}`, y: weekTotals[week] }));
      setHeatMapData([{ id: "Week", data: heatMapFormatted }]);
    } catch (err) {
      console.error("Error parsing automations-history-data:", err);
    }
  }, []);

      // GRID SIZES FOR THE DASHBOARD
      const fullGridSize = 120;

      const row1Tile1SizeHorizontal = 50;
      const row1Tile1SizeVertical = 1;
      const row1Tile2SizeHorizontal = 50;
      const row1Tile2SizeVertical = 1;
      // const row1Tile3SizeHorizontal = 25;
      // const row1Tile3SizeVertical = 2;
      // const row1Tile4SizeHorizontal = 25;
      // const row1Tile4SizeVertical = 2;

      const row2Tile1SizeHorizontal = 25;
      const row2Tile1SizeVertical = 2;
      // const row2Tile2SizeHorizontal = 25;
      // const row2Tile2SizeVertical = 1;
      // const row2Tile3SizeHorizontal = 25;
      // const row2Tile3SizeVertical = 1;
      // const row2Tile4SizeHorizontal = 25;
      // const row2Tile4SizeVertical = 1;



      // GRID SIZES FOR THE DASHBOARD

  const weekOptions = useMemo(() => {
    const opts = getWeekOptionsFromMatrix(dataMatrix, 12);
    if (opts.length) return opts;
    return Array.from({ length: 12 }, (_, i) => {
      const v = String(i + 1);
      return { label: `Week ${v}`, value: v };
    });
  }, [dataMatrix]);

  let filteredMatrix = dataMatrix;
  if (Array.isArray(filteredMatrix) && filteredMatrix.length) {
    if (selectedWeek) {
      const headers = filteredMatrix[0];
      const weekIdx = headers.indexOf("week");
      if (weekIdx !== -1) {
        filteredMatrix = [headers, ...filteredMatrix.slice(1).filter(r => r[weekIdx] === selectedWeek)];
      }
    }
  }

  let mappedProducts = [];
  let filteredAssignments = [];
  let isolatedMappedProducts = [];

  if (filteredMatrix && filteredMatrix.length !== 0 && !isNaN(filteredMatrix.length)) {
    if (vpName !== "All") {
      const assignmentsPerVP = JSON.parse(localStorage.getItem("assignments")) || [];
      filteredAssignments = assignmentsPerVP.filter(row => row[2] === vpName);
      mappedProducts = filteredAssignments.map(r => r[0]);
      isolatedMappedProducts = mappedProducts;
      const headers = filteredMatrix[0];
      const productIdx = headers.indexOf("product");
      if (productIdx !== -1 && mappedProducts.length > 0) {
        filteredMatrix = [headers, ...filteredMatrix.slice(1).filter(line => mappedProducts.includes(line[productIdx]))];
      }
    }
  }

  dataMatrix = filteredMatrix;
  let currentPath = window.location.pathname;
  currentPath = currentPath.replace(/\/passive/, '');

  const safeDataMatrix = Array.isArray(dataMatrix) ? dataMatrix : [];

  const rowsScoped = useMemo(() => {
    try { return matrixToRows(safeDataMatrix); } catch (e) { console.error(e); return []; }
  }, [safeDataMatrix]);

  const rowsForCards = useMemo(() => {
    try { return scopeRows(rowsScoped, { bu: bu_subset, product: productChosen }); }
    catch (e) { console.error(e); return []; }
  }, [rowsScoped, bu_subset, productChosen]);

  const agg = useMemo(() => {
    try { return buildAgg(rowsForCards); } catch (e) { console.error(e); return buildAgg([]); }
  }, [rowsForCards]);

  const fullMatrixLS = useMemo(() => {
    try { 
      const raw = localStorage.getItem("automations-history-data");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { console.error(e); return []; }
  }, []);

  const trends = useMemo(() => {
    try {
      const t = buildTrend(fullMatrixLS);
      return {
        tickets: Array.isArray(t?.tickets) ? t.tickets : [],
        automationRate: Array.isArray(t?.automationRate) ? t.automationRate : []
      };
    } catch (e) {
      console.error(e);
      return { tickets: [], automationRate: [] };
    }
  }, [fullMatrixLS]);

  const topBU = useMemo(() => {
    try {
      const arr = topBUsByAutomation(safeDataMatrix);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [safeDataMatrix]);

  const topProd = useMemo(() => {
    try {
      const arr = topProductsByFailures(safeDataMatrix, { bu: bu_subset });
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [safeDataMatrix, bu_subset]);

  const {
    vfTotal, vbTotal, icTotal, atTotal,
    vfPct,   vbPct,   icPct,   atPct
  } = useMemo(() => {
    const vfTotal = (agg.voiceflow_success || 0) + (agg.voiceflow_failure || 0);
    const vbTotal = (agg.voicebot_success  || 0) + (agg.voicebot_failure  || 0);
    const icTotal = (agg.intent_capture_success || 0) + (agg.intent_capture_failure || 0);
    const atTotal = (agg.athena_success || 0) + (agg.athena_failure || 0);
  
    const vfPct = vfTotal > 0 ? agg.voiceflow_success / vfTotal : 0;
    const vbPct = vbTotal > 0 ? agg.voicebot_success  / vbTotal : 0;
    const icPct = icTotal > 0 ? agg.intent_capture_success / icTotal : 0;
    const atPct = atTotal > 0 ? agg.athena_success / atTotal : 0;
  
    return { vfTotal, vbTotal, icTotal, atTotal, vfPct, vbPct, icPct, atPct };
  }, [agg]);

  // Build bar-series with required "dates" index
  const vfVbBarsForBar = useMemo(() => ([
    { dates:"Voiceflow", Success: agg.voiceflow_success||0, Failure: agg.voiceflow_failure||0 },
    { dates:"Voicebot",  Success: agg.voicebot_success||0,  Failure: agg.voicebot_failure||0  },
  ]), [agg]);

  const topBUForBar = useMemo(() => (
    (topBU||[]).map(x => ({ dates: x.bu, ["Automation %"]: x.Pct }))
  ), [topBU]);

  const topProdForBar = useMemo(() => (
    (topProd||[]).map(x => ({ dates: getProductRealName(x.product), Failures: x.Failures }))
  ), [topProd]);

  const hasMatrix = Array.isArray(safeDataMatrix) && safeDataMatrix.length > 1;
  const hasTrendTickets = Array.isArray(trends.tickets) && trends.tickets.length > 0 && Array.isArray(trends.tickets[0].data) && trends.tickets[0].data.length > 0;
  const hasTrendAutomation = Array.isArray(trends.automationRate) && trends.automationRate.length > 0 && Array.isArray(trends.automationRate[0].data) && trends.automationRate[0].data.length > 0;
  const hasTopBU = Array.isArray(topBUForBar) && topBUForBar.length > 0;
  const hasTopProd = Array.isArray(topProdForBar) && topProdForBar.length > 0;

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" flexDirection="column">
        <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
          <Header 
            title={`Central Support: Automations through the weeks ( ${vpName === "All" ? "All VPs" : vpName} )`} 
            subtitle={`${bu_subset === "All" ? "All" : bu_subset} statistics for ${vpName === "All" ? "All VPs" : vpName}`} 
          />
        </Box>
        <Box width="100%" mt={2} mb={2}>
          <Selector
            options={weekOptions}
            value={selectedWeek}
            initialIndex={0}
            onChange={(val) => setSelectedWeek(val)}
          />
        </Box>
      </Box>

      <Box display="grid" gridTemplateColumns={`repeat(${fullGridSize}, 1fr)`} gridAutoRows="100px" gap="10px">

        {/* ROW 0 */}

        <Box
          gridColumn={`span ${20}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBoxSpecial
            title="Total Tickets"
            subtitle={` ${selectedWeek ? `${formatWeekLabel(selectedWeek)}` : ""}`}
            icon={<SmartToyRoundedIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
            rightValue = {`${agg.total}`}     
            rightCaption = "tickets"    
            rightSize = {`25px`}     
            rightColor = {colors.primary[100]}
          />
        </Box>

        <Box
          gridColumn={`span ${20}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          <StatBoxSpecial
            title="Automation %"
            subtitle={`${(agg.automated_tickets || 0).toLocaleString()} tickets`}  
            icon={<SmartToyRoundedIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
            progress={agg.pct_automation}
            increase={`${(agg.pct_automation * 100).toFixed(1)}%`}                
            rightValue = {`${(agg.pct_automation * 100).toFixed(2)}%`}    
            rightCaption = ""    
            rightSize = {`25px`}   
            rightColor = { (agg.pct_automation * 100).toFixed(2) > 70 
              ? (agg.pct_automation * 100).toFixed(2) > 74 ? colors.greenAccent[500] : colors.greenAccent[300]
              : (agg.pct_automation * 100).toFixed(2) < 65 ? colors.redAccent[500] : colors.redAccent[300]
            }
          />
        </Box>

          <Box
            gridColumn={`span ${20}`}
            // gridRow={`span ${row2Tile1SizeVertical}`} 
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={`VoiceFlow Stats`}
              subtitle={`${vfTotal} tickets`}
              progress={vfPct}
              increase={`Success: ${(vfPct * 100).toFixed(2)}% (${agg.voiceflow_success} tickets)`}
              icon={<SmartToyRoundedIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
              redflag = {true}
            />
          </Box>

          <Box
            gridColumn={`span ${20}`}
            // gridRow={`span ${row2Tile1SizeVertical}`} 
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={`VoiceBot Stats`}
              subtitle={`${vbTotal} tickets`}
              progress={vbPct}
              increase={`Success: ${(vbPct * 100).toFixed(2)}% (${agg.voicebot_success} tickets)`}
              icon={<SmartToyRoundedIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
              redflag = {true}
            />
          </Box>

          <Box
            gridColumn={`span ${20}`}
            // gridRow={`span ${row2Tile1SizeVertical}`} 
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={`Intent Capture Stats`}
              subtitle={`${icTotal} tickets`}
              progress={icPct}
              increase={`Success: ${(icPct * 100).toFixed(2)}% (${agg.intent_capture_success} tickets)`}
              icon={<SmartToyRoundedIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
              redflag = {true}
            />
          </Box>

          <Box
            gridColumn={`span ${20}`}
            // gridRow={`span ${row2Tile1SizeVertical}`} 
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={`Atlas (Athena) Stats`}
              subtitle={`${atTotal} tickets`}
              progress={atPct}
              increase={`Success: ${(atPct * 100).toFixed(2)}% (${agg.athena_success} tickets)`}
              icon={<SmartToyRoundedIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
              redflag = {true}
            />
          </Box>

        {/* LEFT PANNEL */}

        <Box gridColumn={`span ${20}`} gridRow={`span ${8}`} backgroundColor={colors.primary[400]} overflow="auto">
          <Box display="flex" justifyContent="space-between" alignItems="center" borderBottom={`4px solid ${colors.primary[500]}`} colors={colors.grey[100]} p="15px">
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              {`Statistics for ${bu_subset} ${(productChosen === "All") ? (bu_subset === "All" ? `BUs` : `Products`) : (bu_subset === "All" ? `BUs` : `Products (${getProductRealName(productChosen)})`)}`}
            </Typography>
          </Box>

          {Array.isArray(safeDataMatrix) && safeDataMatrix.length ? (
            (bu_subset === "All") ? (
              (productChosen === "All") ? (
                Object.entries(
                  safeDataMatrix
                    .filter(row => row[0] !== "bu" && row[0] !== "Totals")
                    .reduce((acc, row) => { const bu = row[0]; if (!acc[bu]) acc[bu] = [{}]; return acc; }, {})
                ).sort(([buA], [buB]) => buA.localeCompare(buB))
                .map(([bu, metrics], i) => (
                  <Box key={`${bu}-${i}`} borderBottom={`4px solid ${colors.primary[500]}`} p="15px"
                    onClick={() => { 
                      let cleanedPath = `${currentPath}/${bu.toLowerCase().replace('/', '-').replace(' ', '')}`;
                      navigate(cleanedPath);
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">{`${bu}`}</Typography>
                    <Box display="flex" justifyContent="space-between"></Box>
                  </Box>
                ))
              ) : (
                Object.entries(
                  safeDataMatrix
                    .filter(row => row[0] !== "bu" && row[0] !== "Totals")
                    .reduce((acc, row) => { const bu = row[0]; if (!acc[bu]) acc[bu] = [{}]; return acc; }, {})
                ).sort(([buA], [buB]) => buA.localeCompare(buB))
                .map(([bu, metrics], i) => (
                  <Box key={`${bu}-${i}`} borderBottom={`4px solid ${colors.primary[500]}`} p="15px"
                    onClick={() => { 
                      let cleanedPath = `${currentPath}/${bu.toLowerCase().replace('/', '-').replace(' ', '')}`;
                      navigate(cleanedPath);
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">{`${bu}`}</Typography>
                    <Box display="flex" justifyContent="space-between"></Box>
                  </Box>
                ))
              )
            ) : (
              (productChosen === "All") ? (
                [...new Set(safeDataMatrix
                  .filter(row => row[0] === bu_subset && row[2] !== "Totals")
                  .filter(row => (Array.isArray(isolatedMappedProducts) && isolatedMappedProducts.length > 0) ? isolatedMappedProducts.includes(row[1]) : true)
                  .map(row => row[1]))] 
                  .map((productName, i) => (
                    <Box key={`${productName}-${i}`} borderBottom={`4px solid ${colors.primary[500]}`} p="15px"
                      onClick={() => { 
                        let cleanedPath = `${currentPath}/${productName.toLowerCase().replace('/', '-').replace(' ', '')}`;
                        navigate(cleanedPath);
                      }}
                      sx={{ cursor: "pointer" }}
                    >
                      <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">{getProductRealName(productName)}</Typography>
                    </Box>
                  ))
              ) : (
                [...new Set(safeDataMatrix
                  .filter(row => row[0] === bu_subset && row[1] === productChosen)
                  .map(row => row[1]))]
                  .map((productName, i) => (
                    <Box key={`${productName}-${i}`} borderBottom={`4px solid ${colors.primary[500]}`} p="15px">
                      <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">{getProductRealName(productName)}</Typography>
                    </Box>
                  ))
              )
            )
          ) : (console.log(`No DataMatrix`))}
        </Box>

        {/* ROW 1 */}

        <Box gridColumn={`span ${50}`} gridRow={`span ${row2Tile1SizeVertical}`} backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" position="relative">
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box position="absolute" top={10} left={10} padding="10px">
            <Typography display="flex" variant="h2" fontWeight="600">
              <ConfirmationNumberRoundedIcon sx={{ color: colors.primary[100], fontSize: "26px", marginRight: "8px" }} />
              {`Top 5 BUs by Automation %`}
              {` ${selectedWeek ? `(${formatWeekLabel(selectedWeek)})` : ""}`}
              {` ${vpName && vpName !== "All" ? `[ ${vpName.split(" ")[0].substring(0, 1)}. ${vpName.split(" ")[1]} ]` : ""}`}
            </Typography>
            <Typography variant="h5" sx={{ color: colors.primary[100] }}>
            
            </Typography>
          </Box>
          {hasTopBU ? ( <BarChart dataArray={topBUForBar} keys={["Automation %"]} /> ) : <Box p={2}><Typography>No data</Typography></Box>}
        </Box>

        <Box gridColumn={`span ${50}`} gridRow={`span ${row2Tile1SizeVertical}`} backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" position="relative">
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box position="absolute" top={10} left={10} padding="10px">
            <Typography display="flex" variant="h2" fontWeight="600">
              <ConfirmationNumberRoundedIcon sx={{ color: colors.primary[100], fontSize: "26px", marginRight: "8px" }} />
              {`Top 5 Products by Failures`}
              {` ${bu_subset !== "All" ? `(${bu_subset})` : ""}`}
              {` ${selectedWeek ? `(${formatWeekLabel(selectedWeek)})` : ""}`}
              {` ${vpName && vpName !== "All" ? `[ ${vpName.split(" ")[0].substring(0, 1)}. ${vpName.split(" ")[1]} ]` : ""}`}
            </Typography>
            <Typography variant="h5" sx={{ color: colors.primary[100] }}>
            
            </Typography>
          </Box>
          {hasTopProd ? ( <BarChart dataArray={topProdForBar} keys={["Failures"]} /> ) : <Box p={2}><Typography>No data</Typography></Box>}
        </Box>

        {/* ROW 2 */}


        {/* ROW 3 */}

        {/* <Box gridColumn={`span ${row2Tile1SizeHorizontal}`} gridRow={`span ${row2Tile1SizeVertical}`} backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" position="relative">
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box position="absolute" top={10} left={10} padding="10px">
            <Typography display="flex" variant="h2" fontWeight="600">
              <ConfirmationNumberRoundedIcon sx={{ color: colors.primary[100], fontSize: "26px", marginRight: "8px" }} />
              VoiceFlow Stats
            </Typography>
            <Typography variant="h5" sx={{ color: colors.primary[100] }}>
            
            </Typography>
          </Box>
          {hasMatrix ? <PieChart dataArray={vfPie} /> : <Box p={2}><Typography>No data to show. Please reload.</Typography></Box>}
        </Box> */}

        {/* <Box gridColumn="span 80" gridRow="span 6" backgroundColor={colors.primary[400]}>
          <Header title="VF vs VB (Success/Failure)" subtitle="" />
          {hasMatrix ? (
            <BarChart dataArray={vfVbBarsForBar} keys={["Success","Failure"]} />
          ) : <Box p={2}><Typography>No data</Typography></Box>}
        </Box> */}


        {/* ROW 4 */}

        <Box gridColumn={`span ${50}`} gridRow={`span ${2}`} backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" position="relative">
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box position="absolute" top={10} left={10} padding="10px">
            <Typography display="flex" variant="h2" fontWeight="600">
              <ConfirmationNumberRoundedIcon sx={{ color: colors.primary[100], fontSize: "26px", marginRight: "8px" }} />
              12-week Trend: Automation %
            </Typography>
            <Typography variant="h5" sx={{ color: colors.primary[100] }}>
              Placeholder 2
            </Typography>
          </Box>
          {hasTrendAutomation ? <LineChart dataArray={trends.automationRate} /> : <Box p={2}><Typography>No data</Typography></Box>}
        </Box>

        <Box gridColumn={`span ${50}`} gridRow={`span ${2}`} backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" position="relative">
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box position="absolute" top={10} left={10} padding="10px">
            <Typography display="flex" variant="h2" fontWeight="600">
              <ConfirmationNumberRoundedIcon sx={{ color: colors.primary[100], fontSize: "26px", marginRight: "8px" }} />
              12-weeks Trend: Tickets
            </Typography>
            <Typography variant="h5" sx={{ color: colors.primary[100] }}>
              Placeholder 2
            </Typography>
          </Box>
          {hasTrendTickets ? <LineChart dataArray={trends.tickets} /> : <Box p={2}><Typography>No data</Typography></Box>}
        </Box>

        {/* END */}

      </Box>
    </Box>
  );
};

export default DashboardAutomations;
