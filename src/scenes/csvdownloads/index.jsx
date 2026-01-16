import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Checkbox,
  CircularProgress,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";

import Header from "../../components/Header";

const transparent = (hex, alpha = 0.3) => {
  const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const result = regex.exec(hex);
  if (!result) return hex;
  const [r, g, b] = [result[1], result[2], result[3]].map((val) => parseInt(val, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CSVDownloads = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [reports, setReports] = useState([
    { name: "1 Day Metrics", checked: false, processing: false, clonedFileUrl: null, sheet_id: "1j1SCJrBrYb8Dx5l6QkMB9SX7WMkV_ZzSZOCxs3Tm6Os" },
    { name: "1 Week Metrics", checked: false, processing: false, clonedFileUrl: null, sheet_id: "1zUZJJsqkKfs9Fu4gx5tOW9m216Kft5ucdoutcY02LEM" },
    { name: "4 Weeks Metrics", checked: false, processing: false, clonedFileUrl: null, sheet_id: "1I5cdCL3k_h25DGzySpkQQuqsn0Rbuv-KafEEtVCgj3E" },
    // { name: "Custom Metrics", checked: false, processing: false, clonedFileUrl: null, sheet_id: "CUSTOM" },
  ]);

  const [csatReports, setCsatReports] = useState([
    { name: "CSAT (1 Day)", checked: false, processing: false, sheet_id: "1j1SCJrBrYb8Dx5l6QkMB9SX7WMkV_ZzSZOCxs3Tm6Os" },
    { name: "CSAT (1 Week)", checked: false, processing: false, sheet_id: "1zUZJJsqkKfs9Fu4gx5tOW9m216Kft5ucdoutcY02LEM" },
    { name: "CSAT (4 Weeks)", checked: false, processing: false, sheet_id: "1I5cdCL3k_h25DGzySpkQQuqsn0Rbuv-KafEEtVCgj3E" },
  ]);

  const [dataGridRows, setDataGridRows] = useState([]);
  const [loadingDataGrid, setLoadingDataGrid] = useState(true);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showDatePickers, setShowDatePickers] = useState(false);
  const [customProcessing, setCustomProcessing] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const fileName = `[ ${userInfo.given_name} ] - `;

  const fetchDataGridData = async () => {
    setLoadingDataGrid(true);
    try {
      const response = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets/11W21HKGz7oo_sCn3inX6LbrCGq7tjkug_hUG0Y3EN48/values/Reports!B1:D?key=AIzaSyCO8yb8FFHwAbaJR6YmfQXKgZxkGEQjk5A"
      );
      const data = await response.json();
      const rows = data.values.slice(1).reverse().map((row, index) => ({
        id: index,
        date: row[0],
        link: row[1],
        name: row[2],
      }));
      setDataGridRows(rows);
    } catch (error) {
      console.error("Error fetching DataGrid data:", error);
    } finally {
      setLoadingDataGrid(false);
    }
  };

  useEffect(() => {
    fetchDataGridData();
  }, []);

  const handleCheck = (index) => {
    const updatedReports = [...reports];
    updatedReports[index].checked = !updatedReports[index].checked;
    setReports(updatedReports);

    if (updatedReports[index].name === "Custom Metrics") {
      setShowDatePickers(updatedReports[index].checked);
    }
  };

  const handleCsatCheck = (index) => {
    const updatedReports = [...csatReports];
    updatedReports[index].checked = !updatedReports[index].checked;
    setCsatReports(updatedReports);
  };

  const handleProcess = async () => {
    const selectedReports = reports.filter((report) => report.checked);

    if (selectedReports.length === 0) {
      alert("Please select at least one report to process.");
      return;
    }

    for (const report of selectedReports) {
      const index = reports.indexOf(report);

      setReports((prevReports) => {
        const updatedReports = [...prevReports];
        updatedReports[index].processing = true;
        return updatedReports;
      });

      try {
        const payload = {
          sheet_id: report.sheet_id,
          newName: fileName + report.name,
          newViewer: userInfo.email,
        };

        if (report.name === "Custom Metrics") {
          setCustomProcessing(true);
          if (!customStartDate || !customEndDate) {
            alert("Please select both start and end dates for Custom Metrics.");
            setReports((prevReports) => {
              const updatedReports = [...prevReports];
              updatedReports[index].processing = false;
              return updatedReports;
            });
            setCustomProcessing(false);
            return;
          }
          payload.startDate = customStartDate.format("YYYY-MM-DD");
          payload.endDate = customEndDate.format("YYYY-MM-DD");
        }

        const url = "https://o26k6wjinwlv7nwx2w5aqyifaa0cgxrk.lambda-url.us-east-1.on.aws/";

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (data.message?.success) {
          const clonedFileUrl = data.message.clonedFileUrl;
          setReports((prevReports) => {
            const updatedReports = [...prevReports];
            updatedReports[index].clonedFileUrl = clonedFileUrl;
            updatedReports[index].processing = false;
            return updatedReports;
          });
        } else {
          console.error("API call failed", data);
        }
      } catch (error) {
        console.error(`Error processing report ${report.name}:`, error);
      } finally {
        if (report.name === "Custom Metrics") {
          setCustomProcessing(false);
        }
      }
    }

    fetchDataGridData();
  };

  const handleCsatDownload = async () => {
    const selectedReports = csatReports.filter((report) => report.checked);

    if (selectedReports.length === 0) {
      alert("Please select at least one CSAT report to download.");
      return;
    }

    for (const report of selectedReports) {
      const index = csatReports.indexOf(report);

      setCsatReports((prevReports) => {
        const updatedReports = [...prevReports];
        updatedReports[index].processing = true;
        return updatedReports;
      });

      try {
        const payload = {
          sheet_id: report.sheet_id,
        };

        // TODO: Replace with actual Function URL after deployment
        const url = "https://FUNCTION_URL_PLACEHOLDER.lambda-url.us-east-1.on.aws/";

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const csvBlob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(csvBlob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${userInfo.given_name}_${report.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(downloadUrl);
        } else {
          console.error("API call failed", await response.text());
          alert(`Failed to download ${report.name}`);
        }
      } catch (error) {
        console.error(`Error downloading report ${report.name}:`, error);
        alert(`Error downloading ${report.name}: ${error.message}`);
      } finally {
        setCsatReports((prevReports) => {
          const updatedReports = [...prevReports];
          updatedReports[index].processing = false;
          updatedReports[index].checked = false;
          return updatedReports;
        });
      }
    }
  };

  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "name", headerName: "Name", flex: 1 },
    {
      field: "link",
      headerName: "Link",
      flex: 1,
      renderCell: (params) => (
        <a
          href={params.value}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "100%",
          }}
        >
          <img
              src="https://i.imgur.com/7JPoStV.png"
              alt="Google Sheets Icon"
              style={{
                width: "24px",
                height: "24px",
                objectFit: "contain",
              }}
          />
        </a>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box m="20px">
        <Header
          title="CSV Downloads"
          subtitle="This tool allows you to create CSV reports directly in Google Sheets."
        />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box>
              {reports.map((report, index) => (
                <Paper
                  key={index}
                  elevation={3}
                  sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: transparent(colors.blueAccent[900]),
                    color: colors.primary[100],
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid
                      item
                      xs={6}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: report.checked
                          ? colors.greenAccent[300]
                          : colors.primary[100],
                      }}
                    >
                      <Checkbox
                        checked={report.checked}
                        onChange={() => handleCheck(index)}
                        sx={{
                          color: report.checked
                            ? colors.greenAccent[300]
                            : colors.primary[100],
                          "&.Mui-checked": {
                            color: colors.greenAccent[300],
                          },
                          marginRight: "10px",
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          color: report.checked
                            ? colors.greenAccent[300]
                            : colors.primary[100],
                        }}
                      >
                        {report.name}
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sx={{ textAlign: "right" }}>
                      {report.processing ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "10px",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              color: colors.greenAccent[300],
                            }}
                          >
                            Processing...
                          </Typography>
                          <CircularProgress
                            size={24}
                            sx={{
                              color: colors.greenAccent[300],
                            }}
                          />
                        </Box>
                      ) : ( report.clonedFileUrl ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "10px",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              color: colors.greenAccent[300],
                            }}
                          >
                            Open File
                          </Typography>
                          <a
                            href={report.clonedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              textDecoration: "none",
                            }}
                          >
                            <img
                              src="https://i.imgur.com/7JPoStV.png"
                              alt="Google Sheets Icon"
                              style={{
                                width: "24px",
                                height: "24px",
                                objectFit: "contain",
                              }}
                            />
                          </a>
                        </Box>
                      ) : null ) }
                    </Grid>
                  </Grid>

                  {report.name === "Custom Metrics" && showDatePickers && (
                    <Grid container spacing={2} mt={2} alignItems="center">
                      <Grid item xs={4}>
                        <DatePicker
                          label="Start Date"
                          value={customStartDate}
                          onChange={(newValue) => setCustomStartDate(newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <DatePicker
                          label="End Date"
                          value={customEndDate}
                          onChange={(newValue) => setCustomEndDate(newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                      <Grid item xs={4}>

                      </Grid>
                    </Grid>
                  )}
                </Paper>
              ))}
            </Box>
            <Button
              variant="contained"
              onClick={handleProcess}
              sx={{
                mt: 2,
                backgroundColor: colors.greenAccent[300],
                color: colors.primary[900],
                "&:hover": {
                  backgroundColor: colors.greenAccent[700],
                },
              }}
            >
              Process
            </Button>

            {/* CSAT Reports Section */}
            <Box mt={4}>
              <Typography variant="h5" sx={{ color: colors.blueAccent[300], mb: 2, fontWeight: 600 }}>
                📊 CSAT Analysis Reports
              </Typography>
              <Typography variant="body2" sx={{ color: colors.grey[300], mb: 2 }}>
                Download CSV files with AI CSAT scores and justifications
              </Typography>

              {csatReports.map((report, index) => (
                <Paper
                  key={index}
                  elevation={3}
                  sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: transparent(colors.blueAccent[900]),
                    color: colors.primary[100],
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid
                      item
                      xs={6}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: report.checked
                          ? colors.greenAccent[300]
                          : colors.primary[100],
                      }}
                    >
                      <Checkbox
                        checked={report.checked}
                        onChange={() => handleCsatCheck(index)}
                        sx={{
                          color: report.checked
                            ? colors.greenAccent[300]
                            : colors.primary[100],
                          "&.Mui-checked": {
                            color: colors.greenAccent[300],
                          },
                          marginRight: "10px",
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          color: report.checked
                            ? colors.greenAccent[300]
                            : colors.primary[100],
                        }}
                      >
                        {report.name}
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sx={{ textAlign: "right" }}>
                      {report.processing && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "10px",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              color: colors.greenAccent[300],
                            }}
                          >
                            Generating...
                          </Typography>
                          <CircularProgress
                            size={24}
                            sx={{
                              color: colors.greenAccent[300],
                            }}
                          />
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              <Button
                variant="contained"
                onClick={handleCsatDownload}
                sx={{
                  mt: 2,
                  backgroundColor: colors.blueAccent[700],
                  color: colors.grey[100],
                  "&:hover": {
                    backgroundColor: colors.blueAccent[800],
                  },
                }}
              >
                Download CSV
              </Button>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Paper
              sx={{
                height: "100%",
                padding: "20px",
                backgroundColor: transparent(colors.blueAccent[900]),
              }}
            >
              <Header
                title="Reports History"
                subtitle="Below you will find the list of all the reports that have been processed with this tool."
                sx={{
                  "& h4": { fontSize: "1.25rem" },
                  "& h6": { fontSize: "1rem" },
                }}
              />
              {loadingDataGrid ? (
                <CircularProgress color="inherit" />
              ) : (
                <DataGrid
                  rows={dataGridRows}
                  columns={columns}
                  autoHeight
                  disableSelectionOnClick
                  pageSize={15}
                  pagination
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default CSVDownloads;
