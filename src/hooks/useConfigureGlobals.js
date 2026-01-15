import { useContext, useMemo } from "react";
import { PeriodContext } from "../context/PeriodContext";


const useConfigureGlobals = () => {
  const { period } = useContext(PeriodContext);

  const globals = useMemo(() => {
    const globalSettings = {
      SHEET_KEY: 'AIzaSyCO8yb8FFHwAbaJR6YmfQXKgZxkGEQjk5A',
      SHEET_API_URL: `sheets.googleapis.com/v4/spreadsheets`,
      SHEET_RANGE: `A1:Z`,
      FROM: `2024-01-01`,
      TO: `2024-01-01`,
    };

    // console.log(`case ${period}`)
    switch (period) {
      case 0:
        globalSettings.SHEET_ID = "1j1SCJrBrYb8Dx5l6QkMB9SX7WMkV_ZzSZOCxs3Tm6Os"; //1 day 
        break;
      case 1:
        globalSettings.SHEET_ID = "1zUZJJsqkKfs9Fu4gx5tOW9m216Kft5ucdoutcY02LEM"; //1 week
        break;
      case 2:
        globalSettings.SHEET_ID = "1I5cdCL3k_h25DGzySpkQQuqsn0Rbuv-KafEEtVCgj3E"; //4 week
        break;
      case 3:
      case 4:
        globalSettings.SHEET_ID = "CUSTOM"; //Custom
        break;
      default:
        globalSettings.SHEET_ID = "1I5cdCL3k_h25DGzySpkQQuqsn0Rbuv-KafEEtVCgj3E"; //4 week
    }

    return globalSettings;
  }, [period]); // Solo se recalcula cuando 'period' cambia

  return globals;
};

export default useConfigureGlobals;
