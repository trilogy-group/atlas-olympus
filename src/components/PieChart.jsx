import { ResponsivePie } from "@nivo/pie";
import { tokens } from "../theme";
import { useTheme, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getProductID } from "../data/fetchData";
import { useIsForcedMobile } from "../hooks/useIsMobile";

const PieChart = ({ dataArray, view = "total" }) => { 
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const isMobileWidth = useMediaQuery(theme.breakpoints.down('sm'));
  const isForcedMobile = useIsForcedMobile();
  const isMobile = isMobileWidth || isForcedMobile;
  
  // Detect portrait orientation specifically (for mobile-only features)
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isPortraitMobile = isMobile && isPortrait;

  const currentPath = window.location.pathname;

  const handleClick = (data) => {
    // Use productId if available (contains the real product ID)
    const productId = data.data?.productId || data.productId || data.id;
    
    // Don't call getProductID if we already have the productId field,
    // because productId already contains the real ID we need
    const idToUse = data.data?.productId || data.productId 
      ? productId 
      : getProductID(productId);
    
    let newPath = `${currentPath}/${idToUse.toLowerCase().replace('/', '-').replace(' ','')}`;
    newPath = newPath.replace(/passive\//, '');
    navigate(newPath);
  };

  return (
    <ResponsivePie
      data={dataArray}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
              fontSize: isMobile ? '10px' : '8px', 
            },
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.grey[100],
              fontSize: isMobile ? '10px' : '8px', 
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
            fontSize: isMobile ? '11px' : '8px', 
          },
        },
        tooltip: {
          container: {
            background: colors.grey[800],
            color: colors.grey[100],
            fontSize: isMobile ? '12px' : '10px', 
          },
        },
        labels: {
          text: {
            fontSize: isMobile ? '11px' : '8px', 
          },
        },
 
      }}
      margin={isMobile 
        ? { top: 70, right: 10, bottom: 80, left: 10 } 
        : { top: 60, right: 70, bottom: 60, left: -40 }
      }
      innerRadius={view === "total" ? 0.3 : 0.7}
      padAngle={0.7}
      cornerRadius={10}
      activeOuterRadiusOffset={8}
      borderColor={{
        from: "color",
        modifiers: [["darker", 0.2]],
      }}
      motionConfig="slow"
      enableArcLinkLabels={!isPortraitMobile}
      arcLinkLabel="label"
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsOffset={0}
      arcLinkLabelsDiagonalLength={20}
      arcLinkLabelsTextColor={colors.grey[100]}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      enableArcLabels={false}
      arcLabelsRadiusOffset={0.4}
      arcLabelsSkipAngle={5}
      arcLabelsTextColor={{
        from: "color",
        modifiers: [["darker", 2]],
      }}
      legends={[]}
      tooltip={({ datum }) => (
        <div
          style={{
            padding: '12px 16px',
            background: colors.grey[800],
            color: colors.grey[100],
            fontSize: isMobile ? '12px' : '10px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <strong>{datum.label}</strong>: {datum.value} tickets
        </div>
      )}
      onClick={handleClick}
          onMouseEnter={(data, event) => {
            event.target.style.cursor = "pointer";
          }}
          onMouseLeave={(data, event) => {
            event.target.style.cursor = "default";
          }}
    />
  );
};

export default PieChart;
