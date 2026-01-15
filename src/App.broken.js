import React, { useEffect, useState, useMemo } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, Box } from "@mui/material";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Login from "./scenes/login";
import DashboardPassive from "./scenes/dashboardpassive";
import DashboardHistory from "./scenes/dashboardhistory";
import DashboardAutomations from "./scenes/dashboardautomations";
import DataMatrix from "./scenes/datamatrix";
import CreateUserForm from "./scenes/createuser";
import AssignProducts from "./scenes/assignproducts";
import UserProducts from "./scenes/userproducts";
import EscalationsReport from "./scenes/escalationsreport";
import CustomReport from "./scenes/customreport";
import CSVDownloads from "./scenes/csvdownloads";
import CallsStatistics from "./scenes/callsstatistics";
import { PeriodProvider } from "./context/PeriodContext";
import { performGetTotalsAll, performGetHistory, performGetAutomations, fetchAssignments, fetchUsers } from "./data/fetchData";
import { ReloadProvider } from "./context/ReloadContext";
import process from 'process';

window.process = process;

const CLIENT_ID = "683916915036-9j70gp68v7asifbll12bh5dt690cbc52.apps.googleusercontent.com";
const SHEET_IDS = [
  "1j1SCJrBrYb8Dx5l6QkMB9SX7WMkV_ZzSZOCxs3Tm6Os",
  "1zUZJJsqkKfs9Fu4gx5tOW9m216Kft5ucdoutcY02LEM",
  "1I5cdCL3k_h25DGzySpkQQuqsn0Rbuv-KafEEtVCgj3E",
];

const GLOBAL_SETTINGS = {
  SHEET_KEY: 'AIzaSyCO8yb8FFHwAbaJR6YmfQXKgZxkGEQjk5A',
  SHEET_API_URL: `sheets.googleapis.com/v4/spreadsheets`,
  SHEET_RANGE: `A1:Z`,
};

function clearLocalStorageOnRefresh() {
  window.addEventListener('beforeunload', () => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== 'user_info' && key !== 'token_for_backend') {
        localStorage.removeItem(key);
        i--;
      }
    }
  });
}

// --- Data Fetchers ---
const fetchData = async () => {
  const promises = SHEET_IDS.map(sheet => {
    const settings = { ...GLOBAL_SETTINGS, SHEET_ID: sheet };
    return performGetTotalsAll(settings);
  });
  await Promise.all(promises);
};

const fetchHistoryData = async () => {
  const promises = SHEET_IDS.map(sheet => {
    const settings = { ...GLOBAL_SETTINGS, SHEET_ID: sheet };
    return performGetHistory(settings);
  });
  await Promise.all(promises);
};

const fetchAutomationsData = async () => {
  const promises = SHEET_IDS.map(sheet => {
    const settings = { ...GLOBAL_SETTINGS, SHEET_ID: sheet };
    return performGetAutomations(settings);
  });
  await Promise.all(promises);
};

// --- Polling for Data ---
const pollForData = (setRoutesConfig) => {
  const buProductData = JSON.parse(localStorage.getItem('bu-product'));
  const currentVp = localStorage.getItem("current-vp")?.toLowerCase().replace(/\s+/g, '') || 'all';

  if (buProductData) {
    const buProductRoutes = buProductData.flatMap(row => {
      const bu = row[0];
      const product = row[1];
      const basePath = currentVp === 'all'
        ? `/dashboard/${bu.toLowerCase().replace(/\s+/g, '')}`
        : `/dashboard/${currentVp}/${bu.toLowerCase().replace(/\s+/g, '')}`;
      const productPath = `${basePath}/${product.toLowerCase().replace(/\s+/g, '_')}`;
      const buRoute = { path: basePath, element: <DashboardPassive bu_subset={bu} vpName={currentVp === 'all' ? undefined : currentVp} /> };
      const productRoute = { path: productPath, element: <DataMatrix product={product} /> };
      return [buRoute, productRoute];
    });
    setRoutesConfig(buProductRoutes);
    console.log("Dashboard routes:", buProductRoutes.map(r => r.path));
  } else {
    setTimeout(() => pollForData(setRoutesConfig), 100);
  }
};

const pollForHistoryData = (setRoutesHistoryConfig) => {
  const buProductHistoryData = JSON.parse(localStorage.getItem('bu-product-history'));
  const currentVp = localStorage.getItem("current-vp")?.toLowerCase().replace(/\s+/g, '') || 'all';

  if (buProductHistoryData) {
    const buProductRoutes = buProductHistoryData.flatMap(row => {
      const bu = row[0];
      const product = row[1];
      const basePath = currentVp === 'all'
        ? `/history/${bu.toLowerCase().replace(/\s+/g, '')}`
        : `/history/${currentVp}/${bu.toLowerCase().replace(/\s+/g, '')}`;
      const productPath = `${basePath}/${product.toLowerCase().replace(/\s+/g, '_')}`;
      const buRoute = { path: basePath, element: <DashboardHistory bu_subset={bu} vpName={currentVp === 'all' ? undefined : currentVp} /> };
      const productRoute = { path: productPath, element: <DashboardHistory bu_subset={bu} vpName={currentVp === 'all' ? undefined : currentVp} productChosen={product} /> };
      return [buRoute, productRoute];
    });
    setRoutesHistoryConfig(buProductRoutes);
    console.log("History routes:", buProductRoutes.map(r => r.path));
  } else {
    setTimeout(() => pollForHistoryData(setRoutesHistoryConfig), 100);
  }
};

const pollForAutomationsData = (setRoutesAutomationsConfig) => {
  const buProductAutomationsData = JSON.parse(localStorage.getItem('bu-product-automations'));
  const currentVp = localStorage.getItem("current-vp")?.toLowerCase().replace(/\s+/g, '') || 'all';

  if (buProductAutomationsData) {
    const buProductRoutes = buProductAutomationsData.flatMap(row => {
      const bu = row[0];
      const product = row[1];
      const basePath = currentVp === 'all'
        ? `/automations/${bu.toLowerCase().replace(/\s+/g, '')}`
        : `/automations/${currentVp}/${bu.toLowerCase().replace(/\s+/g, '')}`;
      const productPath = `${basePath}/${product.toLowerCase().replace(/\s+/g, '_')}`;
      const buRoute = { path: basePath, element: <DashboardAutomations bu_subset={bu} vpName={currentVp === 'all' ? undefined : currentVp} /> };
      const productRoute = { path: productPath, element: <DashboardAutomations bu_subset={bu} vpName={currentVp === 'all' ? undefined : currentVp} productChosen={product} /> };
      return [buRoute, productRoute];
    });
    setRoutesAutomationsConfig(buProductRoutes);
    console.log("Automations routes:", buProductRoutes.map(r => r.path));
  } else {
    setTimeout(() => pollForAutomationsData(setRoutesAutomationsConfig), 100);
  }
};

const fetchAndSetRoutes = async (setRoutesConfig, setRoutesHistoryConfig, setRoutesAutomationsConfig) => {
  await fetchData();
  await fetchHistoryData();
  await fetchAutomationsData();
  pollForData(setRoutesConfig);
  pollForHistoryData(setRoutesHistoryConfig);
  pollForAutomationsData(setRoutesAutomationsConfig);
};

// --- VP Dynamic Routes ---
async function fetchVPRoutes(setVpRoutesConfig) {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  let allUsers = [];
  do {
    allUsers = JSON.parse(localStorage.getItem("all-users"));
    if (!allUsers || allUsers.length === 0) {
      await delay(500);
    }
  } while (!allUsers || allUsers.length === 0);

  const vps = allUsers.filter(user => user[5]?.includes("Vice President"));
  const vpRoutes = [];

  for (const vp of vps) {
    const vpPath = `/dashboard/${(vp[0] + vp[1]).toLowerCase().replace(/\s+/g, '')}`;
    let buProductData = [];
    do {
      buProductData = JSON.parse(localStorage.getItem('bu-product')) || [];
      if (buProductData.length === 0) {
        await delay(500);
      }
    } while (buProductData.length === 0);

    vpRoutes.push({ path: vpPath, element: <DashboardPassive vpName={`${vp[0]} ${vp[1]}`} /> });

    buProductData.forEach(row => {
      const bu = row[0];
      const product = row[1];
      const buPath = `${vpPath}/${bu.toLowerCase().replace(/\s+/g, '')}`;
      const productPath = `${buPath}/${product.toLowerCase().replace(/\s+/g, '_')}`;
      vpRoutes.push({ path: buPath, element: <DashboardPassive bu_subset={bu} vpName={`${vp[0]} ${vp[1]}`} /> });
      vpRoutes.push({ path: productPath, element: <DataMatrix product={product} /> });
    });
  }

  setVpRoutesConfig(vpRoutes);
  console.log("VP Dashboard routes:", vpRoutes.map(r => r.path));
}

async function fetchVPHistoryRoutes(setVpHistoryRoutesConfig) {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  let allUsers = [];
  do {
    allUsers = JSON.parse(localStorage.getItem("all-users"));
    if (!allUsers || allUsers.length === 0) {
      await delay(500);
    }
  } while (!allUsers || allUsers.length === 0);

  const vps = allUsers.filter(user => user[5]?.includes("Vice President"));
  const vpHistoryRoutes = [];

  for (const vp of vps) {
    const vpPath = `/history/${(vp[0] + vp[1]).toLowerCase().replace(/\s+/g, '')}`;
    let buProductData = [];
    do {
      buProductData = JSON.parse(localStorage.getItem('bu-product-history')) || [];
      if (buProductData.length === 0) {
        await delay(500);
      }
    } while (buProductData.length === 0);

    vpHistoryRoutes.push({ path: vpPath, element: <DashboardHistory vpName={`${vp[0]} ${vp[1]}`} /> });

    buProductData.forEach(row => {
      const bu = row[0];
      const product = row[1];
      const buPath = `${vpPath}/${bu.toLowerCase().replace(/\s+/g, '')}`;
      const productPath = `${buPath}/${product.toLowerCase().replace(/\s+/g, '_')}`;
      vpHistoryRoutes.push({ path: buPath, element: <DashboardHistory bu_subset={bu} vpName={`${vp[0]} ${vp[1]}`} /> });
      vpHistoryRoutes.push({ path: productPath, element: <DashboardHistory bu_subset={bu} vpName={`${vp[0]} ${vp[1]}`} productChosen={product} /> });
    });
  }

  setVpHistoryRoutesConfig(vpHistoryRoutes);
  console.log("VP History routes:", vpHistoryRoutes.map(r => r.path));
}

async function fetchVPAutomationsRoutes(setVpAutomationsRoutesConfig) {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  let allUsers = [];
  do {
    allUsers = JSON.parse(localStorage.getItem("all-users"));
    if (!allUsers || allUsers.length === 0) {
      await delay(500);
    }
  } while (!allUsers || allUsers.length === 0);

  const vps = allUsers.filter(user => user[5]?.includes("Vice President"));
  const vpAutomationsRoutes = [];

  for (const vp of vps) {
    const vpPath = `/automations/${(vp[0] + vp[1]).toLowerCase().replace(/\s+/g, '')}`;
    let buProductData = [];
    do {
      buProductData = JSON.parse(localStorage.getItem('bu-product-automations')) || [];
      if (buProductData.length === 0) {
        await delay(500);
      }
    } while (buProductData.length === 0);

    vpAutomationsRoutes.push({ path: vpPath, element: <DashboardAutomations vpName={`${vp[0]} ${vp[1]}`} /> });

    buProductData.forEach(row => {
      const bu = row[0];
      const product = row[1];
      const buPath = `${vpPath}/${bu.toLowerCase().replace(/\s+/g, '')}`;
      const productPath = `${buPath}/${product.toLowerCase().replace(/\s+/g, '_')}`;
      vpAutomationsRoutes.push({ path: buPath, element: <DashboardAutomations bu_subset={bu} vpName={`${vp[0]} ${vp[1]}`} /> });
      vpAutomationsRoutes.push({ path: productPath, element: <DashboardAutomations bu_subset={bu} vpName={`${vp[0]} ${vp[1]}`} productChosen={product} /> });
    });
  }

  setVpAutomationsRoutesConfig(vpAutomationsRoutes);
  console.log("VP Automations routes:", vpAutomationsRoutes.map(r => r.path));
}

async function fetchDataAssignments() {
  try {
    const globals = {
      "SHEET_KEY": GLOBAL_SETTINGS.SHEET_KEY,
      "SHEET_API_URL": GLOBAL_SETTINGS.SHEET_API_URL,
    };
    await fetchAssignments(globals);
  } catch (error) {
    console.error("Error fetching assignments:", error);
  }
}

// --- Main App Component ---
function App() {

  const [theme, colorMode] = useMode();
  const [routesConfig, setRoutesConfig] = useState([]);
  const [routesHistoryConfig, setRoutesHistoryConfig] = useState([]);
  const [routesAutomationsConfig, setRoutesAutomationsConfig] = useState([]);
  const [vpRoutesConfig, setVpRoutesConfig] = useState([]);
  const [vpHistoryRoutesConfig, setVpHistoryRoutesConfig] = useState([]);
  const [vpAutomationsRoutesConfig, setVpAutomationsRoutesConfig] = useState([]);
  const location = useLocation();
  const isLoginRoute = location.pathname === '/login';
  const isAuthenticated = !!localStorage.getItem("user_info");

    // Debug: log start of useEffect and fetchUsers result
    useEffect(() => {
      console.log("🔍 useEffect start");
  
      fetchUsers()
        .then(() => {
          console.log("✅ fetchUsers resolved");
  
          localStorage.setItem('current-vp', 'All');
          localStorage.setItem('current-timeframe', '4 Weeks');
          fetchAndSetRoutes(setRoutesConfig, setRoutesHistoryConfig, setRoutesAutomationsConfig);
          fetchVPRoutes(setVpRoutesConfig);
          fetchVPHistoryRoutes(setVpHistoryRoutesConfig);
          fetchVPAutomationsRoutes(setVpAutomationsRoutesConfig);
          fetchDataAssignments();
          clearLocalStorageOnRefresh();
  
          console.log("all-users", JSON.parse(localStorage.getItem('all-users')));
          console.log("bu-product-automations", JSON.parse(localStorage.getItem('bu-product-automations')));
        })
        .catch(err => console.error("❌ fetchUsers error", err));
    }, []);

  const allTheRoutes = useMemo(() => [
    ...routesConfig,
    ...routesHistoryConfig,
    ...routesAutomationsConfig,    // ← ADD THIS LINE
    ...vpRoutesConfig,
    ...vpHistoryRoutesConfig,
    ...vpAutomationsRoutesConfig,
  ], [
    routesConfig,
    routesHistoryConfig,
    routesAutomationsConfig,      // ← AND HERE IN DEPENDENCIES
    vpRoutesConfig,
    vpHistoryRoutesConfig,
    vpAutomationsRoutesConfig
  ]);

  useEffect(() => {
    console.log("ALL ROUTES", allTheRoutes.map(r => r.path));
  }, [allTheRoutes]);

  useEffect(() => {
    fetchUsers().then(() => {
      localStorage.setItem('current-vp', 'All');
      localStorage.setItem('current-timeframe', '4 Weeks');
      fetchAndSetRoutes(setRoutesConfig, setRoutesHistoryConfig, setRoutesAutomationsConfig);
      fetchVPRoutes(setVpRoutesConfig);
      fetchVPHistoryRoutes(setVpHistoryRoutesConfig);
      fetchVPAutomationsRoutes(setVpAutomationsRoutesConfig);
      fetchDataAssignments();
      clearLocalStorageOnRefresh();

      // AGREGA ESTO:
      console.log("all-users", JSON.parse(localStorage.getItem('all-users')));
      console.log("bu-product-automations", JSON.parse(localStorage.getItem('bu-product-automations')));
    });
  }, []);

  // const allTheRoutes = [
  //   ...routesConfig,
  //   ...routesHistoryConfig,
  //   ...routesAutomationsConfig,
  //   ...vpRoutesConfig,
  //   ...vpHistoryRoutesConfig,
  //   ...vpAutomationsRoutesConfig,
  // ];

  useEffect(() => {
    console.log("All dynamic routes available:", allTheRoutes.map(r => r.path));
  }, [allTheRoutes]);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <ReloadProvider>
            <PeriodProvider>
              <CssBaseline />
              <div className="app">
                {!isLoginRoute && (
                  <Box
                    sx={{
                      backgroundImage: theme.palette.background.backgroundImage,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      zIndex: -1, 
                    }}
                  />
                )}

                <Box display="flex" sx={{ minHeight: "100vh", width: "100%" }}>
                  {isAuthenticated && !isLoginRoute && <Sidebar />}
                  <Box flexGrow={1} display="flex" flexDirection="column" sx={{ width: "100%" }}>
                    {isAuthenticated && !isLoginRoute && <Topbar />}
                    <Routes>
                      {allTheRoutes.map((route, index) => (
                        <Route key={index} path={route.path.replace('engineering/saas', 'engineering-saas')} element={route.element} />
                      ))}
                      <Route path="/" element={<Navigate to="/login" />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/history" element={<DashboardHistory />} />
                      <Route path="/automations" element={<DashboardAutomations />} />
                      <Route path="/dashboard/passive" element={<DashboardPassive />} />
                      <Route path="/dashboard/centralfinance/centralfinance"  element={<DataMatrix product="cs_central_finance" />} />
                      <Route path="/createuser" element={<CreateUserForm />} />
                      <Route path="/assignproducts" element={<AssignProducts />} />
                      <Route path="/userproducts" element={<UserProducts />} />
                      <Route path="/escalationsreport" element={<EscalationsReport />} />
                      <Route path="/customreport" element={<CustomReport />} />
                      <Route path="/csvdownloads" element={<CSVDownloads />} />
                      <Route path="/callsstatistics" element={<CallsStatistics />} />
                    </Routes>
                  </Box>
                </Box>
              </div>
            </PeriodProvider>
          </ReloadProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default App;