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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const transparent = (hex, alpha = 0.3) => {
  const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const result = regex.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Calculate ISO week number from date string
const getWeekNumber = (dateString) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Format date for display: date on top, time below in purple
const formatDateTime = (isoString, colors) => {
  if (!isoString || isoString === null || isoString === undefined) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box sx={{ color: colors.grey[500] }}>Unknown</Box>
      </Box>
    );
  }
  
  const [date, timeWithZ] = isoString.split('T');
  // Remove Z and milliseconds: "14:18:42.000Z" → "14:18:42"
  const time = timeWithZ ? timeWithZ.replace('Z', '').split('.')[0] : "00:00:00";
  
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Box>{date}</Box>
      <Box sx={{ color: colors.blueAccent[300], fontSize: "10px" }}>
        {time}
      </Box>
    </Box>
  );
};

const EscalationsReport = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [businessUnits, setBusinessUnits] = useState([]);
  const [selectedBU, setSelectedBU] = useState("");
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [includeOpenTickets, setIncludeOpenTickets] = useState(false); 
  const [filterType, setFilterType] = useState("escalated"); // 'created' | 'closed' | 'escalated'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const [sortBy, setSortBy] = useState(null); // Column to sort by
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    // Load BU-Product mapping from localStorage
    const storedBUProducts = localStorage.getItem("bu-product");

    if (storedBUProducts) {
      try {
        const parsedData = JSON.parse(storedBUProducts);
        // parsedData format: [[bu_name, product_id], ...]
        // Example: [["Ignite", "sococo"], ["Ignite", "dnn"], ...]
        
        // Extract unique BUs (filter out "bu" and "Totals")
        const uniqueBUs = [...new Set(parsedData
          .map(item => item[0]) // BU is at index 0
          .filter(bu => bu && bu !== "Totals" && bu.toLowerCase() !== "bu"))
        ].sort();
        
        setBusinessUnits(uniqueBUs);
        
        // Store all products for filtering
        const allProducts = parsedData
          .filter(item => item[0] !== "Totals")
          .map(item => ({
            bu: item[0],          // BU at index 0
            productId: item[1],   // Product ID at index 1
          }));
        
        setProducts(allProducts);
      } catch (error) {
        console.error("Error parsing bu-product from localStorage:", error);
      }
    } else {
      console.warn('No bu-product found in localStorage.');
    }
  }, []);

  // Update available products when BU changes
  useEffect(() => {
    if (selectedBU && products.length > 0) {
      const filtered = products.filter(p => p.bu === selectedBU);
      setAvailableProducts(filtered);
      setSelectedProduct(""); // Reset product selection
    } else {
      setAvailableProducts([]);
    }
  }, [selectedBU, products]);

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const downloadCSV = () => {
    if (!data || !data.escalations_per_ticket || data.escalations_per_ticket.length === 0) {
      alert("No data to download");
      return;
    }

    // Prepare CSV data
    const headers = ["Ticket ID", "Ticket Created", "Ticket Closed", "Product", "Status", "Week", "Escalations Count", "Escalation Timestamp", "Escalation Reason", "AI Analysis"];
    const rows = [];

    data.escalations_per_ticket.forEach(ticket => {
      ticket.escalationReasons.forEach(reason => {
        rows.push([
          ticket.ticketId,
          ticket.ticketCreated || '',
          ticket.ticketClosed || '',
          ticket.product || '',
          ticket.status || '',
          reason.week,
          ticket.escalationsCount,
          reason.date || '',
          reason.reason || '',
          ticket.analysis || ''
        ]);
      });
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `escalations_report_${dayjs().format("YYYY-MM-DD_HH-mm")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!selectedBU || !selectedProduct || !fromDate || !toDate) {
      alert("Please fill in all fields (BU, Product, and Dates).");
      return;
    }

    setLoading(true);

    // If "ALL" is selected, get all product IDs from the selected BU
    const companyValue = selectedProduct === "ALL" 
      ? availableProducts.map(p => p.productId).join(",")
      : selectedProduct;

    const payload = {
      company: companyValue,
      from: dayjs(fromDate).format("YYYY-MM-DD"),
      to: dayjs(toDate).format("YYYY-MM-DD"),
      openTickets: includeOpenTickets,
      filterType: filterType, // 'created' | 'closed' | 'escalated'
    };

    try {
      console.log("📤 Sending payload:", payload);
      
      const response = await fetch(
        "https://i3wclk4drxbhspuirj4g326loq0pwspz.lambda-url.us-east-1.on.aws/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("📥 Received result:", result);
      
      if (result.success) { 
        console.log("✅ Success data:", result.success);
        console.log("📊 Total tickets:", result.success.total_tickets);
        console.log("📊 Escalated tickets:", result.success.total_tickets_escalated);
        if (result.success.escalations_per_ticket.length > 0) {
          console.log("📋 First ticket sample:", result.success.escalations_per_ticket[0]);
        }
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
      

      // Group the data by weeks based on filterType
      const grouped = result.success.escalations_per_ticket.reduce(
        (acc, ticket) => {
          ticket.escalationReasons.forEach((reason) => {
            // Determine which week to use based on filterType
            let week;
            switch (filterType) {
              case 'created':
                week = ticket.weekNumber; // Week when ticket was created
                break;
              case 'closed':
                week = getWeekNumber(ticket.ticketClosed); // Week when ticket was closed
                break;
              case 'escalated':
              default:
                week = reason.week; // Week when escalation occurred
                break;
            }
            
            if (!acc[week]) {
              acc[week] = [];
            }
            acc[week].push({
              ticketId: ticket.ticketId,
              ticketCreated: ticket.ticketCreated,
              ticketClosed: ticket.ticketClosed,
              product: ticket.product,
              status: ticket.status,
              weekNumber: week, // Use the calculated week based on filterType
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

  // Removed complex grid system - using simple 3-column grid instead

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box m="20px">
        <Header
          title={`Escalations Report`}
          subtitle={`Calculate escalations per week for a selected product. Choose how to filter: by when escalations occurred (recommended), when tickets closed, or when tickets were created.`}
        />

        {/*- ROW 1: Business Unit and Product Selection -*/}
        <Box 
          display="grid"
          gridTemplateColumns="1fr 1fr"
          gap={3}
          mb={3}
        >
          {/* Business Unit Selector */}
          <FormControl fullWidth variant="outlined">
            <InputLabel
              id="bu-label"
              style={{
                color: selectedBU
                  ? colors.greenAccent[300]
                  : colors.redAccent[300],
                fontSize: "11px",
              }}
            >
              Business Unit
            </InputLabel>

            <Select
              labelId="bu-label"
              value={selectedBU}
              onChange={(e) => setSelectedBU(e.target.value)}
              onClick={() => {
                if (!businessUnits.length) {
                  alert("Your session has expired. You will be redirected to the login screen.");
                  window.location.href = "/login";
                }
              }}
              label="Business Unit"
              sx={{
                backgroundColor: transparent(colors.blueAccent[900]),
                fontSize: "11px",
              }}
            >
              {businessUnits.map((bu) => (
                <MenuItem key={bu} value={bu} sx={{ fontSize: "11px" }}>
                  {bu}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Product Selector */}
          <FormControl fullWidth variant="outlined">
            <InputLabel
              id="product-label"
              style={{
                color: selectedProduct
                  ? colors.greenAccent[300]
                  : (selectedBU ? colors.redAccent[300] : colors.grey[600]),
                fontSize: "11px",
              }}
            >
              {selectedBU ? "Product" : "Product (Select BU first)"}
            </InputLabel>

            <Select
              labelId="product-label"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={!selectedBU}
              label={selectedBU ? "Product" : "Product (Select BU first)"}
              sx={{
                backgroundColor: transparent(colors.blueAccent[900]),
                opacity: selectedBU ? 1 : 0.5,
                fontSize: "11px",
              }}
            >
              {/* ALL option */}
              <MenuItem value="ALL" sx={{ fontSize: "11px", fontWeight: "bold", color: colors.greenAccent[400] }}>
                ALL (Calculate all products in {selectedBU})
              </MenuItem>
              
            {availableProducts.map((product) => (
              <MenuItem key={product.productId} value={product.productId} sx={{ fontSize: "11px" }}>
                {product.productId}
              </MenuItem>
            ))}
            </Select>
          </FormControl>
        </Box>

        {/*- ROW 2: Filters and Date Selection -*/}
        <Box 
          display="flex" 
          gap={2} 
          mb={4} 
          alignItems="center"
          flexWrap="wrap"
        >
          {/* Filter Type Selector */}
          <FormControl sx={{ minWidth: 200 }} variant="outlined">
            <InputLabel
              id="filter-type-label"
              style={{
                color: colors.blueAccent[300],
                fontSize: "11px",
              }}
            >
              Filter By
            </InputLabel>
            <Select
              labelId="filter-type-label"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Filter By"
              sx={{
                backgroundColor: transparent(colors.blueAccent[900]),
                fontSize: "11px",
              }}
            >
              <MenuItem value="escalated" sx={{ fontSize: "11px" }}>
                Escalations Occurred
              </MenuItem>
              <MenuItem value="closed" sx={{ fontSize: "11px" }}>
                Tickets Closed
              </MenuItem>
              <MenuItem value="created" sx={{ fontSize: "11px" }}>
                Tickets Created
              </MenuItem>
            </Select>
          </FormControl>

          {/* Date Pickers */}
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
                  minWidth: 150,
                  fontSize: "11px",
                }}
              />
            )}
            sx={{ minWidth: 150 }}
            slotProps={{
              textField: {
                InputProps: {
                  style: { fontSize: "11px" }
                },
                InputLabelProps: {
                  style: { fontSize: "11px" }
                }
              }
            }}
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
                  minWidth: 150,
                  fontSize: "11px",
                }}
              />
            )}
            sx={{ minWidth: 150 }}
            slotProps={{
              textField: {
                InputProps: {
                  style: { fontSize: "11px" }
                },
                InputLabelProps: {
                  style: { fontSize: "11px" }
                }
              }
            }}
          />

          {/* Include Open Tickets Checkbox - Only show when filter is NOT "closed" */}
          {filterType !== 'closed' && (
            <Box display="flex" alignItems="center" gap={1}>
              <Checkbox
                checked={includeOpenTickets}
                onChange={(e) => setIncludeOpenTickets(e.target.checked)}
                sx={{
                  color: includeOpenTickets ? colors.greenAccent[400] : colors.primary[100],
                  "&.Mui-checked": {
                    color: colors.greenAccent[400],
                  },
                  padding: "8px",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: includeOpenTickets ? colors.greenAccent[400] : colors.primary[100],
                  fontSize: "11px",
                }}
              >
                Include Open Tickets
              </Typography>
            </Box>
          )}

          {/* Submit and Download Buttons */}
          <Box display="flex" flexDirection="column" gap={1} marginLeft="auto">
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                backgroundColor: colors.greenAccent[300],
                color: colors.primary[900],
                minWidth: "120px", 
                minHeight: "45px",
                fontSize: "11px",
                "&:hover": {
                  backgroundColor: colors.greenAccent[700],
                },
                "&:disabled": {
                  backgroundColor: colors.grey[700],
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Submit"}
            </Button>

            {/* Download CSV Button - Only show when there's data */}
            {!loading && data && data.escalations_per_ticket && data.escalations_per_ticket.length > 0 && (
              <Button
                variant="outlined"
                onClick={downloadCSV}
                sx={{
                  borderColor: colors.blueAccent[300],
                  color: colors.blueAccent[300],
                  minWidth: "120px",
                  minHeight: "35px",
                  fontSize: "10px",
                  "&:hover": {
                    borderColor: colors.blueAccent[500],
                    backgroundColor: transparent(colors.blueAccent[900], 0.1),
                  },
                }}
              >
                Download CSV
              </Button>
            )}
          </Box>
        </Box>

        {!loading && data && (
          <>
            {/*- Statistics Row -*/}
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              gap={3}
              mb={4}
            >
              {/*- Total Tickets Widget -*/}
              <Box
                backgroundColor={colors.primary[400]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="8px"
                p={2}
                minHeight="120px"
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
                backgroundColor={colors.primary[400]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="8px"
                p={2}
                minHeight="120px"
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
                backgroundColor={colors.primary[400]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="8px"
                p={2}
                minHeight="120px"
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
              .map((week) => {
                // Sort data within each week
                const weekData = [...groupedData[week]];
                if (sortBy) {
                  weekData.sort((a, b) => {
                    let aVal = a[sortBy];
                    let bVal = b[sortBy];
                    
                    // Handle nulls
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;
                    
                    // Compare
                    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                  });
                }
                
                return (
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
                    <Table sx={{ tableLayout: "fixed", width: "100%" }}>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "6%",
                              textAlign: "center",
                              cursor: "pointer",
                              "&:hover": { backgroundColor: transparent(colors.blueAccent[900], 0.5) }
                            }}
                            onClick={() => handleSort('ticketId')}
                          >
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                              Ticket ID
                              {sortBy === 'ticketId' && (
                                sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "8%",
                              textAlign: "center",
                            }}
                          >
                            Ticket Created
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "8%",
                              textAlign: "center",
                            }}
                          >
                            Ticket Closed
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "8%",
                              textAlign: "center",
                            }}
                          >
                            Escalation Timestamp
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "5%",
                              textAlign: "center",
                            }}
                          >
                            {filterType === 'created' ? 'Week Created' : 
                             filterType === 'closed' ? 'Week Closed' : 
                             'Week Escalated'}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "4%",
                              textAlign: "center",
                            }}
                          >
                            Count
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "10%",
                              textAlign: "center",
                              cursor: "pointer",
                              "&:hover": { backgroundColor: transparent(colors.blueAccent[900], 0.5) }
                            }}
                            onClick={() => handleSort('product')}
                          >
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                              Product
                              {sortBy === 'product' && (
                                sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "6%",
                              textAlign: "center",
                            }}
                          >
                            Status
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "22%",
                              textAlign: "center",
                            }}
                          >
                            Escalation Reasons
                          </TableCell>
                          <TableCell
                            sx={{
                              color: colors.primary[100],
                              fontWeight: "bold",
                              width: "23%",
                              textAlign: "center",
                            }}
                          >
                           AI Analysis
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {weekData.map((ticket, index) => (
                          <TableRow key={index}>
                            <TableCell
                              sx={{
                                textAlign: "center",
                                color: colors.greenAccent[300],
                              }}
                            >
                              <a
                                href={`https://central-supportdesk.kayako.com/agent/conversations/${ticket.ticketId}`}
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
                              {formatDateTime(ticket.ticketCreated, colors)}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {formatDateTime(ticket.ticketClosed, colors)}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {formatDateTime(ticket.date, colors)}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {ticket.weekNumber}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {ticket.escalationsCount}
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: "center", 
                              fontSize: "11px",
                              wordWrap: "break-word",
                              whiteSpace: "normal",
                              overflow: "hidden"
                            }}>
                              {ticket.product || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: "center", 
                              fontSize: "11px",
                              color: ticket.status === 'Closed' ? colors.greenAccent[400] : 
                                     ticket.status === 'Completed' ? colors.blueAccent[400] :
                                     ticket.status === 'New' ? colors.orangeAccent?.[200] || '#ffb74d' :
                                     ticket.status === 'Open' ? colors.redAccent[300] :
                                     ticket.status === 'Pending' ? colors.yellowAccent?.[400] || '#ffa726' :
                                     ticket.status === 'Hold' ? colors.grey[400] :
                                     colors.grey[400]
                            }}>
                              {ticket.status || 'Unknown'}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: "11px" }}>
                              {ticket.reason}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: "11px" }}>
                              {ticket.analysis}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            })}
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default EscalationsReport;
