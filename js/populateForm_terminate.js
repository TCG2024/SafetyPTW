//**********************************************************************************************************************************
// Function to fetch and populate user names in the terminationEhsSignatureSelect with users having "Safety" role
async function populateTerminationEhsSignatures() {
  const terminationEhsSelect = document.querySelector('select[name="terminationEhsSignatureSelect"]');

  // Ensure the select element is present
  if (!terminationEhsSelect) {
    console.error('The terminationEhsSignatureSelect element is not found in the DOM.');
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
        terminationEhsSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Error fetching users with 'Safety' role for terminationEhsSignatureSelect:", error);
  }
}

//**********************************************************************************************************************************

// Function to fetch and populate contractor supervisors in select boxes
async function populateContractorSupervisors() {
  const contractorSupervisorSelectBox = document.getElementById('terminationContractorSupervisorSelect');

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

//**********************************************************************************************************************************

// Initialize form fields
document.addEventListener('DOMContentLoaded', async function() {
  await populateTerminationEhsSignatures();
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
    document.getElementById('terminationDate').value = currentDate;
    document.getElementById('terminationTime').value = currentTime;
  });

