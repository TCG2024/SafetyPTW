document.addEventListener("DOMContentLoaded", function() {
  const loginForm = document.getElementById("loginForm");
  const forgotPasswordLink = document.getElementById("forgotPassword");

  // Attempt auto-login if "Remember Me" is checked and credentials are stored
  autoLogin();

  loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    if (!navigator.onLine) {
      alert("It seems you are offline. Please check your internet connection and try again.");
      return;
    }

    try {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log("User logged in", user);

      // Get the custom UID from Firestore
      const userDoc = await window.db.collection("users").where("email", "==", email).limit(1).get();
      let customUID;
      userDoc.forEach((doc) => {
        customUID = doc.id;
      });

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("email", email);
        localStorage.setItem("password", password); // Storing password for auto-login
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("email");
        localStorage.removeItem("password");
      }

      // Store the custom UID in localStorage
      localStorage.setItem("userUID", customUID);
      console.log("Custom UID saved in localStorage:", localStorage.getItem("userUID"));

      alert("Login successful! Redirecting you to the dashboard...");
      window.location.href = 'index.html'; // Redirect to dashboard or home page
    } catch (error) {
      console.error("Error logging in: ", error);
      alert(`Unable to log in. Please check your email and password, and try again. If the problem persists, contact support.`);
    }
  });

  forgotPasswordLink.addEventListener("click", async function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;

    if (!email) {
      alert("Please enter your email address to receive password reset instructions.");
      return;
    }

    try {
      await window.auth.sendPasswordResetEmail(email);
      alert("Password reset email sent successfully! Please check your inbox and follow the instructions to reset your password.");
    } catch (error) {
      console.error("Error sending password reset email: ", error);
      alert("Unable to send password reset email. Please ensure the email address is correct and try again. If the issue continues, please contact support.");
    }
  });

  async function autoLogin() {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");

    if (!navigator.onLine) {
      console.log("Auto-login skipped: No internet connection.");
      return;
    }

    if (rememberMe && email && password) {
      try {
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("User auto logged in", user);

        // Get the custom UID from Firestore
        const userDoc = await window.db.collection("users").where("email", "==", email).limit(1).get();
        let customUID;
        userDoc.forEach((doc) => {
          customUID = doc.id;
        });

        // Store the custom UID in localStorage
        localStorage.setItem("userUID", customUID);
        console.log("Custom UID saved in localStorage (auto-login):", localStorage.getItem("userUID"));

        alert("Auto-login successful! Redirecting you to the dashboard...");
        window.location.href = 'dashboard.html'; // Redirect to dashboard or home page
      } catch (error) {
        console.error("Error auto logging in: ", error);
        alert("Auto-login failed. Please log in manually.");
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("email");
        localStorage.removeItem("password");
      }
    }
  }
});
