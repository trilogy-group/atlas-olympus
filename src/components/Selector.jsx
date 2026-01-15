import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { tokens } from "../theme";
import SwitchSelector from "react-switch-selector";

const transparent = (hex, alpha = 0.3) => {
  const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const result = regex.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Selector = ({ options = [], onChange, value, initialIndex }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const wrapperRef = useRef(null);
  const [wrapWidth, setWrapWidth] = useState(0);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useLayoutEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      setWrapWidth(w);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const count = Math.max(1, options.length);

  // Tamaños responsivos
  const fontSize = isSmallScreen ? 12 : 13;
  const height = isSmallScreen ? 36 : 42;
  const minWidthPerOption = isSmallScreen ? 100 : 130;
  const optionPadding = isSmallScreen ? '4px 8px' : '8px 16px';

  const selectorWidth = useMemo(() => {
    if (wrapWidth === 0) return "100%";
    
    const totalNeededWidth = count * minWidthPerOption;
    
    // Si necesita más espacio del disponible, usar el 100% y dejar que se ajuste
    if (totalNeededWidth > wrapWidth) {
      return "100%";
    }
    
    // Si cabe, usar el ancho disponible
    return wrapWidth;
  }, [wrapWidth, count, minWidthPerOption]);

  const controlledIndex = useMemo(() => {
    if (value == null) return undefined;
    const idx = options.findIndex((o) => String(o.value) === String(value));
    return idx >= 0 ? idx : 0;
  }, [options, value]);

  const normalizedOptions = useMemo(
    () =>
      options.map((o) => ({
        ...o,
        label: (
          <span style={{ 
            whiteSpace: "nowrap", 
            display: "inline-block",
            padding: optionPadding,
            fontSize: `${fontSize}px`
          }}>
            {o.label}
          </span>
        ),
      })),
    [options, optionPadding, fontSize]
  );

  return (
    <Box
      ref={wrapperRef}
      sx={{
        width: "100%",
        mx: "auto",
        mt: 2,
        '& .switch-selector': {
          minWidth: '100%',
          '& > div': {
            display: 'flex',
            gap: '4px'
          }
        }
      }}
    >
      <Box sx={{ 
        width: selectorWidth,
        overflowX: 'visible'
      }}>
        <SwitchSelector
          key={`${controlledIndex ?? initialIndex ?? "ss"}`}
          options={normalizedOptions}
          onChange={onChange}
          initialSelectedIndex={controlledIndex !== undefined ? controlledIndex : initialIndex ?? 0}
          backgroundColor={transparent(colors.blueAccent[900], 0.5)}
          selectedBackgroundColor={transparent(colors.blueAccent[800], 0.8)}
          fontColor={colors.grey[100]}
          fontSize={fontSize}
          optionBorderRadius={50}
          height={height}
          border={2}
          wrapperBorderRadius={8}
          transition="all 0.3s ease-in-out" // Añade esta línea
        />
      </Box>
    </Box>
  );
};

export default Selector;