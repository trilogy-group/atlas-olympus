import React, { useState, useEffect, useRef  } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  GlobalStyles,
  Popover,
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  InputLabel,
  Chip
} from "@mui/material";
import { fetchModels } from "../../data/fetchData";

import dayjs from "dayjs"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Header from "../../components/Header";
import Tooltip from "@mui/material/Tooltip";

/* global product/ticket-mode flag (requested) */
export let productMode = true; // toggled by the header button

const transparent = (hex, alpha = 0.3) => {
  const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const result = regex.exec(hex);
  if (!result) return hex;
  const [r, g, b] = [result[1], result[2], result[3]].map((val) => parseInt(val, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getTextFieldStyles = (colors) => ({
  "& .MuiInputLabel-root": { color: colors.primary[100] },
  "& .MuiInputLabel-root.Mui-focused": { color: colors.greenAccent[300] },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: colors.greenAccent[100] },
    // "&:hover fieldset": { borderColor: colors.greenAccent[300] },
    "&.Mui-focused fieldset": { borderColor: colors.greenAccent[400] },
  },
});

const delay = (ms) => new Promise(
  resolve => setTimeout(resolve, ms)
);

const getCurrentDate = (tabFormat = false) => {
  const today = new Date();
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0'); //Enero es 0
  const yyyy = today.getUTCFullYear();
  const hours = String(today.getUTCHours()).padStart(2, '0');
  const minutes = String(today.getUTCMinutes()).padStart(2, '0');
  const seconds = String(today.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(today.getUTCMilliseconds()).padStart(3, '0');

  return tabFormat ? `${mm}/${dd}/${yyyy} ${hours}:${minutes}` : `${mm}/${dd}/${yyyy} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const CustomReportForm = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

/*-------------- STATES ----------------------------------------------------------------------------*/
  const [fields, setFields] = useState([
    { id: 1, name: "", options: "", description: "", errors: {} },
    { id: 2, name: "", options: "", description: "", errors: {} }, 
  ]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productList, setProductList] = useState([]);
  const [isSecondBoxVisible, setIsSecondBoxVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logMessages, setLogMessages] = useState([]);
  const [isLogsVisible, setIsLogsVisible] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);
  const [baseInputTokens, setBaseInputTokens] = useState(null);
  const [baseOutputTokens, setBaseOutputTokens] = useState(null);
  const [selectedOption, setSelectedOption] = useState("GPT_4o");
  const [calculatedInputTokens, setcalculatedInputTokens] = useState(null);
  const [calculatedOutputTokens, setcalculatedOutputTokens] = useState(null);
  const [calculatedCost, setCalculatedCost] = useState(null);
  const [payloadData, setPayloadData] = useState(null);
  const [postProcessLogs, setPostProcessLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState([]); 
  const [isConfigPanelVisible, setIsConfigPanelVisible] = useState(false); 
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [configName, setConfigName] = useState(""); 
  const [anchorEl, setAnchorEl] = useState(null); 
  const [isSaving, setIsSaving] = useState(false); 
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0); 
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(null);
  const [optionValue, setOptionValue] = useState('2');
  const [prices, setPrices] = useState(null); // dynamic prices from sheet

  /* UI mode states (requested) */
  const [isProductMode, setIsProductMode] = useState(true);
  const [ticketIds, setTicketIds] = useState("");
/*------------------------------------------------------------------------------------------------*/

  const computeCost = (model, inT, outT) => {
    const p = prices?.[model];
    if (!p) return null;
    return inT * p.in + outT * p.out;
  };

  // dynamic models from sheet (fallback to old list if not loaded)
  const models = prices ? Object.keys(prices) : ["gpt-4o"];

  const handleDeleteField = (id) => {
    const tile = document.getElementById(`tile-${id}`);
    if (tile) {
      tile.style.transition = "opacity 0.3s ease, height 0.3s ease";
      tile.style.opacity = "0";
      tile.style.height = "0";
    }

    setTimeout(() => {
      setFields((prevFields) => prevFields.filter((field) => field.id !== id));
    }, 300); 
  };

  const handleAddField = () => {
    setFields((prevFields) => [
        ...prevFields,
        {
            id: prevFields.length + 1, 
            name: "",
            options: "",
            description: "",
        },
    ]);
  };

  const popUp = (message) => {
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const popUpYesNo = (message) => {
    return new Promise((resolve) => {
      setConfirmMessage(message);
      setOnConfirm(() => (confirmed) => resolve(confirmed)); 
      setConfirmDialogOpen(true);
    });
  };

  const getSavedConfig = async () => {
    try {
      const response = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets/11W21HKGz7oo_sCn3inX6LbrCGq7tjkug_hUG0Y3EN48/values/CustomReportConfigs!A1:D?key=AIzaSyCO8yb8FFHwAbaJR6YmfQXKgZxkGEQjk5A"
      );
  
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
  
      const data = await response.json();
      const values = data.values;
  
        if (!values || values.length <= 1) {
          popUp("No saved configurations found.");
          return;
        }
  
      const userInfo = localStorage.getItem("user_info");
  
        if (!userInfo) {
          console.error("Error: User info not found in localStorage.");
          return;
        }
      
      const userEmail = JSON.parse(userInfo).email;
      const savedConfigs = values.slice(1).filter(row => row[3] === userEmail);
      
        if (savedConfigs.length === 0) {
          popUp("No saved configurations found for your email.");
          return null;
        }
  
      return savedConfigs;
  
    } catch (error) {
      console.error("Error loading config:", error);
      popUp("Failed to load configuration. Please try again.");
    }
  };

  const addLogMessage = (message, sheetUrl = null) => {
    setLogMessages((prevMessages) => [
      ...prevMessages,
      <div
        style={{
          display: "flex",
          flexDirection: "column", 
          alignItems: "flex-start",
          gap: "8px", 
        }}
        key={prevMessages.length}
      >

        <span>{message}</span>
      </div>,
    ]);
  };
  
  const defaultFields = [
    "Custom", "Tickets table - amountToBePaid", "Tickets table - assignee", "Tickets table - availableNext2Hours", 
    "Tickets table - billableUnit", "Tickets table - chatbotDeflectionTag", "Tickets table - chatEscalatedByAlan", 
    "Tickets table - closedByMerge", "Tickets table - closedDueToMigration", "Tickets table - commentOther",
     "Tickets table - commentRequester", "Tickets table - component", "Tickets table - componentPredicted", 
     "Tickets table - componentPredictedAt", "Tickets table - componentPredictedRaw", "Tickets table - componentPredictedScore", 
     "Tickets table - createdAt", "Tickets table - detailedStatus", "Tickets table - description", "Tickets table - discardedAt", "Tickets table - discardedBy", 
     "Tickets table - discardReason", "Tickets table - escalatedToL2", "Tickets table - escalation", "Tickets table - estimatedResolutionTime", 
     "Tickets table - evalAssignedTo", "Tickets table - externalTeam", "Tickets table - firstAssignee", "Tickets table - forceSync", 
     "Tickets table - groupId", "Tickets table - hasFollowUp", "Tickets table - initialResponseType", "Tickets table - isAlanAssigned", 
     "Tickets table - isAlanL1Deflected", "Tickets table - isCall", "Tickets table - isCallInbound", "Tickets table - isCallOutbound", 
     "Tickets table - isChatbotDeflected", "Tickets table - isMigrated", "Tickets table - isSev1", "Tickets table - itrAssignedToL2", 
     "Tickets table - jiraCreated", "Tickets table - jiraDevelopmentStatus", "Tickets table - jiraEscalated", 
     "Tickets table - jiraEscalationCreatedOn", "Tickets table - jiraEscalationRespondedOn", "Tickets table - jiraEscalationResponse", 
     "Tickets table - jiraFixReleaseTiming", "Tickets table - jiraId", "Tickets table - jiraResolved", "Tickets table - kbUrl", 
     "Tickets table - kbUsed", "Tickets table - lastCheckForStatusChanges", "Tickets table - lastPending", "Tickets table - lastRuleCheck", 
     "Tickets table - noSurvey", "Tickets table - npsTypePredicted", "Tickets table - npsTypePredictedAt", "Tickets table - onCallTicket", 
     "Tickets table - onholdReleaseEta", "Tickets table - organizationId", "Tickets table - pendingForCustomerEta", 
     "Tickets table - preventedReopenCount", "Tickets table - priority", "Tickets table - productUpdatedBy", "Tickets table - rawAudits", 
     "Tickets table - rawData", "Tickets table - reopenCount", "Tickets table - report", "Tickets table - requester", "Tickets table - requesterEmail", 
     "Tickets table - requesterName", "Tickets table - requesterSalary", "Tickets table - resolutionLevelPredicted", 
     "Tickets table - resolutionLevelPredictedAt", "Tickets table - secureId", "Tickets table - slaFulfilledPredicted", 
     "Tickets table - slaFulfilledPredictedAt", "Tickets table - solvedViaZDChat", "Tickets table - status", 
     "Tickets table - supportLevel", "Tickets table - syncMetrics", "Tickets table - ticketClosed", "Tickets table - ticketCreated", 
     "Tickets table - ticketEscalated", "Tickets table - ticketEscalationCategory", "Tickets table - ticketEscalationReason", 
     "Tickets table - ticketSolved", "Tickets table - ticketUpdated", "Tickets table - totalTimeSpent", "Tickets table - underEvaluationAt", 
     "Tickets table - underEvaluationBy", "Tickets table - updatedAt", "Tickets table - viaTicketSharing", "Tickets table - weekStartDate",
     "Tickets table - xoEmailAddress", 

     "Products table - alpProductName", "Products table - amazonQueueId", "Products table - answerbot", 
     "Products table - brand", "Products table - contactEmails", "Products table - createdAt", "Products table - csProductId", 
     "Products table - deletedAt", "Products table - focus", "Products table - group", "Products table - id", "Products table - inpitr", 
     "Products table - isCreateFCRFailureTickets", "Products table - isImport", "Products table - isSupported", "Products table - name", 
     "Products table - pocs", "Products table - portalUrl", "Products table - productId", "Products table - requiredL1", 
     "Products table - requiredL2", "Products table - updatedAt", "Products table - zdSkillId", 

     "Metrics table - agentQB", "Metrics table - artIn24h", "Metrics table - artIn7d", "Metrics table - assignee", "Metrics table - assigneeGroup", 
     "Metrics table - assigneeName", "Metrics table - atlas_chat_csat", "Metrics table - atlas_chat_csat_comment", 
     "Metrics table - avolinVersion", "Metrics table - awsCsatNotProvided", "Metrics table - awsCsatNotSatisfied", 
     "Metrics table - awsCsatSatisfied", "Metrics table - billableUnits", "Metrics table - brand", "Metrics table - brandId", 
     "Metrics table - BUJiraIds", "Metrics table - channel", "Metrics table - clientEscalationCount", "Metrics table - closedByMerge", 
     "Metrics table - commentRequester", "Metrics table - countryOfOrigin", "Metrics table - createdAt", "Metrics table - csatComment", 
     "Metrics table - csatReason", "Metrics table - csatScore", "Metrics table - deflectedByAnswerBot", "Metrics table - description", 
     "Metrics table - escalatedTicketId", "Metrics table - externalQB", "Metrics table - externalQBWithoutLastPending", 
     "Metrics table - externalTeam", "Metrics table - fcr", "Metrics table - fcrPlus", "Metrics table - fcrTicketId", 
     "Metrics table - firstAssignedByITR", "Metrics table - firstAssignedL1AgentName", "Metrics table - firstAssignedL2AgentName", 
     "Metrics table - firstAssignedToL1Agent", "Metrics table - firstAssignedToL2Agent", "Metrics table - firstAssignmentTime", 
     "Metrics table - firstL1AgentId", "Metrics table - firstL1AgentName", "Metrics table - firstL2AgentId", "Metrics table - firstL2AgentName", 
     "Metrics table - firstReplierEmail", "Metrics table - fsmResult", "Metrics table - groupId", "Metrics table - groupName", 
     "Metrics table - groupType", "Metrics table - hasFollowUp", "Metrics table - inboundCallsReceived", "Metrics table - initialResponseTime", 
     "Metrics table - irtIn15m", "Metrics table - irtatIn1m", "Metrics table - itratIn15m", "Metrics table - itratIn5m", 
     "Metrics table - isCall", "Metrics table - isCallInbound", "Metrics table - isCallOutbound", "Metrics table - isCsTicket", 
     "Metrics table - isFollowUp", "Metrics table - isMigrated", "Metrics table - isSev1", "Metrics table - isSharedIgnite", 
     "Metrics table - issueSeverity", "Metrics table - itrAssignmentTime", "Metrics table - jiraId", "Metrics table - jiraIdBackup", 
     "Metrics table - jiveVersion", "Metrics table - kbArticleURL", "Metrics table - kbUsed", "Metrics table - lastMacroId", 
     "Metrics table - lastPending", "Metrics table - latestUpdateByAssignee", "Metrics table - latitude", "Metrics table - levelSolved", 
     "Metrics table - linkedUnit", "Metrics table - linkedUnitAssigneeId", "Metrics table - location", "Metrics table - longitude", 
     "Metrics table - l1FcrNew", "Metrics table - l2FcrNew", "Metrics table - npsComment", 
     "Metrics table - npsReason", "Metrics table - npsScore", "Metrics table - npsSent", "Metrics table - npsType", 
     "Metrics table - numericPriority", "Metrics table - onHoldReason", "Metrics table - onHoldReleaseETA", "Metrics table - onTimeIRT", 
     "Metrics table - onTimeResolution", "Metrics table - oneTouchResolution", "Metrics table - organizationId", "Metrics table - organizationName", 
     "Metrics table - outboundCallsMade", "Metrics table - priority", "Metrics table - PSSkyveraJIRA_ID", "Metrics table - PSSkyveraJIRA_Key", 
     "Metrics table - product", "Metrics table - productName", "Metrics table - qualityScore", "Metrics table - qualityScoreWithoutLastPending", 
     "Metrics table - reopenCount", "Metrics table - requester", "Metrics table - resolutionTime", "Metrics table - resolutionTimeWithoutLastPending", 
     "Metrics table - sev1Reason", "Metrics table - sharingAgreements", "Metrics table - skills", "Metrics table - solDelProcStarted", 
     "Metrics table - solvedWithExternalAssistance", "Metrics table - status", "Metrics table - statusId", "Metrics table - statusName", 
     "Metrics table - subject", "Metrics table - Createter", "Metrics table - SupportJiraIds", "Metrics table - thirdStrike", 
     "Metrics table - ticketClosed", "Metrics table - ticketComponent", "Metrics table - ticketCreated", "Metrics table - ticketCreatedRaw", 
     "Metrics table - ticketFormId", "Metrics table - ticketQB", "Metrics table - ticketReopened", "Metrics table - ticketSolved", 
     "Metrics table - ticketSolvedRaw", "Metrics table - ticketTags", "Metrics table - ticketUpdated", "Metrics table - timelinessMet", 
     "Metrics table - timeSpentInHold", "Metrics table - timeSpentInNew", "Metrics table - timeSpentInOpen", "Metrics table - timeSpentInPending", 
     "Metrics table - timeSpentInSolved", "Metrics table - timeSpentInSolvedBeforeReopened", "Metrics table - timeSpentITAR", 
     "Metrics table - timeSpentOpenCSM", "Metrics table - timeSpentOpenL1", "Metrics table - timeSpentOpenL2", "Metrics table - timeSpentOpenOther", 
     "Metrics table - timeSpentOpenPKC", "Metrics table - timeSpentOpenUnassigned", "Metrics table - tmp", "Metrics table - updatedAt", 
     "Metrics table - usedKbArticles", "Metrics table - waitingTime", "Metrics table - withExternalTeam",
  ];

  useEffect(() => {
    const excludedBUnames = [
      "Ignite",
      "GFI",
      "CopperTree",
      "Crossover",
      "Engineering/SaaS",
      "Central Finance",
      "CS Knowledge",
      "Totogi",
      "Education",
      "CS Escalation",
      "Joe R&D",
      "CloudFix",
      "zaxcapital",
      "Jigsaw",
      "Skyvera",
    ]; 
  
    const storedProductList = localStorage.getItem("product-list");
    if (storedProductList) {
      try {
        const parsedList = JSON.parse(storedProductList)
          .filter(([id]) => !excludedBUnames.includes(id)) 
          .map(([id, name]) => `${name} - (${id})`)
          .sort((a, b) => a.localeCompare(b)); // alphabetical order
  
        setProductList(parsedList);
      } catch (error) {
        console.error("Error parsing product list from localStorage:", error);
      }
    }
  }, []);

  // load prices from Google Sheets
  useEffect(() => {
    let mounted = true;
    (async () => {
      const values = await fetchModels();
      if (!values || values.length < 2) return;
      const [, ...rows] = values;
      const map = rows.reduce((acc, [model, inCost, outCost]) => {
        if (model) acc[model] = { in: parseFloat(inCost), out: parseFloat(outCost) };
        return acc;
      }, {});
      if (!mounted) return;
      setPrices(map);
      if (!map[selectedOption]) {
        const first = Object.keys(map)[0];
        if (first) setSelectedOption(first);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (fromDate && toDate && selectedProducts.length > 0) {
      setIsSecondBoxVisible(true); 
    } else {
      setIsSecondBoxVisible(false); 
    }
  }, [fromDate, toDate, selectedProducts]);

  // dynamic-cost block
  useEffect(() => {
    if (
      baseInputTokens != null &&
      baseOutputTokens != null &&
      prices?.[selectedOption]
    ) {
      const cost = computeCost(selectedOption, baseInputTokens, baseOutputTokens);
      setCalculatedCost(cost.toFixed(2));
      setcalculatedInputTokens(baseInputTokens);
      setcalculatedOutputTokens(baseOutputTokens);
    }
  }, [selectedOption, baseInputTokens, baseOutputTokens, prices]);

  useEffect(() => {
    // console.log(`Updated loading progress: ${loadingProgress}`);
  }, [loadingProgress]);

  const handleFieldChange = (index, field, value) => {
    const updatedFields = [...fields];
    updatedFields[index][field] = value;

    const errors = updatedFields[index].errors || {};
    if (field === "name" && value !== "Name") {
      delete errors.name;
    }
    if (field === "customName" && value.trim() !== "") {
      delete errors.customName;
    }
    if (field === "description" && value.trim() !== "") {
      delete errors.description;
    }
    updatedFields[index].errors = errors;
  
    setFields(updatedFields);
  };

  const handleCreate = async () => {

    const customNames = fields
    .filter(field => field.name === "Custom" && field.customName)
    .map(field => field.customName.trim().toLowerCase()); 

    const duplicates = customNames.filter((name, index, array) => array.indexOf(name) !== index);

    if (duplicates.length > 0) {
      popUp(`Duplicated field detected.\n Please review the following custom name(s): \n \n ${[...new Set(duplicates)].join(", ")}`);
      setLoading(false);
      return;
    }

    // ⚠️ Icon
    setSheetUrl(null);
    setIsLogsVisible(true);
    setLoading(true);
    setBaseInputTokens(null);
    setBaseOutputTokens(null);
    setcalculatedInputTokens(null);
    setcalculatedOutputTokens(null);
    setCalculatedCost(null);
    setPostProcessLogs([]);

    await delay(291);
    let isValid = true;

    const relevantFields = fields.filter((field) => field.id > 2);
    const updatedFields = relevantFields.map((field) => {
      const errors = {};
  
      if (!field.name || field.name === "Name") {
        errors.name = true;
        isValid = false;
      }
  
      if (field.name === "Custom") {
        errors.customName = !field.customName || field.customName.trim() === "";
        errors.description = !field.description || field.description.trim() === "";
        if (errors.customName || errors.description) {
          isValid = false;
        }
      }
  
      return { ...field, errors };
    });
  
    const allFields = fields.map((field) =>
      field.id > 2
        ? updatedFields.find((updatedField) => updatedField.id === field.id) || field
        : field
    );
  
    setFields(allFields);
  
    if (!isValid) {
      setLoading(false);
      return;
    }
  
    if (!fromDate || !toDate || selectedProducts.length === 0) {
      popUp("Please fill in all required fields.");
      setLoading(false);
      return;
    }
  
    const userInfo = localStorage.getItem("user_info");
    if (!userInfo) {
      console.error("Error: User info not found in localStorage.");
      setLoading(false);
      return;
    }
    const userEmail = JSON.parse(userInfo).email;
  
    setLogMessages([``]);
    await delay(291);
    addLogMessage(`[${getCurrentDate()}] - Creating file in Google Sheets.`);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////// FIRST CALL: Create the file in Google Sheets (66lra36o5gbbi5lxij3wcijhbi0ksxui - cs-ai-cors-handler-for-sheet-creation)
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    let data1;
    let payload = { email: userEmail };

    // console.log(`First call payload: ${JSON.stringify(payload, null, 2)}`);

      try {
        const url = "https://66lra36o5gbbi5lxij3wcijhbi0ksxui.lambda-url.us-east-1.on.aws/";
        const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`Error in API call: ${response.status}`);
          }
        data1 = await response.json();
      } catch (error) { 
        addLogMessage(`[${getCurrentDate()}] - 390 Error: ${error.message}`); 
        throw new Error(`API call failed: ${error}`); 
      }
  
    //////////////////////////////////////////////////////////////////////////

    const productIds = selectedProducts.map(prod => {
      const parts = prod.split(" - ");
      const lastPart = parts[parts.length - 1];
      return lastPart.replace("(", "").replace(")", "");
    }).filter(Boolean);

    const result = {
      sheetId: data1.sheeetId,
      product: productIds,
      from: fromDate.format("YYYY-MM-DD"),
      to: toDate.format("YYYY-MM-DD"),
      columns: relevantFields.length,
      columnNames: relevantFields.map((field) => [
        field.name || "",
        field.customName || "",
        field.options || "",
        field.description || "",
      ]),
      condition: optionValue,
    };
  
    // console.log(JSON.stringify(result, null, 2));
  
    const sheetUrl = data1.sheetUrl;
    setSheetUrl(sheetUrl);
    addLogMessage(`[${getCurrentDate()}] - File created. Click on the Google Sheets icon to check the report.`, data1.sheetUrl);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////// SECOND CALL: Write the report in the created file (3krfichmtib74nxknsa6nw6hfq0wfdhs - cs-ai-olympus-ticket-tamer)
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    await delay(291);
    addLogMessage(`[${getCurrentDate()}] - Generating report. This process might take a while, depending on the number of tickets and columns.`);
    let data2;
    let sizeRows = 0;
    payload = result;

    const userInfoString = localStorage.getItem('user_info');

      if (userInfoString) {
        // console.log("User info string found in localStorage.");
          try {
              const userInfo = JSON.parse(userInfoString);
              if (userInfo.email) {
                  // console.log("User email found in user_info.");
                  payload.user = userInfo.email.charAt(0).toUpperCase() + userInfo.email.slice(1); //Add this to the payload, so we can rename the Google Sheet.
                  // console.log(`User email: ${userInfo.email}`);
              } else {
                  console.error('Email does not exist.');
              }
          } catch (error) {
              console.error('Error parsing user_info from localStorage:', error);
          }
      } else {
          console.error('user_info not found in localStorage.');
      }

    setPayloadData(payload);
    // console.log(`Payload saved: ${JSON.stringify(payload, null, 2)} `);

      try {
        const url = "https://3krfichmtib74nxknsa6nw6hfq0wfdhs.lambda-url.us-east-1.on.aws/" //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }

        const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`Error in Second API call: ${response.status}`);
          }
        data2 = await response.json();

        addLogMessage(`[${getCurrentDate()}] - Report completed.`);
        await delay(291);
        addLogMessage(`[${getCurrentDate()}] - ${data2.message.info}`);
        sizeRows = +(data2.message.size);

      } catch (error) { 
        addLogMessage(`[${getCurrentDate()}] - 442 Error: ${error.message}`); 
        throw new Error(`Second API call failed: ${error}`); 
      }
      
      const hasCustomFields = relevantFields.some(field => 
        field.name === "Custom" &&
        field.customName?.trim() !== "" &&
        field.description?.trim() !== ""
      );

    if (!hasCustomFields) {
        setLoading(false);
        return; 
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////// THIRD CALL: Calculate the estimated cost (aj3q2sktxoe5cmwaizcubbfxy40lepzj - cs-ai-olympus-ticket-tamer-cost-calculator)
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    await delay(291);
    addLogMessage(`[${getCurrentDate()}] - Calculating tokens to be processed...`);

    let data3;
    payload.size = sizeRows; //I also send the size of the rows to the cost calculator, so it can calculate the cost.
    console.log(`Third call payload: ${JSON.stringify(payload, null, 2)}`);

      try {
        const url = "https://aj3q2sktxoe5cmwaizcubbfxy40lepzj.lambda-url.us-east-1.on.aws/"
        const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`Error in Third API call: ${response.status}`);
          }
        data3 = await response.json();

      } catch (error) {
        addLogMessage(`[${getCurrentDate()}] - 462 Error: ${error.message}`); 
        throw new Error(`Third API call failed: ${error}`); 
      } finally {
        setLoading(false);
      }

    //////////////////////////////////////////////////////////////////////////

    if (data3.message && data3.message.total_input_tokens != null) {
      const totalInputTokens = parseFloat(data3.message.total_input_tokens);
      const totalOutputTokens = parseFloat(data3.message.total_output_tokens);
    
      initializeTokens(totalInputTokens, totalOutputTokens);

      addLogMessage(`[${getCurrentDate()}] - Input Tokens calculated: ${totalInputTokens} tokens.`);
      await delay(291);
      addLogMessage(`[${getCurrentDate()}] - Output Tokens calculated: ${totalOutputTokens} tokens.`);

    } else {
      console.error("Invalid response data:", data3);
      addLogMessage(`[${getCurrentDate()}] - Error: Invalid response data.`);
    }

    await delay(291);

    //////////////////////////////////////////////////////////////////////////
    
  };

  const handleProcess = async () => {
    if (!payloadData) {
        popUp("Payload not found. Please generate the report first.");
        return;
    }

    setPostProcessLogs([]);
    setIsProcessing(true);
    setShowProgressBar(false);  // Ocultar la barra al inicio

    let payload = {
      ...payloadData,
      model: selectedOption,
    };

    const proceed = await popUpYesNo(
      `WARNING:
      When you click "OK," an AI powered by the ${selectedOption} model will process ${calculatedInputTokens + calculatedOutputTokens} tokens.
      The estimated cost for this operation is $${calculatedCost}.
      Would you like to proceed? (This action cannot be undone.)`,
      () => handleProcess()
    );

    if (!proceed) {
      setIsProcessing(false); // Si el usuario cancela, detén el proceso
      return;
    } else {
      setPostProcessLogs((prevLogs) => [
          ...prevLogs,
          `[${getCurrentDate()}] - Processing started.`,
      ]);

      await delay(291);

      setPostProcessLogs((prevLogs) => [
          ...prevLogs,
          `[${getCurrentDate()}] - AI model: ${selectedOption} processing ${calculatedInputTokens + calculatedOutputTokens} tokens approx. (${calculatedInputTokens} Input tokens and ${calculatedOutputTokens} Output tokens)`,
      ]);

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      ///////////////////////////// FOURTH CALL: Process with the AI (c6x7e6cbyt3vvi45mnsnq3z5kq0jiszm - cs-ai-olympus-ticket-tamer-process-ai)
      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        let data4 = {};

        try {
            console.log(`Fourth call payload: ${JSON.stringify(payload, null, 2)}`);

            const url = "https://c6x7e6cbyt3vvi45mnsnq3z5kq0jiszm.lambda-url.us-east-1.on.aws/"; //Process AI
            const options = { 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify(payload)
            };
            const response = await fetch(url, options);
              if (!response.ok) {
                  throw new Error(
                      `API call failed with status ${response.status}`
                  );
              }

            data4 = await response.json();
            // console.log("4th API Response:", data4);

            setPostProcessLogs((prevLogs) => [
                ...prevLogs,
                `[${getCurrentDate()}] - ${data4.message}`,
            ]);

        } catch (error) {
            console.error("Error making Fourth API call:", error);
            popUp("API call failed. Check the console for more details.");

            setPostProcessLogs((prevLogs) => [
              ...prevLogs,
              `[${getCurrentDate()}] - Error: ${error.message}`,
          ]);
        } 

      //////////////////////////////////////////////////////////////////////////

      await delay(291);

      setPostProcessLogs((prevLogs) => [
          ...prevLogs,
          `[${getCurrentDate()}] - Creating the Buffer table (This process can take up to 90 seconds).`,
      ]);

      await delay(300);
      setShowProgressBar(true);

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      ///////////////////////////// FIFTH CALL: Process with the AI (2i325okuovtaocjh4e24wwizvm0fkbrh - cs-ai-olympus-ticket-tamer-report-finisher)
      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const rowNumber = +(data4.message.split("Processing")[1].split("tickets")[0].trim());
        // console.log("Row number:", rowNumber);

        console.log(`Entering first time check progress`);
        await checkProgress(rowNumber, "insert", 0);
        console.log(`Leaving first time check progress`);

        let payload2 = {
            rows_count: rowNumber,
            sheet_id: payloadData.sheetId,
            delete_buffer: false, //false for testing, true for production
        };

        console.log(`Fifth call payload: ${JSON.stringify(payload2, null, 2)}`);

        try {
            // console.log("Payload:", payload2);

            const url = "https://2i325okuovtaocjh4e24wwizvm0fkbrh.lambda-url.us-east-1.on.aws/"; //Finisher
            const options = { 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify(payload2)
            };
            const response = await fetch(url, options);
              if (!response.ok) {
                  throw new Error(
                      `5th API call failed with status ${response.status}`
                  );
              }

            const data5 = await response.json();
            console.log("5th API Response:", data5);

            const splitMessage = data5.message?.split("||");
            const firstLine = splitMessage[0];
            const secondLine = splitMessage[1];

            setPostProcessLogs((prevLogs) => [
                ...prevLogs,
                `[${getCurrentDate()}] - ${data5.message ? firstLine : "No message received."}`,
            ]);

            /*- Calculating Report's Price -*/

            const { sumInput, sumOutput, avgInput, avgOutput } = JSON.parse(secondLine);

          await delay(291);

          setPostProcessLogs((prevLogs) => [
              ...prevLogs,
              `[${getCurrentDate()}] - ${data5.message ? `Processed Input tokens: ${sumInput} (${avgInput.toFixed(0)} average per row), Processed Output tokens: ${sumOutput} (${avgOutput.toFixed(0)} average per row)` : " "}`,
          ]);

          await delay(489);

          // dynamic final cost
          const finalCost = prices?.[selectedOption]
            ? computeCost(selectedOption, +sumInput, +sumOutput)
            : null;

          setPostProcessLogs((prevLogs) => [
              ...prevLogs,
              `[${getCurrentDate()}] - ${data5.message ? `Total cost: $${finalCost ? finalCost.toFixed(2) : "N/A"}` : " "}`,
          ]);

        } catch (error) {
            console.error("Error making Fifth API call:", error);
            setPostProcessLogs((prevLogs) => [
              ...prevLogs,
              `[${getCurrentDate()}] - Error: ${error.message}`,
          ]);
        } 
        // finally {
        //   setIsProcessing(false); 
        // }

      ///////////////////////////// SIXTH CALL: Delete the buffer

        await delay(489);
        console.log("Deleting buffer...");

        try {

          const url = "https://ms36hej36qpyrqasvkwqmozkwm0ijnuo.lambda-url.us-east-1.on.aws/"; //Finisher
          const options = { 
              method: "GET", 
              headers: { "Content-Type": "application/json" }
          };

          fetch(url, options);

          setPostProcessLogs((prevLogs) => [
              ...prevLogs,
              `[${getCurrentDate()}] - Deleting buffer...`,
          ]);

          await delay(489);

        } catch (error) {
            console.error("Error making Sixth API call:", error);

            setPostProcessLogs((prevLogs) => [
                ...prevLogs,
                `[${getCurrentDate()}] - Error: ${error.message}`,
            ]);

        } 

        console.log(`Entering second time check progress`);
        await checkProgress(payload2.rows_count, "delete", 100);
        console.log(`Leaving second time check progress`);

        setPostProcessLogs((prevLogs) => [
            ...prevLogs,
            `[${getCurrentDate()}] - Buffer deleted. All actions have been completed.`,
        ]);

        setIsProcessing(false); 

      //////////////////////////////////////////////////////////////////////////

    }

  };

  const handleRemoveProduct = (index) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const renderComboBoxes = () => (
    <Box sx={{ width: '100%' }}>
      {/* Row 1 - Instruction Text */}
      {/* <Box sx={{ mb: 2, width: '100%' }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Select a product and specify the "Closed date" range. The report calculation considers 00:00 (midnight) of each selected date.
        </Typography>
      </Box> */}
  
      {/* Row 2 - Product + Selected Products */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, width: '100%' }}>
        {/* Product */}
        <TextField
          select
          fullWidth
          label="Product"
          value=""
          onChange={(e) => {
            const value = e.target.value;
            if (value === "__ALL_PRODUCTS__") {
              const newSelections = productList.filter(p => !selectedProducts.includes(p));
              setSelectedProducts(prev => [...prev, ...newSelections]);
            } else if (!selectedProducts.includes(value)) {
              setSelectedProducts(prev => [...prev, value]);
            }
          }}
          onClick={() => {
            if (!productList.length) {
              popUp("Your session has expired. You will be redirected to the login screen.");
              window.location.href = "/login";
            }
          }}
          sx={{ ...getTextFieldStyles(colors), flex: 1 }}
        >
          <MenuItem value="__ALL_PRODUCTS__"> ALL PRODUCTS </MenuItem>
          {productList.map((product, index) => (
            <MenuItem key={index} value={product}>
              {product}
            </MenuItem>
          ))}
        </TextField>
  
        {/* Selected Products */}
        <Box sx={{ position: 'relative', flex: 1 }}>
          <InputLabel
            shrink={selectedProducts.length > 0}
            sx={{
              position: 'absolute',
              top: '8px',
              left: '14px',
              transform: selectedProducts.length > 0
                ? 'scale(0.75) translate(0, -1.5px)'
                : 'scale(1) translate(0, 16px)',
              transformOrigin: 'top left',
              transition: 'transform 0.2s ease-in-out',
              color: theme.palette.mode === 'dark'
                ? theme.palette.grey[300]
                : theme.palette.grey[700],
            }}
          >
            Selected Products
          </InputLabel>
          <Box
            sx={{
              border: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.23)'
                : 'rgba(0, 0, 0, 0.23)'}`,
              borderRadius: '4px',
              padding: '28px 14px 8px 14px',
              height: '56px',
              overflowY: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'flex-start',
              minHeight: '56px',
              maxHeight: '500px',
            }}
          >
            {selectedProducts.map((product, index) => (
              <Chip
                key={index}
                label={product.split('-')[0].trim()}
                onDelete={() => handleRemoveProduct(index)}
                size="small"
                sx={{
                  maxWidth: '100%',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
  
      {/* Row 3 - Option + From + To */}
      <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
        {/* Options */}
        <TextField
          select
          label="Condition"
          value={optionValue}
          onChange={(e) => setOptionValue(e.target.value)}
          sx={{ ...getTextFieldStyles(colors), flex: 1 }}
        >
          <MenuItem value="1">Created between</MenuItem>
          <MenuItem value="2">Closed between</MenuItem>
          <MenuItem value="3">Last update between</MenuItem>
        </TextField>
  
        {/* From */}
        <DatePicker
          label="From"
          value={fromDate}
          onChange={(newValue) => setFromDate(newValue)}
          renderInput={(params) => (
            <TextField {...params} fullWidth sx={{ ...getTextFieldStyles(colors), flex: 1 }} />
          )}
        />
  
        {/* To */}
        <DatePicker
          label="To"
          value={toDate}
          onChange={(newValue) => setToDate(newValue)}
          renderInput={(params) => (
            <TextField {...params} fullWidth sx={{ ...getTextFieldStyles(colors), flex: 1 }} />
          )}
        />
      </Box>
    </Box>
  );
 
  const handleOptionChange = (event) => {
      const selected = event.target.value;
      setSelectedOption(selected);

      if (baseInputTokens != null && baseOutputTokens != null && prices?.[selected]) {
          const cost = computeCost(selected, baseInputTokens, baseOutputTokens);
          setCalculatedCost(cost.toFixed(2));
          setcalculatedInputTokens(baseInputTokens);
          setcalculatedOutputTokens(baseOutputTokens);
      } else {
          console.error("Base tokens not initialized or prices not loaded.");
      }
  };

  const initializeTokens = (inputTokens, outputTokens) => {
    if (isNaN(inputTokens) || isNaN(outputTokens)) {
      console.error("Invalid token values:", { inputTokens, outputTokens });
      return;
    }
  
    setBaseInputTokens(inputTokens);
    setBaseOutputTokens(outputTokens);

    // align tokens with what we got from calculator
    setcalculatedInputTokens(inputTokens);
    setcalculatedOutputTokens(outputTokens);
  };

  const handleSaveConfig = (event) => {
    if (!fromDate || !toDate || selectedProducts.length === 0 || fields.length === 0) {
      popUp("Please fill in all required fields before saving.");
      return;
    }
    setAnchorEl(event.currentTarget); 
  };

  const handleConfirmSaveConfig = async () => {
    if (!configName.trim()) {
      popUp("Please enter a valid config name.");
      return;
    }
  
    setIsSaving(true);
  
    const userInfo = localStorage.getItem("user_info");
    if (!userInfo) {
      console.error("Error: User info not found in localStorage.");
      popUp("User info not found. Please log in again.");
      setIsSaving(false);
      return;
    }
  
    const userEmail = JSON.parse(userInfo).email;
  
    let userConfigs = await getSavedConfig();
    console.log(`Size: ${userConfigs.length}`);
    userConfigs = userConfigs.map(row => row[1]);
    // console.log(`Config names: ${userConfigs}`);
    // console.log(`Condition: ${userConfigs.includes(configName)}`);
  
    if (userConfigs.includes(configName)) {
      console.error("Error: This config already exists. Use another name");
      popUp("This config already exists. Pick another name");
      setIsSaving(false);
      return;
    }
  
    const configData = {
      name: configName,
      json: {
        selectedProducts,
        fromDate: fromDate.format("YYYY-MM-DD"),
        toDate: toDate.format("YYYY-MM-DD"),
        fields,
      },
      email: userEmail,
    };
  
    try {
      setAnchorEl(null);
      setShowSavedMessage(false);
  
      const response = await fetch("https://y27v4ckyckup3vgedda2hnik5y0avuun.lambda-url.us-east-1.on.aws/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to save config: ${response.statusText}`);
      }
  
      // After successful save, fetch the updated config list and update the state
      const updatedConfigs = await getSavedConfig();
      setSavedConfigs(updatedConfigs);
  
      setShowSavedMessage(true);
      setTimeout(() => {
        setShowSavedMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving config:", error);
      popUp("Failed to save configuration. Please try again.");
    } finally {
      setIsSaving(false); // Disable the loading state after completion
    }
  };

  const handleLoadConfig = async () => {
    if (isConfigPanelVisible) {
      // Si ya está abierto, lo cerramos
      setIsConfigPanelVisible(false);
      return;
    }
  
    try {
      const userConfigs = await getSavedConfig();  

      setSavedConfigs(userConfigs);
      setIsConfigPanelVisible(true);
  
    } catch (error) {
      console.error("Error loading config:", error);
      popUp("Failed to load configuration. Please try again.");
    }
  };
  
  const handleSelectConfig = (config) => {
    const parsedConfig = JSON.parse(config[2]); // Parsear la configuración
  
    setFromDate(dayjs(parsedConfig.fromDate));
    setToDate(dayjs(parsedConfig.toDate));
    setSelectedProducts(parsedConfig.selectedProducts);
    setFields(parsedConfig.fields);
    setIsConfigPanelVisible(false); // Ocultar el panel después de seleccionar una configuración
  };

  const handleDeleteConfig = async (configName, index) => {
    setLoadingIndex(index); 
  
    try {
      const options = {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: configName }),
      };

      console.log(`options = ${JSON.stringify(options, null, 2)}`)
      const response = await fetch("https://y27v4ckyckup3vgedda2hnik5y0avuun.lambda-url.us-east-1.on.aws/", options);
  
      if (!response.ok) {
        throw new Error(`Failed to delete config: ${response.statusText}`);
      }

      setSavedConfigs((prevConfigs) => prevConfigs.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting config:", error);
      popUp("Failed to delete configuration. Please try again.");
    } finally {
      setLoadingIndex(null);
    }
  };

  const checkProgress = async (size, mode = "insert", startValue) => {
    setLoadingProgress(startValue);
    setShowProgressBar(true);

    const startTime = Date.now(); 

    while (true) {
        try {
            const response = await fetch("https://xgo6jfj4zqlqqkhi4xffzgbbd40sarlx.lambda-url.us-east-1.on.aws/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ size, mode }),
            });

            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }

            const data = await response.json();
            let progress = data.message.progress || 0;
            setLoadingProgress(progress);

            if (mode === "insert") {
                
                if (Date.now() - startTime > 90000) { //Checks that the process doesn't hung in 90 seconds.
                    console.warn("Limit time (90 seconds) reached. Aborting");
                    setPostProcessLogs((prevLogs) => [
                        ...prevLogs,
                        `[${getCurrentDate()}] - Buffer not fully loaded: the AI engine failed responding one more more requests. Success rate: ${progress}%`,
                    ]);
                    return false;
                }

                if (progress >= 100) {
                    setLoadingProgress(100);
                    setPostProcessLogs((prevLogs) => [
                        ...prevLogs,
                        `[${getCurrentDate()}] - Buffer completed. Dumping the data to Google Sheets. Writting 115 rows / sec, approx.`,
                    ]);
                    return true;
                }

            } else if (mode === "delete") {

              if (Date.now() - startTime > 90000) { //Checks that the process doesn't hung in 90 seconds.
                  console.warn("Limit time (90 seconds) reached. Aborting");
                  setPostProcessLogs((prevLogs) => [
                      ...prevLogs,
                      `[${getCurrentDate()}] - Buffer not fully cleared: the buffer still contains some of the answers. This does not affect the execution, but please report it to xavier.villarroel@trilogy.com.`,
                  ]);
                  return false;
              }

                if (progress <= 0) {
                    console.log("Buffer deleted.");
                    setLoadingProgress(0);

                    await delay(1000);
                    setShowProgressBar(false);
                    return true;
                }
            }

        } catch (error) {
            console.error(`Error verificando progreso (${mode}):`, error);
            setShowProgressBar(false);
            return false;
        }

        await delay(50);
    }
  };

  const resetForm = () => {
    setFields([
      { id: 1, name: "", options: "", description: "", errors: {} },
      { id: 2, name: "", options: "", description: "", errors: {} },
    ]);
    setFromDate(null);
    setToDate(null);
    setSelectedProducts([]);
    setIsSecondBoxVisible(false);
    setLoading(false);
    setLogMessages([]);
    setIsLogsVisible(false);
    setSheetUrl(null);
    setBaseInputTokens(null);
    setBaseOutputTokens(null);
    setcalculatedInputTokens(null);
    setcalculatedOutputTokens(null);
    setCalculatedCost(null);
    setPayloadData(null);
    setPostProcessLogs([]);
    setIsProcessing(false);
    setIsConfigPanelVisible(false);
    setLoadingIndex(null);
    setConfigName("");
    setAnchorEl(null);
    setIsSaving(false);
    setShowSavedMessage(false);
    setBufferProgress(0);
    setLoadingProgress(0);
    setShowProgressBar(false);
    setDialogOpen(false);
    setDialogMessage("");
    setConfirmDialogOpen(false);
    setConfirmMessage("");
    setOnConfirm(null);
    setOptionValue("2");
    setSelectedOption(prices && Object.keys(prices)[0] ? Object.keys(prices)[0] : "gpt-4o");
    setTicketIds("");
  };
  

  /* simple mode toggle — keeps global productMode in sync */
  const toggleMode = () => {
    const next = !isProductMode;
    setIsProductMode(next);
    productMode = next; // keep global var in sync
    resetForm();        // wipe all user inputs and transient state
  };

  return (

      <LocalizationProvider dateAdapter={AdapterDayjs}>

      <GlobalStyles
          styles={{
            // ".MuiOutlinedInput-root:hover fieldset": {
            //   borderColor: `${colors.greenAccent[300]} !important`, // Hover en los bordes
            // },
            ".MuiOutlinedInput-root.Mui-focused fieldset": {
              borderColor: `${colors.greenAccent[400]} !important`, // Cuando está enfocado
            },
            ".MuiInputLabel-root": {
              color: `${colors.primary[100]} !important`, // Color de los labels por defecto
            },
            ".MuiInputLabel-root.Mui-focused": {
              color: `${colors.greenAccent[300]} !important`, // Color de labels cuando está en focus
            },
            ".MuiButton-contained": {
              backgroundColor: `${colors.greenAccent[300]} !important`, // Botones primarios
            },
            ".MuiButton-contained:hover": {
              backgroundColor: `${colors.greenAccent[700]} !important`, // Botones en hover
            },
          }}
        />

        <Box m="20px">

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mb: 2,
            }}
          >
            {/* LOAD CONFIG BUTTON */}
            <Button
              variant="contained"
              onClick={handleLoadConfig}
              sx={{
                backgroundColor: colors.greenAccent[300],
                color: colors.primary[900],
                textAlign: "center",
                "&:hover": {
                  backgroundColor: colors.blueAccent[700],
                },
              }}
            >
              Load Config
            </Button>

            {/* SAVE CONFIG BUTTON */}
            <Box sx={{ position: "relative", display: "inline-block" }}>
              <Button
                variant="contained"
                onClick={handleSaveConfig}
                sx={{
                  backgroundColor: colors.greenAccent[300],
                  color: colors.primary[900],
                  minWidth: "130px",  // Tamaño fijo como los otros botones
                  minHeight: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  "&:hover": {
                    backgroundColor: colors.greenAccent[700],
                  },
                }}
              >
                {isSaving ? <CircularProgress size={24} sx={{ color: colors.greenAccent[900] }} /> : "Save Config"}
              </Button>

              {/* Mensaje "saved" posicionado sin afectar el botón */}
              {showSavedMessage && (
                <Typography
                  sx={{
                    position: "absolute",
                    top: "100%",  // Justo debajo del botón
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: colors.redAccent[500],
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginTop: "5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  saved!
                </Typography>
              )}
            </Box>
          </Box>


          <Header
            title="Custom Report"
            subtitle="This tool allows you to generate a custom report with additional columns for specific data fields. Start by selecting the created date range."
          />

          {/*- First tile -*/}
          <Box
            sx={{
              display: "flex",
              gap: 4,
              alignItems: "center",
              mb: 4,
            }}
          >

          {/* Both paper's containers */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "start", width: "100%", position: "relative" }}>
            {/* Left Pannel */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                width: "50%",
                textAlign: "left",
                backgroundColor: transparent(colors.blueAccent[900]),
                transition: "none", // No cambia de tamaño nunca
                position: "relative" // for toggle button positioning
              }}
            >

              {/* toggle button (requested) */}
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ flex: 1, pr: 2 }}>
                  {isProductMode
                    ? "Select the product(s) and the condition to be applied. For the Dates, The report calculation considers 00:00 (midnight) of each selected date."
                    : "Insert the tickets IDs separated by commas. Example: '12345678, 87654321'"
                  }
                </Typography>

                <Tooltip title={isProductMode ? "Switch to ticket id mode" : "Switch to product mode"} arrow>
                  <Button
                    size="small"
                    onClick={toggleMode}
                    sx={{
                      backgroundColor: colors.greenAccent[300],
                      color: colors.primary[900],
                      minHeight: "28px",
                      minWidth: "28px",
                      px: 1.5,
                      whiteSpace: "nowrap",
                      "&:hover": { backgroundColor: colors.greenAccent[700] },
                    }}
                  >
                    {isProductMode ? "TM" : "PM"}
                  </Button>
                </Tooltip>
              </Box>


              {/* content switches per mode */}
              {isProductMode ? (
                renderComboBoxes()
              ) : (
                <Box sx={{ width: "100%" }}>
                  <TextField
                    fullWidth
                    label="Ticket IDs"
                    placeholder="12345678, 87654321"
                    value={ticketIds}
                    onChange={(e) => setTicketIds(e.target.value)}
                    sx={getTextFieldStyles(colors)}
                  />
                </Box>
              )}
            </Paper>

            {/* Right Pannel */}
            {isConfigPanelVisible && (
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  width: "45%", 
                  backgroundColor: transparent(colors.blueAccent[900]),
                  color: colors.primary[100],
                  overflowY: "auto",
                  position: "absolute",
                  right: 0, 
                  top: 0,
                  zIndex: 10, 
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Select a Saved Configuration:
                </Typography>

                {savedConfigs.map((config, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    {/* Select config button */}
                    <Button
                      variant="outlined"
                      sx={{
                        width: "90%",
                        textAlign: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent",
                        color: colors.primary[100],
                        borderColor: colors.greenAccent[300],
                        "&:hover": {
                          backgroundColor: transparent(colors.greenAccent[300], 0.2),
                          borderColor: colors.greenAccent[500],
                        },
                      }}
                      onClick={() => handleSelectConfig(config)}
                    >
                      {config[1]}
                    </Button>

                    {/* delete config button */}
                    <Button
                      variant="outlined"
                      sx={{
                        width: "10%",
                        height: "100%", 
                        minWidth: "40px",
                        backgroundColor: "transparent",
                        color: colors.redAccent[400],
                        borderColor: colors.redAccent[400],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "&:hover": {
                          backgroundColor: transparent(colors.redAccent[400], 0.2),
                          borderColor: colors.redAccent[500],
                        },
                      }}
                      onClick={() => handleDeleteConfig(config[1], index)}
                    >
                      {loadingIndex === index ? <CircularProgress size={14} sx={{ color: colors.redAccent[400] }} /> : <DeleteIcon />}
                    </Button>

                  </Box>
                ))}

                
              </Paper>
            )}
          </Box>


          </Box>

        {isSecondBoxVisible && (
          fields.map((field, index) => (
            
            /*- Second tile and subsequent tiles -*/
            <Paper
              key={field.id}
              id={`tile-${field.id}`}
              elevation={3}
              sx={{
                p: 3,
                mb: 1,
                backgroundColor: field.id === 1 || field.id === 2
                  ? transparent(colors.primary[300])
                  : transparent(colors.blueAccent[900]),
                color: colors.primary[100],
                width: "50%",
                height: field.name === "Custom" ? "240px" : "128px", 
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {`Column ${field.id} ${ field.id === 1 || field.id === 2 ? " (This field is mandatory) " : ""}`}
                </Typography>

                {field.id !== 1 && field.id !== 2 && (
                  <Tooltip title="DELETE COLUMN" arrow>
                    <DeleteIcon
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleDeleteField(field.id)} 
                    />
                  </Tooltip>
                )}
              </Box>

              {/*- FIELDS -*/}
              <Grid container spacing={3} alignItems="center">

                <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label={field.id === 1 ? "Ticket" : field.id === 2 ? "Subject" : "Name"}
                      variant="outlined"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                      error={field.errors?.name || false}
                      disabled={field.id === 1 || field.id === 2}
                      sx={{
                        ...getTextFieldStyles(colors),
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: field.id === 1 || field.id === 2
                              ? colors.primary[300]
                              : field.errors?.name
                              ? colors.redAccent[400]
                              : colors.greenAccent[100],
                          },
                          "&:hover fieldset": {
                            borderColor: field.id === 1 || field.id === 2
                              ? colors.primary[300]
                              : field.errors?.name
                              ? colors.redAccent[400]
                              : colors.greenAccent[300],
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: field.id === 1 || field.id === 2
                              ? colors.primary[300]
                              : field.errors?.name
                              ? colors.redAccent[400]
                              : colors.greenAccent[400],
                          },
                        },
                      }}
                    >
                      {defaultFields.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                </Grid>

                {field.name === "Custom" && (
                  <>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Custom Name"
                        variant="outlined"
                        value={field.customName || ""}
                        onChange={(e) =>
                          handleFieldChange(index, "customName", e.target.value)
                        }
                        error={field.errors?.customName || false}
                        placeholder={field.errors?.customName ? "Custom Name - Mandatory Field" : ""}
                        sx={{
                          ...getTextFieldStyles(colors),
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: field.errors?.customName
                                ? colors.redAccent[400]
                                : colors.greenAccent[100],
                            },
                            "&:hover fieldset": {
                              borderColor: field.errors?.customName
                                ? colors.redAccent[400]
                                : colors.greenAccent[300],
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: field.errors?.customName
                                ? colors.redAccent[400]
                                : colors.greenAccent[400],
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Output Options (comma-separated)"
                        variant="outlined"
                        value={field.options || ""}
                        onChange={(e) =>
                          handleFieldChange(index, "options", e.target.value)
                        }
                        sx={getTextFieldStyles(colors)}
                      />
                    </Grid>

                    <Grid item xs={12} md={11}>
                      <TextField
                        fullWidth
                        label="Description (Prompt)"
                        variant="outlined"
                        multiline
                        rows={3}
                        value={field.description || ""}
                        onChange={(e) =>
                          handleFieldChange(index, "description", e.target.value)
                        }
                        error={field.errors?.description || false}
                        placeholder={field.errors?.description ? "Description (Prompt) - Mandatory Field" : ""}
                        sx={{
                          ...getTextFieldStyles(colors),
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: field.errors?.description
                                ? colors.redAccent[400]
                                : colors.greenAccent[100],
                            },
                            "&:hover fieldset": {
                              borderColor: field.errors?.description
                                ? colors.redAccent[400]
                                : colors.greenAccent[300],
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: field.errors?.description
                                ? colors.redAccent[400]
                                : colors.greenAccent[400],
                            },
                          },
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

          ))
        )}

        {/*- BUTTONS -*/}
        {isSecondBoxVisible && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 4,
              width: "50%",
            }}
          >
            {/* Botón "Add New Column" */}
            <Tooltip title="Add Column" arrow>
              <Button
                variant="contained"
                onClick={handleAddField}
                sx={{
                  backgroundColor: colors.blueAccent[300],
                  color: colors.primary[900],
                  minWidth: "45px",
                  minHeight: "45px",
                  marginRight: "auto",
                  "&:hover": {
                    backgroundColor: colors.blueAccent[700],
                  },
                }}
              >
                <AddCircleOutlineIcon />
              </Button>
            </Tooltip>

            {/* Botón "Create" */}
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={loading}
              sx={{
                backgroundColor: colors.greenAccent[300],
                color: colors.primary[900],
                minWidth: "65px",
                minHeight: "45px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                "&:hover": {
                  backgroundColor: colors.greenAccent[700],
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: colors.greenAccent[900] }}  /> : "Create"}
            </Button>

          </Box>
        )}

        {/* LOGS */}
        {isLogsVisible && (
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mt: 4, 
              backgroundColor: transparent(colors.blueAccent[900]),
              color: colors.primary[100],
              width: "50%",
              transition: "width 0.3s ease",
              position: "relative", 
            }}
          >
            {sheetUrl && (
              <div
                style={{
                  position: "absolute",
                  top: "24px", 
                  right: "24px", 
                  textAlign: "center",
                }}
              >
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src="https://i.imgur.com/7JPoStV.png"
                    alt="Google Sheets"
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "contain",
                    }}
                  />
                </a>
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: colors.greenAccent[300],
                    textDecoration: "none",
                  }}
                >
                  Open file
                </a>
              </div>
            )}


            {/* logs */}
            {logMessages.map((message, index) => (
              <Typography 
                key={`log-${index}`} 
                variant="body1" 
                sx={{ mb: 1 }}
              >
                {message}
              </Typography>
            ))}
          </Paper>
        )}

        {isLogsVisible && calculatedInputTokens !== null && calculatedInputTokens > 0 && (
            <>
                {/* Cuadro de Tokens y Cost */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        mt: 4,
                        backgroundColor: transparent(colors.blueAccent[900]),
                        color: colors.primary[100],
                        width: "50%",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        {/* Combobox */}
                        <TextField
                            select
                            label="Select AI Model"
                            value={selectedOption}
                            onChange={handleOptionChange}
                            sx={{
                                ...getTextFieldStyles(colors),
                                width: "45%", 
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                        borderColor: colors.greenAccent[100],
                                    },
                                    "&:hover fieldset": {
                                        borderColor: colors.greenAccent[300],
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: colors.greenAccent[400],
                                    },
                                },
                            }}
                        >
                            {models.map((model) => (
                                <MenuItem key={`model=${model}`} value={model}>
                                    {model}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* Tokens y Cost */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column", 
                                alignItems: "flex-end", 
                                gap: 1,
                            }}
                        >
                            <Typography variant="h6">
                                {`Input Tokens: ${calculatedInputTokens} tokens`}
                            </Typography>
                            <Typography variant="h6">
                                {`Output Tokens: ${calculatedOutputTokens} tokens`}
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{ color: colors.redAccent[400] }}
                            >
                                {`Cost: $${calculatedCost || "0.0000"}`}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Botón de Process */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end", 
                        mt: 2, 
                        width: "50%", 
                    }}
                >

                  {/*- Progress Bar -*/}
                  { showProgressBar && isProcessing && loadingProgress !== null && (
                    <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: "10px" }}>

                      <Typography 
                        variant="body1" 
                        sx={{ color: colors.greenAccent[400], fontWeight: "bold", minWidth: "60px" }}
                      >
                        Buffer Status:
                      </Typography>

                      <Box sx={{ width: "80%", backgroundColor: colors.primary[300], borderRadius: "5px", overflow: "hidden" }}>
                        <Box
                          sx={{
                            width: `${loadingProgress}%`,
                            backgroundColor: colors.greenAccent[300],
                            height: "10px",
                            transition: "width 0.5s ease-in-out",
                          }}
                        />
                      </Box>
                      <Typography variant="body2">{loadingProgress}%</Typography>
                    </Box>
                  )}

                <Button
                  variant="contained"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  sx={{
                    backgroundColor: isProcessing ? colors.greenAccent[700] : colors.greenAccent[300],
                    color: colors.primary[900],
                    minWidth: "65px", 
                    minHeight: "45px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    "&:hover": {
                      backgroundColor: isProcessing ? colors.greenAccent[700] : colors.greenAccent[500],
                    },
                  }}
                >
                  <Box sx={{ visibility: isProcessing ? "hidden" : "visible", position: "absolute" }}>
                    Process
                  </Box>
                  {isProcessing && <CircularProgress size={24} sx={{ color: colors.greenAccent[900] }} />}
                </Button>


                </Box>

                {postProcessLogs.length > 0 && (
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            mt: 4, 
                            backgroundColor: transparent(colors.blueAccent[900]),
                            color: colors.primary[100],
                            width: "50%",
                            transition: "width 0.3s ease",
                            position: "relative", 
                        }}
                    >
                        {postProcessLogs.map((log, index) => (
                            <Typography 
                                key={`post-log-${index}`} 
                                variant="body1" 
                                sx={{ mb: 1 }}
                            >
                                {log}
                            </Typography>
                        ))}
                    </Paper>
                )}

                </>
              )}

            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              sx={{
                "& .MuiPaper-root": {
                  backgroundColor: "transparent",
                  borderRadius: "20px", 
                  border: "none", 
                  backdropFilter: "none", 
                },
              }}
            >
              <Box
                sx={{
                  p: 3,
                  backgroundColor: transparent(colors.blueAccent[900]), 
                  borderRadius: "20px", 
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)", 
                  minWidth: "280px",
                }}
              >

              <Header
              // title="Save Config"
              subtitle="Set a name for this configuration"
              />

              <TextField
                autoFocus
                fullWidth
                label="Config Name"
                variant="outlined"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                sx={getTextFieldStyles(colors)}
              />

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                <Button
                  onClick={() => setAnchorEl(null)}
                  sx={{
                    color: colors.redAccent[400],
                    backgroundColor: transparent(colors.redAccent[900]), 
                    "&:hover": { 
                      color: colors.redAccent[900],
                      backgroundColor: (colors.redAccent[300]), 
                    },
                  }}
                >
                  CANCEL
                </Button>
                <Button
                  onClick={handleConfirmSaveConfig}
                  sx={{
                    color: colors.greenAccent[400],
                    backgroundColor: transparent(colors.greenAccent[900]), 
                    "&:hover": { 
                      color: colors.greenAccent[900],
                      backgroundColor: (colors.greenAccent[300]), 
                    },
                  }}
                >
                  SAVE
                </Button>
              </Box>
            </Box>
            </Popover>

            {/*- Only Yes -*/}
            <Dialog 
              open={dialogOpen} 
              onClose={() => setDialogOpen(false)}
              sx={{
                "& .MuiDialog-paper": { backgroundColor: colors.redAccent[800], color: colors.primary[100] }
              }}
            >
              {/* <DialogTitle>Notification</DialogTitle> */}
              <DialogContent>
                <Typography sx={{ whiteSpace: "pre-line" }}>
                  {dialogMessage}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => setDialogOpen(false)} 
                  sx={{ 
                    backgroundColor: transparent(colors.redAccent[800]), 
                    color: colors.greenAccent[100], 
                    "&:hover": { backgroundColor: colors.redAccent[900] } 
                  }}
                >
                  OK
                </Button>
              </DialogActions>
            </Dialog>

            {/*- Yes/No -*/}
            <Dialog 
              open={confirmDialogOpen} 
              onClose={() => {
                setConfirmDialogOpen(false);
                if (onConfirm) onConfirm(false); // Resuelve con `false` al cancelar
              }}
              sx={{
                "& .MuiDialog-paper": { backgroundColor: colors.blueAccent[900], color: colors.primary[100] }
              }}
            >
              {/* <DialogTitle>Confirm Action</DialogTitle> */}
              <DialogContent>
                <Typography sx={{ whiteSpace: "pre-line" }}>
                  {confirmMessage}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => {
                    setConfirmDialogOpen(false);
                    if (onConfirm) onConfirm(false); // Resuelve con `false` al cancelar
                  }} 
                  sx={{ 
                    backgroundColor: colors.redAccent[800], 
                    color: colors.redAccent[100], 
                    "&:hover": { backgroundColor: colors.redAccent[900] } 
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setConfirmDialogOpen(false);
                    if (onConfirm) onConfirm(true); // Resuelve con `true` al confirmar
                  }} 
                  sx={{ 
                    backgroundColor: colors.greenAccent[800], 
                    color: colors.greenAccent[100], 
                    "&:hover": { backgroundColor: colors.greenAccent[900] } 
                  }}
                >
                  OK
                </Button>
              </DialogActions>
            </Dialog>

        </Box>  
      </LocalizationProvider>
  );
};

export default CustomReportForm;