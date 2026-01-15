"use strict";

// Exporting the functions so they can be used in other files
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPriority = exports.isValidAlphaGroup = exports.isValidAlphaTeam = exports.isValidSupportTeam = exports.isValidTeam = exports.isValidStatus = void 0;

// Function to check if the status is valid
function isValidStatus(status) {
    return ["Open", "New", "On-hold", "Pending", "Closed"].includes(status);
}
exports.isValidStatus = isValidStatus;

// Function to check if the team is valid
function isValidTeam(team) {
    return isValidSupportTeam(team) || isValidAlphaTeam(team);
}
exports.isValidTeam = isValidTeam;

// Function to check if the team is a valid support team
function isValidSupportTeam(team) {
    return ["Support", "Engineering", "Finance", "BU", "Collections"].includes(team);
}
exports.isValidSupportTeam = isValidSupportTeam;

// Function to check if the team is a valid Alpha team
function isValidAlphaTeam(team) {
    return ["Support", "Academics", "Coachbot", "Engineering"].includes(team);
}
exports.isValidAlphaTeam = isValidAlphaTeam;

// Function to check if the group is a valid Alpha group
function isValidAlphaGroup(group) {
    return ["Student", "Guide", "Other"].includes(group);
}
exports.isValidAlphaGroup = isValidAlphaGroup;

// Function to check if the priority is valid
function isValidPriority(priority) {
    return ["Low", "Normal", "High", "Urgent"].includes(priority);
}
exports.isValidPriority = isValidPriority;
