import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Typography, useTheme, Avatar, Checkbox } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import useConfigureGlobals from '../../hooks/useConfigureGlobals';
import { handleDeleteUsers, handleFormSubmit, fetchUsers, validateUser } from "../../data/fetchData";
import { useNavigate } from "react-router-dom"; 

const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    // contact: "",
    // image_link: "",
};

const userSchema = yup.object().shape({
    firstName: yup.string().required("required"),
    lastName: yup.string().required("required"),
    email: yup.string().email("invalid email").required("required"),
    // contact: yup.string().matches(phoneRegExp, "Phone number is not valid").required("required"),
});

const CreateUserForm = () => {
    const [users, setUsers] = useState([]);
    const [apiResponse, setApiResponse] = useState(null);
    const [deleteResponse, setDeleteResponse] = useState(null);
    const [isSubmitting, setSubmitting] = useState(false);
    const [isDeleteMode, setDeleteMode] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [emailError, setEmailError] = useState(null);
    const globals = useConfigureGlobals();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width: 600px)");
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
        fetchUsers(setUsers);
        
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

    const toggleUserSelection = (email) => {
        setSelectedUsers((prev) =>
            prev.includes(email) ? prev.filter((item) => item !== email) : [...prev, email]
        );
    };

    const handleDeleteButtonClick = () => {
        if (isDeleteMode && selectedUsers.length > 0) {
            setSubmitting(true);
            handleDeleteUsers(selectedUsers, setDeleteResponse, setSubmitting, () => {
                fetchUsers(setUsers);
                setSelectedUsers([]);
            });
        } else {
            setDeleteMode(!isDeleteMode);
        }
    };

    useEffect(() => {
        if (apiResponse) {
            const timer = setTimeout(() => {
                setApiResponse(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [apiResponse]);

    useEffect(() => {
        if (deleteResponse) {
            const timer = setTimeout(() => {
                setDeleteResponse(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [deleteResponse]);

    const checkIfEmailExists = (email) => {
        const allUsers = JSON.parse(localStorage.getItem("all-users")) || [];
        return allUsers.some(user => user[2] === email);
    };

    return (
        <Box m="20px">
            <Header title="Manage users" subtitle="This screen allows you to manage (Add, Delete) the user profiles" />
            <Formik
                onSubmit={(values) => {
                    setSubmitting(true);
                    handleFormSubmit(values, setApiResponse, setSubmitting, () => {
                        fetchUsers(setUsers);
                    });
                }}
                initialValues={initialValues}
                validationSchema={userSchema}
            >
                {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue }) => (
                    <form onSubmit={handleSubmit}>
                        <Box
                            display="grid"
                            gap="30px"
                            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                            sx={{
                                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                            }}
                        >
                            {/* User List Panel */}
                            <Box
                                gridColumn={`span 2`}
                                gridRow={`span 18`}
                                backgroundColor={colors.primary[400]}
                                overflow="auto"
                            >
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    borderBottom={`4px solid ${colors.primary[500]}`}
                                    colors={colors.grey[100]}
                                    p="15px"
                                >
                                    <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
                                        Users
                                    </Typography>
                                </Box>

                                {users.map((user, index) => (
                                    <Box
                                        key={`${user[2]}-${index}`}
                                        borderBottom={`4px solid ${colors.primary[500]}`}
                                        p="15px"
                                        sx={{ cursor: isDeleteMode ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
                                    >
                                        {isDeleteMode && (
                                            <Checkbox
                                                checked={selectedUsers.includes(user[2])}
                                                onChange={() => toggleUserSelection(user[2])}
                                                color="secondary"
                                            />
                                        )}
                                        <Avatar
                                            src={user[4]}
                                            alt={`${user[0]} ${user[1]}`}
                                            sx={{ marginRight: '15px' }}
                                        />
                                        <Box flexGrow={1}>
                                            <Typography color={colors.greenAccent[400]} variant="h4" fontWeight="600">
                                                {`${user[0]} ${user[1]}`} <span style={{ marginLeft: '1px', fontWeight: '400', fontSize: '0.85rem' }}> ({user[5]}) </span>
                                            </Typography>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography color={colors.blueAccent[300]}>
                                                    {user[2]}
                                                </Typography>
                                                {/* <Typography color={colors.redAccent[300]}>
                                                    {user[3]}
                                                </Typography> */}
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>

                            {/* Form Fields */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="First Name"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.firstName}
                                name="firstName"
                                error={!!touched.firstName && !!errors.firstName}
                                helperText={touched.firstName && errors.firstName}
                                sx={{ gridColumn: "span 1" }}
                            />
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Last Name"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.lastName}
                                name="lastName"
                                error={!!touched.lastName && !!errors.lastName}
                                helperText={touched.lastName && errors.lastName}
                                sx={{ gridColumn: "span 1" }}
                            />

                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Email"
                                onBlur={handleBlur}
                                onChange={(e) => {
                                    handleChange(e);
                                    if (checkIfEmailExists(e.target.value)) {
                                        setEmailError("The user already exists");
                                    } else {
                                        setEmailError(null);
                                    }
                                }}
                                value={values.email}
                                name="email"
                                error={!!touched.email && (!!errors.email || emailError)}
                                helperText={touched.email && (errors.email || emailError)}
                                sx={{ gridColumn: "span 1" }}
                            />
                            {/* <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Contact Number"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.contact}
                                name="contact"
                                error={!!touched.contact && !!errors.contact}
                                helperText={touched.contact && errors.contact}
                                sx={{ gridColumn: "span 1" }}
                            /> 
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Picture URL"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.image}
                                name="image"
                                error={!!touched.image && !!errors.image}
                                helperText={touched.image && errors.image}
                                sx={{ gridColumn: "span 1" }}
                            /> */}

                            {/* Botón de Crear Usuario */}
                            <Box gridColumn={`span 1`} gridRow={`span 1`} display="flex" flexDirection="column" alignItems="end">
                                <Button
                                    type="submit" 
                                    variant="contained"
                                    disabled={isSubmitting || !!emailError}
                                    sx={{
                                        backgroundColor: colors.greenAccent[300], 
                                        '&:hover': {
                                            backgroundColor: colors.greenAccent[500], 
                                        },
                                        color: colors.primary[900] 
                                    }}
                                >
                                    Create New User
                                </Button>

                                {apiResponse && (
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            marginTop: '10px',
                                            color: apiResponse.success ? colors.greenAccent[300] : colors.redAccent[300],
                                            opacity: 1,
                                            transition: 'opacity 1s ease-in-out',
                                        }}
                                        className={`fade-out ${apiResponse ? 'show' : ''}`}
                                    >
                                        {apiResponse.message}
                                    </Typography>
                                )}

                                {emailError && (
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            marginTop: '10px',
                                            color: colors.redAccent[300],
                                            opacity: 1,
                                            transition: 'opacity 1s ease-in-out',
                                        }}
                                    >
                                        {emailError}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Botón de eliminación de usuarios */}
                        <Box mt="20px" display="flex" alignItems="center">
                            <Button
                                variant="contained"
                                onClick={handleDeleteButtonClick}
                                disabled={isSubmitting}
                                sx={{
                                    backgroundColor: colors.redAccent[400], 
                                    '&:hover': {
                                        backgroundColor: colors.redAccent[500], 
                                    },
                                    color: colors.primary[900] 
                                }}
                            >
                                {isDeleteMode && selectedUsers.length > 0 ? 'CONFIRM DELETE' : 'DELETE USERS'}
                            </Button>

                            {deleteResponse && (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        marginLeft: '10px',
                                        color: deleteResponse.success ? colors.greenAccent[300] : colors.redAccent[300],
                                        opacity: 1,
                                        transition: 'opacity 1s ease-in-out',
                                    }}
                                    className={`fade-out ${deleteResponse ? 'show' : ''}`}
                                >
                                    {deleteResponse.message}
                                </Typography>
                            )}
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    );
};

export default CreateUserForm;