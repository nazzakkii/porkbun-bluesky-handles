let canCreateHandle = false;
let isLoading = false;
let domain = "";

// Load domain configuration on page load
async function loadConfig() {
  try {
    const response = await fetch("/config");
    const config = await response.json();
    domain = config.domain;
    document.getElementById("domainText").textContent = domain;
    document.getElementById("handleText").textContent = domain;
    document.title = `Handle Creator - ${domain}`;
  } catch (error) {
    console.error("Failed to load domain configuration:", error);
    document.getElementById("domainText").textContent = "error";
    document.getElementById("handleText").textContent = "error";
    document.title = "Handle Creator - error";
  }
}

// Load config when page loads
loadConfig();

// Handle preview functionality
document.getElementById("handle").addEventListener("input", function (e) {
  const handle = e.target.value.trim();
  const preview = document.getElementById("handlePreview");
  const previewText = document.getElementById("previewText");

  if (handle) {
    previewText.textContent = handle;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }
});

// DID paste functionality
document.getElementById("did").addEventListener("paste", function (e) {
  setTimeout(() => {
    const pastedValue = e.target.value;
    if (pastedValue.includes("did=")) {
      const didMatch = pastedValue.match(/did=([^&\s]+)/);
      if (didMatch && didMatch[1]) {
        const extractedDid = didMatch[1];
        // Format as did=did:plc:...
        if (extractedDid.startsWith("did:")) {
          e.target.value = `did=${extractedDid}`;
        } else {
          e.target.value = `did=did:${extractedDid}`;
        }
        e.target.dispatchEvent(new Event("input"));
      }
    }
  }, 10);
});

function setLoading(buttonId, loading, loadingText, normalText) {
  const button = document.getElementById(buttonId);
  if (loading) {
    button.disabled = true;
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.textContent = normalText;
  }
  isLoading = loading;
}

function showResult(message, isSuccess) {
  const resultDiv = document.getElementById("result");
  resultDiv.className = `result ${isSuccess ? "success" : "error"}`;
  resultDiv.textContent = message;
  resultDiv.classList.remove("hidden");

  if (isSuccess) {
    setTimeout(() => {
      resultDiv.classList.add("hidden");
    }, 5000);
  }
}

function updateForm(canCreate) {
  const didSection = document.getElementById("didSection");
  const createBtn = document.getElementById("createBtn");

  canCreateHandle = canCreate;

  if (canCreate) {
    didSection.classList.remove("hidden");
    createBtn.disabled = false;
  } else {
    didSection.classList.add("hidden");
    createBtn.disabled = true;
  }
}

async function checkHandle() {
  if (isLoading) return;

  const handle = document.getElementById("handle").value.trim();

  if (!handle) {
    showResult("Please enter a handle to check.", false);
    return;
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(handle)) {
    showResult(
      "Handle can only contain letters, numbers, dots, underscores, and hyphens.",
      false
    );
    return;
  }

  setLoading("checkBtn", true, "Checking...", "Check Availability");

  try {
    const response = await fetch("/check-handle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ handle }),
    });

    const data = await response.json();
    const isSuccess = data.status === "SUCCESS";

    showResult(data.message, isSuccess);
    updateForm(isSuccess);
  } catch (error) {
    console.error("Error checking handle:", error);
    showResult(
      "Network error. Please check your connection and try again.",
      false
    );
    updateForm(false);
  } finally {
    setLoading("checkBtn", false, "Checking...", "Check Availability");
  }
}

async function createHandle() {
  if (isLoading || !canCreateHandle) return;

  const handle = document.getElementById("handle").value.trim();
  const did = document.getElementById("did").value.trim();

  if (!did) {
    showResult("Please enter a DID to create the handle.", false);
    return;
  }

  if (!did.startsWith("did:")) {
    showResult('DID must start with "did:".', false);
    return;
  }

  setLoading("createBtn", true, "Creating...", "Create Handle");

  try {
    const response = await fetch("/create-handle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ handle, did }),
    });

    const data = await response.json();
    const isSuccess = data.status === "SUCCESS";

    showResult(data.message, isSuccess);

    if (isSuccess) {
      document.getElementById("handleForm").reset();
      document.getElementById("handlePreview").classList.add("hidden");
      updateForm(false);
    }
  } catch (error) {
    console.error("Error creating handle:", error);
    showResult(
      "Network error. Please check your connection and try again.",
      false
    );
  } finally {
    setLoading("createBtn", false, "Creating...", "Create Handle");
  }
}

// Keyboard navigation
document.getElementById("handle").addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !isLoading) {
    checkHandle();
  }
});

document.getElementById("did").addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !isLoading && canCreateHandle) {
    createHandle();
  }
});
