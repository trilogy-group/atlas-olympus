// IMPORT SECTION
import React, { useState, useEffect } from "react";
import { Typography, Box, Button, useTheme, Select, MenuItem } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { fetchAssignments, getProductRealName, validateUser } from "../../data/fetchData";  
import { useNavigate } from "react-router-dom"; 

// FUNCTION SECTION

// Function to check and retrieve users from localStorage
const checkLocalStorage = (setUsers) => {
  const allUsers = localStorage.getItem("all-users");
  if (allUsers) {
    const parsedAllUsers = JSON.parse(allUsers).map(user => ({
      name: `${user[0]} ${user[1]}`,  
      email: user[2],
    }));
    setUsers(parsedAllUsers);
  } else {
    setTimeout(() => checkLocalStorage(setUsers), 100);  
  }
};

// Function to handle the selection change in the DataGrid
const handleSelectChange = (rowId, field, value, setDataObject) => {
  const processedValue = value === "None" ? null : value;  // Cambia "None" a null o el valor que prefieras
  setDataObject(prevData => 
    prevData.map(row => 
      row.product_id === rowId ? { ...row, [field]: processedValue } : row
    )
  );
};


// Function to handle saving changes and sending data to the backend
const handleSaveChanges = async (dataObject, setIsSubmitting, setResponseMessage, setResponseColor, colors) => {
  setIsSubmitting(true);  
  setResponseMessage(""); 

  const dataToSave = dataObject.map(row => [
    row.product_id,  
    row.bu,
    row.owner,
    row.type
  ]);

  localStorage.setItem("assignments", JSON.stringify(dataToSave));

  const payload = {
    matrix: JSON.stringify(dataToSave) 
  };

  try {
    const response = await fetch("https://lovk2cbgfgdk6dgtz674eiyg2u0ugklv.lambda-url.us-east-1.on.aws", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    // console.log("Response from Lambda:", result);
    
    setResponseMessage("Saved Successfully");
    setResponseColor(colors.greenAccent[400]); 

  } catch (error) {
    console.error("Failed to send data:", error);
    setResponseMessage("There was an error saving the information");
    setResponseColor(colors.redAccent[400]);  
  } finally {
    setIsSubmitting(false);  
  }
};

// Main Component
const AssignProducts = ({ product }) => {

  /*- Variables -*/

  const globals = useConfigureGlobals();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [dataObject, setDataObject] = useState([]);  
  const [columns, setColumns] = useState([]);        
  const [users, setUsers] = useState([]);            
  const [isSubmitting, setIsSubmitting] = useState(false);  
  const [responseMessage, setResponseMessage] = useState("");  
  const [responseColor, setResponseColor] = useState(""); 
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
    checkLocalStorage(setUsers); 
    
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

  }, []); 

  // Load assignments and update dataObject and columns
  useEffect(() => {
    const loadAssignments = async () => {
      const assignments = await fetchAssignments(globals);

      if (assignments && assignments.length > 0) {
        const headers = ["product_id", "bu", "owner", "type"];
        const initialDataObject = assignments.map(row => {
          let obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });

          obj.product_name = getProductRealName(obj.product_id);
          return obj;
        });

        setDataObject(initialDataObject);

        const columnsConfig = [
          { 
            field: "product_id", 
            headerName: "Product ID", 
            flex: 1 
          },
          { field: "product_name", headerName: "Product Name", flex: 1 }, 
          { field: "bu", headerName: "Business Unit", flex: 1 },
          { 
            field: "owner", 
            headerName: "Owner", 
            flex: 1,
            renderCell: (params) => (
              <Select
                value={params.row.owner || ''}  // Maneja el valor de 'None'
                onChange={(event) => handleSelectChange(params.row.product_id, "owner", event.target.value, setDataObject)}
                fullWidth
                sx={{
                  height: '30px',
                  fontSize: '0.875rem',
                }}
              >
                {/* Opción None */}
                <MenuItem value="None">None</MenuItem>
          
                {/* Opciones de usuarios desde localStorage */}
                {users.map((user) => (
                  <MenuItem key={user.email} value={user.name}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            )
          },
          { 
            field: "type", 
            headerName: "Order Type", 
            flex: 1,
            renderCell: (params) => (
              <Select
                value={params.row.type || ''}
                onChange={(event) => handleSelectChange(params.row.product_id, "type", event.target.value, setDataObject)}
                fullWidth
                sx={{
                  height: '30px',
                  fontSize: '0.875rem',
                }}
              >
                <MenuItem value="Full">Full</MenuItem>
                <MenuItem value="AI Only">AI Only</MenuItem>
                <MenuItem value="Subscale">Subscale</MenuItem>
              </Select>
            )
          },
        ];

        setColumns(columnsConfig);
      }
    };

    loadAssignments(); 
  }, [globals, product, users]);

  // Clear the response message after 3 seconds
  useEffect(() => {
    if (responseMessage) {
      const timer = setTimeout(() => {
        setResponseMessage("");
      }, 3000);

      return () => clearTimeout(timer); 
    }
  }, [responseMessage]);

  return (
    <Box m="20px">
      <Header 
        title={`Assign users to products`} 
        subtitle={`This screen allows you to select the users in charge and order type for each specific product.`} 
      />

      <Box
        display="grid"
        gridTemplateColumns={`repeat(120, 1fr)`}
        gridAutoRows="100px"
        gap="10px"
      >
        
        <Box 
          gridColumn="span 120"
          gridRow="span 7"
          backgroundColor={colors.primary[400]}
          p="20px"
          overflow="auto"
        >
          <DataGrid
            rows={dataObject}
            columns={columns}
            getRowId={(row) => row.product_id}
            autoHeight={false}
          />
        </Box>

        <Box 
          gridColumn="span 120" 
          display="flex" 
          justifyContent="flex-end"  
          alignItems="center" 
        >
          {/* Response message */}
          <Typography 
            sx={{ 
              color: responseColor, 
              marginRight: "20px"  
            }}
          >
            {responseMessage}
          </Typography>

          {/* Save changes button */}
          <Button 
            variant="contained" 
            sx={{
              backgroundColor: isSubmitting ? colors.primary[300] : colors.greenAccent[300], 
              '&:hover': {
                backgroundColor: isSubmitting ? colors.primary[300] : colors.greenAccent[500],
              },
              color: colors.primary[900],
              height: '30px',  
              minWidth: 'auto',
            }} 
            onClick={() => handleSaveChanges(dataObject, setIsSubmitting, setResponseMessage, setResponseColor, colors)}
            disabled={isSubmitting}  
          >
            Save Changes
          </Button>
        </Box>

      </Box>
    </Box>
  );
};

export default AssignProducts;
