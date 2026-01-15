import { Box } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import { mockPieData } from "../../data/mockData";

const Pie = () => {
  return (
    <Box m="20px">
      <Header title="Pie Chart" subtitle="Simple Pie Chart" />
      <Box height="75vh">
        <PieChart 
        dataArray={mockPieData}
        />
      </Box>
    </Box>
  );
};

export default Pie;