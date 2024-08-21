document.addEventListener("DOMContentLoaded", function() {
  const db = firebase.firestore();

  const companyForm = document.getElementById("companyForm");
  const companiesList = document.getElementById("companies");
  const companySelect = document.getElementById("companySelect");
  const companySearch = document.getElementById("companySearch");
  const companySubmitButton = companyForm.querySelector("button[type='submit']");

  const supervisorForm = document.getElementById("supervisorForm");
  const supervisorsList = document.getElementById("supervisors");
  const supervisorSubmitButton = supervisorForm.querySelector("button[type='submit']");

  let editingCompanyId = null;
  let editingSupervisorId = null;

  // Initialize Select2 for the company select box
  $(document).ready(function() {
    $('#companySelect').select2({
      placeholder: "Select Contractor",
      allowClear: true
    }).on('select2:select', function (e) {
      const companyId = e.params.data.id;
      loadSupervisors(companyId);
    });
    loadCompanyOptions();
  });

  // Add or update a company
  companyForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const companyName = document.getElementById("companyName").value;
    const companyAddress = document.getElementById("companyAddress").value;

    try {
      const companiesCollection = db.collection("contractors");
      const companiesSnapshot = await companiesCollection.get();
      const companyCount = companiesSnapshot.size;
      const newCompanyId = `C-${companyCount + 1}`;

      if (editingCompanyId) {
        await companiesCollection.doc(editingCompanyId).update({
          name: companyName,
          address: companyAddress
        });
        alert("Company updated successfully!");
        editingCompanyId = null;
        companySubmitButton.textContent = "Add Company";
      } else {
        await companiesCollection.doc(newCompanyId).set({
          name: companyName,
          address: companyAddress,
          supervisors: [] // Initialize with an empty supervisors array
        });
        alert("Company added successfully!");
      }

      companyForm.reset();
      loadCompanies();
      loadCompanyOptions();
    } catch (error) {
      console.error("Error saving company: ", error);
      alert("Error saving company: " + error.message);
    }
  });

  // Add or update a supervisor
  supervisorForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const companySelectValue = $('#companySelect').val();
    const supervisorName = document.getElementById("supervisorName").value;
    const supervisorAge = document.getElementById("supervisorAge").value;
    const supervisorAddress = document.getElementById("supervisorAddress").value;
    const supervisorIdentityProof = document.getElementById("supervisorIdentityProof").value;
    const supervisorPhoneNumber = document.getElementById("supervisorPhoneNumber").value;

    try {
      const companyDoc = await db.collection("contractors").doc(companySelectValue).get();
      const companyData = companyDoc.data();
      let supervisors = companyData.supervisors || [];

      if (editingSupervisorId !== null) {
        supervisors[editingSupervisorId] = {
          name: supervisorName,
          age: supervisorAge,
          address: supervisorAddress,
          identityProof: supervisorIdentityProof,
          phoneNumber: supervisorPhoneNumber
        };
        alert("Supervisor updated successfully!");
        editingSupervisorId = null;
        supervisorSubmitButton.textContent = "Add Supervisor";
      } else {
        supervisors.push({
          name: supervisorName,
          age: supervisorAge,
          address: supervisorAddress,
          identityProof: supervisorIdentityProof,
          phoneNumber: supervisorPhoneNumber
        });
        alert("Supervisor added successfully!");
      }

      await db.collection("contractors").doc(companySelectValue).update({
        supervisors: supervisors
      });

      supervisorForm.reset();
      loadSupervisors(companySelectValue);
    } catch (error) {
      console.error("Error saving supervisor: ", error);
      alert("Error saving supervisor: " + error.message);
    }
  });

  // Load companies into the company table
  async function loadCompanies(searchTerm = '') {
    companiesList.innerHTML = "";

    try {
      let query = db.collection("contractors");

      if (searchTerm) {
        query = query.where('name', '>=', searchTerm).where('name', '<=', searchTerm + '\uf8ff');
      }

      const querySnapshot = await query.get();
      querySnapshot.forEach((doc) => {
        const company = doc.data();
        const companyId = doc.id;

        const companyRow = document.createElement("tr");
        companyRow.innerHTML = `
          <td>${company.name}</td>
          <td>${company.address}</td>
          <td>
            <button class="edit-btn" onclick="editCompany('${companyId}', '${company.name}', '${company.address}')">Edit</button>
            <button class="delete-btn" onclick="deleteCompany('${companyId}')">Delete</button>
          </td>
        `;
        companiesList.appendChild(companyRow);
      });
    } catch (error) {
      console.error("Error loading companies: ", error);
    }
  }

  // Load company options into the select box
  async function loadCompanyOptions() {
    try {
      const querySnapshot = await db.collection("contractors").get();
      const companies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().name
      }));

      $('#companySelect').select2({
        data: [],
        placeholder: "Select Contractor",
        allowClear: true
      }).empty().append('<option></option>'); // Ensuring the placeholder is shown

      companies.forEach(company => {
        const newOption = new Option(company.text, company.id, false, false);
        $('#companySelect').append(newOption).trigger('change');
      });

    } catch (error) {
      console.error("Error loading company options: ", error);
    }
  }

  // Load supervisors into the supervisor table
  async function loadSupervisors(companyId) {
    supervisorsList.innerHTML = "";

    try {
      const companyDoc = await db.collection("contractors").doc(companyId).get();
      const companyData = companyDoc.data();
      const supervisors = companyData.supervisors || [];

      supervisors.forEach((supervisor, index) => {
        const supervisorRow = document.createElement("tr");
        supervisorRow.innerHTML = `
          <td>${supervisor.name}</td>
          <td>${supervisor.age}</td>
          <td>${supervisor.address}</td>
          <td>${supervisor.identityProof}</td>
          <td>${supervisor.phoneNumber}</td>
          <td>${companyData.name}</td>
          <td>
            <button class="edit-btn" onclick="editSupervisor(${index}, '${supervisor.name}', ${supervisor.age}, '${supervisor.address}', '${supervisor.identityProof}', '${supervisor.phoneNumber}')">Edit</button>
            <button class="delete-btn" onclick="deleteSupervisor('${companyId}', ${index})">Delete</button>
          </td>
        `;
        supervisorsList.appendChild(supervisorRow);
      });
    } catch (error) {
      console.error("Error loading supervisors: ", error);
    }
  }

  // Edit a company
  window.editCompany = function(companyId, companyName, companyAddress) {
    document.getElementById("companyName").value = companyName;
    document.getElementById("companyAddress").value = companyAddress;
    editingCompanyId = companyId;
    companySubmitButton.textContent = "Update Company";
  };

  // Delete a company
  window.deleteCompany = async function(companyId) {
    try {
      await db.collection("contractors").doc(companyId).delete();
      alert("Company deleted successfully!");
      loadCompanies();
      loadCompanyOptions();
    } catch (error) {
      console.error("Error deleting company: ", error);
      alert("Error deleting company: " + error.message);
    }
  };

  // Edit a supervisor
  window.editSupervisor = function(index, supervisorName, supervisorAge, supervisorAddress, supervisorIdentityProof, supervisorPhoneNumber) {
    document.getElementById("supervisorName").value = supervisorName;
    document.getElementById("supervisorAge").value = supervisorAge;
    document.getElementById("supervisorAddress").value = supervisorAddress;
    document.getElementById("supervisorIdentityProof").value = supervisorIdentityProof;
    document.getElementById("supervisorPhoneNumber").value = supervisorPhoneNumber;
    editingSupervisorId = index;
    supervisorSubmitButton.textContent = "Update Supervisor";
  };

  // Delete a supervisor
  window.deleteSupervisor = async function(companyId, index) {
    try {
      const companyDoc = await db.collection("contractors").doc(companyId).get();
      const companyData = companyDoc.data();
      let supervisors = companyData.supervisors || [];

      supervisors.splice(index, 1); // Remove the supervisor at the specified index

      await db.collection("contractors").doc(companyId).update({
        supervisors: supervisors
      });

      alert("Supervisor deleted successfully!");
      loadSupervisors(companyId);
    } catch (error) {
      console.error("Error deleting supervisor: ", error);
      alert("Error deleting supervisor: " + error.message);
    }
  };

  // Search companies
  companySearch.addEventListener("input", function() {
    const filter = companySearch.value.toLowerCase();
    const rows = companiesList.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName("td");
      const companyName = cells[0].textContent || cells[0].innerText;
      if (companyName.toLowerCase().indexOf(filter) > -1) {
        rows[i].style.display = "";
      } else {
        rows[i].style.display = "none";
      }
    }
  });

  // Initial load of companies and company options
  loadCompanies();
  loadCompanyOptions();
});
