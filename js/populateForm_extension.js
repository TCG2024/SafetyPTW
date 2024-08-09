// populateForm.js

//****************************************************************************************************************

// Function to fetch and populate user names in the extensionEhsSignatureSelect based on the role "Safety"
async function populateExtensionEhsSignatures() {
  const extensionEhsSelect = document.querySelector('select[name="extensionEhsSignatureSelect"]');

  if (!extensionEhsSelect) {
    console.error('The select element for extensionEhsSignatureSelect is not found in the DOM.');
    return; // Stop the function if the select box is not found
  }

  try {
    // Fetch all users from Firestore
    const usersSnapshot = await firebase.firestore().collection('users').get();
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Filter and populate only 'Safety' role users in the EHS select box
      if (userData.role === "Safety") {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = userData.fullName;
        extensionEhsSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Error fetching users with role 'Safety':", error);
  }
}

//****************************************************************************************************************

// Function to fetch and populate contractor supervisors in select boxes
async function populateContractorSupervisors() {
  const contractorSupervisorSelectBox = document.getElementById('extensionContractorSupervisorSelect');

  try {
    const supervisorsSnapshot = await firebase.firestore().collection('supervisors').get();
    supervisorsSnapshot.forEach((doc) => {
      const supervisorData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = supervisorData.name;
      contractorSupervisorSelectBox.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching supervisors:", error);
  }
}


//****************************************************************************************************************

// Initialize form fields
document.addEventListener('DOMContentLoaded', async function() {
  await populateExtensionEhsSignatures();
  await populateContractorSupervisors();
});
document.addEventListener('DOMContentLoaded', function() {
    // Get current date and time
    const now = new Date();
    
    // Format date to ISO format (YYYY-MM-DD)
    const currentDate = now.toISOString().split('T')[0];
    
    // Format time to HH:MM (24-hour format)
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Set default values to the inputs
    document.getElementById('extensionDate').value = currentDate;
    document.getElementById('extensionTimeFrom').value = currentTime;
  });
