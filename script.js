// MediSOS — beginner-friendly Emergency SOS Health Card
// Data is saved in localStorage so it stays after a refresh.

var STORAGE_KEY = "medisos-health-card";

var homeSection = document.getElementById("home");
var createSection = document.getElementById("create");
var cardSection = document.getElementById("card");
var navButtons = document.querySelectorAll(".nav-btn");
var form = document.getElementById("healthForm");
var emptyCard = document.getElementById("emptyCard");
var emergencyCard = document.getElementById("emergencyCard");
var fileHint = document.getElementById("fileHint");
var qrHolder = document.getElementById("qrcode");
var qrObject = null;

// Show one screen at a time (Home, Create Card, or Emergency Card)
function showSection(name) {
  homeSection.classList.remove("active");
  createSection.classList.remove("active");
  cardSection.classList.remove("active");

  document.getElementById(name).classList.add("active");

  navButtons.forEach(function (btn) {
    if (btn.getAttribute("data-section") === name) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function getFormData() {
  return {
    fullName: document.getElementById("fullName").value.trim(),
    age: document.getElementById("age").value.trim(),
    bloodGroup: document.getElementById("bloodGroup").value,
    allergies: document.getElementById("allergies").value.trim(),
    conditions: document.getElementById("conditions").value.trim(),
    medications: document.getElementById("medications").value.trim(),
    contactName: document.getElementById("contactName").value.trim(),
    contactPhone: document.getElementById("contactPhone").value.trim()
  };
}

function fillForm(data) {
  document.getElementById("fullName").value = data.fullName || "";
  document.getElementById("age").value = data.age || "";
  document.getElementById("bloodGroup").value = data.bloodGroup || "";
  document.getElementById("allergies").value = data.allergies || "";
  document.getElementById("conditions").value = data.conditions || "";
  document.getElementById("medications").value = data.medications || "";
  document.getElementById("contactName").value = data.contactName || "";
  document.getElementById("contactPhone").value = data.contactPhone || "";
}

function textOrFallback(value, fallback) {
  if (value && value.length > 0) {
    return value;
  }
  return fallback;
}

function saveCard(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadCard() {
  var raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function normalizeCard(data) {
  if (!data) {
    return null;
  }

  return {
    fullName: data.fullName || data.n || "",
    age: data.age || data.a || "",
    bloodGroup: data.bloodGroup || data.b || "",
    allergies: data.allergies || data.g || "",
    conditions: data.conditions || data.c || "",
    medications: data.medications || data.m || "",
    contactName: data.contactName || data.e || "",
    contactPhone: data.contactPhone || data.p || ""
  };
}

function compactCard(data) {
  return {
    n: data.fullName,
    a: data.age,
    b: data.bloodGroup,
    g: data.allergies,
    c: data.conditions,
    m: data.medications,
    e: data.contactName,
    p: data.contactPhone
  };
}

function decodeCardText(encoded) {
  if (!encoded) {
    return null;
  }

  var text = encoded;
  try {
    text = decodeURIComponent(encoded);
  } catch (error) {
    text = encoded;
  }

  try {
    return normalizeCard(JSON.parse(text));
  } catch (error) {
    return null;
  }
}

// Phone cameras keep query strings more reliably than #hash fragments.
function getShareUrl(data) {
  var encoded = encodeURIComponent(JSON.stringify(compactCard(data)));
  var base = window.location.href.split("#")[0].split("?")[0];
  return base + "?e=" + encoded;
}

function drawQrCode(shareUrl) {
  if (!qrHolder) {
    return;
  }

  qrHolder.innerHTML = "";
  qrObject = null;

  if (typeof QRCode === "function") {
    qrObject = new QRCode(qrHolder, {
      text: shareUrl,
      width: 180,
      height: 180,
      colorDark: "#115e59",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
    return;
  }

  var img = document.createElement("img");
  img.alt = "QR code for this emergency card";
  img.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" +
    encodeURIComponent(shareUrl);
  qrHolder.appendChild(img);
}

function renderCard(data) {
  data = normalizeCard(data);
  if (!data || !data.fullName) {
    return;
  }

  document.getElementById("displayName").textContent = data.fullName;
  document.getElementById("displayAge").textContent = data.age;
  document.getElementById("displayBlood").textContent = data.bloodGroup;
  document.getElementById("displayAllergies").textContent = textOrFallback(data.allergies, "None listed");
  document.getElementById("displayConditions").textContent = textOrFallback(data.conditions, "None listed");
  document.getElementById("displayMedications").textContent = textOrFallback(data.medications, "None listed");
  document.getElementById("displayContactName").textContent = data.contactName;
  document.getElementById("displayContactPhone").textContent = data.contactPhone;

  var phoneLink = String(data.contactPhone || "").replace(/\s+/g, "");
  document.getElementById("callBtn").href = "tel:" + phoneLink;

  drawQrCode(getShareUrl(data));

  if (window.location.protocol === "file:") {
    fileHint.classList.remove("hidden");
  } else {
    fileHint.classList.add("hidden");
  }

  emptyCard.classList.add("hidden");
  emergencyCard.classList.remove("hidden");
}

function readSharedCardFromUrl() {
  var params = new URLSearchParams(window.location.search);
  var fromQuery = params.get("e");
  if (fromQuery) {
    return decodeCardText(fromQuery);
  }

  var hash = window.location.hash;
  if (hash.indexOf("#e=") === 0) {
    return decodeCardText(hash.slice(3));
  }

  return null;
}

navButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    showSection(btn.getAttribute("data-section"));
  });
});

document.getElementById("goCreateBtn").addEventListener("click", function () {
  showSection("create");
});

document.getElementById("goCardBtn").addEventListener("click", function () {
  showSection("card");
});

document.getElementById("emptyCreateBtn").addEventListener("click", function () {
  showSection("create");
});

form.addEventListener("submit", function (event) {
  event.preventDefault();
  var data = getFormData();
  saveCard(data);
  renderCard(data);
  showSection("card");
});

// Start the app: shared QR link, or saved localStorage card, or empty state.
var sharedCard = readSharedCardFromUrl();
if (sharedCard && sharedCard.fullName) {
  renderCard(sharedCard);
  document.getElementById("cardHeading").textContent = "Emergency Health Information";
  document.getElementById("cardSub").textContent = "This card was opened from a QR code scan.";
  emergencyCard.classList.add("is-shared-view");
  showSection("card");
} else {
  var saved = loadCard();
  if (saved) {
    fillForm(saved);
    renderCard(saved);
  }
  showSection("home");
}
