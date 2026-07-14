document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const adminToggle = document.getElementById("admin-toggle");
  const adminLoginPanel = document.getElementById("admin-login-panel");
  const adminLoginForm = document.getElementById("admin-login-form");
  const adminUsernameInput = document.getElementById("admin-username");
  const adminPasswordInput = document.getElementById("admin-password");
  const teacherHelp = document.getElementById("teacher-help");
  let isAdmin = false;

  function setAdminState(authenticated, username = "") {
    isAdmin = authenticated;
    signupForm.classList.toggle("hidden", !authenticated);
    teacherHelp.textContent = authenticated
      ? `Signed in as ${username}. You can register or remove students.`
      : "Sign in as a teacher to register or remove students for activities.";
    adminToggle.textContent = authenticated ? `👤 ${username}` : "👤 Teacher Login";
    adminLoginPanel.classList.add("hidden");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map((email) => {
                    const deleteButton = isAdmin
                      ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                      : "";
                    return `<li><span class="participant-email">${email}</span>${deleteButton}</li>`;
                  })
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            "X-Admin-Username": localStorage.getItem("adminUsername") || "",
            "X-Admin-Password": localStorage.getItem("adminPassword") || "",
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            "X-Admin-Username": localStorage.getItem("adminUsername") || "",
            "X-Admin-Password": localStorage.getItem("adminPassword") || "",
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  adminToggle.addEventListener("click", () => {
    adminLoginPanel.classList.toggle("hidden");
  });

  adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("adminUsername", username);
        localStorage.setItem("adminPassword", password);
        setAdminState(true, username);
        messageDiv.textContent = `Signed in as ${username}`;
        messageDiv.className = "success";
        adminLoginForm.reset();
      } else {
        messageDiv.textContent = result.detail || "Unable to sign in.";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 4000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign in.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error(error);
    }
  });

  const storedUsername = localStorage.getItem("adminUsername") || "";
  const storedPassword = localStorage.getItem("adminPassword") || "";
  if (storedUsername && storedPassword) {
    setAdminState(true, storedUsername);
  } else {
    setAdminState(false);
  }

  // Initialize app
  fetchActivities();
});
