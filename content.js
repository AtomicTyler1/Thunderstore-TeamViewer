// [ Get a cookie value by name for authorization ]

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

// [ Renders the team dropdown inside a container. ]

const renderTeamsDropdown = (container, teams, originalHref) => {
  container.innerHTML = "";

  if (!teams?.length) {
    container.innerHTML = `<p style="text-align: center;">No teams found.</p>`;
    return;
  }

  container.innerHTML = `
  <h3 style="
    margin-bottom: 15px; 
    font-size: 1.2em;
    font-weight: 600;
    text-align: center;
    letter-spacing: 1px;
    color: #ddd;
    border-bottom: 1px solid #555;
    padding-bottom: 10px;">
    Your Teams
  </h3>`;

  const teamsList = document.createElement("ul");
  Object.assign(teamsList.style, {
    listStyle: "none",
    paddingLeft: "0",
    margin: "0",
  });

  teams.forEach((team) => {
    const teamItem = document.createElement("li");
    teamItem.textContent = team.name;

    Object.assign(teamItem.style, {
      padding: "10px 15px",
      cursor: "pointer",
      transition: "background-color 0.2s, transform 0.2s",
      borderRadius: "5px",
      textAlign: "center",
      marginBottom: "5px",
    });

    // [ Hover effects ]
    teamItem.addEventListener("mouseenter", () => {
      teamItem.style.backgroundColor = "#1b1b1b";
      teamItem.style.transform = "scale(1.02)";
    });
    teamItem.addEventListener("mouseleave", () => {
      teamItem.style.backgroundColor = "transparent";
      teamItem.style.transform = "scale(1)";
    });

    // [ Click redirect ]
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

// [ Create the styled dropdown container. ]
const createDropdownContainer = () => {
  const container = document.createElement("div");

  Object.assign(container.style, {
    position: "absolute",
    backgroundColor: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "8px",
    padding: "15px",
    color: "#fff",
    zIndex: "1000",
    display: "none",
    marginTop: "10px",
    minWidth: "250px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6), 0 0 0 2px #3498db, inset 0 0 0 1px #444",
    transform: "translateY(-10px)",
    opacity: "0",
    transition: "opacity 0.3s ease-in, transform 0.3s ease-in",
  });

  document.body.appendChild(container);
  return container;
};


// [ Show the dropdown with animation at navLink position. ]

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
  }, 300);
};


// [ Fetch teams data with session cookie and cache. ]

const fetchTeams = async (sessionId, cacheKey, cacheDurationMs) => {
  // [ Check cache ]
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const { timestamp, teams } = JSON.parse(cachedData);
    if (Date.now() - timestamp < cacheDurationMs) {
      console.log("Thunderstore extension: Using cached data.");
      return teams;
    }
  }

  // [ Fetch fresh ]

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


// [ Observer to wait for nav link to appear. ]

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

  const handleResizeAndReposition = () => {
    if (isVisible) {
      showDropdown(dropdown, navLink);
    }
  };

  navLink.addEventListener("click", async (event) => {
    event.preventDefault();
    isVisible = !isVisible;

    if (isVisible) {
      console.log("Team Viewer: Showing dropdown.");
      showDropdown(dropdown, navLink);

      dropdown.innerHTML = `<p style="text-align: center;">Loading teams...</p>`;

      const sessionId = getCookie("sessionid");
      if (!sessionId) {
        dropdown.innerHTML = `<p style="text-align: center;">Error: Session ID not found. Please log in.</p>`;
        console.error("Team Viewer: No session ID.");
        return;
      }

      try {
        const teams = await fetchTeams(sessionId, "thunderstore_teams_cache", 6 * 60 * 60 * 1000);
        renderTeamsDropdown(dropdown, teams, originalHref);
        console.log("Team Viewer: Teams loaded.");
      } catch (err) {
        console.error("Team Viewer: Failed to fetch teams:", err);
        dropdown.innerHTML = `<p style="text-align: center;">Error: Could not fetch teams. ${err.message}</p>`;
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

// Start observing
observer.observe(document.body, { childList: true, subtree: true });