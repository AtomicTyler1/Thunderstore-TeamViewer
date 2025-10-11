const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // Not used for logic, but kept as a reminder/config
const CACHE_KEY = "thunderstore_teams_cache"; // Not used for logic, but kept as a reminder/config

const STYLE_CONFIG = {
    BACKGROUND_COLOR: "#303030",
    ACCENT_COLOR: "#3498db",
    MEMBER_COLOR: "#2ecc71",
    OWNER_COLOR: "#ffbe5d", // Added missing OWNER_COLOR
    BORDER_COLOR: "#3c3c3c",
    ERROR_COLOR: "#ff6347"
};

const createDropdownContainer = () => {
    const container = document.createElement("div");

    Object.assign(container.style, {
        position: "absolute",
        backgroundColor: STYLE_CONFIG.BACKGROUND_COLOR,
        border: `1px solid ${STYLE_CONFIG.ACCENT_COLOR}`,
        borderRadius: "6px",
        padding: "10px",
        color: "#fff",
        zIndex: "10000", // Increased zIndex for safety
        display: "none",
        marginTop: "10px",
        minWidth: "250px", 
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px #444",
        transform: "translateY(-10px)",
        opacity: "0",
        transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
    });

    document.body.appendChild(container);
    return container;
};

const showDropdown = (dropdown, navLink) => {
    // ... (logic remains the same)
    dropdown.style.display = "block";
    const rect = navLink.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - dropdown.offsetWidth / 2;

    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${left}px`;

    setTimeout(() => {
        dropdown.style.transform = "translateY(0)";
        dropdown.style.opacity = "1";
    }, 10);
};

const hideDropdown = (dropdown) => {
    // ... (logic remains the same)
    dropdown.style.transform = "translateY(-10px)";
    dropdown.style.opacity = "0";
    setTimeout(() => {
        dropdown.style.display = "none";
    }, 200);
};

// Helper function to safely create and append an element
const createAndAppend = (parent, tag, styles = {}, textContent = null, innerHTML = null) => {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    if (textContent !== null) el.textContent = textContent;
    if (innerHTML !== null) el.innerHTML = innerHTML;
    parent.appendChild(el);
    return el;
};

// Rewritten SVG function to use innerHTML only for trusted SVG path data
const getRoleIconSvg = (role) => {
    const color = role === 'owner' ? STYLE_CONFIG.OWNER_COLOR : STYLE_CONFIG.MEMBER_COLOR;
    const titleText = `Your Role: ${role.toUpperCase()}`;

    // Path data is static and not from external input, making this safe
    const crownPath = `
        <path d="M21.609 13.5616L21.8382 11.1263C22.0182 9.2137 22.1082 8.25739 21.781 7.86207C21.604 7.64823 21.3633 7.5172 21.106 7.4946C20.6303 7.45282 20.0329 8.1329 18.8381 9.49307C18.2202 10.1965 17.9113 10.5482 17.5666 10.6027C17.3757 10.6328 17.1811 10.6018 17.0047 10.5131C16.6865 10.3529 16.4743 9.91812 16.0499 9.04851L13.8131 4.46485C13.0112 2.82162 12.6102 2 12 2C11.3898 2 10.9888 2.82162 10.1869 4.46486L7.95007 9.04852C7.5257 9.91812 7.31351 10.3529 6.99526 10.5131C6.81892 10.6018 6.62434 10.6328 6.43337 10.6027C6.08872 10.5482 5.77977 10.1965 5.16187 9.49307C3.96708 8.1329 3.36968 7.45282 2.89399 7.4946C2.63666 7.5172 2.39598 7.64823 2.21899 7.86207C1.8918 8.25739 1.9818 9.2137 2.16181 11.1263L2.391 13.5616C2.76865 17.5742 2.95748 19.5805 4.14009 20.7902C5.32271 22 7.09517 22 10.6401 22H13.3599C16.9048 22 18.6773 22 19.8599 20.7902C21.0425 19.5805 21.2313 17.5742 21.609 13.5616Z" fill="${STYLE_CONFIG.OWNER_COLOR}"/>
    `.trim();

    const memberPath = `
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.42-.82-6.19-2.22C7.3 16.5 9.77 15 12 15s4.7 1.5 6.19 2.78c-1.77 1.4-4.16 2.22-6.19 2.22z" fill="${STYLE_CONFIG.MEMBER_COLOR}"/>
    `.trim();

    const svgContent = role === 'owner' ? crownPath : memberPath;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("title", titleText);
    svg.style.marginRight = "8px";
    svg.style.flexShrink = "0";
    svg.style.padding = "2px";
    svg.innerHTML = svgContent; // Safe because content is static/controlled
    
    return svg;
}


const renderTeamsDropdown = (container, teams, originalHref, onRefreshClick) => {
    container.innerHTML = ""; // Clear existing content

    if (!teams?.length) {
        createAndAppend(container, 'p', { textAlign: "center", color: "#aaa", padding: "10px" }, "No teams found.");
        return;
    }
    
    // --- Header ---
    const headerWrapper = createAndAppend(container, 'div', {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${STYLE_CONFIG.BORDER_COLOR}`, 
        paddingBottom: "8px", marginBottom: "10px",
    });

    createAndAppend(headerWrapper, 'h3', {
        margin: "0", fontSize: "1em", fontWeight: "700", letterSpacing: "0.5px", 
        color: STYLE_CONFIG.ACCENT_COLOR, textTransform: "uppercase", paddingLeft: "5px",
    }, "YOUR TEAMS");

    const refreshButton = createAndAppend(headerWrapper, 'button', {
        backgroundColor: "transparent", border: `1px solid ${STYLE_CONFIG.ACCENT_COLOR}`,
        color: STYLE_CONFIG.ACCENT_COLOR, borderRadius: "4px", cursor: "pointer",
        fontSize: "1em", lineHeight: "1", padding: "4px 8px",
        transition: "background-color 0.15s, color 0.15s",
    }, "⟳"); 

    refreshButton.addEventListener("mouseenter", () => {
        refreshButton.style.backgroundColor = STYLE_CONFIG.ACCENT_COLOR;
        refreshButton.style.color = "#fff";
    });
    refreshButton.addEventListener("mouseleave", () => {
        refreshButton.style.backgroundColor = "transparent";
        refreshButton.style.color = STYLE_CONFIG.ACCENT_COLOR;
    });
    
    refreshButton.addEventListener("click", onRefreshClick);

    // --- Teams List ---
    const teamsList = createAndAppend(container, 'ul', {
        listStyle: "none", paddingLeft: "0", margin: "0",
    });

    teams.forEach((team) => {
        const teamItem = createAndAppend(teamsList, 'li', {
            padding: "8px 10px", cursor: "pointer", transition: "background-color 0.15s",
            borderRadius: "4px", textAlign: "left", marginBottom: "2px", display: "flex", // Ensure it's a flex container
            alignItems: "center", justifyContent: "space-between"
        });
        
        // Left side: Icon and Team Name
        const teamNameWrapper = createAndAppend(teamItem, 'div', { display: 'flex', alignItems: 'center' });
        
        const roleSvg = getRoleIconSvg(team.role);
        teamNameWrapper.appendChild(roleSvg);

        createAndAppend(teamNameWrapper, 'span', { fontWeight: "600", color: "#fff", marginTop: "1px" }, team.name);

        // Right side: Member Count (using textContent for safety)
        createAndAppend(teamItem, 'span', {
            fontSize: "0.85em", color: "#999", fontWeight: "500", paddingRight: "5px",
        }, `${team.member_count} Members`);


        // Hover/Click Listeners (unchanged)
        teamItem.addEventListener("mouseenter", () => {
            teamItem.style.backgroundColor = "rgba(52, 152, 219, 0.2)"; 
        });
        teamItem.addEventListener("mouseleave", () => {
            teamItem.style.backgroundColor = "transparent";
        });

        teamItem.addEventListener("click", () => {
            let newUrl;
            if (originalHref.includes("/package/")) {
                newUrl = `${window.location.origin}/package/${team.name}`;
            } else {
                const communityMatch = originalHref.match(/\/c\/([^/]+)/);
                newUrl = communityMatch
                    ? `${window.location.origin}/c/${communityMatch[1]}/p/${team.name}`
                    : `${window.location.origin}/c/${team.name}`;
            }
            window.location.href = newUrl;
        });
    });
};

// Messaging function to communicate with the background service worker
const loadTeams = async (useCache = true) => {
    const dropdown = document.querySelector("#thunderstore-team-dropdown");
    if (!dropdown) return;

    dropdown.innerHTML = "";
    createAndAppend(dropdown, 'p', { 
        textAlign: "center", color: STYLE_CONFIG.ACCENT_COLOR, padding: "10px" 
    }, "Loading teams...");

    try {
        const response = await chrome.runtime.sendMessage({ action: "fetchTeams", useCache });
        
        const onRefresh = () => loadTeams(false);

        if (response.status === "success") {
            console.log("Team Viewer: Teams loaded successfully via background script.");
            renderTeamsDropdown(dropdown, response.teams, dropdown.dataset.originalHref, onRefresh);
        } else {
            console.error("Team Viewer: Failed to fetch teams:", response.message);
            createAndAppend(dropdown, 'p', { 
                textAlign: "center", color: STYLE_CONFIG.ERROR_COLOR, padding: "10px" 
            }, `Error: ${response.message}`);
        }
    } catch (error) {
        console.error("Team Viewer: Error communicating with background script:", error);
        createAndAppend(dropdown, 'p', { 
            textAlign: "center", color: STYLE_CONFIG.ERROR_COLOR, padding: "10px" 
        }, `Fatal Error: Cannot connect to extension background service.`);
    }
};


// --- Main Execution Logic ---

const observer = new MutationObserver((_, obs) => {
    // Find the link that typically leads to the user's default team page.
    const navLink = Array.from(document.querySelectorAll("a.nav-link.text-dark"))
        .find(link => link.href?.includes("/package/") || link.href?.includes("/c/"));

    if (!navLink) return;

    console.log("Team Viewer: Found navigation link. Initializing script.");
    obs.disconnect();

    const originalHref = navLink.href;
    navLink.removeAttribute("href");
    navLink.style.cursor = "pointer";

    const dropdown = createDropdownContainer();
    dropdown.id = "thunderstore-team-dropdown"; // Add an ID for easy lookup
    dropdown.dataset.originalHref = originalHref; // Store original href securely
    
    let isVisible = false;

    const handleResizeAndReposition = () => {
        if (isVisible) showDropdown(dropdown, navLink);
    };

    navLink.addEventListener("click", async (event) => {
        event.preventDefault();
        isVisible = !isVisible;

        if (isVisible) {
            console.log("Team Viewer: Showing dropdown.");
            showDropdown(dropdown, navLink);
            // Only load/refresh if content is empty or older than a threshold (though the background handles the actual cache logic)
            if (!dropdown.querySelector('ul')) {
                 loadTeams(true);
            }
            window.addEventListener("resize", handleResizeAndReposition);
        } else {
            console.log("Team Viewer: Hiding dropdown.");
            hideDropdown(dropdown);
            window.removeEventListener("resize", handleResizeAndReposition);
        }
    });

    document.addEventListener("click", (e) => {
        const isClickInside = navLink.contains(e.target) || dropdown.contains(e.target);
        if (!isClickInside && isVisible) {
            isVisible = false;
            hideDropdown(dropdown);
            window.removeEventListener("resize", handleResizeAndReposition);
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });