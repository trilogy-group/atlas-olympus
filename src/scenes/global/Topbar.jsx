import React, { useContext, useState, useEffect } from "react";
import { Box, Button, IconButton, TextField, useTheme, CircularProgress, Tooltip, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ColorModeContext, tokens } from "../../theme";
import { PeriodContext } from "../../context/PeriodContext";
import { useReload } from "../../context/ReloadContext";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block'; 
import { useLocation } from 'react-router-dom'; 
import dayjs from 'dayjs';
import { useIsMobile } from "../../hooks/useIsMobile";

const Topbar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const isMobile = useIsMobile(); // Detect mobile viewport
    const { period, setPeriod } = useContext(PeriodContext);
    const { triggerReload } = useReload(); 
    const [activeButton, setActiveButton] = useState(2);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startDateError, setStartDateError] = useState("");
    const [endDateError, setEndDateError] = useState("");
    const [loading, setLoading] = useState(false); 
    const [isCustomEnabled, setIsCustomEnabled] = useState(true); 
    const [showPredefinedButtons, setShowPredefinedButtons] = useState(false); 
    const location = useLocation();  

    useEffect(() => {
        const currentUrl = location.pathname; 
        setIsCustomEnabled(currentUrl.includes("/dashboard/passive"));
        setShowPredefinedButtons(currentUrl.includes("/dashboard")); 
    }, [location]);

    const handleButtonClick = (newPeriod, buttonIndex, timeFrame) => {
        localStorage.removeItem('current-timeframe'); 
        localStorage.setItem('current-timeframe', timeFrame); 

        if (buttonIndex === 4 && isCustomEnabled) {
            setShowDatePicker(true);
            setActiveButton(buttonIndex);
            setStartDate(null);
            setEndDate(null);
            setStartDateError("");
            setEndDateError("");
        } else if (buttonIndex !== 4) {
            setShowDatePicker(false);
            setPeriod(newPeriod);
            setActiveButton(buttonIndex);
        }
    };

    const handleApply = async () => {
        let isValid = true;

        if (!startDate) {
            setStartDateError("No Start Date was chosen");
            isValid = false;
        } else {
            setStartDateError("");
        }

        if (!endDate) {
            setEndDateError("No End Date was chosen");
            isValid = false;
        } else {
            setEndDateError("");
        }

        if (isValid && startDate && endDate) {
            setLoading(true); // Activate loading
            const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
            const formattedEndDate = dayjs(endDate).format('YYYY-MM-DD');
            
            localStorage.setItem("performGetTotalsAll-CUSTOM", ``);
            localStorage.setItem("datesChoosen", `${formattedStartDate}***${formattedEndDate}`);
            
            setPeriod(4);
            triggerReload();

            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate a delay

            setLoading(false); 
        }
    };

    const handleBackClick = () => {
        window.history.back(); 
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                p={isMobile ? 0.5 : 1}
                flexWrap="nowrap"
            >
                {/* Color mode switcher */}
                <Box display="flex" alignItems="center" flexShrink={0}>
                    <IconButton onClick={colorMode.toggleColorMode}>
                        {theme.palette.mode === "dark" ? (
                            <DarkModeOutlinedIcon />
                        ) : (
                            <LightModeOutlinedIcon />
                        )}
                    </IconButton>
                </Box>

                <Box display="flex" alignItems="center" position="relative" flexWrap={isMobile ? "wrap" : "nowrap"} flex={1} justifyContent="center">
                    {/* Back button */}
                    <Button
                        sx={{
                            color: colors.grey[100],
                            fontSize: isMobile ? "8px" : "10px",
                            fontWeight: "bold",
                            padding: isMobile ? "5px 10px" : "10px 20px",
                            marginRight: isMobile ? "5px" : "10px",
                            minWidth: isMobile ? "auto" : "64px",
                        }}
                        onClick={handleBackClick}
                    >
                        <ArrowBackIcon fontSize={isMobile ? "small" : "medium"} />
                    </Button>

                    {/* Predefined period buttons */}
                    {showPredefinedButtons && (
                        <>
                            <Button
                                sx={{
                                    color: activeButton === 0 ? colors.greenAccent[600] : colors.grey[100],
                                    fontSize: isMobile ? "8px" : "10px",
                                    fontWeight: "bold",
                                    padding: isMobile ? "5px 8px" : "10px 20px",
                                    minWidth: isMobile ? "auto" : "64px",
                                }}
                                onClick={() => handleButtonClick(0, 0, "1 Day")}
                            >
                                1 Day
                            </Button>

                            <Button
                                sx={{
                                    color: activeButton === 1 ? colors.greenAccent[600] : colors.grey[100],
                                    fontSize: isMobile ? "8px" : "10px",
                                    fontWeight: "bold",
                                    padding: isMobile ? "5px 8px" : "10px 20px",
                                    minWidth: isMobile ? "auto" : "64px",
                                }}
                                onClick={() => handleButtonClick(1, 1, "1 Week")}
                            >
                                1 Week
                            </Button>

                            <Button
                                sx={{
                                    color: activeButton === 2 ? colors.greenAccent[600] : colors.grey[100],
                                    fontSize: isMobile ? "8px" : "10px",
                                    fontWeight: "bold",
                                    padding: isMobile ? "5px 8px" : "10px 20px",
                                    minWidth: isMobile ? "auto" : "64px",
                                }}
                                onClick={() => handleButtonClick(2, 2, "4 Weeks")}
                            >
                                4 Weeks
                            </Button>
                        </>
                    )}

                    {/* Custom date button */}
                    <Tooltip
                        title={!isCustomEnabled ? `Button disabled from this screen. Please click on "All Stats:" link` : ""}
                        arrow
                    >
                        <span>
                            <Button
                                sx={{
                                    color: isCustomEnabled ? (activeButton === 4 ? colors.greenAccent[600] : colors.grey[100]) : colors.grey[600],
                                    fontSize: isMobile ? "8px" : "10px",
                                    fontWeight: "bold",
                                    padding: isMobile ? "5px 8px" : "10px 20px",
                                    cursor: isCustomEnabled ? "pointer" : "not-allowed",
                                    minWidth: isMobile ? "auto" : "64px",
                                }}
                                onClick={() => handleButtonClick(4, 4, "Custom")}
                                disabled={!isCustomEnabled}
                            >
                                {isCustomEnabled ? "Custom" : <BlockIcon fontSize={isMobile ? "small" : "medium"} />}
                            </Button>
                        </span>
                    </Tooltip>

                    {/* Date picker and Apply button, only show when isCustomEnabled is true */}
                    {isCustomEnabled && showDatePicker && (
                        <Box display="flex" alignItems="center" gap={1} position="absolute" top="100%" left={0} height="100%" mt={1} flexDirection="row">
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                textField={(params) => 
                                    <TextField 
                                        {...params} 
                                        error={Boolean(startDateError)}
                                        helperText={startDateError}
                                    />
                                }
                            />
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                textField={(params) => 
                                    <TextField 
                                        {...params} 
                                        error={Boolean(endDateError)}
                                        helperText={endDateError}
                                    />
                                }
                            />
                            
                            <Button
                                sx={{
                                    color: colors.greenAccent[600],
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    padding: "10px 20px",
                                }}
                                onClick={handleApply} 
                            >
                                APPLY
                            </Button>

                            {loading && (
                                <Box ml={2}>
                                    <CircularProgress size={24} color="inherit" />
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Logo and version */}
                <Box display="flex" flexDirection="column" alignItems="center" gap={2} position="relative" flexShrink={0}>
                    <img src="https://i.imgur.com/fPrHpkP.png" alt="logo" height={45} />
                    <Typography
                        sx={{
                            color: colors.redAccent[400],
                            fontSize: "12px",
                            fontWeight: "bold",
                            position: "absolute",
                            bottom: "-19px",
                            left: "-28px", 
                        }}
                    >
                        <a>
                            v.1.15012026A
                        </a>
                    </Typography>
                </Box>
                
            </Box>
        </LocalizationProvider>
    );
};

export default Topbar;
