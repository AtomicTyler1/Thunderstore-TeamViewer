const API_URL = "https://thunderstore.io/api/experimental/current-user/";
const COOKIE_NAME = "sessionid";
const COOKIE_DOMAIN = "thunderstore.io";
const CACHE_KEY = "thunderstore_teams_cache";
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

const fetchTeams = async (sessionId) => {
    console.log("Background: Fetching user data...");
    
    const response = await fetch(API_URL, {
        method: "GET",
        headers: {
            Authorization: `Session ${sessionId}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.teams_full;
};

const handleTeamRequest = async (sendResponse, useCache) => {
    if (useCache) {
        const cachedData = await chrome.storage.local.get(CACHE_KEY);
        const { teams, timestamp } = cachedData[CACHE_KEY] || {};

        if (teams && timestamp && (Date.now() - timestamp < CACHE_DURATION_MS)) {
            console.log("Background: Using cached data.");
            sendResponse({ status: "success", teams: teams });
            return true;
        }
    }

    const cookie = await chrome.cookies.get({
        url: `https://${COOKIE_DOMAIN}`,
        name: COOKIE_NAME
    });

    if (!cookie?.value) {
        sendResponse({ status: "error", message: "Session ID not found. Please log in." });
        return true;
    }
    
    const sessionId = cookie.value;

    try {
        const teams = await fetchTeams(sessionId);
        
        await chrome.storage.local.set({ 
            [CACHE_KEY]: { teams, timestamp: Date.now() } 
        });

        sendResponse({ status: "success", teams: teams });
    } catch (err) {
        console.error("Background: Failed to fetch teams:", err);
        sendResponse({ status: "error", message: `Could not fetch teams. ${err.message}` });
    }
    
    return true;
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTeams") {
        handleTeamRequest(sendResponse, request.useCache);
        return true; 
    }
});

console.log("Background Service Worker loaded.");