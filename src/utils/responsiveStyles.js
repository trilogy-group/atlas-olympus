/**
 * Responsive style utilities for Atlas Olympus
 * Provides consistent responsive breakpoints and grid configurations across the app
 */

/**
 * Get responsive grid template columns based on viewport
 * @param {boolean} isMobile - Is mobile viewport
 * @param {number} desktopColumns - Number of columns for desktop (default: 4)
 * @returns {string} Grid template columns CSS value
 */
export const getResponsiveGridColumns = (isMobile, desktopColumns = 4) => {
  if (isMobile) {
    return "repeat(1, 1fr)"; // 1 column on mobile
  }
  return `repeat(${desktopColumns}, 1fr)`;
};

/**
 * Get responsive spacing/gap based on viewport
 * @param {boolean} isMobile - Is mobile viewport
 * @returns {string} Gap value
 */
export const getResponsiveGap = (isMobile) => {
  return isMobile ? "10px" : "20px";
};

/**
 * Get responsive padding based on viewport
 * @param {boolean} isMobile - Is mobile viewport
 * @returns {string} Padding value
 */
export const getResponsivePadding = (isMobile) => {
  return isMobile ? "10px" : "20px";
};

/**
 * Get responsive margin based on viewport
 * @param {boolean} isMobile - Is mobile viewport
 * @returns {string} Margin value
 */
export const getResponsiveMargin = (isMobile) => {
  return isMobile ? "10px" : "20px";
};

/**
 * Get responsive font size multiplier
 * @param {boolean} isMobile - Is mobile viewport
 * @returns {number} Font size multiplier (0.8 for mobile, 1 for desktop)
 */
export const getResponsiveFontSizeMultiplier = (isMobile) => {
  return isMobile ? 0.8 : 1;
};

