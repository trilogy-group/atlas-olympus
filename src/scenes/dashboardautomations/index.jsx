import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { tokens } from "../../theme";
import { performGetAutomations, getProductRealName, validateUser } from "../../data/fetchData";
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { useNavigate } from "react-router-dom"; 
import { useReload } from "../../context/ReloadContext";
import { useIsForcedMobile } from "../../hooks/useIsMobile";
import Header from "../../components/Header";
import Selector from "../../components/Selector";
import PieChart from "../../components/PieChart";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import StatBox from "../../components/StatBox";
import StatBoxSpecial from "../../components/StatBoxSpecial";
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import ForumIcon from '@mui/icons-material/Forum';
import CallIcon from '@mui/icons-material/Call';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import Face3Icon from '@mui/icons-material/Face3';

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
        if (trimmed.length) return String(trimmed[trimmed.length - 1]);
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
  // console.log("🔧 [scopeRows] Input:", rows.length, "rows, bu filter:", bu, "product filter:", product);
  let out = rows;
  
  // FIX: Treat empty string as "All"
  const normalizedBU = !bu || bu === "" ? "All" : bu;
  const normalizedProduct = !product || product === "" ? "All" : product;
  
  if (normalizedBU !== "All") {
    // console.log("🔧 [scopeRows] Filtering by BU:", normalizedBU);
    out = out.filter(x => x.bu === normalizedBU);
    // console.log("🔧 [scopeRows] After BU filter:", out.length, "rows");
  }
  if (normalizedProduct !== "All") {
    // console.log("🔧 [scopeRows] Filtering by Product:", normalizedProduct);
    out = out.filter(x => x.product === normalizedProduct);
    // console.log("🔧 [scopeRows] After Product filter:", out.length, "rows");
  }
  // console.log("🔧 [scopeRows] Output:", out.length, "rows");
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
  const ccDen = agg.cc_success + agg.cc_failure;
  agg.pct_vf = pct(agg.voiceflow_success, vfDen);
  agg.pct_vb = pct(agg.voicebot_success, vbDen);
  agg.pct_intent = pct(agg.intent_capture_success, icDen);
  agg.pct_athena = pct(agg.athena_success, atDen);
  agg.pct_autoFlows = pct(agg.automation_success, auDen);
  agg.pct_cc = pct(agg.cc_success, ccDen);
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

function topProductsByFailures(matrix, { bu = "All", limit = 10 } = {}) {
  let rows = matrixToRows(matrix);
  // FIX: Normalize empty string to "All"
  const normalizedBU = !bu || bu === "" ? "All" : bu;
  if (normalizedBU !== "All") rows = rows.filter(r => r.bu === normalizedBU);

  const map = rows.reduce((acc, r) => {
    const f = (r.voiceflow_failure||0)+(r.voicebot_failure||0)+(r.intent_capture_failure||0)+(r.athena_failure||0)+(r.automation_failure||0)+(r.cc_failure||0);
    if (!acc[r.product]) acc[r.product] = 0;
    acc[r.product] += f;
    return acc;
  }, {});

  return Object.entries(map)
    .map(([product, Failures]) => ({ product, Failures }))
    .sort((a, b) => b.Failures - a.Failures)
    .slice(0, limit);   // <- antes era 5
}


function bottomProductsByAutomation(matrix, { bu = "All", limit = 10 } = {}) {
  let rows = matrixToRows(matrix);
  // FIX: Normalize empty string to "All"
  const normalizedBU = !bu || bu === "" ? "All" : bu;
  if (normalizedBU !== "All") rows = rows.filter(r => r.bu === normalizedBU);
  const byProduct = {};
  rows.forEach(r => {
    if (!r.product || r.product === "Totals") return;
    if (!byProduct[r.product]) byProduct[r.product] = { all: 0, auto: 0 };
    byProduct[r.product].all += r.all_tickets || 0;
    byProduct[r.product].auto += r.automated_tickets || 0;
  });
  return Object.entries(byProduct)
    .map(([product, v]) => ({
      product,
      pct: v.all > 0 ? +(v.auto / v.all * 100).toFixed(1) : 0
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, limit);
}

const DashboardAutomations = ({ bu_subset = "All", vpName = "All", productChosen = "All" }) => {
  // FIX: Normalize empty string to "All"
  bu_subset = !bu_subset || bu_subset === "" ? "All" : bu_subset;
  productChosen = !productChosen || productChosen === "" ? "All" : productChosen;
  
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

  // Mobile portrait detection
  const isForcedMobile = useIsForcedMobile();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isPortraitMobile = (isForcedMobile || isSmallScreen) && isPortrait;

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
        // console.log("🔍 [DASHBOARD] RAW DATA FROM performGetAutomations:", data);
        // console.log("🔍 [DASHBOARD] TYPE:", typeof data);
        // console.log("🔍 [DASHBOARD] IS ARRAY:", Array.isArray(data));
        // console.log("🔍 [DASHBOARD] DATA LENGTH:", data?.length);
        
        // FIX: Si viene como objeto con .values, extraerlo
        if (data && typeof data === 'object' && !Array.isArray(data) && data.values) {
          // console.log("⚠️ [DASHBOARD] Data came as object with .values, extracting...");
          data = data.values;
        }
        
        // Verify we have a valid array
        if (!Array.isArray(data) || data.length === 0) {
          console.error("❌ [DASHBOARD] Invalid data format or empty array");
          return;
        }
        
        // console.log("✅ [DASHBOARD] Setting dataMatrix with", data.length, "rows");
        // console.log("🔍 [DASHBOARD] First 3 rows:", data.slice(0, 3));
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
    // Re-run when automations data arrives (reloadKey or dataMatrix change)
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
  }, [dataMatrix, reloadKey]);

  // GRID SIZES
  const fullGridSize = 120;

  const row1Tile1SizeHorizontal = 50;
  const row1Tile1SizeVertical = 1;
  const row1Tile2SizeHorizontal = 50;
  const row1Tile2SizeVertical = 1;

  const row2Tile1SizeHorizontal = 25;
  const row2Tile1SizeVertical = 2;

  const weekOptions = useMemo(() => {
    const opts = getWeekOptionsFromMatrix(dataMatrix, 12);
    if (opts.length) return opts;
    return Array.from({ length: 12 }, (_, i) => {
      const v = String(i + 1);
      return { label: `Week ${v}`, value: v };
    });
  }, [dataMatrix]);

  let filteredMatrix = dataMatrix;
  // console.log("🔍 [FILTER WEEK] Initial dataMatrix length:", dataMatrix?.length);
  // console.log("🔍 [FILTER WEEK] Selected week:", selectedWeek);
  
  if (Array.isArray(filteredMatrix) && filteredMatrix.length) {
    if (selectedWeek) {
      const headers = filteredMatrix[0];
      const weekIdx = headers.indexOf("week");
      // console.log("🔍 [FILTER WEEK] Week column index:", weekIdx);
      // console.log("🔍 [FILTER WEEK] Headers:", headers);
      
      if (weekIdx !== -1) {
        const dataRows = filteredMatrix.slice(1);
        const matchingRows = dataRows.filter(r => r[weekIdx] === selectedWeek);
        // console.log("🔍 [FILTER WEEK] Total data rows:", dataRows.length);
        // console.log("🔍 [FILTER WEEK] Matching rows for week", selectedWeek, ":", matchingRows.length);
        // console.log("🔍 [FILTER WEEK] Sample week values:", dataRows.slice(0, 5).map(r => r[weekIdx]));
        
        filteredMatrix = [headers, ...matchingRows];
        // console.log("🔍 [FILTER WEEK] Filtered matrix length:", filteredMatrix.length);
      }
    }
  }

  let mappedProducts = [];
  let filteredAssignments = [];
  let isolatedMappedProducts = [];

  // console.log("🔍 [FILTER VP] Current VP:", vpName);
  // console.log("🔍 [FILTER VP] Filtered matrix length before VP filter:", filteredMatrix?.length);
  
  if (filteredMatrix && filteredMatrix.length !== 0 && !isNaN(filteredMatrix.length)) {
    if (vpName !== "All") {
      const assignmentsPerVP = JSON.parse(localStorage.getItem("assignments")) || [];
      // console.log("🔍 [FILTER VP] Assignments from localStorage:", assignmentsPerVP.length);
      
      filteredAssignments = assignmentsPerVP.filter(row => row[2] === vpName);
      console.log("🔍 [FILTER VP] Filtered assignments for VP:", filteredAssignments.length);
      console.log("🔍 [FILTER VP] VP Assignments:", filteredAssignments);
      
      mappedProducts = filteredAssignments.map(r => r[0]);
      isolatedMappedProducts = mappedProducts;
      console.log("🔍 [FILTER VP] Mapped products for VP:", mappedProducts);
      
      const headers = filteredMatrix[0];
      const productIdx = headers.indexOf("product");
      console.log("🔍 [FILTER VP] Product column index:", productIdx);
      console.log("🔍 [FILTER VP] Headers:", headers);
      
      if (productIdx !== -1 && mappedProducts.length > 0) {
        const beforeVPFilter = filteredMatrix.length;
        console.log("🔍 [FILTER VP] Before filter - All products in matrix:", [...new Set(filteredMatrix.slice(1).map(line => line[productIdx]))]);
        filteredMatrix = [headers, ...filteredMatrix.slice(1).filter(line => mappedProducts.includes(line[productIdx]))];
        console.log("🔍 [FILTER VP] Rows before VP filter:", beforeVPFilter, "after:", filteredMatrix.length);
        console.log("🔍 [FILTER VP] After filter - Products in matrix:", [...new Set(filteredMatrix.slice(1).map(line => line[productIdx]))]);
      } else {
        console.log("⚠️ [FILTER VP] No mapped products found or product column missing");
        console.log("⚠️ [FILTER VP] productIdx:", productIdx, "mappedProducts.length:", mappedProducts.length);
      }
    } else {
      console.log("✅ [FILTER VP] VP is 'All', no filtering applied");
    }
  }

  dataMatrix = filteredMatrix;
  
  // Calculate total tickets AFTER VP filtering
  if (Array.isArray(filteredMatrix) && filteredMatrix.length > 1) {
    const headers = filteredMatrix[0];
    const ticketsIdx = headers.indexOf("all_tickets");
    if (ticketsIdx !== -1) {
      const totalAfterVPFilter = filteredMatrix.slice(1).reduce((sum, r) => sum + (parseInt(r[ticketsIdx]) || 0), 0);
      console.log("🎯 [AFTER VP FILTER] Total tickets after VP filtering:", totalAfterVPFilter);
      console.log("🎯 [AFTER VP FILTER] Number of rows:", filteredMatrix.length - 1);
    }
  }
  
  let currentPath = window.location.pathname;
  currentPath = currentPath.replace(/\/passive/, '');

  const safeDataMatrix = Array.isArray(dataMatrix) ? dataMatrix : [];

  const rowsScoped = useMemo(() => {
    try { 
      const rows = matrixToRows(safeDataMatrix);
      // console.log("🔍 [ROWS SCOPED] Total rows after matrixToRows:", rows.length);
      // console.log("🔍 [ROWS SCOPED] Sample row:", rows[0]);
      return rows;
    } catch (e) { 
      console.error("❌ [ROWS SCOPED] Error:", e); 
      return []; 
    }
  }, [safeDataMatrix]);

  const rowsForCards = useMemo(() => {
    try { 
      // console.log("🔍 [ROWS FOR CARDS] Input rowsScoped length:", rowsScoped.length);
      // console.log("🔍 [ROWS FOR CARDS] BU filter:", bu_subset, "Product filter:", productChosen);
      // console.log("🔍 [ROWS FOR CARDS] Sample input rows (first 3):", rowsScoped.slice(0, 3));
      
      const rows = scopeRows(rowsScoped, { bu: bu_subset, product: productChosen });
      
      // console.log("🔍 [ROWS FOR CARDS] Total rows after scoping:", rows.length);
      // console.log("🔍 [ROWS FOR CARDS] Sample output row:", rows[0]);
      
      if (rows.length === 0 && rowsScoped.length > 0) {
        console.error("❌ [ROWS FOR CARDS] All rows were filtered out!");
        console.error("❌ [ROWS FOR CARDS] Check if bu_subset/productChosen match the data");
        console.error("❌ [ROWS FOR CARDS] Available BUs in data:", [...new Set(rowsScoped.map(r => r.bu))]);
        console.error("❌ [ROWS FOR CARDS] Available Products in data:", [...new Set(rowsScoped.map(r => r.product))].slice(0, 10));
      }
      
      return rows;
    }
    catch (e) { 
      console.error("❌ [ROWS FOR CARDS] Error:", e); 
      return []; 
    }
  }, [rowsScoped, bu_subset, productChosen]);

  const agg = useMemo(() => {
    try { 
      const aggregated = buildAgg(rowsForCards);
      console.log("🔍 [AGGREGATION] Rows used for aggregation:", rowsForCards.length);
      console.log("🔍 [AGGREGATION] Total tickets:", aggregated.total);
      console.log("🔍 [AGGREGATION] Automated tickets:", aggregated.automated_tickets);
      console.log("🔍 [AGGREGATION] Automation %:", aggregated.pct_automation);
      console.log("🔍 [AGGREGATION] VoiceBot Success:", aggregated.voicebot_success);
      console.log("🔍 [AGGREGATION] VoiceBot Failure:", aggregated.voicebot_failure);
      console.log("🔍 [AGGREGATION] Full agg object:", aggregated);
      
      // DEBUG: Find crossover_hiring rows
      const hiringRows = rowsForCards.filter(r => r.product === 'crossover_hiring');
      if (hiringRows.length > 0) {
        console.log("🚨 [DEBUG CROSSOVER_HIRING] Found", hiringRows.length, "row(s):");
        hiringRows.forEach((row, i) => {
          console.log(`  Row ${i + 1}:`, {
            bu: row.bu,
            product: row.product,
            week: row.week,
            all_tickets: row.all_tickets,
            automated_tickets: row.automated_tickets
          });
        });
        const hiringTotal = hiringRows.reduce((sum, r) => sum + (r.all_tickets || 0), 0);
        console.log("🚨 [DEBUG CROSSOVER_HIRING] Total tickets:", hiringTotal);
      }
      
      // Sample first 3 rows for debugging
      if (rowsForCards.length > 0) {
        console.log("🔍 [AGGREGATION] Sample rows (first 3):");
        rowsForCards.slice(0, 3).forEach((row, i) => {
          console.log(`  Row ${i}:`, {
            bu: row.bu,
            product: row.product,
            week: row.week,
            voicebot_success: row.voicebot_success,
            voicebot_failure: row.voicebot_failure,
            all_tickets: row.all_tickets
          });
        });
      }
      
      return aggregated;
    } catch (e) { 
      console.error("❌ [AGGREGATION] Error:", e); 
      return buildAgg([]); 
    }
  }, [rowsForCards]);

  const fullMatrixLS = useMemo(() => {
    // Re-read localStorage when dataMatrix changes (after fetch) or when reload is requested
    try { 
      const raw = localStorage.getItem("automations-history-data");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { console.error(e); return []; }
  }, [dataMatrix, reloadKey]);

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
      // console.log("🔍 [TOP PRODUCTS BY FAILURES] BU filter:", bu_subset, "Results:", arr.length);
      // console.log("🔍 [TOP PRODUCTS BY FAILURES] Data:", arr);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error("❌ [TOP PRODUCTS BY FAILURES] Error:", e);
      return [];
    }
  }, [safeDataMatrix, bu_subset]);

  const {
    vfTotal, vbTotal, icTotal, atTotal, ccTotal,
    vfPct,   vbPct,   icPct,   atPct,   ccPct
  } = useMemo(() => {
    const vfTotal = (agg.voiceflow_success || 0) + (agg.voiceflow_failure || 0);
    const vbTotal = (agg.voicebot_success  || 0) + (agg.voicebot_failure  || 0);
    const icTotal = (agg.intent_capture_success || 0) + (agg.intent_capture_failure || 0);
    const atTotal = (agg.athena_success || 0) + (agg.athena_failure || 0);
    const ccTotal = (agg.cc_success || 0) + (agg.cc_failure || 0);

    const vfPct = vfTotal > 0 ? agg.voiceflow_success / vfTotal : 0;
    const vbPct = vbTotal > 0 ? agg.voicebot_success  / vbTotal : 0;
    const icPct = icTotal > 0 ? agg.intent_capture_success / icTotal : 0;
    const atPct = atTotal > 0 ? agg.athena_success / atTotal : 0;
    const ccPct = ccTotal > 0 ? agg.cc_success / ccTotal : 0;

    console.log("🤖 [VOICEBOT STATS DEBUG]");
    console.log("  agg object:", agg);
    console.log("  voicebot_success:", agg.voicebot_success);
    console.log("  voicebot_failure:", agg.voicebot_failure);
    console.log("  vbTotal:", vbTotal);
    console.log("  vbPct:", vbPct);

    return { vfTotal, vbTotal, icTotal, atTotal, ccTotal, vfPct, vbPct, icPct, atPct, ccPct };
  }, [agg]);

  const vfVbCcBarsForBar = useMemo(() => ([
    { dates:"Voiceflow",       Success: agg.voiceflow_success||0, Failure: agg.voiceflow_failure||0 },
    { dates:"Voicebot",        Success: agg.voicebot_success||0,  Failure: agg.voicebot_failure||0  },
    { dates:"Call Classifier", Success: agg.cc_success||0,        Failure: agg.cc_failure||0        },
  ]), [agg]);

  const topBUForBar = useMemo(() => (
    (topBU||[]).map(x => ({ dates: x.bu, ["Automation %"]: x.Pct }))
  ), [topBU]);

  const topProdForBar = useMemo(() => (
    (topProd||[]).map(x => ({ dates: getProductRealName(x.product), Failures: x.Failures }))
  ), [topProd]);

  // NEW: worst products by automation %
  const worstProducts = useMemo(() => {
    try { 
      const result = bottomProductsByAutomation(safeDataMatrix, { bu: bu_subset, limit: 10 });
      // console.log("🔍 [WORST PRODUCTS BY AUTOMATION] BU filter:", bu_subset, "Results:", result.length);
      // console.log("🔍 [WORST PRODUCTS BY AUTOMATION] Data:", result);
      return result;
    }
    catch (e) { 
      console.error("❌ [WORST PRODUCTS BY AUTOMATION] Error:", e);
      return []; 
    }
  }, [safeDataMatrix, bu_subset]);

  const worstProdForBar = useMemo(() =>
    (worstProducts || []).map(x => ({ dates: getProductRealName(x.product), ["Automation %"]: x.pct }))
  , [worstProducts]);

  const hasMatrix = Array.isArray(safeDataMatrix) && safeDataMatrix.length > 1;
  const hasTrendTickets = Array.isArray(trends.tickets) && trends.tickets.length > 0 && Array.isArray(trends.tickets[0].data) && trends.tickets[0].data.length > 0;
  const hasTrendAutomation = Array.isArray(trends.automationRate) && trends.automationRate.length > 0 && Array.isArray(trends.automationRate[0].data) && trends.automationRate[0].data.length > 0;
  const hasWorstProd = Array.isArray(worstProdForBar) && worstProdForBar.length > 0;
  const hasTopBU = Array.isArray(topBUForBar) && topBUForBar.length > 0;
  const hasTopProd = Array.isArray(topProdForBar) && topProdForBar.length > 0;

  return (
    <Box m={isPortraitMobile ? "10px" : "20px"}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexDirection="column">
        <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
          <Header 
            title={`Central Support: Automations through the weeks ( ${vpName === "All" ? "All VPs" : vpName} )`} 
            subtitle={`${bu_subset === "All" ? "All" : bu_subset} statistics for ${vpName === "All" ? "All VPs" : vpName}`} 
          />
        </Box>
        <Box 
          width="100%" 
          mt={2} 
          mb={2}
          sx={isPortraitMobile ? {
            overflowX: "auto",
            overflowY: "hidden",
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: colors.primary[300],
              borderRadius: '3px',
            },
          } : undefined}
        >
          <Selector
            options={weekOptions}
            value={selectedWeek}
            initialIndex={0}
            onChange={(val) => setSelectedWeek(val)}
          />
        </Box>
      </Box>

      <Box 
        display="grid" 
        gridTemplateColumns={isPortraitMobile ? "repeat(3, 1fr)" : `repeat(${fullGridSize}, 1fr)`} 
        gridAutoRows={isPortraitMobile ? "auto" : "100px"} 
        gap="10px"
      >

        {/* ROW 0 */}
        <Box 
          gridColumn={isPortraitMobile ? "span 3" : `span ${60}`} 
          gridRow={isPortraitMobile ? "auto" : `span ${2}`} 
          backgroundColor={colors.primary[400]} 
          display="flex" 
          flexDirection={isPortraitMobile ? "column" : undefined}
          alignItems="center" 
          justifyContent={isPortraitMobile ? "flex-start" : "center"}
          position="relative"
          minHeight={isPortraitMobile ? "300px" : undefined}
          padding={isPortraitMobile ? "10px" : undefined}
          borderRadius={isPortraitMobile ? "12px" : undefined}
          order={isPortraitMobile ? 10 : undefined}
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box 
            position={isPortraitMobile ? "relative" : "absolute"} 
            top={10} 
            left={10} 
            padding="10px"
            width={isPortraitMobile ? "100%" : undefined}
          >
            <Typography display="flex" variant={isPortraitMobile ? "h3" : "h2"} fontWeight="600">
              <AssessmentIcon sx={{ color: colors.primary[100], fontSize: isPortraitMobile ? "22px" : "26px", marginRight: "8px" }} />
              12-weeks Trend: Tickets
            </Typography>
            <Typography variant={isPortraitMobile ? "h6" : "h5"} sx={{ color: colors.primary[100] }}>
               
            </Typography>
          </Box>
          <Box 
            sx={{ 
              width: '100%', 
              height: isPortraitMobile ? '200px' : '100%',
              marginTop: isPortraitMobile ? '10px' : undefined,
              flexGrow: isPortraitMobile ? 1 : undefined
            }}
          >
            {hasTrendTickets ? <LineChart dataArray={trends.tickets} /> : <Box p={2}><Typography>No data</Typography></Box>}
          </Box>
        </Box>

        <Box 
          gridColumn={isPortraitMobile ? "span 3" : `span ${60}`} 
          gridRow={isPortraitMobile ? "auto" : `span ${2}`} 
          backgroundColor={colors.primary[400]} 
          display="flex" 
          flexDirection={isPortraitMobile ? "column" : undefined}
          alignItems="center" 
          justifyContent={isPortraitMobile ? "flex-start" : "center"}
          position="relative"
          minHeight={isPortraitMobile ? "300px" : undefined}
          padding={isPortraitMobile ? "10px" : undefined}
          borderRadius={isPortraitMobile ? "12px" : undefined}
          order={isPortraitMobile ? 11 : undefined}
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box 
            position={isPortraitMobile ? "relative" : "absolute"} 
            top={10} 
            left={10} 
            padding="10px"
            width={isPortraitMobile ? "100%" : undefined}
          >
            <Typography display="flex" variant={isPortraitMobile ? "h3" : "h2"} fontWeight="600">
              <AssessmentIcon sx={{ color: colors.primary[100], fontSize: isPortraitMobile ? "22px" : "26px", marginRight: "8px" }} />
              12-weeks Trend: Automation %
            </Typography>
            <Typography variant={isPortraitMobile ? "h6" : "h5"} sx={{ color: colors.primary[100] }}>
               
            </Typography>
          </Box>
          <Box 
            sx={{ 
              width: '100%', 
              height: isPortraitMobile ? '200px' : '100%',
              marginTop: isPortraitMobile ? '10px' : undefined,
              flexGrow: isPortraitMobile ? 1 : undefined
            }}
          >
            {hasTrendAutomation ? <LineChart dataArray={trends.automationRate} /> : <Box p={2}><Typography>No data</Typography></Box>}
          </Box>
        </Box>

        {/* LEFT PANEL */}
        <Box 
          gridColumn={isPortraitMobile ? "span 3" : `span ${20}`} 
          gridRow={isPortraitMobile ? "auto" : `span ${8}`} 
          backgroundColor={colors.primary[400]} 
          overflow="auto"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "200px" : undefined}
          order={isPortraitMobile ? 12 : undefined}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" borderBottom={`4px solid ${colors.primary[500]}`} colors={colors.grey[100]} p="15px">
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              {`Statistics for ${bu_subset} ${(productChosen === "All") ? (bu_subset === "All" ? `BUs` : `Products`) : (bu_subset === "All" ? `BUs` : `Products (${getProductRealName(productChosen)})`)}`}
            </Typography>
          </Box>

          {(() => {
            console.log("\n=== LEFT PANEL DEBUG ===");
            console.log("bu_subset:", bu_subset);
            console.log("productChosen:", productChosen);
            console.log("safeDataMatrix length:", safeDataMatrix?.length);
            console.log("isolatedMappedProducts length:", isolatedMappedProducts?.length);
            
            if (!safeDataMatrix || safeDataMatrix.length === 0) {
              console.log("❌ No safeDataMatrix");
              return <Box p={2}><Typography>No data available</Typography></Box>;
            }

            if (bu_subset === "All") {
              console.log("📊 Showing all BUs");
              const filtered = safeDataMatrix.filter(row => 
                row[0] && 
                row[0] !== "bu" && 
                row[0] !== "Totals" && 
                row[0] !== "" &&
                row[0].trim() !== ""
              );
              console.log("Filtered rows (BUs):", filtered.length);
              console.log("Sample BU rows:", filtered.slice(0, 3).map(r => ({ bu: r[0], product: r[1] })));

              if (productChosen === "All") {
                const busMap = Object.entries(
                  filtered.reduce((acc, row) => {
                    const bu = row[0]; 
                    if (bu && bu.trim() !== "") {
                      if (!acc[bu]) acc[bu] = [{}];
                    }
                    return acc;
                  }, {})
                ).sort(([buA], [buB]) => buA.localeCompare(buB));

                console.log("Total unique BUs:", busMap.length);
                console.log("BUs list:", busMap.map(([bu]) => bu));

                return busMap.map(([bu], i) => (
                  <Box
                    key={`${bu}-${i}`}
                    borderBottom={`4px solid ${colors.primary[500]}`}
                    p="15px"
                    onClick={() => { 
                      let cleanedPath = `${currentPath}/${bu.toLowerCase().replace('/', '-').replace(' ', '')}`;
                      navigate(cleanedPath);
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">
                      {`${bu}`}
                    </Typography>
                    <Box display="flex" justifyContent="space-between"></Box>
                  </Box>
                ));
              } else {
                // Same as above but when productChosen is selected
                const filteredForProduct = safeDataMatrix.filter(row => 
                  row[0] && 
                  row[0] !== "bu" && 
                  row[0] !== "Totals" && 
                  row[0] !== "" &&
                  row[0].trim() !== ""
                );
                
                const busMap = Object.entries(
                  filteredForProduct.reduce((acc, row) => {
                    const bu = row[0]; 
                    if (bu && bu.trim() !== "") {
                      if (!acc[bu]) acc[bu] = [{}];
                    }
                    return acc;
                  }, {})
                ).sort(([buA], [buB]) => buA.localeCompare(buB));

                return busMap.map(([bu], i) => (
                  <Box
                    key={`${bu}-${i}`}
                    borderBottom={`4px solid ${colors.primary[500]}`}
                    p="15px"
                    onClick={() => { 
                      let cleanedPath = `${currentPath}/${bu.toLowerCase().replace('/', '-').replace(' ', '')}`;
                      navigate(cleanedPath);
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">
                      {`${bu}`}
                    </Typography>
                    <Box display="flex" justifyContent="space-between"></Box>
                  </Box>
                ));
              }
            } else {
              console.log("\n🏢 Showing products for specific BU:", bu_subset);
              console.log("🔍 All BUs in safeDataMatrix:", [...new Set(safeDataMatrix.map(r => r[0]).filter(b => b && b !== 'bu'))]);
              
              if (productChosen === "All") {
                console.log("🔍 Filtering for BU:", bu_subset);
                console.log("🔍 First 5 rows of safeDataMatrix:");
                safeDataMatrix.slice(0, 5).forEach((row, i) => {
                  console.log(`  Row ${i}: bu='${row[0]}' (match: ${row[0] === bu_subset}), product='${row[1]}', col2='${row[2]}'`);
                });
                
                const step1 = safeDataMatrix.filter(row => 
                  row[0] === bu_subset && 
                  row[2] !== "Totals" &&
                  row[1] && 
                  row[1] !== "" && 
                  row[1].trim() !== ""
                );
                console.log("Step 1 - Filtered by BU:", step1.length, "rows");
                console.log("Sample rows after BU filter:", step1.slice(0, 3).map(r => ({ bu: r[0], product: r[1], col2: r[2] })));
                
                // NOTE: We don't apply VP filter here because safeDataMatrix already comes filtered by VP
                // If you still need to filter by VP, uncomment the following line:
                // const step2 = step1.filter(row => (isolatedMappedProducts.length > 0) ? isolatedMappedProducts.includes(row[1]) : true);
                const step2 = step1; // Data already comes filtered by VP in lines 367-389
                console.log("Step 2 - After VP filter (skipped, already filtered):", step2.length, "rows");
                console.log("Sample rows after VP filter:", step2.slice(0, 3).map(r => ({ product: r[1] })));
                
                const products = [...new Set(step2.map(row => row[1]))].filter(p => p && p !== "" && p.trim() !== "");
                console.log("Step 3 - Unique products:", products.length);
                console.log("Products list:", products);

                if (products.length === 0) {
                  console.log("❌ No products found!");
                  return <Box p={2}><Typography>No products found for {bu_subset}</Typography></Box>;
                }

                return products.map((productName, i) => (
                  <Box
                    key={`${productName}-${i}`}
                    borderBottom={`4px solid ${colors.primary[500]}`}
                    p="15px"
                    onClick={() => { 
                      let cleanedPath = `${currentPath}/${productName.toLowerCase().replace('/', '-').replace(' ', '')}`;
                      navigate(cleanedPath);
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">
                      {getProductRealName(productName)} 
                    </Typography>
                  </Box>
                ));
              } else {
                console.log("📦 Showing specific product:", productChosen);
                const filtered = [...new Set(safeDataMatrix
                  .filter(row => row[0] === bu_subset && row[1] === productChosen)
                  .map(row => row[1]))];
                
                console.log("Filtered products:", filtered);

                return filtered.map((productName, i) => (
                  <Box
                    key={`${productName}-${i}`}
                    borderBottom={`4px solid ${colors.primary[500]}`}
                    p="15px"
                  >
                    <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">
                      {getProductRealName(productName)} 
                    </Typography>
                  </Box>
                ));
              }
            }
          })()}
        </Box>

        {/* ROW 1 */}
        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${33}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "120px" : undefined}
          order={isPortraitMobile ? 1 : undefined}
        >
          <StatBoxSpecial
            title="Total Tickets"
            subtitle={` ${selectedWeek ? `${formatWeekLabel(selectedWeek)}` : ""}`}
            icon={<ConfirmationNumberRoundedIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}}/>}
            rightValue = {`${agg.total} Tickets`}
            rightCaption = ""
            rightSize = {`25px`}
            rightColor = {colors.primary[100]}
          />
        </Box>

        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${33}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "120px" : undefined}
          order={isPortraitMobile ? 2 : undefined}
        >
          <StatBox
            title={`Automation %`}
            subtitle={` ${selectedWeek ? `${formatWeekLabel(selectedWeek)}` : ""}`}
            progress={agg.pct_automation}
            increase={`Success: ${(agg.pct_automation * 100).toFixed(1)}% (${(agg.automated_tickets || 0).toLocaleString()} tickets)`}
            icon={<BuildCircleIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
            redflag = {false}
          />
        </Box>

        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${34}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "120px" : undefined}
          order={isPortraitMobile ? 3 : undefined}
        >
          <StatBox
            title={`Cu-Chulainn Stats`}
            subtitle={`${ccTotal} tickets`}
            progress={ccPct}
            increase={`Success: ${(ccPct * 100).toFixed(2)}% (${agg.cc_success} tickets)`}
            icon={<ForumIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
            redflag = {true}
          />
        </Box>

        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${25}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "120px" : undefined}
          order={isPortraitMobile ? 5 : undefined}
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
          gridColumn={isPortraitMobile ? "span 1" : `span ${25}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "120px" : undefined}
          order={isPortraitMobile ? 6 : undefined}
        >
          <StatBox
            title={`VoiceBot Stats`}
            subtitle={`${vbTotal} tickets`}
            progress={vbPct}
            increase={`Success: ${(vbPct * 100).toFixed(2)}% (${agg.voicebot_success} tickets)`}
            icon={<CallIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
            redflag = {true}
          />
        </Box>

        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${25}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "120px" : undefined}
          order={isPortraitMobile ? 7 : undefined}
        >
          <StatBox
            title={`Intent Capture Stats`}
            subtitle={`${icTotal} tickets`}
            progress={icPct}
            increase={`Success: ${(vbPct * 100).toFixed(2)}% (${agg.intent_capture_success} tickets)`}
            icon={<ConnectWithoutContactIcon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
            redflag = {true}
          />
        </Box>

        <Box
          gridColumn={isPortraitMobile ? "span 1" : `span ${25}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "120px" : undefined}
          order={isPortraitMobile ? 8 : undefined}
        >
          <StatBox
            title={`Atlas (Athena) Stats`}
            subtitle={`${atTotal} tickets`}
            progress={atPct}
            increase={`Success: ${(atPct * 100).toFixed(2)}% (${agg.athena_success} tickets)`}
            icon={<Face3Icon sx={{ color: colors.greenAccent[300], fontSize: "25px"}} />}
            redflag = {true}
          />
        </Box>

        {/* ROW 2 */}
        <Box 
          gridColumn={isPortraitMobile ? "span 3" : `span ${100}`} 
          gridRow={isPortraitMobile ? "auto" : `span ${row2Tile1SizeVertical}`} 
          backgroundColor={colors.primary[400]} 
          display="flex" 
          flexDirection={isPortraitMobile ? "column" : undefined}
          alignItems="center" 
          justifyContent={isPortraitMobile ? "flex-start" : "center"}
          position="relative"
          minHeight={isPortraitMobile ? "350px" : undefined}
          padding={isPortraitMobile ? "10px" : undefined}
          borderRadius={isPortraitMobile ? "12px" : undefined}
          order={isPortraitMobile ? 13 : undefined}
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box 
            position={isPortraitMobile ? "relative" : "absolute"} 
            top={10} 
            left={10} 
            padding="10px"
            width={isPortraitMobile ? "100%" : undefined}
          >
            <Typography display="flex" variant={isPortraitMobile ? "h3" : "h2"} fontWeight="600">
              <ConfirmationNumberRoundedIcon sx={{ color: colors.primary[100], fontSize: isPortraitMobile ? "22px" : "26px", marginRight: "8px" }} />
              {`Top 10 Products by Lowest Automation %`}
              {` ${bu_subset !== "All" ? `(${bu_subset})` : ""}`}
              {` ${selectedWeek ? `(${formatWeekLabel(selectedWeek)})` : ""}`}
              {` ${vpName && vpName !== "All" ? `[ ${vpName.split(" ")[0].substring(0, 1)}. ${vpName.split(" ")[1]} ]` : ""}`}
            </Typography>
            <Typography variant={isPortraitMobile ? "h6" : "h5"} sx={{ color: colors.primary[100] }}>
            </Typography>
          </Box>
          <Box 
            sx={{ 
              width: '100%', 
              height: isPortraitMobile ? '250px' : '100%',
              marginTop: isPortraitMobile ? '60px' : undefined,
              flexGrow: isPortraitMobile ? 1 : undefined
            }}
          >
            {hasWorstProd ? ( <BarChart dataArray={worstProdForBar} keys={["Automation %"]} /> ) : <Box p={2}><Typography>No data</Typography></Box>}
          </Box>
        </Box>

        <Box 
          gridColumn={isPortraitMobile ? "span 3" : `span ${100}`} 
          gridRow={isPortraitMobile ? "auto" : `span ${row2Tile1SizeVertical}`} 
          backgroundColor={colors.primary[400]} 
          display="flex" 
          flexDirection={isPortraitMobile ? "column" : undefined}
          alignItems="center" 
          justifyContent={isPortraitMobile ? "flex-start" : "center"}
          position="relative"
          minHeight={isPortraitMobile ? "350px" : undefined}
          padding={isPortraitMobile ? "10px" : undefined}
          borderRadius={isPortraitMobile ? "12px" : undefined}
          order={isPortraitMobile ? 14 : undefined}
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box 
            position={isPortraitMobile ? "relative" : "absolute"} 
            top={10} 
            left={10} 
            padding="10px"
            width={isPortraitMobile ? "100%" : undefined}
          >
            <Typography display="flex" variant={isPortraitMobile ? "h3" : "h2"} fontWeight="600">
              <ConfirmationNumberRoundedIcon sx={{ color: colors.primary[100], fontSize: isPortraitMobile ? "22px" : "26px", marginRight: "8px" }} />
              {`Top 10 Products by Failures`}
              {` ${bu_subset !== "All" ? `(${bu_subset})` : ""}`}
              {` ${selectedWeek ? `(${formatWeekLabel(selectedWeek)})` : ""}`}
              {` ${vpName && vpName !== "All" ? `[ ${vpName.split(" ")[0].substring(0, 1)}. ${vpName.split(" ")[1]} ]` : ""}`}
            </Typography>
            <Typography variant={isPortraitMobile ? "h6" : "h5"} sx={{ color: colors.primary[100] }}>
            </Typography>
          </Box>
          <Box 
            sx={{ 
              width: '100%', 
              height: isPortraitMobile ? '250px' : '100%',
              marginTop: isPortraitMobile ? '60px' : undefined,
              flexGrow: isPortraitMobile ? 1 : undefined
            }}
          >
            {hasTopProd ? ( <BarChart dataArray={topProdForBar} keys={["Failures"]} /> ) : <Box p={2}><Typography>No data</Typography></Box>}
          </Box>
        </Box>

      </Box>
    </Box>
  );
};

export default DashboardAutomations;
