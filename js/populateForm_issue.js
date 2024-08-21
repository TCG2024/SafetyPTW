// populateForm.js

async function populateUserNames() {
  const usersSelectBoxes = document.querySelectorAll('select[name="requestingPersonnel"]');
  const userUID = localStorage.getItem('userUID');

  if (userUID) {
    try {
      const usersSnapshot = await firebase.firestore().collection('users').get();
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        usersSelectBoxes.forEach(selectBox => {
          const option = document.createElement('option');
          option.value = doc.id;
          option.textContent = userData.fullName;
          selectBox.appendChild(option);
        });
      });
      
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }
}
//**********************************************************************************************************
async function populateEhsSignatureSelect() {
  const ehsSelect = document.querySelector('select[name="ehsSignatureSelect"]');

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
  const issuerNameInput = document.getElementById('issuerName');
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


//**********************************************************************************************************
// Function to fetch and populate contractor names in the select box
async function populateContractors() {
  const contractorSelectBox = document.getElementById('contractor');

  try {
    const contractorsSnapshot = await firebase.firestore().collection('contractors').get();
    contractorsSnapshot.forEach((doc) => {
      const contractorData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = contractorData.name;
      contractorSelectBox.appendChild(option);
    });

    // Add event listener to contractor select box to fetch supervisors when a contractor is selected
    contractorSelectBox.addEventListener('change', populateSupervisors);

  } catch (error) {
    console.error("Error fetching contractors:", error);
  }
}

//**********************************************************************************************************

// Function to fetch and populate supervisor names based on the selected contractor
async function populateSupervisors() {
  const supervisorSelectBox = document.getElementById('contractorSupervisor');
  const supervisorSignatureSelectBox = document.getElementById('contractorSupervisorsignature');
  const selectedContractorId = document.getElementById('contractor').value;

  // Clear the current supervisor options
  supervisorSelectBox.innerHTML = '<option value="">Select Supervisor</option>';
  supervisorSignatureSelectBox.innerHTML = '<option value="">Select Supervisor</option>';

  if (selectedContractorId) {
    try {
      const contractorDoc = await firebase.firestore().collection('contractors').doc(selectedContractorId).get();
      
      if (contractorDoc.exists) {
        const contractorData = contractorDoc.data();
        const supervisors = contractorData.supervisors || [];

        supervisors.forEach((supervisor, index) => {
          const option = document.createElement('option');
          option.value = index;  // Option value can be the index or a unique identifier if available
          option.textContent = supervisor.name;

          // Append the option to both select boxes
          supervisorSelectBox.appendChild(option);
          supervisorSignatureSelectBox.appendChild(option.cloneNode(true));
        });
      } else {
        console.error("No such contractor!");
      }
    } catch (error) {
      console.error("Error fetching contractor's supervisors:", error);
    }
  }
}

//**********************************************************************************************************

// Document ready event
document.addEventListener('DOMContentLoaded', async function() {
  await populateEhsSignatureSelect();
  await setIssuerName();
  await populateUserNames()
  await populateContractors();
});

//**********************************************************************************************************

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
    document.getElementById('date').value = currentDate;
    document.getElementById('issueTimeFrom').value = currentTime;
  });