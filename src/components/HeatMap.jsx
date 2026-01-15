import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import { ResponsiveHeatMap } from '@nivo/heatmap';

const transparent = (hex, alpha = 0.3) => {
  const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const result = regex.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const HeatMap = ({data}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const customTooltip = ({ cell }) => {
    return (
      <div style={{
        padding: '6px 9px',
        color: colors.grey[900],
        background: transparent(colors.grey[100], 0.8),
        fontSize: '8px',
        borderRadius: '4px',
        whiteSpace: 'nowrap', 
        minWidth: 'max-content',  
        display: 'inline-block'  
      }}>
        <strong>{cell.serieId} {cell.data.x}</strong>: {cell.data.y} tickets
      </div>
    );
  };

  return (
    <ResponsiveHeatMap
      data={data}
      margin={{ 
        top: 0,
        right: 90, 
        bottom: 40, 
        left: 90 
      }}
      valueFormat=">-.2s"
      xInnerPadding={0.1}
      yOuterPadding={0.35}
      yInnerPadding={0.1}
      axisTop={{
        tickRotation: -50,
        tickSize: 5,      
        tickPadding: 5    
      }}
      axisLeft={{
        tickSize: 5,  
        tickPadding: 5  
      }}
      colors={{ 
        type: 'sequential', 
        scheme: 'blues', 
        minValue: 63, 
        maxValue: 74 
      }}
      borderRadius={5}
      opacity={0.85}
      borderWidth={3}
      borderColor={{ from: 'color', modifiers: [['darker', 3]] }}
      theme={{
        axis: {
          ticks: {
            line: { 
              stroke: colors.grey[100], 
            },
            text: { 
              fill: colors.grey[100], 
              fontSize: 10, 
              fontWeight: 600 
            },
          },
        },
        labels: { 
          text: { 
            fill: colors.grey[100], 
            fontSize: 25, 
            fontWeight: 1000
          } 
        }
      }}
      tooltip={customTooltip}  // Usamos el tooltip personalizado
    />
  );
};
export default HeatMap;
