import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { tokens } from "../theme";
import { useTheme } from "@mui/material";

const SimpleAreaChart = ({ data, colorObject, percent = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  

  const renderColorfulTooltipContent = ({ payload, label, active }) => {
    if (active && payload && payload.length) {
      const currentValue = payload[0].value;

      const currentIndex = data.findIndex(item => item.Week === label);
      const previousValue = currentIndex > 0 ? data[currentIndex - 1].Total : 0;
      const percentChange = previousValue > 0 
      ? !percent 
        ? (((currentValue - previousValue) / previousValue) * 100).toFixed(1) 
        : (currentValue - previousValue).toFixed(2)
      : 0;

      let backgroundColor = colors.blueAccent[900];
      let backgroundTransparency = 0.6;
      let backgroundCustomColor = `rgba(${parseInt(backgroundColor.slice(1, 3), 16)}, ${parseInt(backgroundColor.slice(3, 5), 16)}, ${parseInt(backgroundColor.slice(5, 7), 16)}, ${backgroundTransparency})`


      return (
        <div style={{
            padding: '10px', 
            backgroundColor: backgroundCustomColor, 
            color: colors.primary[200], 
            borderRadius: '16px',
            maxWidth: '330px',
          }}>
          <p style={{
              margin: '0', 
              paddingBottom: '5px', 
              fontWeight: 'bold',
            }}>
            Total
          </p>
          <p style={{
              margin: '5px 0px', 
              fontSize: '14px',
            }}>
            {label}
          </p>
          <p style={{
              margin: '0', 
              fontSize: '20px', 
              fontWeight: 'bold',
            }}>
            {currentValue} {!percent ? "Tickets" : "%"}
          </p>
          <p style={{
              marginTop: '5px', 
              color: percentChange < 0 ? colors.redAccent[600] : colors.greenAccent[700], 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
            }}>
            <span style={{
                backgroundColor: percentChange < 0 ? colors.redAccent[600] : colors.greenAccent[700],
                color: colors.primary[100],
                padding: '2px 5px',
                borderRadius: '3px',
                marginRight: '5px',
                fontSize: '12px',
              }}>
              {percentChange}%
            </span>
            from previous week ({previousValue} → {currentValue})
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="60%">
      <AreaChart
        width={500}
        height={500}
        data={data}
        margin={{
          top: 0,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="1 5" />
        <XAxis 
          dataKey="Week" 
          stroke={colors.primary[100]}
        />
        <YAxis  
          stroke={colors.primary[100]} 
        />
        <Tooltip content={renderColorfulTooltipContent} /> 
        <Area 
            type="linear" 
            dataKey="Total" 
            stroke={colorObject.stroke} 
            fill={colorObject.fill} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SimpleAreaChart;

