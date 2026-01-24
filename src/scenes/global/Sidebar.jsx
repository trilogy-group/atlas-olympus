import { useState, useEffect } from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, Modal, Drawer } from "@mui/material";
import { Link } from "react-router-dom";
import { tokens } from "../../theme";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PermIdentityRoundedIcon from '@mui/icons-material/PermIdentityRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import RecentActorsRoundedIcon from '@mui/icons-material/RecentActorsRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DescriptionIcon from '@mui/icons-material/Description';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';

import { fetchUsers } from "../../data/fetchData";
import { useReload } from "../../context/ReloadContext";
import { useIsMobile, useIsForcedMobile } from "../../hooks/useIsMobile";



const transparent = (hex, alpha = 0.3) => {
    const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    const result = regex.exec(hex);
    if (!result) return hex;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

const Item = ({ title, to, icon, selected, setSelected, section, onMobileClick }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { triggerReload } = useReload();

    const uniqueId = `${section}-${title}`; 

    const handleClick = () => {
        localStorage.removeItem('current-vp');
        localStorage.setItem('current-vp', (title === "All Stats" || title === "All History" || title === "All Automations" ? "All" : title));
        setSelected(uniqueId);
        triggerReload(); // Trigger reload to update the dashboard
        
        // Close mobile drawer if callback provided
        if (onMobileClick) {
            onMobileClick();
        }
    };

    return (
        <MenuItem
            active={selected === uniqueId}
            rootStyles={{
                color: selected === uniqueId ? colors.redAccent[600] : colors.grey[100],
                "&:hover": { color: colors.grey[700] },
            }}
            sx={{
                padding: "2px 16px", // Reducir el padding vertical
                lineHeight: "0.2 !important", 
                minHeight: "10%", 
            }}
            component={<Link to={to} />}
            onClick={handleClick}
            icon={icon}
        >
            <Typography>{title}</Typography>
        </MenuItem>
    );
};


const SidebarX = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isMobileWidth = useIsMobile();
    const isForcedMobile = useIsForcedMobile();
    const isMobile = isMobileWidth || isForcedMobile; // Detect real mobile or forced Safari
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false); // Mobile drawer state
    const [selected, setSelected] = useState("Dashboard");

    const [isStatsExpanded, setStatsExpanded] = useState(false);
    const [isHistoryExpanded, setHistoryExpanded] = useState(false);
    const [isAdminExpanded, setAdminExpanded] = useState(false);
    const [isToolsExpanded, setToolsExpanded] = useState(false);
    const [isAutomationsExpanded, setAutomationsExpanded] = useState(false);

    const [vicePresidents, setVicePresidents] = useState([]);

    // Close mobile drawer when item is clicked
    const handleMobileMenuClick = () => {
        if (isMobile) {
            setIsMobileDrawerOpen(false);
        }
    };

    useEffect(() => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
        const getVPs = async () => {
            try {
                // Llamar a fetchUsers y esperar a que termine antes de continuar
                await fetchUsers();
    
                let allUsers = [];
                do {
                    allUsers = JSON.parse(localStorage.getItem("all-users")) || [];
                    if (allUsers.length === 0) {
                        await delay(500);  // Wait 0.5 seconds if users haven't loaded yet
                    }
                } while (allUsers.length === 0);
    
                const vps = allUsers.filter(user => user[5].includes("Vice President"));
                setVicePresidents(vps);
            } catch (error) {
                console.error("Error fetching Vice Presidents:", error);
            }
        };

        getVPs();
    }, []);
    

    let loggedUser;
    let retryCount = 0; 
    const maxRetries = 10; 
    const delay = 500; 
    let userPosition = "Conductor"

    function getLoggedUserPosition() {

    loggedUser = JSON.parse(localStorage.getItem("user_info"));
    if (!loggedUser) loggedUser = [];
    let userList = JSON.parse(localStorage.getItem("all-users"));

        if (userList && userList.length > 0) {
            let arrayPosition = userList.filter(user => user[2] === loggedUser.email);
            if (arrayPosition.length > 0) {
                userPosition = arrayPosition[0][5];
                // console.log("User position set:", userPosition);
            }
        } else {

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

    // console.log(`userPosition = ${JSON.stringify(userPosition)}`)

    const showAdmin =    userPosition.includes("Vice President") //If the user is a vicepresident
                      || loggedUser.name.includes(`Xavier Villarroel`); //If the user is a Xavier Villarroel

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Do you want to log out?");
        if (confirmLogout) {
            setIsLoggingOut(true);
            setTimeout(() => {
                // Clear ALL localStorage data to force complete reload
                console.log('🚪 Logging out - Clearing all data...');
                localStorage.clear();
                
                // Note: No need to call fetchUsers() here, it will be done on next login
                console.log('✅ Data cleared - Redirecting to login...');
                window.location.href = "/login";
            }, 2000);
        }
    };

    // Sidebar content (reusable for both desktop and mobile drawer)
    const sidebarContent = (
        <Sidebar
            collapsed={isCollapsed && !isMobile} // Never collapse in mobile
            backgroundColor={`${colors.primary[400]}`}
            rootStyles={{
                borderRight: 'none',
                height: '100%'
            }}
        >
            <Menu iconShape="square">

                {/* LOGO AND MENU ICON */}
                <MenuItem
                    onClick={() => {
                        if (isMobile) {
                            setIsMobileDrawerOpen(false); // Close drawer on mobile
                        } else {
                            setIsCollapsed(!isCollapsed); // Toggle collapse on desktop
                        }
                    }}
                    icon={isCollapsed && !isMobile ? <MenuOutlinedIcon /> : undefined}
                    style={{
                        margin: "10px 0 20px 0",
                        color: colors.grey[100],
                    }}
                    rootStyles={{
                        '&:hover': {
                            color: transparent(colors.grey[900]),
                        },
                    }}
                >
                    {(!isCollapsed || isMobile) && (
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            ml="15px"
                        >
                            <Typography variant="h3" color={colors.grey[100]}>
                                ATLAS Olympus
                            </Typography>
                            <IconButton onClick={() => {
                                if (isMobile) {
                                    setIsMobileDrawerOpen(false);
                                } else {
                                    setIsCollapsed(!isCollapsed);
                                }
                            }}>
                                <MenuOutlinedIcon />
                            </IconButton>
                        </Box>
                    )}
                </MenuItem>

                {/* USER */}
                {(!isCollapsed || isMobile) && (
                        <Box mb="25px">
                            <Box display="flex" justifyContent="center" alignItems="center">
                                <img
                                    alt="Profile-user"
                                    width="100px"
                                    height="100px"
                                    src={loggedUser.picture /*- Picture to load -*/}
                                    style={{ cursor: "pointer", borderRadius: "50%" }}
                                />
                            </Box>

                            <Box textAlign="center">
                                <Typography
                                    variant="h3"
                                    color={colors.grey[100]}
                                    fontWeight="bold"
                                    sx={{ m: "10px 0 0 0" }}
                                >
                                    {loggedUser.name /*- Xavier Villarroel -*/} 
                                </Typography>

                                <Typography
                                    variant="h5"
                                    color={colors.greenAccent[500]}
                                    sx={{ m: "10px 0 0 0" }}
                                >
                                    [ {userPosition /*- Conductor -*/} ]
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* MENU ITEMS */}
                    <Box paddingLeft={isCollapsed ? "1%" : "1%"}>
                        
                        {/* 1. Stats Menu */}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                            <Box
                                display="flex"
                                alignItems="center"
                                sx={{ cursor: "pointer", m: "15px 0 5px 20px" }}
                                onClick={() => setStatsExpanded(!isStatsExpanded)}
                            >
                                {isStatsExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                <Typography variant="h6" color={colors.blueAccent[300]} ml="3px">
                                    {isCollapsed ? "1.-" : "1. Stats"}
                                </Typography>
                            </Box>
                            {isStatsExpanded && (
                                <>
                                    <Item
                                        title="All Stats"
                                        to="/dashboard/passive"
                                        icon={<HomeOutlinedIcon />}
                                        selected={selected}
                                        setSelected={setSelected}
                                        section="Stats"
                                        onMobileClick={handleMobileMenuClick}
                                    />
                                    <Box
                                        sx={{
                                            height: '1px', 
                                            width: '180px',
                                            backgroundColor: colors.grey[600], 
                                            marginTop: '1px', 
                                            marginBottom: '10px', 
                                            marginLeft: '30px', 
                                        }}
                                    />
                                    {vicePresidents.map((vp, index) => (
                                        <Item
                                            key={`${index}A`}
                                            title={`${vp[0]} ${vp[1]}`} 
                                            to={`/dashboard/${(vp[0] + vp[1]).toLowerCase()}`}
                                            icon={(vp[0] + " " + vp[1] === "Colin Guilfoyle") ? <ManageAccountsRoundedIcon /> : <PermIdentityRoundedIcon />}
                                            selected={selected}
                                            setSelected={setSelected}
                                            section="Stats"
                                            onMobileClick={handleMobileMenuClick}
                                        />
                                    ))}
                                </>
                            )}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}

                        {/* 2. Stats Menu */}
                            <Box
                                display="flex"
                                alignItems="center"
                                sx={{ cursor: "pointer", m: "15px 0 5px 20px" }}
                                onClick={() => setHistoryExpanded(!isHistoryExpanded)}
                            >
                                {isHistoryExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                <Typography variant="h6" color={colors.blueAccent[300]} ml="3px">
                                    {isCollapsed ? "2.-" : "2. History"}
                                </Typography>
                            </Box>
                            {isHistoryExpanded && (
                                <>
                                    <Item
                                        title="All History"
                                        to="/history"
                                        icon={<HomeOutlinedIcon />}
                                        selected={selected}
                                        setSelected={setSelected}
                                        section="History"
                                        onMobileClick={handleMobileMenuClick}
                                    />
                                    <Box
                                        sx={{
                                            height: '1px', 
                                            width: '180px',
                                            backgroundColor: colors.grey[600], 
                                            marginTop: '1px', 
                                            marginBottom: '10px', 
                                            marginLeft: '30px', 
                                        }}
                                    />
                                    {vicePresidents.map((vp, index) => (
                                        <Item
                                            key={`${index}B`}
                                            title={`${vp[0]} ${vp[1]}`} 
                                            to={`/history/${(vp[0] + vp[1]).toLowerCase()}`}
                                            icon={(vp[0] + " " + vp[1] === "Colin Guilfoyle") ? <ManageAccountsRoundedIcon /> : <PermIdentityRoundedIcon />}
                                            selected={selected}
                                            setSelected={setSelected}
                                            section="History"
                                            onMobileClick={handleMobileMenuClick}
                                        />
                                    ))}
                                </>
                            )}

                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}

                        {/* 3. Automations Menu */}
                            <Box
                            display="flex"
                            alignItems="center"
                            sx={{ cursor: "pointer", m: "15px 0 5px 20px" }}
                            onClick={() => setAutomationsExpanded(!isAutomationsExpanded)}
                            >
                            {isAutomationsExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                            <Typography variant="h6" color={colors.blueAccent[300]} ml="3px">
                                {isCollapsed ? "3.-" : "3. Automations"}
                            </Typography>
                            </Box>
                            {isAutomationsExpanded && (
                            <>
                                <Item
                                title="All Automations"
                                to="/automations"
                                icon={<HomeOutlinedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                                section="Automations"
                                onMobileClick={handleMobileMenuClick}
                                />
                                <Box
                                sx={{
                                    height: '1px',
                                    width: '180px',
                                    backgroundColor: colors.grey[600],
                                    marginTop: '1px',
                                    marginBottom: '10px',
                                    marginLeft: '30px',
                                }}
                                />
                                {vicePresidents.map((vp, index) => (
                                <Item
                                    key={`${index}C`}
                                    title={`${vp[0]} ${vp[1]}`}
                                    to={`/automations/${(vp[0] + vp[1]).toLowerCase()}`}
                                    icon={(vp[0] + " " + vp[1] === "Colin Guilfoyle") ? <ManageAccountsRoundedIcon /> : <PermIdentityRoundedIcon />}
                                    selected={selected}
                                    setSelected={setSelected}
                                    section="Automations"
                                    onMobileClick={handleMobileMenuClick}
                                />
                                ))}
                            </>
                            )}

                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}
                        {/*------------------ DYNAMIC RENDERED -----------------*/}

                        {/* 4. Tools Menu */}
                            <Box
                                display="flex"
                                alignItems="center"
                                sx={{ cursor: "pointer", m: "15px 0 5px 20px" }}
                                onClick={() => setToolsExpanded(!isToolsExpanded)}
                            >
                                {isToolsExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                <Typography variant="h6" color={colors.blueAccent[300]} ml="3px">
                                    {isCollapsed ? "4.-" : "4. Tools"}
                                </Typography>
                            </Box>
                            {isToolsExpanded && (
                                <>
                                    <Item
                                        title="Escalations Report"
                                        to="/escalationsreport"
                                        icon={<TimelineOutlinedIcon />}
                                        selected={selected}
                                        setSelected={setSelected}
                                        onMobileClick={handleMobileMenuClick}
                                    />
                                     <Item
                                        title="Custom Report"
                                        to="/customreport"
                                        icon={<AnalyticsIcon />}
                                        selected={selected}
                                        setSelected={setSelected}
                                        onMobileClick={handleMobileMenuClick}
                                    />
                                    <Item
                                        title="CSV Downloads"
                                        to="/csvdownloads"
                                        icon={<DescriptionIcon />}
                                        selected={selected}
                                        setSelected={setSelected}
                                        onMobileClick={handleMobileMenuClick}
                                    />
                                </>
                            )}

                        {/* 5. VoiceBot Menu */}
                        {/* <Box
                            display="flex"
                            alignItems="center"
                            sx={{ cursor: "pointer", m: "15px 0 5px 20px" }}
                            onClick={() => setVoiceBotExpanded(!isVoiceBotExpanded)} 
                        >
                            {isVoiceBotExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                            <Typography variant="h6" color={colors.blueAccent[300]} ml="3px">
                                {isCollapsed ? "4.-" : "4. VoiceBot"}
                            </Typography>
                        </Box>
                        {isVoiceBotExpanded && (
                            <>
                                <Item
                                    title="Calls Statistics"
                                    to="/callsstatistics"
                                    icon={<TimelineOutlinedIcon />}
                                    selected={selected}
                                    setSelected={setSelected}
                                />
                                    <Item
                                    title="Calls Log"
                                    to="/callslog"
                                    icon={<AnalyticsIcon />}
                                    selected={selected}
                                    setSelected={setSelected}
                                />
                            </>
                        )} */}

                        {/* 5. Admin Section */}   
                            {showAdmin && ( //Only will be shown if showAdmin is true or if it is my. 
                                <>
                                    
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        sx={{ cursor: "pointer", m: "15px 0 5px 20px" }}
                                        onClick={() => setAdminExpanded(!isAdminExpanded)}
                                    >
                                        {isAdminExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                        <Typography variant="h6" color={colors.blueAccent[300]} ml="3px">
                                            {isCollapsed ? "5.-" : "5. Admin"}
                                        </Typography>
                                    </Box>
                                    {isAdminExpanded && (
                                        <>
                                            <Item
                                                title="Manage Users"
                                                to="/createuser"
                                                icon={<PeopleOutlineRoundedIcon />}
                                                selected={selected}
                                                setSelected={setSelected}
                                                onMobileClick={handleMobileMenuClick}
                                            />
                                            <Item
                                                title="Assign Products"
                                                to="/assignproducts" 
                                                icon={<ContactsOutlinedIcon />}
                                                selected={selected}
                                                setSelected={setSelected}
                                                onMobileClick={handleMobileMenuClick}
                                            />
                                            <Item
                                                title="Products Per User"
                                                to="/userproducts" 
                                                icon={<RecentActorsRoundedIcon />}
                                                selected={selected}
                                                setSelected={setSelected}
                                                onMobileClick={handleMobileMenuClick}
                                            />
                                        </>
                                    )}
                                </>
                            )}

                    </Box>

                    {/* LOGOUT BUTTON */}
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-start"
                        sx={{ cursor: "pointer", ml: "27px", mt: "30px", mb: "20px" }}  // Added mb for bottom spacing
                        onClick={handleLogout}
                    >
                        <LogoutRoundedIcon style={{ color: colors.redAccent[200] }} />
                        {(!isCollapsed || isMobile) && (
                            <Typography variant="h6" color={colors.redAccent[200]} ml="10px">
                                Logout
                            </Typography>
                        )}
                    </Box>

                </Menu>
            </Sidebar>
    );

    // Return different rendering based on viewport
    return (
        <>
            {isMobile ? (
                // Mobile: Drawer that can be toggled
                <>
                    {/* Hamburger button for mobile */}
                    <IconButton
                        onClick={() => setIsMobileDrawerOpen(true)}
                        sx={{
                            position: 'fixed',
                            top: '10px',
                            left: '10px',
                            zIndex: 1100,
                            backgroundColor: colors.primary[400],
                            '&:hover': {
                                backgroundColor: colors.primary[300],
                            },
                        }}
                    >
                        <MenuOutlinedIcon />
                    </IconButton>
                    
                    <Drawer
                        anchor="left"
                        open={isMobileDrawerOpen}
                        onClose={() => setIsMobileDrawerOpen(false)}
                        sx={{
                            '& .MuiDrawer-paper': {
                                width: '280px',
                                backgroundColor: colors.primary[400],
                            },
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '100%',
                                "& .pro-sidebar-inner": {
                                    background: `${colors.primary[400]} !important`,
                                    height: '100%', 
                                },
                                "& .pro-icon-wrapper": {
                                    backgroundColor: "transparent !important",
                                },
                                "& .pro-inner-item": {
                                    padding: "5px 35px 5px 20px !important",
                                },
                                "& .pro-menu-item.active": {
                                    color: "#6870fa !important",
                                },
                            }}
                        >
                            {sidebarContent}
                        </Box>
                    </Drawer>
                </>
            ) : (
                // Desktop: Normal sidebar
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',

                        "& .pro-sidebar-inner": {
                            background: `${colors.primary[400]} !important`,
                            height: '100%', 
                        },
                        "& .pro-icon-wrapper": {
                            backgroundColor: "transparent !important",
                        },
                        "& .pro-inner-item": {
                            padding: "5px 35px 5px 20px !important",
                        },
                        "& .pro-menu-item.active": {
                            color: "#6870fa !important",
                        },
                    }}
                >
                    {sidebarContent}
                </Box>
            )}

            {/* Logout Modal */}
            <Modal open={isLoggingOut}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    }}
                >
                    <Typography variant="h4" color="white">
                        Logging out...
                    </Typography>
                </Box>
            </Modal>
        </>
    );
};

export default SidebarX;
