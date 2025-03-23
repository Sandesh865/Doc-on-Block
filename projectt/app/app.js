// Check if MetaMask is installed
if (typeof window.ethereum === "undefined") {
  alert("Please install MetaMask to use this application.");
}

// Use MetaMask's provider
const web3 = new Web3(window.ethereum);

// Contract details (replace with your deployed contract's details)
const contractAddress = "0x3Ea5A4a410Cfc32224c95Fca53E98dc6b8Fa2e29";
const contractABI = [
  {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "string",
              "name": "hash",
              "type": "string"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "issuer",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
          },
          {
              "indexed": false,
              "internalType": "string",
              "name": "studentName",
              "type": "string"
          },
          {
              "indexed": false,
              "internalType": "string",
              "name": "degreeType",
              "type": "string"
          }
      ],
      "name": "CertificateIssued",
      "type": "event"
  },
  {
      "inputs": [
          {
              "internalType": "string",
              "name": "",
              "type": "string"
          }
      ],
      "name": "certificates",
      "outputs": [
          {
              "internalType": "string",
              "name": "hash",
              "type": "string"
          },
          {
              "internalType": "string",
              "name": "studentName",
              "type": "string"
          },
          {
              "internalType": "string",
              "name": "degreeType",
              "type": "string"
          },
          {
              "internalType": "address",
              "name": "issuer",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
  },
  {
      "inputs": [],
      "name": "university",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
  },
  {
      "inputs": [
          {
              "internalType": "string",
              "name": "_hash",
              "type": "string"
          },
          {
              "internalType": "string",
              "name": "_studentName",
              "type": "string"
          },
          {
              "internalType": "string",
              "name": "_degreeType",
              "type": "string"
          }
      ],
      "name": "issueCertificate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "string",
              "name": "_hash",
              "type": "string"
          }
      ],
      "name": "verifyCertificate",
      "outputs": [
          {
              "internalType": "address",
              "name": "issuer",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
          },
          {
              "internalType": "string",
              "name": "studentName",
              "type": "string"
          },
          {
              "internalType": "string",
              "name": "degreeType",
              "type": "string"
          }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
  }
];
const contract = new web3.eth.Contract(contractABI, contractAddress);

let userAccount; // Will store the connected MetaMask account

// Function to connect to MetaMask
async function connectMetaMask() {
  try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      userAccount = accounts[0];
      console.log("Connected account:", userAccount);
      document.getElementById("issueResult").innerText = `Connected: ${userAccount}`;
      document.getElementById("issueResult").className = "success";
  } catch (error) {
      document.getElementById("issueResult").innerText = `Error connecting to MetaMask: ${error.message}`;
      document.getElementById("issueResult").className = "error";
      console.error("MetaMask Connection Error:", error);
  }
}

// Hash a PDF file
async function hashFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex; // Return the hash without "0x" prefix (contract expects a string)
}

// Issue a certificate
async function issueCertificate() {
  const fileInput = document.getElementById("issueFile");
  const studentNameInput = document.getElementById("studentName");
  const degreeTypeInput = document.getElementById("degreeType");
  const file = fileInput.files[0];
  const studentName = studentNameInput.value.trim();
  const degreeType = degreeTypeInput.value.trim();
  const issueSpinner = document.getElementById("issueSpinner");
  const issueResult = document.getElementById("issueResult");

  if (!file) {
      issueResult.innerText = "Please select a PDF.";
      issueResult.className = "error";
      return;
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
      issueResult.innerText = "Please upload a PDF file.";
      issueResult.className = "error";
      return;
  }
  if (!studentName || !degreeType) {
      issueResult.innerText = "Please enter both student name and degree type.";
      issueResult.className = "error";
      return;
  }
  if (!userAccount) {
      issueResult.innerText = "Please connect to MetaMask first.";
      issueResult.className = "error";
      return;
  }

  issueResult.innerText = "";
  issueSpinner.style.display = "block";

  try {
      const hash = await hashFile(file);
      await contract.methods.issueCertificate("0x" + hash, studentName, degreeType).send({ from: userAccount, gas: 1000000 });
      issueResult.innerText = `Issued: 0x${hash} for ${studentName} (${degreeType})`;
      issueResult.className = "success";
  } catch (error) {
      issueResult.innerText = `Error: ${error.message}`;
      issueResult.className = "error";
      console.error("Issue Certificate Error:", error);
  } finally {
      issueSpinner.style.display = "none";
  }
}

// Verify a certificate
async function verifyCertificate() {
  const fileInput = document.getElementById("verifyFile");
  const file = fileInput.files[0];
  const verifySpinner = document.getElementById("verifySpinner");
  const verifyResult = document.getElementById("verifyResult");

  if (!file) {
      verifyResult.innerText = "Please select a PDF.";
      verifyResult.className = "error";
      return;
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
      verifyResult.innerText = "Please upload a PDF file.";
      verifyResult.className = "error";
      return;
  }

  verifyResult.innerText = "";
  verifySpinner.style.display = "block";

  try {
      const hash = await hashFile(file);
      const result = await contract.methods.verifyCertificate("0x" + hash).call();
      if (result.issuer === "0x0000000000000000000000000000000000000000") {
          verifyResult.innerHTML = '<span class="error">Not found! ❌</span>';
      } else {
          verifyResult.innerHTML = `
              <span class="success">Verified! ✅</span>
              <div class="metadata">
                  <p><strong>Student:</strong> ${result.studentName}</p>
                  <p><strong>Degree:</strong> ${result.degreeType}</p>
                  <p><strong>Issuer:</strong> ${result.issuer}</p>
                  <p><strong>Time:</strong> ${new Date(result.timestamp * 1000)}</p>
              </div>
          `;
      }
  } catch (error) {
      verifyResult.innerHTML = `<span class="error">Error: ${error.message} ❌</span>`;
      console.error("Verify Certificate Error:", error);
  } finally {
      verifySpinner.style.display = "none";
  }
}

// Load certificate history
async function loadCertificateHistory() {
  const historyBody = document.getElementById("historyBody");
  const historySpinner = document.getElementById("historySpinner");
  historyBody.innerHTML = ""; // Clear the table
  historySpinner.style.display = "block";

  try {
      const events = await contract.getPastEvents("CertificateIssued", {
          fromBlock: 0,
          toBlock: "latest"
      });

      if (events.length === 0) {
          historyBody.innerHTML = '<tr><td colspan="5">No certificates found.</td></tr>';
          return;
      }

      events.forEach(event => {
          const { hash, issuer, timestamp, studentName, degreeType } = event.returnValues;
          const date = new Date(timestamp * 1000);
          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
          const row = document.createElement("tr");
          row.innerHTML = `
              <td>${hash}</td>
              <td>${studentName}</td>
              <td>${degreeType}</td>
              <td>${issuer}</td>
              <td>${formattedDate}</td>
          `;
          historyBody.appendChild(row);
      });
  } catch (error) {
      historyBody.innerHTML = `<tr><td colspan="5">Error loading history: ${error.message}</td></tr>`;
      console.error("Load History Error:", error);
  } finally {
      historySpinner.style.display = "none";
  }
}

// Clear functions
function clearIssueSection() {
  document.getElementById("studentName").value = "";
  document.getElementById("degreeType").value = "";
  document.getElementById("issueFile").value = "";
  document.getElementById("issueResult").innerText = "";
  document.getElementById("issueResult").className = "";
}

function clearVerifySection() {
  document.getElementById("verifyFile").value = "";
  document.getElementById("verifyResult").innerText = "";
  document.getElementById("verifyResult").className = "";
}