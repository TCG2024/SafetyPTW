// Function to populate General PTW Number select box
async function populateGeneralPTWNumberSelect() {
  const ptwNumberSelect = document.getElementById('generalPtwNumber');

  try {
    // Fetch PTW records with status 'Open' or 'Extended'
    const querySnapshot = await db.collection('General PTW Issue')
      .where('status', 'in', ['Open', 'Extended'])
      .get();

    // Collect PTW records in an array
    const ptwArray = [];
    querySnapshot.forEach(doc => {
      const ptwData = doc.data();
      ptwArray.push({ ptwNumber: ptwData.ptwNumber });
    });

    // Sort the array by PTW number with natural order sorting
    ptwArray.sort((a, b) => {
      const partsA = a.ptwNumber.split('-');
      const partsB = b.ptwNumber.split('-');
      const prefixA = partsA.slice(0, -1).join('-');
      const prefixB = partsB.slice(0, -1).join('-');
      const numA = parseInt(partsA[partsA.length - 1], 10);
      const numB = parseInt(partsB[partsB.length - 1], 10);

      if (prefixA === prefixB) {
        return numA - numB;
      } else {
        return prefixA.localeCompare(prefixB);
      }
    });

    // Populate the select element with sorted options
    ptwArray.forEach(ptw => {
      const option = document.createElement('option');
      option.value = ptw.ptwNumber; // Use PTW number as the value
      option.textContent = ptw.ptwNumber;
      ptwNumberSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching PTW numbers: ', error);
  }
}

//*******************************************************************************************************************

// Function to populate fields based on selected General PTW Number
async function populateFieldsFromPTWNumber() {
  const ptwNumberSelect = document.getElementById('generalPtwNumber');
  const selectedPtwNumber = ptwNumberSelect.value;

  try {
    // Fetch the document from the Firestore collection
    const docRef = db.collection('General PTW Issue').doc(selectedPtwNumber);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();

      // Populate the elements with the values from the document
      document.getElementById('requestingDepartment').value = data.requestingDepartment || '';
      document.getElementById('jobLocation').value = data.jobLocation || '';
      document.getElementById('jobDescription').value = data.jobDescription || '';
      document.getElementById('requestingPersonnel').value = data.requestingPersonnel || '';
      document.getElementById('contractor').value = data.contractor || '';
      document.getElementById('contractorSupervisor').value = data.contractorSupervisor || '';
      document.getElementById('requesterSignatureSelect').value = data.requestingPersonnel || '';
      document.getElementById('contractorSupervisorsignature').value = data.contractorSupervisor || '';

      
    } else {
      console.error('No such document!');
    }
  } catch (error) {
    console.error('Error fetching PTW document: ', error);
  }
}


//***************************************************************************************

// Function to auto-generate Hot Work PTW Number
async function generateHotWorkPTWNumber() {
  try {
    console.log('Generating Hot Work PTW Number');
    const generalPtwNumberSelect = document.getElementById('generalPtwNumber');
    const selectedGeneralPTWNumber = generalPtwNumberSelect.value;

    if (!selectedGeneralPTWNumber) {
      console.error('No General PTW Number selected');
      alert('No General PTW Number selected');
      return;
    }

    console.log(`Selected General PTW Number: ${selectedGeneralPTWNumber}`);

    // Reference to the collection
    const ptwRef = db.collection('Hot Work PTW Issue');

    // Query to get the PTW documents with the selected general PTW number and "-HW-"
    const snapshot = await ptwRef.where('ptwNumber', '>=', `${selectedGeneralPTWNumber}-HW-`)
                                 .where('ptwNumber', '<', `${selectedGeneralPTWNumber}-HX`)
                                 .orderBy('ptwNumber', 'desc')
                                 .get();
    
    console.log('Query executed, processing results');

    let newPTWNumber = `${selectedGeneralPTWNumber}-HW-1`; // Default if no documents found

    if (!snapshot.empty) {
      let highestNumber = 0;
      snapshot.forEach(doc => {
        const ptwNumberParts = doc.data().ptwNumber.split('-HW-');
        if (ptwNumberParts.length === 2) {
          const numberPart = parseInt(ptwNumberParts[1]);
          if (!isNaN(numberPart) && numberPart > highestNumber) {
            highestNumber = numberPart;
          }
        }
      });
      newPTWNumber = `${selectedGeneralPTWNumber}-HW-${highestNumber + 1}`; // Generate new PTW number
    }

    console.log(`Generated new PTW Number: ${newPTWNumber}`);

    const ptwNumberElement = document.getElementById('ptwNumber');
    if (ptwNumberElement) {
      ptwNumberElement.value = newPTWNumber; // Set the new PTW number
      ptwNumberElement.parentElement.style.display = 'block'; // Show the PTW Number field
      console.log('New PTW Number set in the input field');
    }
  } catch (error) {
    console.error('Error fetching PTW numbers: ', error);
    alert('Error fetching Hot Work PTW Numbers: ' + error.message);
  }
}

//**********************************************************************************************************************************


function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}


//**********************************************************************************************************************************


async function saveHotPTWFormData(event) {
  event.preventDefault();

  if (!confirm('Do you want to generate the Hot Work PTW?')) {
    return;
  }

  const ptwForm = document.getElementById('ptwForm');
  if (!ptwForm) {
    console.error('Form element not found');
    alert('Form element not found');
    return;
  }

  showLoading();

  try {
    const getSelectText = (element) => {
      const selectElement = ptwForm[element];
      if (selectElement && selectElement.options) {
        return selectElement.options[selectElement.selectedIndex].text;
      }
      return '';
    };

    const getRadioValue = (name) => {
      const radios = document.getElementsByName(name);
      for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
          return radios[i].value;
        }
      }
      return ''; // Return an empty string if no radio button is selected
    };

    const formData = {
      requesterSignature: document.getElementById('requesterSignatureCanvas')?.toDataURL() || '',
      issuerSignature: document.getElementById('issuerSignatureCanvas')?.toDataURL() || '',
      ehsSignature: document.getElementById('ehsSignatureCanvas')?.toDataURL() || '',
      contractorSupervisorSignature: document.getElementById('contractorSupervisorSignatureCanvas')?.toDataURL() || '',
      status: 'Open',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Iterate through all form elements and add them to formData
    const elements = ptwForm.elements;
    if (!elements) {
      throw new Error('Form elements not found');
    }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.tagName === 'SELECT') {
        formData[element.id] = getSelectText(element.id);
      } else if (element.type === 'checkbox') {
        if (!formData[element.name]) {
          formData[element.name] = [];
        }
        if (element.checked) {
          formData[element.name].push(element.value);
        }
      } else if (element.type === 'radio') {
        formData[element.name] = getRadioValue(element.name);
      } else if (element.type !== 'button' && element.type !== 'submit') {
        formData[element.id] = element.value;
      }
    }

    const ptwNumber = formData.ptwNumber;

    const docRef = db.collection('Hot Work PTW Issue').doc(ptwNumber);
    await docRef.set(formData);

    const captureSection = document.getElementById('capture-section');
    if (!captureSection) {
      throw new Error('Capture section element not found');
    }

    html2canvas(captureSection, { useCORS: true, scale: 2 }).then(async (canvas) => {
      canvas.toBlob(async (blob) => {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`hot_work_ptw_forms/${ptwNumber}.jpeg`);
        await fileRef.put(blob);

        const downloadURL = await fileRef.getDownloadURL();
        await docRef.update({ formImageUrl: downloadURL });

        ptwForm.reset();
        hideLoading();
        alert('Hot Work PTW successfully submitted with ID: ' + ptwNumber);

        // Redirect to ptw_share.html with image URL
        window.location.href = `ptw_share.html?imageUrl=${encodeURIComponent(downloadURL)}`;

      }, 'image/jpeg', 0.5);
    }).catch(error => {
      console.error('Error capturing PTW form image: ', error);
      hideLoading();
      alert('Error capturing PTW form image: ' + error.message);
    });
  } catch (error) {
    console.error('Error adding Hot Work PTW form data: ', error);
    hideLoading();
    alert('Error submitting Hot Work PTW: ' + error.message);
  }
}

// Attach the event listener to the form submission
document.getElementById('ptwForm').addEventListener('submit', saveHotPTWFormData);

//******************************************************************************************************
// Initialize select2 for the general PTW number dropdown
  $(document).ready(function() {
    $('#generalPtwNumber').select2({
      placeholder: 'Select General PTW Number',
      allowClear: true
    });

    // Set up the change event listener for generalPtwNumber
    $('#generalPtwNumber').on('change', handleGeneralPtwNumberSelection);
  });

  function handleGeneralPtwNumberSelection() {
    const selectedValue = $('#generalPtwNumber').val();
    if (selectedValue) {
       generateHotWorkPTWNumber();
	populateFieldsFromPTWNumber();
    }
  }

// Call functions when document is ready
document.addEventListener('DOMContentLoaded', function() {
  populateGeneralPTWNumberSelect();
  handleGeneralPtwNumberSelection();
  saveHotWorkPTWFormData(); // Save PTW form data on form submission

});
