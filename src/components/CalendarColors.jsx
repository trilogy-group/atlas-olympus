import { ResponsiveCalendar } from '@nivo/calendar'
import { tokens } from "../theme";
import {
    useTheme,
    Box,
    Button,
    Typography,
    Paper,
    Grid,
    Checkbox,
    CircularProgress,
    TextField,
    useMediaQuery,
  } from "@mui/material";

const transparent = (hex, alpha = 0.3) => {
    const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    const result = regex.exec(hex);
    if (!result) return hex;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleClick = (data) => { 
    console.log(data)
  };


// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

const CalendarColors = ({ data, fromDate = "2025-01-01", toDate = "2025-03-05"}) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    
    const none = colors.redAccent[400]; // Rojo intenso
    const low = colors.redAccent[200]; // Solo rojo
    const medium = colors.blueAccent[200]; // Azul
    const high = colors.greenAccent[200]; // Verde Claro
    const extra = colors.greenAccent[400]; // Super Verde
    const empty = transparent(colors.primary[100]);

    const isTinyScreen = useMediaQuery("(max-width: 480px)");
    const isSmallScreen = useMediaQuery("(max-width: 600px)");
    const isMediumScreen = useMediaQuery("(max-width: 960px)");

    const getMargins = () => {
        if (isTinyScreen) return { top: 1, right: 1, bottom: 1, left: 1 };
        if (isSmallScreen) return { top: 10, right: 10, bottom: 10, left: 10 };
        if (isMediumScreen) return { top: 20, right: 20, bottom: 20, left: 20 };
        return { top: 40, right: 40, bottom: 40, left: 40 }; 
    };

    return (
        <Paper
            key='whatever'
            id={`tile-${12}`}
            sx={{
                backgroundColor: transparent(colors.blueAccent[900]),
                color: colors.primary[100],
                height: "45%", 
                width: "70%", 
            }}
        >
            <ResponsiveCalendar
                data={data}
                from={fromDate}
                to={toDate}
                emptyColor={empty}
                colors={[none, low, medium, high, extra]}
                margin={getMargins()} // Usa los márgenes dinámicos
                yearSpacing={40}
                monthSpacing={35}
                monthBorderColor="#000000"
                monthLegendOffset={8}
                dayBorderWidth={1}
                dayBorderColor="#000000"
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'row',
                        translateY: 36,
                        itemCount: 4,
                        itemWidth: 42,
                        itemHeight: 36,
                        itemsSpacing: 14,
                        itemDirection: 'right-to-left',
                        symbolSize: 10,
                        symbolShape: "circle",
                        itemTextColor: colors.primary[100],
                        onClick: handleClick,
                    }
                ]}
                theme={{
                    textColor: colors.primary[100], 
                    legends: {
                        text: { fill: colors.primary[100] }
                    },
                    labels: {
                        text: { fill: colors.primary[100] }
                    },
                    axis: {
                        legend: {
                            text: { fill: colors.primary[100] }
                        }
                    },
                    tooltip: {  
                        container: {
                            background: transparent(colors.primary[900], 0.8),
                            color: colors.primary[100],
                            fontSize: "10px",
                            fontWeight: "bold",
                            borderRadius: "3px",
                            padding: "8px"
                        }
                    },
                    days: { cursor: "pointer" },
                }}
                onClick={handleClick}
                onMouseEnter={(data, event) => event.target.style.cursor = "pointer"}
                onMouseLeave={(data, event) => event.target.style.cursor = "default"}
            />
        </Paper>
    );
};

export default CalendarColors;