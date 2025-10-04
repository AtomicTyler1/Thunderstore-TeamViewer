const getCookie = (name) => {
  const cookies = decodeURIComponent(document.cookie).split(';');
  const prefix = `${name}=`;

  for (let cookie of cookies) {
    cookie = cookie.trim();
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
    backgroundColor: "#303030",
    border: "1px solid #3498db",
    borderRadius: "6px",
    padding: "10px",
    color: "#fff",
    zIndex: "1000",
    display: "none",
    marginTop: "10px",
    minWidth: "220px",
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
  // [ Check cache ]
  if (cacheDurationMs > 0) {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { timestamp, teams } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheDurationMs) {
        console.log("Team Viewer: Using cached data.");
        return teams;
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

  if (cacheDurationMs > 0) {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), teams }));
  } else {
      localStorage.removeItem(cacheKey);
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), teams }));
  }
  
  return teams;
};

const renderTeamsDropdown = (container, teams, originalHref, onRefreshClick) => {
  container.innerHTML = "";

  if (!teams?.length) {
    container.innerHTML = `<p style="text-align: center; color: #aaa; padding: 10px;">No teams found.</p>`;
    return;
  }
  
  // Header and Controls Wrapper
  const headerWrapper = document.createElement("div");
  Object.assign(headerWrapper.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #3c3c3c",
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
    color: "#3498db",
    textTransform: "uppercase",
    paddingLeft: "5px",
  });
  headerWrapper.appendChild(headerTitle);

  // Refresh Button
  const refreshButton = document.createElement("button");
  refreshButton.textContent = "⟳";
  Object.assign(refreshButton.style, {
    backgroundColor: "transparent",
    border: "1px solid #3498db",
    color: "#3498db",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1em",
    lineHeight: "1",
    padding: "4px 8px",
    transition: "background-color 0.15s, color 0.15s",
  });
  
  refreshButton.addEventListener("mouseenter", () => {
    refreshButton.style.backgroundColor = "#3498db";
    refreshButton.style.color = "#fff";
  });
  refreshButton.addEventListener("mouseleave", () => {
    refreshButton.style.backgroundColor = "transparent";
    refreshButton.style.color = "#3498db";
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
    teamItem.innerHTML = `
        <span style="font-weight: 600; color: #fff;">${team.name}</span>
        <span style="font-size: 0.8em; color: #999; margin-left: 8px;">(${team.name})</span>
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

  console.log("Team Viewer: Found navigation link.");
  obs.disconnect();

  const originalHref = navLink.href;
  navLink.removeAttribute("href");
  navLink.style.cursor = "pointer";

  const dropdown = createDropdownContainer();
  let isVisible = false;
  const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
  const CACHE_KEY = "thunderstore_teams_cache";

  const handleResizeAndReposition = () => {
    if (isVisible) {
      showDropdown(dropdown, navLink);
    }
  };

  const loadTeams = async (useCache = true) => {
    dropdown.innerHTML = `<p style="text-align: center; color: #3498db; padding: 10px;">Loading teams...</p>`;

    const sessionId = getCookie("sessionid");
    if (!sessionId) {
      dropdown.innerHTML = `<p style="text-align: center; color: #ff6347; padding: 10px;">Error: Session ID not found. Please log in.</p>`;
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
      console.log("Team Viewer: Teams loaded.");
    } catch (err) {
      console.error("Team Viewer: Failed to fetch teams:", err);
      dropdown.innerHTML = `<p style="text-align: center; color: #ff6347; padding: 10px;">Error: Could not fetch teams. ${err.message}</p>`;
    }
  };


  navLink.addEventListener("click", async (event) => {
    event.preventDefault();
    isVisible = !isVisible;

    if (isVisible) {
      console.log("Team Viewer: Showing dropdown.");
      showDropdown(dropdown, navLink);
      loadTeams(true);
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

// Start observing the body for the navigation link to appear
observer.observe(document.body, { childList: true, subtree: true });
