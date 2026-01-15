import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { mocktickets } from "../../data/mockData";
import { dataMatrix } from "../../data/ticketData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import GeographyChart from "../../components/GeographyChart";
import BarChart from "../../components/BarChart";
import StatBox from "../../components/StatBox";
import ProgressCircle from "../../components/ProgressCircle";

function getDateRange(data) {
  let fromDate = new Date(data[0].created);
  let toDate = new Date(); // Current date

  data.forEach(ticket => {
      let createdDate = new Date(ticket.created);
      if (createdDate < fromDate) {
          fromDate = createdDate;
      }
  });

  return {
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
  };
}

const DashboardJigsaw = () => {

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const fullGridSize = 12;
  const bu = "Jigsaw"; //Skyvera //Jigsaw
  let buDataMatrix = dataMatrix.filter(ticket => ticket.bu === bu);

  let dateRange = getDateRange(buDataMatrix)

  let totaltxSize = 4;
  let totaltx = dataMatrix.length;
  let totalBUtx = buDataMatrix.length;
  let totalBUtxPercentage = buDataMatrix.length / totaltx;
  
  let slaSize = 4;
  let aiResolutionMatrix = buDataMatrix.filter(ticket => ticket.ai_tags === 1);
  let aiResolutionTotal = aiResolutionMatrix.length;
  let aiResolutionPercentage = aiResolutionMatrix.length / totalBUtx;

  let fcrSize = 4;
  // let fcrResolutionMatrix = buDataMatrix.filter(ticket => ticket.fcr === 1);
  // let fcrResolutionTotal = aiResolutionMatrix.length;
  // let fcrResolutionPercentage = aiResolutionMatrix.length / buDataMatrix.length;

  let backlogHealthSize = 8;
  // Information to populate the BACKLOCK HEALTH graphic

  let slaFailuresSize = 4;
  let slaFailuresMatrix = buDataMatrix.filter(ticket => ticket.sla === 1);
  let slaFailuresTotal = slaFailuresMatrix.length;
  let slaFailuresPercentage = slaFailuresMatrix.length / totalBUtx;

  let statusGraphicSize = 4;

  let priorityGraphicSize = 4;

  let slaRecentFailuresSize = 4;

  return (
    <Box m="20px">

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title={`${bu}`} subtitle={`Welcome to ${bu} dashboard`} />

        <Box>
          <Button
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns={`repeat(${fullGridSize}, 1fr)`}
        gridAutoRows="140px"
        gap="20px"
      >
      {/* ROW 1 */}

        {/* Total Tickets */}
        <Box
          gridColumn={`span ${totaltxSize}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
              title={`${totalBUtx} tickets`}
              subtitle="Total Tickets"
              progress={totalBUtxPercentage}
              increase={`${(100 * totalBUtxPercentage).toFixed(2)}%`}
              icon={
                  <EmailIcon
                      sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                  />
              }
          />

        </Box>

        {/* SLA Widget */}
        <Box
          gridColumn={`span ${slaSize}`}
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

        {/* FCR Widget  */}
        <Box
          gridColumn={`span ${fcrSize}`}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="4 Tickets"
            subtitle="FCR"
            progress="0.50"
            increase="21%"
            icon={
              <PointOfSaleIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* Whatever Widget */}
        {/* <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="98,765"
            subtitle="Kpi 3"
            progress="0.30"
            increase="+5%"
            icon={
              <PersonAddIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="4,321"
            subtitle="Kpi 4"
            progress="0.80"
            increase="+43%"
            icon={
              <TrafficIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box> */}

      {/* ROW 2 */}

        {/* Backlog Health Widget */}
        <Box
          gridColumn={`span ${backlogHealthSize}`}
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                Backlog Health
              </Typography>
              <Typography 
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
              >
                from {dateRange.from} to {dateRange.to}
              </Typography>
            </Box>
            <Box>
              <IconButton>
                <DownloadOutlinedIcon
                  sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            <LineChart isDashboardJigsaw={true} />
          </Box>
        </Box>

        {/* SLA Failures Graphic */}
        <Box
          gridColumn={`span ${slaFailuresSize}`}
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
              {slaFailuresPercentage.toFixed(2)}%
            </Typography>
            <Typography>
              {slaFailuresTotal === 0 ? `No ticket failed in this period` : `${slaFailuresTotal} Ticket(s) failed in this period`}
            </Typography>
          </Box>
        </Box>

      {/* ROW 3 */}

        {/* Status Graphic */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Status Graphic
          </Typography>
          <Box height="250px" mt="-20px">
            <BarChart isDashboardJigsaw={true} />
          </Box>
        </Box>

        {/* Priority Graphic */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Priority Graphic
          </Typography>
          <Box height="250px" mt="-20px">
            <BarChart isDashboardJigsaw={true} />
          </Box>
        </Box>

        {/* SLA Recent Failures */}
        <Box
          gridColumn="span 4"
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
              SLA Recent Failures
            </Typography>
          </Box>

              {/* Calculation */}
              {slaFailuresMatrix.map((ticket, i) => (
              <Box
                key={`${ticket.ticket_id}-${i}`}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                borderBottom={`4px solid ${colors.primary[500]}`}
                p="15px"
              >
                <Box>
                  <Typography color={colors.greenAccent[500]} variant="h5" fontWeight="600">{ticket.ticket_id} ({ticket.product})</Typography>
                  <Typography color={colors.grey[100]}>{ticket.title}</Typography>
                </Box>

                <Box color={colors.grey[100]}>{ticket.created.split('T')[0]}</Box>

                <Box>
                  <a href="https://central-supportdesk.zendesk.com/agent/tickets/4410184" target="_blank" style={{ textDecoration: 'none' }}>
                    <Box backgroundColor={colors.greenAccent[500]} p="5px 10px" borderRadius="4px" color={colors.grey[100]}>
                      Link
                    </Box>
                  </a>
                </Box>
              </Box>
              
              ))}
        </Box>

        {/* Geography Graphic */}
        {/* <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          padding="30px"
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ marginBottom: "15px" }}
          >
            Geography Based Traffic
          </Typography>
          <Box height="200px">
            <GeographyChart isDashboardJigsaw={true} />
          </Box>
        </Box> */}

      </Box>
    </Box>
  );
};

export default DashboardJigsaw;