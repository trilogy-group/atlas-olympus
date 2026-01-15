import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme, Switch } from "@mui/material";
import { tokens } from "../../theme";
import { performGetHistory, validateUser } from "../../data/fetchData";
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { useNavigate } from "react-router-dom"; 
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import TimerOffRoundedIcon from '@mui/icons-material/TimerOffRounded';
import RepeatOneRoundedIcon from '@mui/icons-material/RepeatOneRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import { useReload } from "../../context/ReloadContext";
import Header from "../../components/Header";
import SimpleAreaChart from "../../components/SimpleaAreaChart";


function createSimpleAreaChartData(matrix, categories, type, percent = false) {
  if (categories === "All") {
    const filteredData = matrix.filter(row => row[11] === "2024");
    const TotalsByWeek = {};

    filteredData.forEach(row => {
      const week = parseInt(row[10]);
      const fullTotal = parseInt(row[1]); // Total de tickets cerrados esa semana
      let Total = 0;

      switch(type) {
        case "Total": 
          Total = fullTotal;
          break;
        case "AI": 
          Total = parseInt(row[6]);
          break;
        case "SLA": 
          Total = fullTotal - parseInt(row[7]);
          break;
        case "FCR": 
          Total = parseInt(row[8]);
          break;
        default:
          break;
      }

      if (!TotalsByWeek[week]) {
        TotalsByWeek[week] = { total: 0, fullTotal: 0 };
      }

      TotalsByWeek[week].total += Total;
      TotalsByWeek[week].fullTotal += fullTotal;
    });

    const acc = Object.keys(TotalsByWeek)
                      .sort((a, b) => a - b) // Ordenar por número de semana
                      .map(week => {
                        let percentage = (percent) 
                          ? (TotalsByWeek[week].total / TotalsByWeek[week].fullTotal * 100).toFixed(2)
                          : TotalsByWeek[week].total ;
                        
                        return {
                          Week: `Week ${week}`,
                          Total: percentage
                        };
                      });

    const filteredAcc = acc.slice(-12); 

    return filteredAcc;
  }
}

const DashboardHistory = ({ bu_subset = "All", vpName = "All" }) => {

  vpName = localStorage.getItem("current-vp");
  // console.log(`bu_subset = ${bu_subset}, vpName = ${vpName}`);

  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const userEmail = userInfo?.email || "";

  const globals = useConfigureGlobals();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate(); 

  let [dataMatrix, setDataMatrix] = useState([]);
  const [showPercentageTotal, setShowPercentageTotal] = useState(false);
  const [showPercentageAI, setShowPercentageAI] = useState(false);
  const [showPercentageFCR, setShowPercentageFCR] = useState(false);
  const [showPercentageSLA, setShowPercentageSLA] = useState(false);
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

  if (dataMatrix && dataMatrix.length !== 0 && !isNaN(dataMatrix.length)) {

    // console.log(`dataMatrix = ${dataMatrix}`)

    if (vpName !== "All") {
      let assignmentsPerVP = JSON.parse(localStorage.getItem("assignments"));
      // console.log(`assignmentsPerVP = ${assignmentsPerVP}`);

      let filteredAssignments = assignmentsPerVP.filter(row => row[2] === vpName);
      // console.log(`filteredAssignments = ${filteredAssignments}`);

      let mappedProducts = filteredAssignments.map(product => product[1]);
      // console.log(`mappedProducts = ${mappedProducts}`);

      dataMatrix = dataMatrix.filter(line => mappedProducts.some(product => line[0] === product));
      // console.log(`dataMatrix (After) = ${dataMatrix}`);
    }

  }

  return (
    <Box m="20px">
    
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
        gridTemplateColumns={`repeat(${fullGridSize}, 1fr)`}
        gridAutoRows="100px"
        gap="10px"
      >
        {/* ROW 1 */}

        {/* BU Statistics */}
        <Box
          gridColumn={`span ${20}`}
          gridRow={`span ${8}`}
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
              {`Statistics for ${bu_subset} ${bu_subset === "All" ? `BUs` : `Products`}`}
            </Typography>
          </Box>

          {/*- console.log(`dataMatrix aqui abajo = ${JSON.stringify(dataMatrix)}`)-*/}

          {(dataMatrix) ?
            (bu_subset === "All") ? (
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

                return (
                  <Box
                    key={`${bu}-${i}`}
                    borderBottom={`4px solid ${colors.primary[500]}`}
                    p="15px"
                    // onClick={() => navigate(`/${bu.toLowerCase().replace('/', '-').replace(' ','')}`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <Typography 
                      color={colors.greenAccent[300]} 
                      variant="h4" 
                      fontWeight="600"
                    >
                      {`${bu}`}
                    </Typography>
                    <Box display="flex" justifyContent="space-between">
                    </Box>
                  </Box>
                );
              })
            ) : ( //if bu-subset is not "All"
              dataMatrix
                .filter(row => row[0] === bu_subset && row[0] !== "Totals")
                .map((row, i) => {
                  const productName = row[1]; //YO NO TENGO PRODUCT NAME
                  const numberOfTickets = Number(row[2]);
                  const ai = Number(row[7]);
                  const slaBreach = Number(row[8]);
                  const fcr = Number(row[9]);
                  
                  const totalSLA = ((numberOfTickets - slaBreach) / numberOfTickets) * 100;
                  const fcrPercentage = (fcr / numberOfTickets) * 100;
                  const aiPercentage = (ai / numberOfTickets) * 100;

                  return (
                    <Box
                      key={`${productName}-${i}`}
                      borderBottom={`4px solid ${colors.primary[500]}`}
                      p="15px"
                      onClick={() => navigate(`/${bu_subset.toLowerCase().replace('/', '-').replace(' ', '')}/${productName.toLowerCase().replace(' ', '')}`)}
                      sx={{ cursor: "pointer" }}
                    >

                      <Box display="flex" justifyContent="space-between">
                        <Typography color={colors.grey[100]}>
                          Tickets: {numberOfTickets}
                          <span 
                          style={{ 
                                  color: colors.primary[200], 
                                  fontSize: '0.80rem',
                                  fontWeight: 'bold' 
                                }}
                          >
                          </span>
                        </Typography>
                        <Typography color={colors.greenAccent[300]}>
                          FCR: {fcrPercentage.toFixed(2)}%
                        </Typography>
                        <Typography color={colors.blueAccent[300]}>
                          AI: {aiPercentage.toFixed(2)}%
                        </Typography>
                        <Typography color={colors.redAccent[300]}>
                          SLA: {totalSLA.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
            )
          : console.log(`No DataMatrix`)}
        </Box>

        {/* Simple Area Chart for Total Tickets */}
        <Box
          gridColumn={`span ${TotalAreaChart}`}
          gridRow={`span ${TotalAreaChartVertical}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative" 
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}></Typography>
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
              <ConfirmationNumberRoundedIcon
                sx={{ color: colors.primary[100], fontSize: "26px", marginRight: "8px" }} 
              />
              Tickets Closed
            </Typography>
            
            <Typography variant="h5" sx={{ color: colors.primary[100] }}>
              The last 12 weeks
            </Typography>
          </Box>

          <Box
            sx={{ width: '100%', height: '100%', marginTop: '30%' }}  // Add marginTop to move the chart down
          >
            <SimpleAreaChart 
              key={`total-${vpName}`}
              data={createSimpleAreaChartData(dataMatrix, "All", "Total", showPercentageTotal)}
              colorObject={{ "fill": colors.primary[200], "stroke": colors.primary[900] }}
            />
          </Box>
        </Box>

        {/* Simple Area Chart for AI Resolution Tickets */}
        <Box
          gridColumn={`span ${TotalSubAreaChart}`}
          gridRow={`span ${TotalSubAreaChartVertical}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
          <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}>{showPercentageAI ? `Showing Percentage` : `Showing Volume`}</Typography>
            <Switch 
              checked={showPercentageAI} 
              onChange={(e) => setShowPercentageAI(e.target.checked)} 
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
              alignItems="center" 
              variant="h2" 
              fontWeight="600"
            >
              <SmartToyRoundedIcon
                sx={{ color: colors.redAccent[300], fontSize: "26px", marginRight: "8px" }} 
              />
              AI Resolution
            </Typography>
            
            <Typography variant="h5" sx={{ color: colors.redAccent[300] }}>
              The last 12 weeks
            </Typography>
          </Box>

          <Box
            sx={{ width: '100%', height: '100%', marginTop: '30%' }}  // Add marginTop to move the chart down
          >
            <SimpleAreaChart
              key={`ai-${vpName}`}
              data={createSimpleAreaChartData(dataMatrix, "All", "AI", showPercentageAI)}
              colorObject={{ "fill": colors.redAccent[200], "stroke": colors.redAccent[900] }}
              percent={showPercentageAI}
            />
          </Box>
        </Box>

        {/* Simple Area Chart for FCR Tickets */}
        <Box
          gridColumn={`span ${TotalSubAreaChart}`}
          gridRow={`span ${TotalSubAreaChartVertical}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative" 
        >
          <Box position="absolute" top={10} right={10} display="flex" alignItems="center">
            <Typography variant="body2" sx={{ color: colors.primary[100], marginRight: 1 }}>{showPercentageFCR ? `Showing Percentage` : `Showing Volume`}</Typography>
            <Switch 
              checked={showPercentageFCR} 
              onChange={(e) => setShowPercentageFCR(e.target.checked)} 
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
              <RepeatOneRoundedIcon
                sx={{ color: colors.blueAccent[300], fontSize: "26px", marginRight: "8px" }} 
              />
              FCR 
            </Typography>
            
            <Typography variant="h5" sx={{ color: colors.blueAccent[300] }}>
              The last 12 weeks
            </Typography>
          </Box>

          <Box
            sx={{ width: '100%', height: '100%', marginTop: '30%' }}  // Add marginTop to move the chart down
          >
            <SimpleAreaChart 
              key={`fcr-${vpName}`}
              data={createSimpleAreaChartData(dataMatrix, "All", "FCR", showPercentageFCR)}
              colorObject={{ "fill": colors.blueAccent[200], "stroke": colors.blueAccent[900] }}
              percent={showPercentageFCR}
            />
          </Box>
        </Box>

        {/* Simple Area Chart for SLA Failed Tickets */}
        <Box
          gridColumn={`span ${TotalSubAreaChart}`}
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

          <Box
            sx={{ width: '100%', height: '100%', marginTop: '30%' }}  // Add marginTop to move the chart down
          >
            <SimpleAreaChart 
              key={`sla-${vpName}`}
              data={createSimpleAreaChartData(dataMatrix, "All", "SLA", showPercentageSLA)}
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
