import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import TimeAverageBox from "../../components/TimeAverageBox";

import ArticleIcon from '@mui/icons-material/Article';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';

const transparent = (hex, alpha = 0.3) => {
  const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const result = regex.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const EscalationsReport = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [includeOpenTickets, setIncludeOpenTickets] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [groupedData, setGroupedData] = useState({});

  useEffect(() => {
    const storedProducts = localStorage.getItem("product-list");

    if (storedProducts) {
      try {
        const parsedProducts = JSON.parse(storedProducts);
        const productList = parsedProducts.map(([value, text]) => ({
          value,
          text,
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error parsing product list from localStorage:", error);
      }
    } else {
      console.warn(
        'No product list found in localStorage under the key "product-list".'
      );
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedProduct || !fromDate || !toDate) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const payload = {
      company: selectedProduct,
      from: dayjs(fromDate).format("YYYY-MM-DD"),
      to: dayjs(toDate).format("YYYY-MM-DD"),
      openTickets: includeOpenTickets, // Add openTickets to the payload
    };

    try {
      const response = await fetch(
        "https://hcia4oladsbf5sqwpxetifpsoq0dnfnw.lambda-url.us-east-1.on.aws/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (result.success) { 
        console.log(result.success);
        setData(result.success);
      } else { //If there is an error
        result.success = {
                            total_tickets: 0, 
                            total_tickets_escalated: 0, 
                            total_escalations: 0,
                            escalations_per_ticket: [],
                          }
        setData(result.success);
      }
      

      // Group the data by weeks
      const grouped = result.success.escalations_per_ticket.reduce(
        (acc, ticket) => {
          ticket.escalationReasons.forEach((reason) => {
            const week = reason.week;
            if (!acc[week]) {
              acc[week] = [];
            }
            acc[week].push({
              ticketId: ticket.ticketId,
              ticketCreated: ticket.ticketCreated,
              weekNumber: ticket.weekNumber,
              escalationsCount: ticket.escalationsCount,
              reason: reason.reason,
              date: reason.date,
              analysis: ticket.analysis,
            });
          });
          return acc;
        },
        {}
      );
      setGroupedData(grouped);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fullGridSizeHorizontal = 84;
  const tileGridSize = 28;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box m="20px">
        <Header
          title={`Escalations Report`}
          subtitle={`The following tool calculates the number of escalations per week for a selected product within the specified date range. Please note that only tickets closed during this date range will be included in the results.`}
        />

        {/*- ROW 1 -*/}
        <Box 
          display="flex" 
          gap={1} 
          mb={4} 
          alignItems="center"
        >

        <FormControl fullWidth sx={{ flex: 1 }}>
          <InputLabel
            id="product-label"
            style={{
              color: selectedProduct
                ? colors.greenAccent[300]
                : colors.redAccent[300],
              transform: "translateY(-15px)",
            }}
          >
            Product
          </InputLabel>

          <Select
            labelId="product-label"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            onClick={() => {
              if (!products.length) {
                alert("Your session has expired. You will be redirected to the login screen.");
                window.location.href = "/login";
              }
            }}
            sx={{
              backgroundColor: transparent(
                selectedProduct
                  ? colors.blueAccent[900]
                  : colors.blueAccent[900]
              ),
              width: "50%",
            }}
          >
            {products.map((product) => (
              <MenuItem key={product.value} value={product.value}>
                {product.text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

          <Typography
            variant="h6"
            sx={{
              color: includeOpenTickets ? colors.greenAccent[400] : colors.primary[100],
              "&.Mui-checked": {
                color: includeOpenTickets ? colors.greenAccent[400] : colors.primary[100],
              },
            }}
          >
            Include Open Tickets
          </Typography>

          <Checkbox
            checked={includeOpenTickets}
            onChange={(e) => setIncludeOpenTickets(e.target.checked)}
            sx={{
              color: includeOpenTickets ? colors.greenAccent[400] : colors.primary[100],
              "&.Mui-checked": {
                color: includeOpenTickets ? colors.greenAccent[400] : colors.primary[100],
              },
              padding: "0.1px", 
              
            }}
          />

          <DatePicker
            label="From"
            value={fromDate}
            onChange={(newValue) => setFromDate(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={{
                  backgroundColor: transparent(colors.blueAccent[900]),
                  color: colors.primary[100],
                }}
              />
            )}
          />

          <DatePicker
            label="To"
            value={toDate}
            onChange={(newValue) => setToDate(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={{
                  backgroundColor: transparent(colors.blueAccent[900]),
                  color: colors.primary[100],
                }}
              />
            )}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              backgroundColor: colors.greenAccent[300],
              color: colors.primary[900],
              minWidth: "65px", 
              minHeight: "45px", 
              display: "flex", 
              justifyContent: "center",
              alignItems: "center",
              "&:hover": {
                backgroundColor: colors.greenAccent[700],
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Submit"}
          </Button>
        </Box>

        {!loading && data && (
          <>
            {/*- ROW 2 -*/}
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${fullGridSizeHorizontal}, 1fr)`}
              gridAutoRows="100px" 
              gap={2}
              mb={4}
            >
              
              {/*- Total Tickets Widget -*/}
              <Box
                gridColumn={`span ${tileGridSize}`}
                backgroundColor={colors.primary[400]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="8px"
              >
                <TimeAverageBox
                  colorx={colors.greenAccent[300]}
                  title={` ${data.total_tickets} Tickets`}
                  subtitle={`Total Tickets`}
                  icon={
                    <ArticleIcon
                      sx={{ color: colors.greenAccent[300], fontSize: "25px" }}
                    />
                  }
                />
              </Box>

              {/*- Total Escalated Tickets Widget -*/}
              <Box
                gridColumn={`span ${tileGridSize}`}
                backgroundColor={colors.primary[400]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="8px"
              >
                <TimeAverageBox
                  colorx={colors.blueAccent[300]}
                  title={` ${data.total_tickets_escalated} Tickets`}
                  subtitle={`Total Tickets Escalated`}
                  icon={
                    <AssignmentIcon
                      sx={{ color: colors.blueAccent[300], fontSize: "25px" }}
                    />
                  }
                />
              </Box>

              {/*- Total Escalations Widget -*/}
              <Box
                gridColumn={`span ${tileGridSize}`}
                backgroundColor={colors.primary[400]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="8px"
              >
                <TimeAverageBox
                  colorx={colors.redAccent[300]}
                  title={` ${data.total_escalations} Escalations`}
                  subtitle={`Total Escalations Count`}
                  icon={
                    <AssessmentIcon
                      sx={{ color: colors.redAccent[300], fontSize: "25px" }}
                    />
                  }
                />
              </Box>

            </Box>

            {Object.keys(groupedData)
              .sort((a, b) => a - b)
              .map((week) => (
                <Box
                  key={week}
                  mb={4}
                  p={2}
                  backgroundColor={colors.primary[400]}
                  borderRadius="8px"
                >
                  <Typography
                    variant="h6"
                    color={colors.greenAccent[500]}
                    gutterBottom
                  >
                    Week {week} (Escalations: {groupedData[week].length})
                  </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{
                      backgroundColor: transparent(colors.blueAccent[900]),
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "5%",
                              textAlign: "center",
                            }}
                          >
                            Ticket ID
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "15%",
                              textAlign: "center",
                            }}
                          >
                            Ticket Created
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "10%",
                              textAlign: "center",
                            }}
                          >
                            Week Created
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "10%",
                              textAlign: "center",
                            }}
                          >
                            Escalations Count
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "40%",
                              textAlign: "center",
                            }}
                          >
                            Escalation Reasons
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "20%",
                              textAlign: "center",
                            }}
                          >
                           AI Analysis
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupedData[week].map((ticket, index) => (
                          <TableRow key={index}>
                            <TableCell
                              sx={{
                                textAlign: "center",
                                color: colors.greenAccent[300],
                              }}
                            >
                              <a
                                href={`https://central-supportdesk.zendesk.com/agent/tickets/${ticket.ticketId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: colors.greenAccent[300],
                                  textDecoration: "none",
                                }}
                              >
                                {ticket.ticketId}
                              </a>
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {ticket.ticketCreated}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {ticket.weekNumber}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {ticket.escalationsCount}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              <span
                                style={{ color: colors.redAccent[400] }}
                              >
                                {ticket.date
                                  .replace("T", " ( ")
                                  .replace("Z", " ) GMT")}
                              </span>{" "}
                              - {ticket.reason}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {ticket.analysis}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default EscalationsReport;
