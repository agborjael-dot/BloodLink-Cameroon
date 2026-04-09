const Donor = require("../models/Donor");
const User = require("../models/User");

const computeNextEligible = (dateStr) => {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return undefined;
  const next = new Date(date);
  next.setDate(next.getDate() + 90);
  return next.toISOString().slice(0, 10);
};

const buildJoinedDate = (createdAt) => {
  const parsed = new Date(createdAt || Date.now());
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const sortDonationHistory = (history = []) =>
  [...history].sort((left, right) => {
    const leftTime = Date.parse(left?.date || "");
    const rightTime = Date.parse(right?.date || "");
    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
    if (Number.isNaN(leftTime)) return 1;
    if (Number.isNaN(rightTime)) return -1;
    return rightTime - leftTime;
  });

const buildDonationHistory = (donor = {}) => {
  const storedHistory = Array.isArray(donor?.donationHistory)
    ? donor.donationHistory
        .filter((entry) => entry?.date)
        .map((entry) => ({
          date: entry.date,
          location: entry.location || "",
          status: entry.status || "Completed",
        }))
    : [];

  if (storedHistory.length > 0) {
    return sortDonationHistory(storedHistory);
  }

  if (donor?.lastDonation) {
    return [
      {
        date: donor.lastDonation,
        location: donor.city || "",
        status: "Recorded",
      },
    ];
  }

  return [];
};

const serializeAccount = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const normalizeDonorUpdate = (payload = {}) => {
  const normalized = {};
  const allowedStringFields = [
    "name",
    "tel",
    "city",
    "address",
    "bloodgroup",
    "diseases",
    "date",
    "joined",
    "lastDonation",
  ];
  const allowedNumberFields = ["weight", "age", "bloodpressure"];

  allowedStringFields.forEach((field) => {
    if (payload[field] !== undefined) {
      normalized[field] = typeof payload[field] === "string" ? payload[field].trim() : payload[field];
    }
  });

  allowedNumberFields.forEach((field) => {
    if (payload[field] === undefined) return;
    if (payload[field] === "" || payload[field] === null) {
      normalized[field] = null;
      return;
    }
    const casted = Number(payload[field]);
    normalized[field] = Number.isNaN(casted) ? null : casted;
  });

  return normalized;
};

const getCurrentDonorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json("User not found");

    const donor = await Donor.findOne({ email: user.email });
    const donorProfile = donor
      ? {
          ...donor.toObject(),
          joined: donor.joined || buildJoinedDate(user.createdAt),
          nextEligible: donor.nextEligible || computeNextEligible(donor.lastDonation) || "",
          status: donor.status || "Active",
          donationHistory: buildDonationHistory(donor),
        }
      : {
          name: user.name,
          email: user.email,
          city: "",
          address: "",
          tel: "",
          bloodgroup: "",
          weight: null,
          date: "",
          joined: buildJoinedDate(user.createdAt),
          lastDonation: "",
          nextEligible: "",
          diseases: "",
          age: null,
          bloodpressure: null,
          status: "Active",
          donationHistory: [],
        };

    res.status(200).json({
      account: serializeAccount(user),
      donor: donorProfile,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

// CREATE DONOR

const createDonor = async (req, res) => {
  try {
    const payload = { ...req.body };
    const lastDonation = payload.lastDonation || payload.date || payload.joined;
    const computed = computeNextEligible(lastDonation);
    if (!payload.nextEligible && computed) {
      payload.nextEligible = computed;
    }
    if (!Array.isArray(payload.donationHistory)) {
      payload.donationHistory = lastDonation
        ? [
            {
              date: lastDonation,
              location: payload.city || "",
              status: "Recorded",
            },
          ]
        : [];
    }
    const newDonor = Donor(payload);
    const donor = await newDonor.save();
    res.status(201).json(donor);
  } catch (error) {
    res.status(500).json(error);
  }
};

// GET ALL DONORS

const getAlldonors = async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.status(200).json(donors);
  } catch (error) {
    res.status(500).json(error);
  }
};

// UPDATE DONOR

const updateDonor = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.lastDonation && !update.nextEligible) {
      const computed = computeNextEligible(update.lastDonation);
      if (computed) update.nextEligible = computed;
    }
    const updateDonor = await Donor.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    res.status(201).json(updateDonor);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateCurrentDonorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json("User not found");
    const existingDonor = await Donor.findOne({ email: user.email });

    const update = normalizeDonorUpdate(req.body);
    if (typeof update.name === "string" && update.name) {
      user.name = update.name;
      await user.save();
    }

    const donorUpdate = {
      ...update,
      name: user.name,
      email: user.email,
    };

    if (!donorUpdate.joined) {
      donorUpdate.joined = existingDonor?.joined || buildJoinedDate(user.createdAt);
    }

    if (req.body?.lastDonation === "") {
      donorUpdate.lastDonation = "";
      donorUpdate.nextEligible = "";
      donorUpdate.donationHistory = [];
    } else if (donorUpdate.lastDonation) {
      donorUpdate.nextEligible = computeNextEligible(donorUpdate.lastDonation) || "";
      const history = buildDonationHistory(existingDonor || {});
      if (!history.some((entry) => entry.date === donorUpdate.lastDonation)) {
        history.unshift({
          date: donorUpdate.lastDonation,
          location: donorUpdate.city || existingDonor?.city || "",
          status: "Recorded",
        });
      }
      donorUpdate.donationHistory = sortDonationHistory(history);
    } else if (existingDonor) {
      donorUpdate.donationHistory = buildDonationHistory(existingDonor);
    }

    const donor = await Donor.findOneAndUpdate(
      { email: user.email },
      {
        $set: donorUpdate,
        $setOnInsert: { status: "Active" },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      account: serializeAccount(user),
      donor,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

// GET ONE DONOR
const getOneDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    res.status(200).json(donor);
  } catch (error) {
    res.status(500).json(error);
  }
};

// DELETE DONOR

const deleteDonor = async (req, res) => {
  try {
    await Donor.findByIdAndDelete(req.params.id);
    res.status(201).json("Donor deleted successfully");
  } catch (error) {
    res.status(500).json(error);
  }
};

// STATS
const getDonorsStats = async (req, res) => {
  try {
    const stats = await Donor.aggregate([
      {
        $group: {
          _id: "$bloodgroup",
          count: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json(error);
  }
};

const recordDonation = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json("Donor not found");

    const donationDate = req.body?.date || new Date().toISOString().slice(0, 10);
    const nextEligible = computeNextEligible(donationDate);
    const donationHistory = sortDonationHistory([
      {
        date: donationDate,
        location: req.body?.location || donor.city || "",
        status: "Completed",
      },
      ...buildDonationHistory(donor).filter((entry) => entry.date !== donationDate),
    ]);

    const updated = await Donor.findByIdAndUpdate(
      req.params.id,
      { $set: { lastDonation: donationDate, nextEligible, donationHistory } },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  deleteDonor,
  getOneDonor,
  getAlldonors,
  getCurrentDonorProfile,
  getDonorsStats,
  updateDonor,
  updateCurrentDonorProfile,
  createDonor,
  recordDonation,
};
