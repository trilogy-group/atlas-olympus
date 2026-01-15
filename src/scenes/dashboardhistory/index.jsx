import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme, Switch, useMediaQuery, IconButton } from "@mui/material";
import { tokens } from "../../theme";
import { performGetHistory, getProductRealName, validateUser } from "../../data/fetchData";
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { useNavigate } from "react-router-dom"; 
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import TimerOffRoundedIcon from '@mui/icons-material/TimerOffRounded';
import RepeatOneRoundedIcon from '@mui/icons-material/RepeatOneRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useReload } from "../../context/ReloadContext";
import Header from "../../components/Header";
import SimpleAreaChart from "../../components/SimpleaAreaChart";
import { useIsForcedMobile } from "../../hooks/useIsMobile";


function createSimpleAreaChartData(matrix, bu, product, type, percent = false, excludedItems = []) {

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  let filteredData = matrix.filter(row => row[12] === previousYear.toString() || row[12] === currentYear.toString() || row[12] === previousYear || row[12] === currentYear);

  // Filter out excluded BUs or products
  if (excludedItems.length > 0) {
    filteredData = filteredData.filter(row => {
      // If viewing all BUs, exclude by BU name (row[0])
      // If viewing a specific BU, exclude by product name (row[1])
      if (bu === "All") {
        return !excludedItems.includes(row[0]);
      } else {
        return !excludedItems.includes(row[1]);
      }
    });
  }

  if (bu !== "All") {
    filteredData = filteredData.filter(row => row[0] === bu);
  }

  if (product !== "All") {
    filteredData = filteredData.filter(row => row[1] === product);
  }

  const totalsByWeek = {};

  filteredData.forEach(row => {
      const week = parseInt(row[11]);
      const year = row[12];
      const weekKey = `${year}-${week}`; // Incluir año en la key para evitar colisiones
      const buTotal = filteredData.filter(item => parseInt(item[11]) === week && item[12] === year).reduce((sum, item) => sum + parseInt(item[2]), 0);
      const aiTotal = filteredData.filter(item => parseInt(item[11]) === week && item[12] === year).reduce((sum, item) => sum + parseInt(item[7]), 0);
      const slaTotal = filteredData.filter(item => parseInt(item[11]) === week && item[12] === year).reduce((sum, item) => sum + parseInt(item[8]), 0);
      const fcrTotal = filteredData.filter(item => parseInt(item[11]) === week && item[12] === year).reduce((sum, item) => sum + parseInt(item[9]), 0);

      let Total = 0;

      switch (type) {
        case "Total":
          Total = buTotal; // Total es ahora la sumatoria de la columna 2 por BU
          break;
        case "AI":
          Total = aiTotal; // Columna para AI se desplazó a row[7]
          break;
        case "SLA":
          Total = buTotal - slaTotal; // Columna para SLA ahora es row[8]
          break;
        case "FCR":
          Total = fcrTotal; // Columna para FCR ahora es row[9]
          break;
        default:
          break;
      }

      // Acumulamos los totales por semana (con año incluido en la key)
      if (!totalsByWeek[weekKey]) {
        totalsByWeek[weekKey] = { total: 0, fullTotal: 0 };
      }

      totalsByWeek[weekKey].total = Total;
      totalsByWeek[weekKey].fullTotal = buTotal;
    }
  );

  const acc = Object.keys(totalsByWeek)
                    .sort((a, b) => {
                      // Ordenar por año-semana (e.g., "2025-52" vs "2026-1")
                      const [yearA, weekA] = a.split('-').map(Number);
                      const [yearB, weekB] = b.split('-').map(Number);
                      return (yearA - yearB) || (weekA - weekB);
                    })
                    .map(weekKey => {
                      let percentage = (percent) ? (totalsByWeek[weekKey].total / totalsByWeek[weekKey].fullTotal * 100).toFixed(2) : totalsByWeek[weekKey].total;

                      // Extraer solo el número de semana de la key "2026-1"
                      const weekNumber = weekKey.split('-')[1].padStart(2, '0');

                      return {
                        Week: `Week ${weekNumber}`, // Mostrar solo el número de la semana
                        Total: percentage
                      };
                    });

  const filteredAcc = acc.slice(-12); // Last 12 weeks
  return filteredAcc;

}


const DashboardHistory = ({ bu_subset = "All", vpName = "All", productChosen = "All" }) => {

  vpName = localStorage.getItem("current-vp");
  // console.log(`DashboardHistory Props = bu_subset = ${bu_subset}, vpName = ${vpName}, productChosen = ${productChosen}`);

  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const userEmail = userInfo?.email || "";

  const globals = useConfigureGlobals();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate(); 

  // Mobile detection
  const isMobileWidth = useMediaQuery(theme.breakpoints.down('sm'));
  const isForcedMobile = useIsForcedMobile();
  const isMobile = isMobileWidth || isForcedMobile;
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isPortraitMobile = isMobile && isPortrait;

  let [dataMatrix, setDataMatrix] = useState([]);
  const [showPercentageTotal, setShowPercentageTotal] = useState(false);
  const [showPercentageAI, setShowPercentageAI] = useState(false);
  const [showPercentageFCR, setShowPercentageFCR] = useState(false);
  const [showPercentageSLA, setShowPercentageSLA] = useState(false);
  const [excludedItems, setExcludedItems] = useState([]); // Track excluded BUs/products
  const { reloadKey } = useReload();

  // Toggle visibility of a BU or product
  const toggleItemVisibility = (itemName) => {
    setExcludedItems(prev => {
      if (prev.includes(itemName)) {
        return prev.filter(item => item !== itemName);
      } else {
        return [...prev, itemName];
      }
    });
  };

  // Reset excluded items when navigating to different view
  useEffect(() => {
    setExcludedItems([]);
  }, [bu_subset, productChosen]);

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
        let data = await performGetHistory(globals);
        setDataMatrix(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } 
    };

    fetchDataAsync();
  }, [globals, reloadKey, navigate, userEmail]);

  const fullGridSize = 120;
  const TotalAreaChart = 50;
  const TotalAreaChartVertical = 4;
  const TotalSubAreaChart = 50;
  const TotalSubAreaChartVertical = 4;
  let mappedProducts = [];
  let filteredAssignments = [];
  let isolatedMappedProducts = [];

  if (dataMatrix && dataMatrix.length !== 0 && !isNaN(dataMatrix.length)) {

    // console.log(`dataMatrix = ${dataMatrix}`)

    if (vpName !== "All") {
      let assignmentsPerVP = JSON.parse(localStorage.getItem("assignments"));
      // console.log(`assignmentsPerVP = ${assignmentsPerVP}`);

      filteredAssignments = assignmentsPerVP.filter(row => row[2] === vpName);
      // console.log(`filteredAssignments = ${filteredAssignments}`);

      mappedProducts = filteredAssignments.map(product => product[1]);
      // console.log(`mappedProducts = ${mappedProducts}`);

      isolatedMappedProducts = filteredAssignments.map(item => item[0]);

      dataMatrix = dataMatrix.filter(line => mappedProducts.some(product => line[0] === product));
      // console.log(`dataMatrix (After) = ${dataMatrix}`);
    }

  }

  let currentPath = window.location.pathname;
  currentPath = currentPath.replace(/\/passive/, '');
  // console.log(`currentPath = ${currentPath}`)

  return (
    <Box m={isPortraitMobile ? "10px" : "20px"}>
    
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header 
          title={`Central Support: Closed Tickets History ( ${vpName === "All" ? "All VPs" : vpName} )`} 
          subtitle={`${bu_subset === "All" ? "All" : bu_subset} statistics for ${vpName === "All" ? "All VPs" : vpName}`} 
        />
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns={isPortraitMobile ? "3fr 7fr" : `repeat(${fullGridSize}, 1fr)`}
        gridAutoRows={isPortraitMobile ? "auto" : "100px"}
        gap={isPortraitMobile ? "10px" : "10px"}
      >
        {/* ROW 1 */}



        {/* Left Pannel Statistics */}
        <Box
          gridColumn={isPortraitMobile ? "1" : `span ${20}`}
          gridRow={isPortraitMobile ? "1 / span 4" : `span ${8}`}
          backgroundColor={colors.primary[400]}
          overflow="auto"
          borderRadius={isPortraitMobile ? "12px" : undefined}
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
              {`Statistics for ${bu_subset} ${(productChosen === "All") ? (bu_subset === "All" ? `BUs` : `Products`) : (bu_subset === "All" ? `BUs` : `Products (${getProductRealName(productChosen)})`)}`}
            </Typography>
          </Box>

          {/* {console.log(`dataMatrix at this point = ${JSON.stringify(dataMatrix)}`)}
          {console.log(`isolatedMappedProducts at this point = ${JSON.stringify(isolatedMappedProducts)}`)} */}

          {(dataMatrix) ?
            (bu_subset === "All") ? (

              (productChosen === "All") ? (
                Object.entries(
                  dataMatrix
                    .filter(row => row[0] !== "bu" && row[0] !== "Totals")
                    .reduce((acc, row) => {
                      const bu = row[0]; 

                      if (!acc[bu]) {
                        acc[bu] = [{ }];
                      }

                      // console.log(`el ACC se ve asi: ${JSON.stringify(acc)}`)
                      return acc;
                    }, {})
                )
                .sort(([buA], [buB]) => buA.localeCompare(buB))
                .map(([bu, metrics], i) => {
                  const isExcluded = excludedItems.includes(bu);

                  return (
                    <Box
                      key={`${bu}-${i}`}
                      borderBottom={`4px solid ${colors.primary[500]}`}
                      p="15px"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ 
                        opacity: isExcluded ? 0.4 : 1,
                        transition: "opacity 0.2s ease-in-out"
                      }}
                    >
                      <Typography 
                        color={colors.greenAccent[300]} 
                        variant="h4" 
                        fontWeight="600"
                        onClick={() => { 
                          let cleanedPath = `${currentPath}/${bu.toLowerCase().replace('/', '-').replace(' ', '')}`;
                          navigate(cleanedPath);
                        }}
                        sx={{ 
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                            color: colors.greenAccent[200]
                          }
                        }}
                      >
                        {`${bu}`}
                      </Typography>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemVisibility(bu);
                        }}
                        sx={{ 
                          color: isExcluded ? colors.grey[500] : colors.greenAccent[400],
                          "&:hover": {
                            color: isExcluded ? colors.greenAccent[400] : colors.grey[500]
                          }
                        }}
                        size="small"
                      >
                        {isExcluded ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Box>
                  );

                })
              ) : ( //if productChosen is indeed one chosen product 
                Object.entries(
                  dataMatrix
                    .filter(row => row[0] !== "bu" && row[0] !== "Totals")
                    .reduce((acc, row) => {
                      const bu = row[0]; 

                      if (!acc[bu]) {
                        acc[bu] = [{ }];
                      }

                      // console.log(`el ACC se ve asi: ${JSON.stringify(acc)}`)
                      return acc;
                    }, {})
                )
                .sort(([buA], [buB]) => buA.localeCompare(buB))
                .map(([bu, metrics], i) => {
                  const isExcluded = excludedItems.includes(bu);

                  return (
                    <Box
                      key={`${bu}-${i}`}
                      borderBottom={`4px solid ${colors.primary[500]}`}
                      p="15px"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ 
                        opacity: isExcluded ? 0.4 : 1,
                        transition: "opacity 0.2s ease-in-out"
                      }}
                    >
                      <Typography 
                        color={colors.greenAccent[300]} 
                        variant="h4" 
                        fontWeight="600"
                        onClick={() => { 
                          let cleanedPath = `${currentPath}/${bu.toLowerCase().replace('/', '-').replace(' ', '')}`;
                          navigate(cleanedPath);
                        }}
                        sx={{ 
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                            color: colors.greenAccent[200]
                          }
                        }}
                      >
                        {`${bu}`}
                      </Typography>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemVisibility(bu);
                        }}
                        sx={{ 
                          color: isExcluded ? colors.grey[500] : colors.greenAccent[400],
                          "&:hover": {
                            color: isExcluded ? colors.greenAccent[400] : colors.grey[500]
                          }
                        }}
                        size="small"
                      >
                        {isExcluded ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Box>
                  );

                })
              )

            ) : ( //if bu-subset is one chosen BU Exmp: alphaschool
              
              (productChosen === "All") ? (
                [...new Set(dataMatrix
                .filter(row => row[0] === bu_subset && row[2] !== "Totals")
                .filter(row => (isolatedMappedProducts.length > 0) ? isolatedMappedProducts.includes(row[1]) : true) //This Isolates the product per VP, a VP will only see his/her own products
                .map(row => row[1]))] 
                .map((productName, i) => {
                  const isExcluded = excludedItems.includes(productName);

                  return (
                    <Box
                      key={`${productName}-${i}`}
                      borderBottom={`4px solid ${colors.primary[500]}`}
                      p="15px"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ 
                        opacity: isExcluded ? 0.4 : 1,
                        transition: "opacity 0.2s ease-in-out"
                      }}
                    >
                      <Typography 
                        color={colors.greenAccent[300]} 
                        variant="h4" 
                        fontWeight="600"
                        onClick={() => { 
                          let cleanedPath = `${currentPath}/${productName.toLowerCase().replace('/', '-').replace(' ', '')}`;
                          navigate(cleanedPath);
                        }}
                        sx={{ 
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                            color: colors.greenAccent[200]
                          }
                        }}
                      >
                        {getProductRealName(productName)} 
                      </Typography>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemVisibility(productName);
                        }}
                        sx={{ 
                          color: isExcluded ? colors.grey[500] : colors.greenAccent[400],
                          "&:hover": {
                            color: isExcluded ? colors.greenAccent[400] : colors.grey[500]
                          }
                        }}
                        size="small"
                      >
                        {isExcluded ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Box>
                  );
                })

              ) : ( //if productChosen is indeed one chosen product
                [...new Set(dataMatrix
                .filter(row => row[0] === bu_subset && row[1] === productChosen)
                .map(row => row[1]))] // Usamos Set para eliminar duplicados
                .map((productName, i) => {
                  return (
                    <Box
                      key={`${productName}-${i}`}
                      borderBottom={`4px solid ${colors.primary[500]}`}
                      p="15px"
                      // onClick={() => { 
                      //   let cleanedPath = `${currentPath}/${productName.toLowerCase().replace('/', '-').replace(' ', '')}`;
                      //   navigate(cleanedPath);
                      // }}
                    >
                      <Typography color={colors.greenAccent[300]} variant="h4" fontWeight="600">
                        {getProductRealName(productName)} 
                      </Typography>
                    </Box>
                  );
                })

              )
            )
          : console.log(`No DataMatrix`)}
        </Box>

        {/* Simple Area Chart for Total Tickets */}
        <Box
          gridColumn={isPortraitMobile ? "2" : `span ${TotalAreaChart}`}
          gridRow={isPortraitMobile ? "1" : `span ${TotalAreaChartVertical}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection={isPortraitMobile ? "column" : undefined}
          alignItems="center"
          justifyContent={isPortraitMobile ? "flex-start" : "center"}
          position="relative" 
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "350px" : undefined}
          padding={isPortraitMobile ? "10px" : undefined}
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
          </Box>
          <Box
            position={isPortraitMobile ? "relative" : "absolute"}
            top={isPortraitMobile ? 0 : 10}
            left={isPortraitMobile ? 0 : 10}
            padding="10px" 
            width={isPortraitMobile ? "100%" : undefined}
          >
            <Typography 
              display="flex" 
              variant={isPortraitMobile ? "h3" : "h2"}
              fontWeight="600"
            >
              <ConfirmationNumberRoundedIcon
                sx={{ color: colors.primary[100], fontSize: isPortraitMobile ? "22px" : "26px", marginRight: "8px" }} 
              />
              Tickets Closed
            </Typography>
            
            <Typography variant={isPortraitMobile ? "h6" : "h5"} sx={{ color: colors.primary[100] }}>
              The last 12 weeks
            </Typography>
          </Box>

          <Box
            sx={{ 
              width: '100%', 
              height: isPortraitMobile ? '250px' : '100%', 
              marginTop: isPortraitMobile ? '60px' : '30%',
              flexGrow: isPortraitMobile ? 1 : undefined
            }}
          >
            <SimpleAreaChart 
              key={`total-${vpName}-${bu_subset}-${productChosen}-${excludedItems.join(',')}`}
              data={createSimpleAreaChartData(dataMatrix.filter(row => (isolatedMappedProducts.length > 0) ? isolatedMappedProducts.includes(row[1]) : true), bu_subset, productChosen, "Total", showPercentageTotal, excludedItems)}
              colorObject={{ "fill": colors.primary[200], "stroke": colors.primary[900] }}
            />
          </Box>
        </Box>

        {/* Simple Area Chart for AI Resolution Tickets */}
        <Box
          gridColumn={isPortraitMobile ? "2" : `span ${TotalSubAreaChart}`}
          gridRow={isPortraitMobile ? "2" : `span ${TotalSubAreaChartVertical}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection={isPortraitMobile ? "column" : undefined}
          alignItems="center"
          justifyContent={isPortraitMobile ? "flex-start" : "center"}
          position="relative"
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "350px" : undefined}
          padding={isPortraitMobile ? "10px" : undefined}
        >
          <Box 
            position={isPortraitMobile ? "relative" : "absolute"} 
            top={isPortraitMobile ? 0 : 10} 
            right={isPortraitMobile ? 0 : 10} 
            display="flex" 
            alignItems="center"
            justifyContent={isPortraitMobile ? "flex-end" : undefined}
            width={isPortraitMobile ? "100%" : undefined}
            mb={isPortraitMobile ? 1 : 0}
            zIndex={10}
          >
          <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1, fontSize: isPortraitMobile ? "10px" : undefined }}>{showPercentageAI ? `Showing Percentage` : `Showing Volume`}</Typography>
            <Switch 
              checked={showPercentageAI} 
              onChange={(e) => setShowPercentageAI(e.target.checked)} 
              color="primary"
              size={isPortraitMobile ? "small" : "medium"}
            />
          </Box>
          <Box
            position={isPortraitMobile ? "relative" : "absolute"}
            top={isPortraitMobile ? 0 : 10}
            left={isPortraitMobile ? 0 : 10}
            padding="10px" 
            width={isPortraitMobile ? "100%" : undefined}
          >
            <Typography 
              display="flex" 
              alignItems="center" 
              variant={isPortraitMobile ? "h3" : "h2"}
              fontWeight="600"
            >
              <SmartToyRoundedIcon
                sx={{ color: colors.redAccent[300], fontSize: isPortraitMobile ? "22px" : "26px", marginRight: "8px" }} 
              />
              AI Resolution
            </Typography>
            
            <Typography variant={isPortraitMobile ? "h6" : "h5"} sx={{ color: colors.redAccent[300] }}>
              The last 12 weeks
            </Typography>
          </Box>

          <Box
            sx={{ 
              width: '100%', 
              height: isPortraitMobile ? '250px' : '100%', 
              marginTop: isPortraitMobile ? '60px' : '30%',
              flexGrow: isPortraitMobile ? 1 : undefined
            }}
          >
            <SimpleAreaChart
              key={`ai-${vpName}-${bu_subset}-${productChosen}-${excludedItems.join(',')}`}
              data={createSimpleAreaChartData(dataMatrix.filter(row => (isolatedMappedProducts.length > 0) ? isolatedMappedProducts.includes(row[1]) : true), bu_subset, productChosen, "AI", showPercentageAI, excludedItems)}
              colorObject={{ "fill": colors.redAccent[200], "stroke": colors.redAccent[900] }}
              percent={showPercentageAI}
            />
          </Box>
        </Box>

        {/* Simple Area Chart for FCR Tickets */}
        <Box
          gridColumn={isPortraitMobile ? "2" : `span ${TotalSubAreaChart}`}
          gridRow={isPortraitMobile ? "3" : `span ${TotalSubAreaChartVertical}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection={isPortraitMobile ? "column" : undefined}
          alignItems="center"
          justifyContent={isPortraitMobile ? "flex-start" : "center"}
          position="relative" 
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "350px" : undefined}
          padding={isPortraitMobile ? "10px" : undefined}
        >
          <Box 
            position={isPortraitMobile ? "relative" : "absolute"} 
            top={isPortraitMobile ? 0 : 10} 
            right={isPortraitMobile ? 0 : 10} 
            display="flex" 
            alignItems="center"
            justifyContent={isPortraitMobile ? "flex-end" : undefined}
            width={isPortraitMobile ? "100%" : undefined}
            mb={isPortraitMobile ? 1 : 0}
            zIndex={10}
          >
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1, fontSize: isPortraitMobile ? "10px" : undefined }}>{showPercentageFCR ? `Showing Percentage` : `Showing Volume`}</Typography>
            <Switch 
              checked={showPercentageFCR} 
              onChange={(e) => setShowPercentageFCR(e.target.checked)} 
              color="primary"
              size={isPortraitMobile ? "small" : "medium"}
            />
          </Box>
          <Box
            position={isPortraitMobile ? "relative" : "absolute"}
            top={isPortraitMobile ? 0 : 10}
            left={isPortraitMobile ? 0 : 10}
            padding="10px" 
            width={isPortraitMobile ? "100%" : undefined}
          >
            <Typography 
              display="flex" 
              variant={isPortraitMobile ? "h3" : "h2"}
              fontWeight="600"
            >
              <RepeatOneRoundedIcon
                sx={{ color: colors.blueAccent[300], fontSize: isPortraitMobile ? "22px" : "26px", marginRight: "8px" }} 
              />
              FCR 
            </Typography>
            
            <Typography variant={isPortraitMobile ? "h6" : "h5"} sx={{ color: colors.blueAccent[300] }}>
              The last 12 weeks
            </Typography>
          </Box>

          <Box
            sx={{ 
              width: '100%', 
              height: isPortraitMobile ? '250px' : '100%', 
              marginTop: isPortraitMobile ? '60px' : '30%',
              flexGrow: isPortraitMobile ? 1 : undefined
            }}
          >
            <SimpleAreaChart 
              key={`fcr-${vpName}-${bu_subset}-${productChosen}-${excludedItems.join(',')}`}
              data={createSimpleAreaChartData(dataMatrix.filter(row => (isolatedMappedProducts.length > 0) ? isolatedMappedProducts.includes(row[1]) : true), bu_subset, productChosen, "FCR", showPercentageFCR, excludedItems)}
              colorObject={{ "fill": colors.blueAccent[200], "stroke": colors.blueAccent[900] }}
              percent={showPercentageFCR}
            />
          </Box>
        </Box>

        {/* Simple Area Chart for SLA Failed Tickets */}
        <Box
          gridColumn={isPortraitMobile ? "2" : `span ${TotalSubAreaChart}`}
          gridRow={isPortraitMobile ? "4" : `span ${TotalSubAreaChartVertical}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection={isPortraitMobile ? "column" : undefined}
          alignItems="center"
          justifyContent={isPortraitMobile ? "flex-start" : "center"}
          position="relative" 
          borderRadius={isPortraitMobile ? "12px" : undefined}
          minHeight={isPortraitMobile ? "350px" : undefined}
          padding={isPortraitMobile ? "10px" : undefined}
        >
          <Box 
            position={isPortraitMobile ? "relative" : "absolute"} 
            top={isPortraitMobile ? 0 : 10} 
            right={isPortraitMobile ? 0 : 10} 
            display="flex" 
            alignItems="center"
            justifyContent={isPortraitMobile ? "flex-end" : undefined}
            width={isPortraitMobile ? "100%" : undefined}
            mb={isPortraitMobile ? 1 : 0}
            zIndex={10}
          >
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1, fontSize: isPortraitMobile ? "10px" : undefined }}>{showPercentageSLA ? `Showing Percentage` : `Showing Volume`}</Typography>
            <Switch 
              checked={showPercentageSLA} 
              onChange={(e) => setShowPercentageSLA(e.target.checked)} 
              color="primary"
              size={isPortraitMobile ? "small" : "medium"}
            />
          </Box>
          <Box
            position={isPortraitMobile ? "relative" : "absolute"}
            top={isPortraitMobile ? 0 : 10}
            left={isPortraitMobile ? 0 : 10}
            padding="10px" 
            width={isPortraitMobile ? "100%" : undefined}
          >
            <Typography 
              display="flex" 
              variant={isPortraitMobile ? "h3" : "h2"}
              fontWeight="600"
            >
              <TimerOffRoundedIcon
                sx={{ color: colors.greenAccent[300], fontSize: isPortraitMobile ? "22px" : "26px", marginRight: "8px" }} 
              />
              SLA Compliance
            </Typography>
            
            <Typography variant={isPortraitMobile ? "h6" : "h5"} sx={{ color: colors.greenAccent[300] }}>
              The last 12 weeks
            </Typography>
          </Box>

          <Box
            sx={{ 
              width: '100%', 
              height: isPortraitMobile ? '250px' : '100%', 
              marginTop: isPortraitMobile ? '60px' : '30%',
              flexGrow: isPortraitMobile ? 1 : undefined
            }}
          >
            <SimpleAreaChart 
              key={`sla-${vpName}-${bu_subset}-${productChosen}-${excludedItems.join(',')}`}
              data={createSimpleAreaChartData(dataMatrix.filter(row => (isolatedMappedProducts.length > 0) ? isolatedMappedProducts.includes(row[1]) : true), bu_subset, productChosen, "SLA", showPercentageSLA, excludedItems)}
              colorObject={{ "fill": colors.greenAccent[200], "stroke": colors.greenAccent[900] }}
              percent={showPercentageSLA}
            />
          </Box>
        </Box>

        {/* HighChart for SLA Failed Tickets */}
        {/* <Box
          gridColumn={`span ${120}`}
          gridRow={`span ${TotalSubAreaChartVertical}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative" 
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}>{showPercentageSLA ? `Showing Percentage` : `Showing Volume`}</Typography>
            <Switch 
              checked={showPercentageSLA} 
              onChange={(e) => setShowPercentageSLA(e.target.checked)} 
              color="primary" 
            />
          </Box>
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
              <TimerOffRoundedIcon
                sx={{ color: colors.greenAccent[300], fontSize: "26px", marginRight: "8px" }} 
              />
              SLA Compliance
            </Typography>
            
            <Typography variant="h5" sx={{ color: colors.greenAccent[300] }}>
              The last 12 weeks
            </Typography>
          </Box>

          <HCDashboardsSync />
        </Box> */}

      </Box>
    </Box>
  );
};

export default DashboardHistory;
