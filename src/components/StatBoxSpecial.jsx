import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";

const StatBoxSpecial = ({
  title = "Title",
  subtitle = "Subtitle",        
  icon,
  rightValue = "Right Value",     
  rightCaption = "Right Caption",    
  rightSize = 62,  
  rightColor,      
}) => {
  
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const numberColor = rightColor || colors.greenAccent[300];

  return (
    <Box width="100%" m="0 30px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          {icon}
          <Typography variant="h4" fontWeight="bold" sx={{ color: colors.grey[100] }}>
            {title}
          </Typography>
        </Box>

        {/* Derecha: número grande */}
        <Box textAlign="right" display="flex" flexDirection="column" alignItems="flex-end">
        <Typography
          sx={{
            fontSize: rightSize,
            lineHeight: 1,
            fontWeight: 800,
            color: numberColor,
            position: "relative",
            top: "12px"   // baja el 1594
          }}
        >
          {rightValue}
        </Typography>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" mt="2px" alignItems="center">
        <Typography variant="h5" sx={{ color: colors.greenAccent[300] }}>
          {subtitle}
        </Typography>
        <Typography variant="h5" fontStyle="italic" sx={{ color: colors.greenAccent[400] }}>
          {rightCaption}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatBoxSpecial;
