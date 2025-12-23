document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const loginCancel = document.getElementById("login-cancel");
  const loginMessage = document.getElementById("login-message");

  let isLoggedIn = false;

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
                    const deleteButton = isLoggedIn
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

      // Add event listeners to delete buttons (only if logged in)
      if (isLoggedIn) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
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

    if (!isLoggedIn) {
      messageDiv.textContent = "Teacher login required to register students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
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

  // Initialize app
  fetchActivities();

  // Login/logout UI logic
  loginBtn.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
  });

  loginCancel.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginMessage.classList.add("hidden");
    loginMessage.textContent = "";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    try {
      const resp = await fetch(`/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
        method: "POST",
      });
      const result = await resp.json();
      if (resp.ok) {
        isLoggedIn = true;
        loginMessage.textContent = result.message;
        loginMessage.className = "success";
        loginMessage.classList.remove("hidden");
        // Swap buttons
        loginBtn.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
        // Close modal after short delay
        setTimeout(() => {
          loginModal.classList.add("hidden");
          loginMessage.classList.add("hidden");
          loginMessage.textContent = "";
        }, 800);
        // Refresh activities to show admin controls
        fetchActivities();
      } else {
        loginMessage.textContent = result.detail || "Login failed";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (err) {
      loginMessage.textContent = "Login error. Please try again.";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      const resp = await fetch("/auth/logout", { method: "POST" });
      const result = await resp.json();
      isLoggedIn = false;
      // Swap buttons
      logoutBtn.classList.add("hidden");
      loginBtn.classList.remove("hidden");
      // Inform user
      messageDiv.textContent = result.message || "Logged out";
      messageDiv.className = "info";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 3000);
      // Refresh activities to hide admin controls
      fetchActivities();
    } catch (err) {
      messageDiv.textContent = "Logout error.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });
});
