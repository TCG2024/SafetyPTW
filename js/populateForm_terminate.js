//**********************************************************************************************************************************
async function populateEhsSignatureSelect() {
  const ehsSelect = document.querySelector('select[name="terminationEhsSignatureSelect"]');

  try {
    // Start by clearing the select and adding a placeholder option
    ehsSelect.innerHTML = ''; // Clear existing options
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select EHS Person'; // Placeholder text
    defaultOption.value = ''; // No value for the placeholder
    ehsSelect.appendChild(defaultOption);

    // Fetch users with 'Safety' role from Firestore
    const usersSnapshot = await firebase.firestore().collection('users').where('role', '==', 'Safety').get();
    if (usersSnapshot.empty) {
      console.log('No users with \'Safety\' role found.');
      return;
    }

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = userData.fullName;
      ehsSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching 'Safety' role users:", error);
  }
}

//**********************************************************************************************************

async function setIssuerName() {
  const issuerNameInput = document.getElementById('terminationIssuerName');
  const userUID = localStorage.getItem('userUID');

  if (userUID) {
    try {
      const userDoc = await firebase.firestore().collection('users').doc(userUID).get();
      if (userDoc.exists) {
        issuerNameInput.value = userDoc.data().fullName;
      } else {
        console.log("User document not found for UID:", userUID);
      }
    } catch (error) {
      console.error("Error fetching issuer's user details:", error);
    }
  } else {
    console.log("No user UID stored in localStorage for issuer.");
  }
}



//**********************************************************************************************************************************

// Initialize form fields
document.addEventListener('DOMContentLoaded', async function() {
await setIssuerName()  
await populateEhsSignatureSelect();
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
