import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Custom hook to detect if the current viewport is mobile size
 * @returns {boolean} true if viewport width is less than 600px (real mobile phones only)
 */
export const useIsMobile = () => {
  const theme = useTheme();
  // sm = 600px - Only TRUE for real phones (iPhone, Android)
  // Desktop/Tablets will be FALSE and show normal layout
  return useMediaQuery(theme.breakpoints.down('sm'));
};

/**
 * Custom hook to force mobile layout for Safari (any platform) or any iOS/Android device.
 * Safari user agents include "Safari" but not "Chrome"/"Chromium".
 * iOS/Android are detected by common substrings.
 */
export const useIsForcedMobile = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium/i.test(ua);

  return isIOS || isAndroid || isSafari;
};

/**
 * Custom hook to detect if the current viewport is tablet size
 * @returns {boolean} true if viewport width is between 600px and 960px
 */
export const useIsTablet = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('sm', 'md'));
};

/**
 * Custom hook to detect if the current viewport is mobile or tablet
 * @returns {boolean} true if viewport width is less than 960px
 */
export const useIsMobileOrTablet = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};

