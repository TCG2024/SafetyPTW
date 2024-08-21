document.addEventListener("DOMContentLoaded", async function() {
  const db = firebase.firestore();
  const versionLabel = document.getElementById('appVersion');

  // Initialize login functionality
  const loginForm = document.getElementById("loginForm");
  const forgotPasswordLink = document.getElementById("forgotPassword");

  loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    await performLogin();
  });

  forgotPasswordLink.addEventListener("click", async function(event) {
    event.preventDefault();
    performPasswordReset();
  });

  await autoLogin();

  async function performLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    if (!navigator.onLine) {
      alert("Your device appears to be offline. Please verify your network connection before proceeding.");
      return;
    }

    try {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      console.log("User logged in", userCredential.user);

      // Get the custom UID from Firestore
      const userDoc = await window.db.collection("users").where("email", "==", email).get();
      let customUID;
      userDoc.forEach((doc) => {
        customUID = doc.id;
      });

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("email");
        localStorage.removeItem("password");
      }

      // Store the custom UID in localStorage
      localStorage.setItem("userUID", customUID);
      console.log("Custom UID saved in localStorage:", localStorage.getItem("userUID"));

      await checkVersion(); // Check version after login
    } catch (error) {
      console.error("Login attempt failed: ", error);
      alert("Failed to log in: " + error.message + ". Please ensure your email and password are correct.");
    }
  }

  async function performPasswordReset() {
    const email = document.getElementById("email").value;
    if (!email) {
      alert("Please provide your email address in the field above to reset your password.");
      return;
    }

    if (!navigator.onLine) {
      alert("Your device appears to be offline. Please verify your network connection before proceeding.");
      return;
    }

    try {
      await window.auth.sendPasswordResetEmail(email);
      alert("Check your inbox for password reset instructions. Please follow them to reset your password.");
    } catch (error) {
      console.error("Failed to send password reset email: ", error);
      alert("We encountered an issue sending the password reset email: " + error.message + ". Please try again later.");
    }
  }

  async function autoLogin() {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");

    if (rememberMe && email && password) {
      document.getElementById("email").value = email;
      document.getElementById("password").value = password;
      document.getElementById("rememberMe").checked = true;

      if (!navigator.onLine) {
        alert("Your device appears to be offline. Please verify your network connection before proceeding.");
        return;
      }

      try {
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        console.log("User auto logged in", userCredential.user);

        // Get the custom UID from Firestore
        const userDoc = await window.db.collection("users").where("email", "==", email).get();
        let customUID;
        userDoc.forEach((doc) => {
          customUID = doc.id;
        });

        // Store the custom UID in localStorage
        localStorage.setItem("userUID", customUID);
        console.log("Custom UID saved in localStorage (auto-login):", localStorage.getItem("userUID"));

        await checkVersion(); // Check version after auto-login
      } catch (error) {
        console.error("Automatic login failed: ", error);
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("email");
        localStorage.removeItem("password");
        alert("Automatic login was unsuccessful: " + error.message + ". Please log in manually.");
      }
    }
  }

  // Version check function
  async function checkVersion() {
    try {
      const versionDoc = await db.collection('app_versions').doc('Latest Version').get();
      if (versionDoc.exists) {
        const latestVersion = versionDoc.data().Version;
        const updateLink = versionDoc.data().Update_Link;
        const currentVersion = versionLabel.textContent.split("Version: ").pop().trim();
        versionLabel.textContent = `Version: ${currentVersion}`;

        if (latestVersion !== currentVersion) {
          alert(`A new version of the app (${latestVersion}) is available for download. Please update to continue.`);
          window.location.href = updateLink;
          return; // Stop further execution if version mismatch
        }
      } else {
        alert("Unable to retrieve version information at this time. Please try again later.");
        return; // Stop further execution if no version data found
      }

      // Check if user is approved before redirecting to home page
      const userUID = localStorage.getItem('userUID');
      const userDoc = await db.collection('users').doc(userUID).get();
      if (userDoc.exists && userDoc.data().isApproved === 'Yes') {
        window.location.href = 'index.html'; // Redirect only if user is approved
      } else {
        alert("Access denied. Your account has not been approved yet. Contact the administrator for more details.");
        return; // Stop further execution if user not approved
      }
    } catch (error) {
      alert("An error occurred while checking version or user status: " + error.message);
      console.error("Error during version check or user approval verification:", error);
    }
  }
});
