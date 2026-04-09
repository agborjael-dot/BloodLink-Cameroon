const ALLOWED_BLOOD_GROUPS = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const PHONE_PATTERN = /^[0-9+\-\s()]{6,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanControlChars = (value = "") => value.replace(/[\u0000-\u001F\u007F]/g, " ");

const collapseWhitespace = (value = "") => value.replace(/\s+/g, " ").trim();

const stripHtmlSensitiveChars = (value = "") => value.replace(/[<>`]/g, "");

const sanitizePlainText = (value) =>
  collapseWhitespace(stripHtmlSensitiveChars(cleanControlChars(typeof value === "string" ? value : "")));

const sanitizeEmail = (value) => sanitizePlainText(value).replace(/\s+/g, "").toLowerCase();

const sanitizePhone = (value) =>
  collapseWhitespace(cleanControlChars(typeof value === "string" ? value : "").replace(/[^0-9+\-\s()]/g, ""));

const sanitizeBloodGroup = (value) =>
  sanitizePlainText(value).replace(/\s+/g, "").toUpperCase();

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const validateProspectCreate = (req, res, next) => {
  const name = sanitizePlainText(req.body.name);
  const tel = sanitizePhone(req.body.tel);
  const email = sanitizeEmail(req.body.email);
  const address = sanitizePlainText(req.body.address);
  const bloodgroup = sanitizeBloodGroup(req.body.bloodgroup);
  const diseases = sanitizePlainText(req.body.diseases);
  const weight = parseOptionalNumber(req.body.weight);
  const age = parseOptionalNumber(req.body.age);
  const errors = {};

  if (!name || name.length < 2 || name.length > 100) {
    errors.name = "Name must be between 2 and 100 characters.";
  }

  if (!tel || !PHONE_PATTERN.test(tel)) {
    errors.tel = "Telephone number is required and must be valid.";
  }

  if (email && (email.length > 120 || !EMAIL_PATTERN.test(email))) {
    errors.email = "Email address is invalid.";
  }

  if (address.length > 200) {
    errors.address = "Address must not exceed 200 characters.";
  }

  if (!ALLOWED_BLOOD_GROUPS.has(bloodgroup)) {
    errors.bloodgroup = "Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, or O-.";
  }

  if (Number.isNaN(weight) || (weight !== null && (weight < 20 || weight > 300))) {
    errors.weight = "Weight must be a valid number between 20 and 300.";
  }

  if (Number.isNaN(age) || (age !== null && (!Number.isInteger(age) || age < 16 || age > 100))) {
    errors.age = "Age must be a whole number between 16 and 100.";
  }

  if (diseases.length > 500) {
    errors.diseases = "Medical notes must not exceed 500 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: Object.values(errors)[0],
      errors,
    });
  }

  req.prospectInput = {
    name,
    tel,
    email,
    address,
    bloodgroup,
    diseases,
    weight,
    age,
    date: new Date().toISOString().slice(0, 10),
  };

  return next();
};

module.exports = { validateProspectCreate };
