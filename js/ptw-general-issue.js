// Function to auto-generate PTW Number
async function generatePTWNumber() {
  try {
    const currentYear = new Date().getFullYear(); // Get the current year
    const prefix = `${currentYear}-G-`;

    // Reference to the collection
    const ptwRef = db.collection('General PTW Issue');

    // Query to get PTWs of the current year
    const snapshot = await ptwRef
      .where('ptwNumber', '>=', prefix)
      .where('ptwNumber', '<=', `${prefix}\uf8ff`)
      .get();

    // Collect PTW records in an array
    const ptwArray = [];
    snapshot.forEach(doc => {
      const ptwData = doc.data();
      ptwArray.push({ id: doc.id, ptwNumber: ptwData.ptwNumber });
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

    let newPTWNumber = `${prefix}1`; // Default to CurrentYear-G-1 if no documents found

    if (ptwArray.length > 0) {
      const lastPTWNumberString = ptwArray[ptwArray.length - 1].ptwNumber.split('-')[2]; // Extract number part only
      const lastPTWNumber = parseInt(lastPTWNumberString, 10);
      
      if (!isNaN(lastPTWNumber)) {
        newPTWNumber = `${prefix}${lastPTWNumber + 1}`; // Generate new PTW number
      }
    }

    document.getElementById('ptwNumber').value = newPTWNumber; // Set the new PTW number
  } catch (error) {
    console.error('Error fetching PTW numbers: ', error);
  }
}

//*******************************************************************************************************************

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}


//*******************************************************************************************************************

async function savePTWFormData(event) {
  event.preventDefault();

  if (!confirm('Do you want to generate the PTW?')) {
    return;
  }

  const ptwForm = document.getElementById('ptwForm');
  showLoading();

  try {
    const capturedPhoto = document.getElementById('canvas').toDataURL('image/jpeg');
    
    const getSelectText = (element) => {
      const selectElement = ptwForm[element];
      if (selectElement && selectElement.options) {
        return selectElement.options[selectElement.selectedIndex].text;
      }
      return '';
    };

    const formData = {
      capturedPhoto: capturedPhoto,
      requesterSignature: document.getElementById('requesterSignatureCanvas').toDataURL(),
      issuerSignature: document.getElementById('issuerSignatureCanvas').toDataURL(),
      ehsSignature: document.getElementById('ehsSignatureCanvas').toDataURL(),
      contractorSupervisorSignature: document.getElementById('contractorSupervisorSignatureCanvas').toDataURL(),
      status: 'Open',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Iterate through all form elements and add them to formData
    const elements = ptwForm.elements;
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
      } else if (element.type !== 'button' && element.type !== 'submit') {
        formData[element.id] = element.value;
      }
    }

    const ptwNumber = formData.ptwNumber;

    // Check if the PTW with the same number already exists in Firestore
    const existingDoc = await db.collection('General PTW Issue').doc(ptwNumber).get();

    if (existingDoc.exists) {
      // If the document already exists, alert the user and stop the process
      hideLoading();
      alert('A PTW with this number already exists. Please generate a new PTW.');
      return;
    }

    // Proceed with saving the document if it doesn't exist
    const docRef = db.collection('General PTW Issue').doc(ptwNumber);
    await docRef.set(formData);

    const captureSection = document.getElementById('captureSection');
    if (captureSection) {
      html2canvas(captureSection, { useCORS: true, scale: 2 }).then(async (canvas) => {
        canvas.toBlob(async (blob) => {
          const storageRef = firebase.storage().ref();
          const fileRef = storageRef.child(`general_ptw_forms/${ptwNumber}.jpeg`);
          await fileRef.put(blob);

          const downloadURL = await fileRef.getDownloadURL();
          await docRef.update({ formImageUrl: downloadURL });

          ptwForm.reset();
          hideLoading();
          alert('PTW successfully submitted with ID: ' + ptwNumber);

          // Redirect to ptw_share.html with image URL
          window.location.href = `ptw_share.html?imageUrl=${encodeURIComponent(downloadURL)}`;

        }, 'image/jpeg', 0.5);
      }).catch(error => {
        console.error('Error capturing PTW form image: ', error);
        hideLoading();
        alert('Error capturing PTW form image: ' + error.message);
      });
    } else {
      throw new Error('Capture section element not found');
    }
  } catch (error) {
    console.error('Error adding PTW form data: ', error);
    hideLoading();
    alert('Error submitting PTW: ' + error.message);
  }
}

//*************************************************************************************************************************


// Call functions when document is ready
document.addEventListener('DOMContentLoaded', function() {
  generatePTWNumber(); // Auto-generate PTW number on page load

  // Attach event listener to the form's submit event
  const ptwForm = document.getElementById('ptwForm');
  ptwForm.addEventListener('submit', savePTWFormData);


// Get the dropdown and input elements
    var dropdown = document.getElementById('contractorSupervisor');
    var input = document.getElementById('contractorSupervisorsignature');

    // Add event listener to the dropdown
    dropdown.addEventListener('change', function() {
        // Update the input box with the selected option's text (or value, based on requirement)
        if (dropdown.selectedIndex > 0) { // Check if an option is selected (not the placeholder)
            input.value = dropdown.options[dropdown.selectedIndex].text; // or .value if you need the value instead
        } else {
            input.value = ''; // Clear input if no supervisor is selected (the placeholder option is selected)
        }
    });

// Get the dropdown for requesting personnel and the corresponding input field
    var personnelDropdown = document.getElementById('requestingPersonnel');
    var signatureInput = document.getElementById('requesterSignatureSelect');

    // Add an event listener to the personnel dropdown
    personnelDropdown.addEventListener('change', function() {
        // Set the input field's value to the text of the selected option in the dropdown
        if (personnelDropdown.selectedIndex > 0) { // Ensures that a valid option is selected
            signatureInput.value = personnelDropdown.options[personnelDropdown.selectedIndex].text;
        } else {
            signatureInput.value = ''; // Clear the input if the placeholder or no valid option is selected
        }
    });

});
