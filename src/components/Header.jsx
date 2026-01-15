import { Typography, Box, useTheme, useMediaQuery } from "@mui/material";
import { tokens } from "../theme";
import { useIsForcedMobile } from "../hooks/useIsMobile";


const Header = ({ title, subtitle }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isMobileWidth = useMediaQuery(theme.breakpoints.down('sm'));
    const isForcedMobile = useIsForcedMobile();
    const isMobile = isMobileWidth || isForcedMobile;
    
    return (
        <Box mb={isMobile ? "15px" : "30px"}>
            <Typography 
                variant={isMobile ? "h4" : "h2"}
                color={colors.grey[100]} 
                fontWeight="bold" 
                sx={{ mb: isMobile ? "3px" : "5px" }}
            >
                {title} 
            </Typography>
            <Typography 
                variant={isMobile ? "body2" : "h5"}
                color={colors.greenAccent[400]} 
            >{subtitle}
            </Typography>
        </Box>
    );
};

export default Header;