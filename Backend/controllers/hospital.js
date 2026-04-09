const Hospital = require("../models/Hospital");

const DEFAULT_HOSPITALS = [
  {
    name: "Central Hospital",
    region: "Centre",
    location: "Yaounde",
    lat: 3.848,
    lng: 11.5021,
    distanceKm: 4,
    inventory: [
      { group: "O+", component: "whole", units: 6 },
      { group: "A-", component: "plasma", units: 2 },
    ],
  },
  {
    name: "Douala General Hospital",
    region: "Littoral",
    location: "Douala",
    lat: 4.0511,
    lng: 9.7679,
    distanceKm: 8,
    inventory: [
      { group: "A+", component: "whole", units: 7 },
      { group: "O-", component: "prbc", units: 3 },
    ],
  },
  {
    name: "Regional Hospital - Buea",
    region: "South-West",
    location: "Buea",
    lat: 4.156,
    lng: 9.2423,
    distanceKm: 18,
    inventory: [
      { group: "O-", component: "whole", units: 3 },
      { group: "AB+", component: "platelets", units: 4 },
    ],
  },
  {
    name: "Bamenda Regional Hospital",
    region: "North-West",
    location: "Bamenda",
    lat: 5.9631,
    lng: 10.1591,
    distanceKm: 14,
    inventory: [
      { group: "AB+", component: "platelets", units: 4 },
      { group: "O+", component: "whole", units: 5 },
    ],
  },
  {
    name: "Bafoussam Regional Hospital",
    region: "West",
    location: "Bafoussam",
    lat: 5.4781,
    lng: 10.417,
    distanceKm: 12,
    inventory: [
      { group: "B+", component: "whole", units: 5 },
      { group: "A-", component: "plasma", units: 3 },
    ],
  },
  {
    name: "Ebolowa Regional Hospital",
    region: "South",
    location: "Ebolowa",
    lat: 2.9167,
    lng: 11.15,
    distanceKm: 19,
    inventory: [
      { group: "O+", component: "whole", units: 4 },
      { group: "AB-", component: "plasma", units: 2 },
    ],
  },
  {
    name: "Bertoua Regional Hospital",
    region: "East",
    location: "Bertoua",
    lat: 4.5773,
    lng: 13.6846,
    distanceKm: 26,
    inventory: [
      { group: "A+", component: "whole", units: 6 },
      { group: "B-", component: "prbc", units: 2 },
    ],
  },
  {
    name: "Ngaoundere Regional Hospital",
    region: "Adamawa",
    location: "Ngaoundere",
    lat: 7.3277,
    lng: 13.5847,
    distanceKm: 31,
    inventory: [
      { group: "O-", component: "whole", units: 4 },
      { group: "A+", component: "platelets", units: 2 },
    ],
  },
  {
    name: "Garoua Regional Hospital",
    region: "North",
    location: "Garoua",
    lat: 9.3265,
    lng: 13.3947,
    distanceKm: 36,
    inventory: [
      { group: "B+", component: "whole", units: 5 },
      { group: "O+", component: "prbc", units: 3 },
    ],
  },
  {
    name: "Maroua Regional Hospital",
    region: "Far North",
    location: "Maroua",
    lat: 10.591,
    lng: 14.3159,
    distanceKm: 42,
    inventory: [
      { group: "O+", component: "whole", units: 7 },
      { group: "A-", component: "plasma", units: 2 },
    ],
  },
];

const seedHospitals = async () => {
  const count = await Hospital.countDocuments();
  if (count === 0) {
    await Hospital.insertMany(DEFAULT_HOSPITALS);
    return;
  }

  await Promise.all(
    DEFAULT_HOSPITALS.map((hospital) =>
      Hospital.updateOne(
        { name: hospital.name },
        {
          $set: {
            region: hospital.region,
            location: hospital.location,
            lat: hospital.lat,
            lng: hospital.lng,
            distanceKm: hospital.distanceKm,
          },
          $setOnInsert: {
            inventory: hospital.inventory,
          },
        },
        { upsert: true }
      )
    )
  );
};

const getHospitalAvailability = async (req, res) => {
  try {
    await seedHospitals();
    const { q, bloodGroup, component, distance } = req.query;
    let hospitals = await Hospital.find().lean();

    if (q) {
      const query = q.toLowerCase();
      hospitals = hospitals.filter((hospital) =>
        hospital.name.toLowerCase().includes(query)
      );
    }

    if (distance) {
      const maxDistance = Number(distance);
      if (!Number.isNaN(maxDistance)) {
        hospitals = hospitals.filter(
          (hospital) => hospital.distanceKm <= maxDistance
        );
      }
    }

    if (bloodGroup || component) {
      hospitals = hospitals.filter((hospital) => {
        return hospital.inventory.some((item) => {
          const groupMatch = !bloodGroup || item.group === bloodGroup;
          const componentMatch = !component || item.component === component;
          return groupMatch && componentMatch;
        });
      });
    }

    res.status(200).json(hospitals);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateHospitalInventory = async (req, res) => {
  try {
    const { group, component, units } = req.body || {};
    if (!group || !component || units === undefined) {
      return res.status(400).json("Missing required fields");
    }
    const unitValue = Number(units);
    if (Number.isNaN(unitValue)) {
      return res.status(400).json("Units must be a number");
    }
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json("Hospital not found");
    }

    const index = hospital.inventory.findIndex(
      (item) => item.group === group && item.component === component
    );
    if (index >= 0) {
      hospital.inventory[index].units = unitValue;
    } else {
      hospital.inventory.push({ group, component, units: unitValue });
    }

    const saved = await hospital.save();
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json(error);
  }
};

const createHospital = async (req, res) => {
  try {
    const hospital = new Hospital(req.body);
    const saved = await hospital.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = { getHospitalAvailability, createHospital, updateHospitalInventory };
