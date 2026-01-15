import React from 'react';
import GoogleLoginButton from './GoogleLoginButton';   
import { Box, Typography, useTheme } from '@mui/material';
import { tokens } from '../../theme';
import { styled } from '@mui/system';

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  backgroundColor: '#39404d', // Background color for the container
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: '7', // 70% of the total width
  position: 'relative', // Enable z-index for stacking
  backgroundColor: '#141B2D', // Dark background for the left panel
}));

const RightPanel = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: '3', // 30% of the total width
  backgroundColor: '#768aa5', // Lighter blue background for the right panel
  zIndex: 3, // Highest z-index to ensure it stays in front
}));

const LogoImage = styled('img')({
  width: '60%', 
  height: 'auto',
  objectFit: 'contain',
  zIndex: 2, // Higher z-index for the front logo image
  position: 'relative',
});

const BackgroundImage = styled('img')({
  position: 'absolute',
  top: '0', // Aligns the background image properly
  left: '0',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: 1, // Lower z-index for the background image
});

const LoginBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#1c1e26', // Dark background for the login box
  borderRadius: '10px',
  padding: '2rem',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
  maxWidth: '400px',
  width: '100%',
  textAlign: 'center',
}));

function Login() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Container>
      <LeftPanel>
        <BackgroundImage 
          src="https://i.imgur.com/d8AxM5e.png" // Lighter background image
          alt="Background Image" 
        />
        <LogoImage 
          src="https://i.imgur.com/e4S1SRB.png" // Transparent logo image
          alt="Olympus Logo" 
        />
      </LeftPanel>

      <RightPanel>
        <LoginBox>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#ffffff' }}>
            Welcome to ATLAS Olympus
          </Typography>
          <Typography variant="h6" align="center" gutterBottom sx={{ color: '#78C0A8' }}>
            Login with Google
          </Typography>

          <GoogleLoginButton />
        </LoginBox>
      </RightPanel>

      {/* Version number - Fixed position at bottom right */}
      <Box
        sx={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          zIndex: 1000,
          backgroundColor: "rgba(0, 0, 0, 0.6)", // Semi-transparent black background
          padding: "6px 12px", // Padding inside the box
          borderRadius: "6px", // Rounded corners
          backdropFilter: "blur(4px)", // Slight blur effect for modern look
        }}
      >
        <Typography
          sx={{
            color: colors.redAccent[400],
            fontSize: "11px",
            fontWeight: "bold",
            opacity: 1, // Full opacity now since we have background
            transition: "color 0.2s ease",
            "&:hover": {
              color: colors.redAccent[300], // Lighter color on hover
            },
          }}
        >
          v.1.15012026A
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;
