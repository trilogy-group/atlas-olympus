import { Box } from "@mui/material";
import Header from "../../components/Header";
import BarChart from "../../components/BarChartJigsaw";

const BarJigsaw = () => {
  return (
    <Box m="20px">
      <Header title="Bar Chart (Jigsaw)" subtitle="Simple Bar Chart for Jigsaw BU" />
      <Box height="75vh">
        <BarChart />
      </Box>
    </Box>
  );
};

export default BarJigsaw;