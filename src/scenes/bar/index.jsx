import { Box } from "@mui/material";
import Header from "../../components/Header";
import BarChart from "../../components/BarChart";

function getKeys(obj) {
  return Object.keys(obj).filter(key => !key.endsWith('Color') && !key.endsWith('dates'));
}

let dataArray = [
  {
    dates: "date 1",
    open: 137,
    openColor: "hsl(229, 70%, 50%)",
    pending: 96,
    pendingColor: "hsl(296, 70%, 50%)",
    onhold: 72,
    onholdColor: "hsl(97, 70%, 50%)",
    new: 140,
    newColor: "hsl(340, 70%, 50%)",
  },
  {
    dates: "date 2",
    open: 55,
    openColor: "hsl(307, 70%, 50%)",
    pending: 28,
    pendingColor: "hsl(111, 70%, 50%)",
    onhold: 58,
    onholdColor: "hsl(273, 70%, 50%)",
    new: 29,
    newColor: "hsl(275, 70%, 50%)",
  },
  {
    dates: "date 3",
    open: 109,
    openColor: "hsl(72, 70%, 50%)",
    pending: 23,
    pendingColor: "hsl(96, 70%, 50%)",
    onhold: 34,
    onholdColor: "hsl(106, 70%, 50%)",
    new: 152,
    newColor: "hsl(256, 70%, 50%)",
  },
  {
    dates: "date 4",
    open: 133,
    openColor: "hsl(257, 70%, 50%)",
    pending: 52,
    pendingColor: "hsl(326, 70%, 50%)",
    onhold: 43,
    onholdColor: "hsl(110, 70%, 50%)",
    new: 83,
    newColor: "hsl(9, 70%, 50%)",
  },
  {
    dates: "date 5",
    open: 81,
    openColor: "hsl(190, 70%, 50%)",
    pending: 80,
    pendingColor: "hsl(325, 70%, 50%)",
    onhold: 112,
    onholdColor: "hsl(54, 70%, 50%)",
    new: 35,
    newColor: "hsl(285, 70%, 50%)",
  },
  {
    dates: "date 6",
    open: 66,
    openColor: "hsl(208, 70%, 50%)",
    pending: 111,
    pendingColor: "hsl(334, 70%, 50%)",
    onhold: 167,
    onholdColor: "hsl(182, 70%, 50%)",
    new: 18,
    newColor: "hsl(76, 70%, 50%)",
  },
  {
    dates: "date n",
    open: 80,
    openColor: "hsl(87, 70%, 50%)",
    pending: 47,
    pendingColor: "hsl(141, 70%, 50%)",
    onhold: 158,
    onholdColor: "hsl(224, 70%, 50%)",
    new: 49,
    newColor: "hsl(274, 70%, 50%)",
  },
];


const Bar = () => {
  return (
    <Box m="20px">
      <Header title="Bar Chart" subtitle="Simple Bar Chart" />
      <Box height="75vh">
      <BarChart 
              dataArray={dataArray}
              keys={getKeys(dataArray[0])}
              isDashboard={false} 
            />
      </Box>
    </Box>
  );
};

export default Bar;