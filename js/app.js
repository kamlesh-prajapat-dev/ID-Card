const FORM_FIELDS = [
  "college", "affiliation", "studentName", "father", "dob", "course", "mobile",
  "address", "session", "guardian", "year1", "year2", "year3", "collegeAddress",
  "collegePhones", "website", "rules"
];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const DEFAULT_LOGO_SOURCE = "assets/kkcLogo.webp";

function readFormValues() {
  return Object.fromEntries(FORM_FIELDS.map((id) => [id, document.getElementById(id).value.trim()]));
}

function setText(id, value, fallback = "--") {
  document.getElementById(id).textContent = value || fallback;
}

function renderCollegeHeading(collegeName) {
  const heading = document.getElementById("vCollege");
  const words = (collegeName || "COLLEGE NAME").split(/\s+/);
  const children = [];
  words.forEach((word, index) => {
    if (index) children.push(document.createTextNode(" "));
    const span = document.createElement("span");
    span.className = "college-name-word";
    span.textContent = word;
    children.push(span);
  });
  heading.replaceChildren(...children);
}

function renderStudentDetails(values) {
  const fields = { vFather: values.father, vDob: values.dob, vCourse: values.course, vMobile: values.mobile, vAddress: values.address };
  Object.entries(fields).forEach(([id, value]) => setText(id, value, id === "vCourse" ? "--" : "--"));
  setText("vName", values.studentName, "Student Name");
  document.querySelector(".student-block").classList.toggle("is-long-name", values.studentName.length > 18);
  document.querySelector(".college-heading").classList.toggle("is-long", values.college.length > 18 || values.affiliation.length > 45);
  setText("vAffiliation", values.affiliation);
  setText("vSession", values.session);
  setText("vCollegeAddress", values.collegeAddress);
  renderCollegeHeading(values.college);
  renderBarcode(values.studentName);
}

function renderBarcode(studentName) {
  const barcode = document.querySelector(".barcode");
  if (!barcode.childElementCount) {
    const pattern = [1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1];
    for (let index = 0; index < 64; index += 1) {
      const bar = document.createElement("i");
      bar.style.width = `${pattern[index % pattern.length]}%`;
      barcode.append(bar);
    }
  }
  setText("vBarcodeLabel", studentName ? `ID: ${studentName.toUpperCase()}` : "STUDENT ID / BARCODE");
}

function renderAcademicYearRows(values) {
  const rows = document.getElementById("yearRows");
  const years = [values.year1, values.year2, values.year3];
  const fragment = document.createDocumentFragment();
  years.forEach((session, index) => {
    const row = document.createElement("tr");
    const year = document.createElement("th");
    year.scope = "row";
    year.textContent = `${index + 1}${["st", "nd", "rd"][index]} Year`;
    const sessionCell = document.createElement("td");
    sessionCell.textContent = session || "--";
    row.append(year, sessionCell, document.createElement("td"));
    fragment.append(row);
  });
  rows.replaceChildren(fragment);
}

function renderInstructionPoints(instructions) {
  const list = document.getElementById("vRules");
  const points = instructions.split(/\r?\n/).map((point) => point.trim()).filter(Boolean);
  const fragment = document.createDocumentFragment();
  points.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    fragment.append(item);
  });
  list.replaceChildren(fragment);
}

function renderFront(values) {
  renderStudentDetails(values);
}

function renderBack(values) {
  renderAcademicYearRows(values);
  renderInstructionPoints(values.rules);
  setText("vGuardian", values.guardian);
  setText("vCollegePhones", values.collegePhones, "College contact numbers");
  setText("vBackAddress", values.collegeAddress);
  setText("vWebsite", values.website, "www.examplecollege.com");
}

function renderCardPreview() {
  const values = readFormValues();
  renderFront(values);
  renderBack(values);
}

function showFormStatus(message) {
  document.getElementById("formStatus").textContent = message;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      reject(new Error("Choose a PNG, JPEG, WebP or GIF image."));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("Images must be 10 MB or smaller."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(file);
  });
}

function setImagePreview(image, fallback, source) {
  image.src = source;
  image.hidden = false;
  fallback.hidden = true;
}

function clearImagePreview(image, fallback) {
  image.removeAttribute("src");
  image.hidden = true;
  fallback.hidden = false;
}

function restoreDefaultCollegeLogo(imageId, fallbackSelector) {
  const image = document.getElementById(imageId);
  image.src = DEFAULT_LOGO_SOURCE;
  image.hidden = false;
  document.querySelector(fallbackSelector).hidden = true;
}

async function previewStudentPhoto(file) {
  const image = document.getElementById("vPhoto");
  const fallback = document.querySelector(".photo-fallback");
  try {
    setImagePreview(image, fallback, await readImageFile(file));
    showFormStatus("");
  } catch (error) {
    showFormStatus(error.message);
  }
}

async function previewCollegeLogo(file) {
  const source = await readImageFile(file);
  setImagePreview(document.getElementById("frontLogo"), document.querySelector(".logo-fallback"), source);
  setImagePreview(document.getElementById("backLogo"), document.querySelector(".back-logo-fallback"), source);
}

function resetCardForm() {
  clearImagePreview(document.getElementById("vPhoto"), document.querySelector(".photo-fallback"));
  restoreDefaultCollegeLogo("frontLogo", ".logo-fallback");
  restoreDefaultCollegeLogo("backLogo", ".back-logo-fallback");
  showFormStatus("");
  renderCardPreview();
}

function prepareCardsForPrint() {
  window.print();
}

function initializeEventListeners() {
  const form = document.getElementById("cardForm");
  form.addEventListener("input", renderCardPreview);
  form.addEventListener("reset", () => requestAnimationFrame(resetCardForm));
  document.getElementById("photoInput").addEventListener("change", (event) => {
    if (event.target.files[0]) previewStudentPhoto(event.target.files[0]);
  });
  document.getElementById("logoInput").addEventListener("change", async (event) => {
    if (!event.target.files[0]) return;
    try {
      await previewCollegeLogo(event.target.files[0]);
      showFormStatus("");
    } catch (error) {
      showFormStatus(error.message);
    }
  });
  document.getElementById("printBtn").addEventListener("click", prepareCardsForPrint);
}

function initializeApp() {
  initializeEventListeners();
  renderCardPreview();
}

initializeApp();