import React, { useState, useEffect } from "react";
import { Typography, Box, useTheme, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { performGetProductsRaw } from "../../data/fetchData";
import ProgressCircle from "../../components/ProgressCircle";
import { getProductRealName } from "../../data/fetchData";
import { useIsForcedMobile } from "../../hooks/useIsMobile";

const DataMatrix = ({ product }) => {
  const globals = useConfigureGlobals();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  // Mobile portrait detection
  const isMobileWidth = useMediaQuery(theme.breakpoints.down('sm'));
  const isForcedMobile = useIsForcedMobile();
  const isMobile = isMobileWidth || isForcedMobile;
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isPortraitMobile = isMobile && isPortrait;

  const [dataMatrix, setDataMatrix] = useState([]);

  useEffect(() => {
    if (!globals || Object.keys(globals).length === 0) {
      return; 
    }

    const fetchDataAsync = async () => {
      try {
        let data = await performGetProductsRaw(globals, product);
        setDataMatrix(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchDataAsync();
  }, [globals, product]); 

  let columns = [];
  let headers;
  let data;
  let dataObject = [];

  if (dataMatrix && dataMatrix.length !== 0 && !isNaN(dataMatrix.length)) {
    // console.log(`dataMatrix inside dataMatrix= ${JSON.stringify(dataMatrix)}`);
    headers = dataMatrix[0]; 
    data = dataMatrix.slice(1); 

    dataObject = data.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    columns = [
      { 
        field: "ticket_id", 
        headerName: "Ticket ID", 
        flex: 1,
        renderCell: (params) => (
          <a 
            href={`https://central-supportdesk.kayako.com/agent/conversations/${params.value}`}
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: colors.greenAccent[500] }}
          >
            {params.value}
          </a>
        )
      }, 
      { field: "priority", headerName: "Priority", flex: 1 }, 
      { field: "ai_tags", headerName: "AI Tags", flex: 0 },
      { field: "sla", headerName: "SLA", flex: 0 }, 
      { field: "fcr", headerName: "FCR", flex: 0 }, 
      { 
        field: "date_closed", 
        headerName: "Date Closed", 
        flex: 1, 
        minWidth: 200,
        renderCell: (params) => {
          const dateTime = params.value.split("T");
          const date = dateTime[0]; 
          const time = dateTime[1]?.replace("Z", ""); 
    
          return (
            <div>
              <div>{date} ({time})</div>
            </div>
          );
        }
      },
      { 
        field: "time_spent_in_open", 
        headerName: "Time Open", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "12px" }}>
            Time Open
          </div>
        ),
        renderCell: (params) => (
          <div style={{ color: colors.redAccent[300], textAlign: "center" }}>
            {params.value} s
          </div>
        )
      },
      { 
        field: "time_spent_in_pending", 
        headerName: "Time Pend", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "12px" }}>
            Time Pend
          </div>
        ),
        renderCell: (params) => (
          <div style={{ color: colors.redAccent[300], textAlign: "center" }}>
            {params.value} s
          </div>
        )
      },
      { 
        field: "time_spent_in_hold", 
        headerName: "Time Hold", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "12px" }}>
            Time Hold
          </div>
        ),
        renderCell: (params) => (
          <div style={{ color: colors.redAccent[300], textAlign: "center" }}>
            {params.value} s
          </div>
        )
      },
      { 
        field: "time_spent_in_solved", 
        headerName: "Time Solv", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "12px" }}>
            Time Solv
          </div>
        ),
        renderCell: (params) => (
          <div style={{ color: colors.redAccent[300], textAlign: "center" }}>
            {params.value} s
          </div>
        )
      },
      { 
        field: "time_spent_open_l1", 
        headerName: "Time L1", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Time L1
          </div>
        ),
        renderCell: (params) => (
          <div style={{ color: colors.redAccent[300], textAlign: "center" }}>
            {params.value} s 
          </div>
        )
      },
      { 
        field: "time_spent_open_l2", 
        headerName: "Time L2", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Time L2
          </div>
        ),
        renderCell: (params) => (
          <div style={{ color: colors.redAccent[300], textAlign: "center" }}>
            {params.value} s
          </div>
        )
      },
      { 
        field: "initial_response_time", 
        headerName: "IRT", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "30px" }}>
            IRT
          </div>
        ),
        renderCell: (params) => (
          <div style={{ color: colors.blueAccent[300], textAlign: "center" }}>
            {params.value} s
          </div>
        )
      },
      { 
        field: "resolution_time", 
        headerName: "Res Time", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "12px" }}>
            Res Time
          </div>
        ),
        renderCell: (params) => (
          <div style={{ color: colors.blueAccent[300], textAlign: "center" }}>
            {params.value} s
          </div>
        )
      },
      { 
        field: "ai_csat_score", 
        headerName: "AI CSAT", 
        flex: 1, 
        renderHeader: () => (
          <div style={{ textAlign: "center", padding: "12px" }}>
            AI CSAT
          </div>
        ),
        renderCell: (params) => (
          <div style={{ 
            color: params.value && params.value !== '' 
              ? (Number(params.value) >= 4 ? colors.greenAccent[400] : Number(params.value) >= 3 ? colors.blueAccent[300] : colors.redAccent[400])
              : colors.grey[500], 
            textAlign: "center",
            fontWeight: params.value && params.value !== '' ? "bold" : "normal"
          }}>
            {params.value && params.value !== '' ? params.value : '-'}
          </div>
        )
      },
    ];
  }

  // console.log(`dataObject = ${JSON.stringify(dataObject)}`)

  let solvedTotal = 0;
  let solvedTotalPercentage = 0;

  let fcrTotal = 0;
  let fcrTotalPercentage = 0;

  let aiTotal = 0;
  let aiTotalPercentage = 0;

  let slaTotal = 0;
  let slaTotalPercentage = 0;

  let csatTotal = 0;
  let csatCount = 0;
  let csatAverage = 0;

  solvedTotal = dataObject.length;
  solvedTotalPercentage = solvedTotal / solvedTotal;

  fcrTotal = dataObject.reduce((sum, row) => sum + Number(row.fcr), 0);
  fcrTotalPercentage = fcrTotal / solvedTotal ;

  aiTotal = dataObject.reduce((sum, row) => sum + Number(row.ai_tags), 0);
  aiTotalPercentage = aiTotal / solvedTotal ;

  slaTotal = dataObject.reduce((sum, row) => sum + Number(row.sla), 0);
  slaTotalPercentage = slaTotal / solvedTotal ;

  // Calculate CSAT average (only for tickets with ai_csat_score)
  const ticketsWithCsat = dataObject.filter(row => row.ai_csat_score && row.ai_csat_score !== '');
  csatCount = ticketsWithCsat.length;
  if (csatCount > 0) {
    csatTotal = ticketsWithCsat.reduce((sum, row) => sum + Number(row.ai_csat_score), 0);
    csatAverage = csatTotal / csatCount;
  }
  
  return (
    <Box m={isPortraitMobile ? "10px" : "20px"}>
      <Header 
        title={getProductRealName(product)} 
        subtitle={`Statistics and raw data for ${getProductRealName(product)}`} 
      />

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns={isPortraitMobile ? "repeat(2, 1fr)" : `repeat(120, 1fr)`}
        gridAutoRows={isPortraitMobile ? "auto" : "100px"}
        gap={isPortraitMobile ? "12px" : "10px"}
      >

        <Box
            gridColumn={isPortraitMobile ? "1" : `span 20`}
            gridRow={isPortraitMobile ? "1" : "span 3"}
            backgroundColor={colors.primary[400]}
            p={isPortraitMobile ? "20px" : "30px"}
            borderRadius={isPortraitMobile ? "12px" : undefined}
            boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : undefined}
          >
            <Typography variant={isPortraitMobile ? "h6" : "h5"} fontWeight="600">
              Solved tickets
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt={isPortraitMobile ? "15px" : "25px"}
            >
              <ProgressCircle
                progress={solvedTotalPercentage}
                size={isPortraitMobile ? "100" : "150"}
              />
              <Typography
                variant={isPortraitMobile ? "h6" : "h5"}
                color={colors.greenAccent[500]}
                sx={{ mt: isPortraitMobile ? "10px" : "15px" }}
              >
                {(100 * solvedTotalPercentage).toFixed(2)}%
              </Typography>
              <Typography fontSize={isPortraitMobile ? "10px" : undefined} textAlign="center">
              {solvedTotal === 0 
                ? `No ticket got solved in this period` 
                : solvedTotal === 1 
                  ? `${solvedTotal} Ticket was solved in this period`
                  : `${solvedTotal} Ticket(s) were solved in this period`
              }
              </Typography>
            </Box>
        </Box>

        {/* FCR Graphic - CIRCULITO MORADO*/}
          <Box
            gridColumn={isPortraitMobile ? "2" : `span 20`}
            gridRow={isPortraitMobile ? "1" : "span 3"}
            backgroundColor={colors.primary[400]}
            p={isPortraitMobile ? "20px" : "30px"}
            borderRadius={isPortraitMobile ? "12px" : undefined}
            boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : undefined}
          >
            <Typography variant={isPortraitMobile ? "h6" : "h5"} fontWeight="600">
              FCR Statistics
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt={isPortraitMobile ? "15px" : "25px"}
            >
              <ProgressCircle
                progress={fcrTotalPercentage}
                size={isPortraitMobile ? "100" : "150"}
              />
              <Typography
                variant={isPortraitMobile ? "h6" : "h5"}
                color={colors.greenAccent[500]}
                sx={{ mt: isPortraitMobile ? "10px" : "15px" }}
              >
                {(100 * fcrTotalPercentage).toFixed(2)}%
              </Typography>
              <Typography fontSize={isPortraitMobile ? "10px" : undefined} textAlign="center">
                {fcrTotalPercentage === 0 ? `No ticket achieved FCR in this period` : `${fcrTotal} Ticket(s) achieved FCR in in this period`}
              </Typography>
            </Box>
          </Box>

        {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */}
        {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */}
        {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */}

          <Box 
              gridColumn={isPortraitMobile ? "1 / 3" : "span 80"}
              gridRow={isPortraitMobile ? "3" : "span 6"}
              backgroundColor={colors.primary[400]}
              p={isPortraitMobile ? "10px" : "20px"}
              overflow="auto"
              borderRadius={isPortraitMobile ? "12px" : undefined}
              boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : undefined}
              sx={{
                minHeight: isPortraitMobile ? "400px" : undefined,
              }}
              >
              <DataGrid
                  rows={dataObject}
                  columns={columns}
                  getRowId={(row) => row.ticket_id}
                  autoHeight={false}  // Set this to false if you want to control the height with grid
              />
          </Box>

        {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */}
        {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */}
        {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */} {/* Data Grid */}

        {/* AI-Solved Graphic - CIRCULITO MORADO*/}
          <Box
            gridColumn={isPortraitMobile ? "1" : `span 20`}
            gridRow={isPortraitMobile ? "2" : "span 3"}
            backgroundColor={colors.primary[400]}
            p={isPortraitMobile ? "20px" : "30px"}
            borderRadius={isPortraitMobile ? "12px" : undefined}
            boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : undefined}
          >
            <Typography variant={isPortraitMobile ? "h6" : "h5"} fontWeight="600">
              AI-Solved tickets
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt={isPortraitMobile ? "15px" : "25px"}
            >
              <ProgressCircle
                progress={aiTotalPercentage}
                size={isPortraitMobile ? "100" : "150"}
              />
              <Typography
                variant={isPortraitMobile ? "h6" : "h5"}
                color={colors.greenAccent[500]}
                sx={{ mt: isPortraitMobile ? "10px" : "15px" }}
              >
                {(100 * aiTotalPercentage).toFixed(2)}%
              </Typography>
              <Typography fontSize={isPortraitMobile ? "10px" : undefined} textAlign="center">
                {aiTotalPercentage === 0 ? `No ticket were solved by the AI in this period` : `${aiTotal} Ticket(s) were solved by the AI in this period`}
              </Typography>
            </Box>
          </Box>

        {/* SLA Graphic - CIRCULITO MORADO*/}
          <Box
            gridColumn={isPortraitMobile ? "2" : `span 20`}
            gridRow={isPortraitMobile ? "2" : "span 3"}
            backgroundColor={colors.primary[400]}
            p={isPortraitMobile ? "20px" : "30px"}
            borderRadius={isPortraitMobile ? "12px" : undefined}
            boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : undefined}
          >
            <Typography variant={isPortraitMobile ? "h6" : "h5"} fontWeight="600">
              SLA Failures
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt={isPortraitMobile ? "15px" : "25px"}
            >
              <ProgressCircle
                progress={slaTotalPercentage}
                size={isPortraitMobile ? "100" : "150"}
              />
              <Typography
                variant={isPortraitMobile ? "h6" : "h5"}
                color={colors.greenAccent[500]}
                sx={{ mt: isPortraitMobile ? "10px" : "15px" }}
              >
                {(100 * slaTotalPercentage).toFixed(2)}%
              </Typography>
              <Typography fontSize={isPortraitMobile ? "10px" : undefined} textAlign="center">
                {slaTotalPercentage === 0 ? `No ticket failed SLA in this period` : `${slaTotal} Ticket(s) failed SLA this period`}
              </Typography>
            </Box>
          </Box>

        {/* AI CSAT Coverage Widget */}
          <Box
            gridColumn={isPortraitMobile ? "1" : `span 40`}
            gridRow={isPortraitMobile ? "4" : "span 3"}
            backgroundColor={colors.primary[400]}
            p={isPortraitMobile ? "20px" : "30px"}
            borderRadius={isPortraitMobile ? "12px" : undefined}
            boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : undefined}
          >
            <Typography variant={isPortraitMobile ? "h6" : "h5"} fontWeight="600">
              AI CSAT Coverage
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt={isPortraitMobile ? "15px" : "25px"}
            >
              {csatCount > 0 ? (
                <>
                  <ProgressCircle
                    progress={csatCount / solvedTotal}
                    size={isPortraitMobile ? "100" : "150"}
                  />
                  <Typography
                    variant={isPortraitMobile ? "h6" : "h5"}
                    color={colors.greenAccent[500]}
                    sx={{ mt: isPortraitMobile ? "10px" : "15px" }}
                  >
                    {((csatCount / solvedTotal) * 100).toFixed(1)}%
                  </Typography>
                  <Typography fontSize={isPortraitMobile ? "10px" : undefined} textAlign="center">
                    {`${csatCount} of ${solvedTotal} tickets analyzed`}
                  </Typography>
                </>
              ) : (
                <Typography fontSize={isPortraitMobile ? "10px" : undefined} textAlign="center" sx={{ mt: "50px" }}>
                  No tickets have AI CSAT score in this period
                </Typography>
              )}
            </Box>
          </Box>

        {/* AI CSAT Average Score Widget */}
          <Box
            gridColumn={isPortraitMobile ? "2" : `span 40`}
            gridRow={isPortraitMobile ? "4" : "span 3"}
            backgroundColor={colors.primary[400]}
            p={isPortraitMobile ? "20px" : "30px"}
            borderRadius={isPortraitMobile ? "12px" : undefined}
            boxShadow={isPortraitMobile ? "0 2px 8px rgba(0,0,0,0.2)" : undefined}
          >
            <Typography variant={isPortraitMobile ? "h6" : "h5"} fontWeight="600">
              AI CSAT Average Score
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt={isPortraitMobile ? "15px" : "25px"}
            >
              {csatCount > 0 ? (
                <>
                  <ProgressCircle
                    progress={csatAverage / 5}
                    size={isPortraitMobile ? "100" : "150"}
                  />
                  <Typography
                    variant={isPortraitMobile ? "h6" : "h5"}
                    color={colors.greenAccent[500]}
                    sx={{ mt: isPortraitMobile ? "10px" : "15px" }}
                  >
                    {csatAverage.toFixed(2)} avg
                  </Typography>
                  <Typography fontSize={isPortraitMobile ? "10px" : undefined} textAlign="center">
                    {`${csatAverage.toFixed(2)} / 5.00`}
                  </Typography>
                </>
              ) : (
                <Typography fontSize={isPortraitMobile ? "10px" : undefined} textAlign="center" sx={{ mt: "50px" }}>
                  No tickets have AI CSAT score in this period
                </Typography>
              )}
            </Box>
          </Box>

      </Box>
    </Box>
  );
};

export default DataMatrix;
