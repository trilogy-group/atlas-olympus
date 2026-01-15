import React, { useState, useEffect } from "react";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, Grid, useTheme } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Header from "../../components/Header"; 
import { tokens } from "../../theme"; 
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { fetchAssignments, getProductRealName, validateUser } from "../../data/fetchData";  
import { useNavigate } from "react-router-dom"; 

const UserAccordion = () => {
  const globals = useConfigureGlobals();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode); 
  const [users, setUsers] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const userEmail = userInfo?.email || "";
  const navigate = useNavigate(); 

  /*- new verification -*/
  let loggedUser;
  let position = '';
  let retryCount = 0; 
  const maxRetries = 10; 
  const delay = 500; 

  function getLoggedUserPosition() {

      loggedUser = JSON.parse(localStorage.getItem("user_info"));
      if (!loggedUser) loggedUser = [];
      let userList = JSON.parse(localStorage.getItem("all-users"));

          if (userList && userList.length > 0) {
              const userPosition = userList.filter(user => user[2] === loggedUser.email);
              if (userPosition) {
                  loggedUser.position = userPosition[0][5];
                  position = userPosition[0][5];
                  // console.log("User position set:", loggedUser.position);
              }
          } else {
              // Si no se ha encontrado la lista de usuarios y no hemos alcanzado el número máximo de intentos
              if (retryCount < maxRetries) {
                  retryCount++;
                  console.log(`Retrying... Attempt ${retryCount}`);
  
                  // Esperar 0.5 segundos y volver a intentar
                  setTimeout(() => {
                      userList = JSON.parse(localStorage.getItem("all-users"));
                      getLoggedUserPosition(); // Volver a intentar
                  }, delay);
              } else {
                  console.log("Could not retrieve userList after multiple attempts");
              }
          }
      }
  getLoggedUserPosition();
  /*- new verification -*/

  useEffect(() => {

    if (!validateUser(userEmail)) {
      alert("This user is not authorized. Please contact the Administrator of ATLAS OLYMPUS");
      navigate("/login");
      return;
    }

    /*- new verification -*/
    if (!position.includes("Vice President")) {
        if (loggedUser.email.includes("xavier.villarroel")) {
            console.log(`User is Xavier Villarroel (Superuser)`)
        } else {
            alert("This user is not authorized. Please contact the Administrator of ATLAS OLYMPUS to access this screen");
            navigate("/login");
            return;
        }
    }
    /*- new verification -*/

    const loadData = async () => {
      const storedUsersData = await fetchAssignments(globals);
      const usersGrouped = groupByUser(storedUsersData);
      setUsers(usersGrouped);
    };

    loadData(); 
  }, []);

  const groupByUser = (data) => {
    const grouped = {};
    data.forEach(([product, company, user, type]) => {
      
      const userName = user || "Non-assigned Products";
      if (!grouped[userName]) {
        grouped[userName] = [];
      }
      grouped[userName].push({ product, company, type });
    });

    // Convert object to array and ensure "Non-assigned Products" is at the end
    const groupedEntries = Object.entries(grouped);
    const nonAssigned = groupedEntries.find(([userName]) => userName === "Non-assigned Products");

    // Filter out "Non-assigned Products" and add it to the end if it exists
    const sortedUsers = groupedEntries.filter(([userName]) => userName !== "Non-assigned Products");
    if (nonAssigned) {
      sortedUsers.push(nonAssigned); // Add Non-assigned Products at the end
    }

    return sortedUsers;
  };

  return (
    <Box m="20px">
      {/* HEADER */}
      <Header title="Products per user" subtitle="This screen shows the products that belong to each user. Click on the user to see the products." />

      {/* Accordeon Render */}
      {users.map(([userName, products], index) => (
        <Accordion key={index} defaultExpanded={index === 500}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography color={colors.blueAccent[400]} variant="h5">
              {`${userName} (${products.length} products)`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {products.map((product, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Typography variant="body1" style={{ color: colors.greenAccent[400] }}>
                    {`- ${getProductRealName(product.product)} (${product.product})`}
                  </Typography>
                  <Typography variant="body2">
                    {`- BU: ${product.company}     - Type: ${product.type}`}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default UserAccordion;
