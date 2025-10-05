const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;
const CACHE_KEY = "thunderstore_teams_cache";

const STYLE_CONFIG = {
    BACKGROUND_COLOR: "#303030",
    ACCENT_COLOR: "#3498db",
    MEMBER_COLOR: "#2ecc71",
    BORDER_COLOR: "#3c3c3c",
    ERROR_COLOR: "#ff6347"
};

const getCookie = (name) => {
    const cookies = decodeURIComponent(document.cookie).split(';');
    const prefix = `${name}=`;

    for (const rawCookie of cookies) {
        const cookie = rawCookie.trim();
        if (cookie.startsWith(prefix)) {
            return cookie.slice(prefix.length);
        }
    }
    return "";
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
        zIndex: "1000",
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
    dropdown.style.transform = "translateY(-10px)";
    dropdown.style.opacity = "0";
    setTimeout(() => {
        dropdown.style.display = "none";
    }, 200);
};

const fetchTeams = async (sessionId, cacheKey, cacheDurationMs) => {
    const useCache = cacheDurationMs > 0;

    // [ Check cache ]
    if (useCache) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            try {
                const { timestamp, teams } = JSON.parse(cachedData);
                if (Date.now() - timestamp < cacheDurationMs) {
                    console.log("Team Viewer: Using cached data.");
                    return teams;
                }
            } catch (e) {
                console.error("Team Viewer: Failed to parse cache, fetching fresh data.", e);
                localStorage.removeItem(cacheKey);
            }
        }
    } else {
        console.log("Team Viewer: Cache bypass requested.");
    }

    console.log("Team Viewer: Fetching user data...");
    const response = await fetch("https://thunderstore.io/api/experimental/current-user/", {
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
    const teams = data.teams_full;

    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), teams }));
    
    return teams;
};

const getRoleIconSvg = (role) => {
    const color = role === 'owner' ? STYLE_CONFIG.OWNER_COLOR : STYLE_CONFIG.MEMBER_COLOR;
    const titleText = `Your Role: ${role.toUpperCase()}`;

    const crownPath = `
        <path xmlns="http://www.w3.org/2000/svg" d="M21.609 13.5616L21.8382 11.1263C22.0182 9.2137 22.1082 8.25739 21.781 7.86207C21.604 7.64823 21.3633 7.5172 21.106 7.4946C20.6303 7.45282 20.0329 8.1329 18.8381 9.49307C18.2202 10.1965 17.9113 10.5482 17.5666 10.6027C17.3757 10.6328 17.1811 10.6018 17.0047 10.5131C16.6865 10.3529 16.4743 9.91812 16.0499 9.04851L13.8131 4.46485C13.0112 2.82162 12.6102 2 12 2C11.3898 2 10.9888 2.82162 10.1869 4.46486L7.95007 9.04852C7.5257 9.91812 7.31351 10.3529 6.99526 10.5131C6.81892 10.6018 6.62434 10.6328 6.43337 10.6027C6.08872 10.5482 5.77977 10.1965 5.16187 9.49307C3.96708 8.1329 3.36968 7.45282 2.89399 7.4946C2.63666 7.5172 2.39598 7.64823 2.21899 7.86207C1.8918 8.25739 1.9818 9.2137 2.16181 11.1263L2.391 13.5616C2.76865 17.5742 2.95748 19.5805 4.14009 20.7902C5.32271 22 7.09517 22 10.6401 22H13.3599C16.9048 22 18.6773 22 19.8599 20.7902C21.0425 19.5805 21.2313 17.5742 21.609 13.5616Z" fill="#ffbe5dff"/>
    `.trim();

    const memberPath = `
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.42-.82-6.19-2.22C7.3 16.5 9.77 15 12 15s4.7 1.5 6.19 2.78c-1.77 1.4-4.16 2.22-6.19 2.22z"/>
    `.trim();

    const svgContent = role === 'owner' ? crownPath : memberPath;

    return `
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="${color}" 
            title="${titleText}"
            style="margin-right: 8px; flex-shrink: 0; padding: 2px;"
        >
            ${svgContent}
        </svg>
    `;
}

const renderTeamsDropdown = (container, teams, originalHref, onRefreshClick) => {
    container.innerHTML = "";

    if (!teams?.length) {
        container.innerHTML = `<p style="text-align: center; color: #aaa; padding: 10px;">No teams found.</p>`;
        return;
    }
    
    const headerWrapper = document.createElement("div");
    Object.assign(headerWrapper.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${STYLE_CONFIG.BORDER_COLOR}`, 
        paddingBottom: "8px",
        marginBottom: "10px",
    });

    const headerTitle = document.createElement("h3");
    headerTitle.textContent = "YOUR TEAMS";
    Object.assign(headerTitle.style, {
        margin: "0",
        fontSize: "1em",
        fontWeight: "700",
        letterSpacing: "0.5px",
        color: STYLE_CONFIG.ACCENT_COLOR, 
        textTransform: "uppercase",
        paddingLeft: "5px",
    });
    headerWrapper.appendChild(headerTitle);

    const refreshButton = document.createElement("button");
    refreshButton.textContent = "⟳"; 
    Object.assign(refreshButton.style, {
        backgroundColor: "transparent",
        border: `1px solid ${STYLE_CONFIG.ACCENT_COLOR}`,
        color: STYLE_CONFIG.ACCENT_COLOR,
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "1em",
        lineHeight: "1",
        padding: "4px 8px",
        transition: "background-color 0.15s, color 0.15s",
    });

    refreshButton.addEventListener("mouseenter", () => {
        refreshButton.style.backgroundColor = STYLE_CONFIG.ACCENT_COLOR;
        refreshButton.style.color = "#fff";
    });
    refreshButton.addEventListener("mouseleave", () => {
        refreshButton.style.backgroundColor = "transparent";
        refreshButton.style.color = STYLE_CONFIG.ACCENT_COLOR;
    });
    
    refreshButton.addEventListener("click", onRefreshClick);

    headerWrapper.appendChild(refreshButton);
    container.appendChild(headerWrapper);

    const teamsList = document.createElement("ul");
    Object.assign(teamsList.style, {
        listStyle: "none",
        paddingLeft: "0",
        margin: "0",
    });

    teams.forEach((team) => {
        const teamItem = document.createElement("li");
        
        const roleSvg = getRoleIconSvg(team.role);

        teamItem.innerHTML = `
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                width: 100%;
            ">
                <div style="display: flex; align-items: center;">
                    ${roleSvg}
                    <span style="font-weight: 600; color: #fff; margin-top: 1px;">${team.name}</span>
                </div>

                <span style="
                    font-size: 0.85em; 
                    color: #999; 
                    font-weight: 500;
                    padding-right: 5px; 
                ">
                    ${team.member_count} Members
                </span>
            </div>
        `;

        Object.assign(teamItem.style, {
            padding: "8px 10px",
            cursor: "pointer",
            transition: "background-color 0.15s",
            borderRadius: "4px",
            textAlign: "left",
            marginBottom: "2px",
        });

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

        teamsList.appendChild(teamItem);
    });

    container.appendChild(teamsList);
};

const observer = new MutationObserver((_, obs) => {
    const navLink = Array.from(document.querySelectorAll("a.nav-link.text-dark"))
        .find(link => link.href?.includes("/package/") || link.href?.includes("/c/"));

    if (!navLink) return;

    console.log("Team Viewer: Found navigation link. Initializing script.");
    obs.disconnect();

    const originalHref = navLink.href;
    navLink.removeAttribute("href");
    navLink.style.cursor = "pointer";

    const dropdown = createDropdownContainer();
    let isVisible = false;

    const handleResizeAndReposition = () => {
        if (isVisible) {
            showDropdown(dropdown, navLink);
        }
    };

    const loadTeams = async (useCache = true) => {
        dropdown.innerHTML = `<p style="text-align: center; color: ${STYLE_CONFIG.ACCENT_COLOR}; padding: 10px;">Loading teams...</p>`;

        const sessionId = getCookie("sessionid");
        if (!sessionId) {
            dropdown.innerHTML = `<p style="text-align: center; color: ${STYLE_CONFIG.ERROR_COLOR}; padding: 10px;">Error: Session ID not found. Please log in.</p>`;
            console.error("Team Viewer: No session ID.");
            return;
        }

        try {
            const duration = useCache ? CACHE_DURATION_MS : 0; 
            
            const teams = await fetchTeams(sessionId, CACHE_KEY, duration);
            
            const onRefresh = () => {
                loadTeams(false);
            };

            renderTeamsDropdown(dropdown, teams, originalHref, onRefresh);
            console.log("Team Viewer: Teams loaded successfully.");
        } catch (err) {
            console.error("Team Viewer: Failed to fetch teams:", err);
            dropdown.innerHTML = `<p style="text-align: center; color: ${STYLE_CONFIG.ERROR_COLOR}; padding: 10px;">Error: Could not fetch teams. ${err.message}</p>`;
        }
    };


    navLink.addEventListener("click", async (event) => {
        event.preventDefault();
        isVisible = !isVisible;

        if (isVisible) {
            console.log("Team Viewer: Showing dropdown.");
            showDropdown(dropdown, navLink);
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
