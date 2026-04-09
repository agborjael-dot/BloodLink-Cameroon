import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HospitalAvailabilityMap from "../components/HospitalAvailabilityMap.jsx";
import { clearStoredSession } from "../utils/auth.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const EMPTY_PROFILE = {
  name: "",
  email: "",
  bloodgroup: "",
  tel: "",
  city: "",
  address: "",
  status: "Active",
  joined: "",
  lastDonation: "",
  nextEligible: "",
  donationHistory: [],
};

const formatDate = (value, fallback = "Not recorded") => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const isEligibleNow = (nextEligible) => {
  if (!nextEligible) return true;
  const parsed = new Date(nextEligible);
  if (Number.isNaN(parsed.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed <= today;
};

const Field = ({ label, value, valueClassName = "font-medium text-gray-900" }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className={valueClassName}>{value || "Not provided"}</p>
  </div>
);

function EligibilityStatus({ lastDonation, nextEligible }) {
  const canDonate = isEligibleNow(nextEligible);

  return (
    <div className="rounded-2xl bg-white shadow-md">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Eligibility Status</h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              canDonate ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}
          >
            {canDonate ? "Can Donate Now" : "Not Eligible"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Field label="Last Donation" value={formatDate(lastDonation)} />
          <Field
            label="Next Eligible Date"
            value={canDonate ? "Available Now" : formatDate(nextEligible)}
          />
        </div>
      </div>
    </div>
  );
}

function DonationHistory({ items, lastDonation }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <p className="text-sm text-gray-500">Total Donations</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">{items.length}</h2>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">
          <p className="text-sm text-gray-500">Last Donation</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            {formatDate(lastDonation)}
          </h2>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Donation History</h2>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No donation history has been recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={`${item.date}-${index}`}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{formatDate(item.date)}</p>
                  <p className="text-sm text-gray-500">
                    {item.location || "Location not recorded"}
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  {item.status || "Recorded"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NearbyOpportunities({ hospitals, drives, requests, bloodgroup, city, loading }) {
  const cityKey = (city || "").trim().toLowerCase();

  const pickNearby = useCallback(
    (items, getText) => {
      if (!cityKey) return items;
      const matched = items.filter((item) => getText(item).includes(cityKey));
      return matched.length > 0 ? matched : items;
    },
    [cityKey]
  );

  const nearbyHospitals = useMemo(() => {
    const base = pickNearby(hospitals, (hospital) => (hospital.location || "").toLowerCase());
    return base
      .map((hospital) => {
        const matchingInventory = (hospital.inventory || []).filter(
          (item) => !bloodgroup || item.group === bloodgroup
        );
        const matchingUnits = matchingInventory.reduce(
          (sum, item) => sum + Number(item.units || 0),
          0
        );
        return {
          id: hospital._id || hospital.name,
          name: hospital.name,
          location: hospital.location,
          distanceKm: hospital.distanceKm,
          matchingUnits,
        };
      })
      .sort((left, right) => Number(left.distanceKm || 999) - Number(right.distanceKm || 999))
      .slice(0, 3);
  }, [bloodgroup, hospitals, pickNearby]);

  const mappedHospitals = useMemo(() => {
    return [...hospitals]
      .map((hospital) => {
        const matchingUnits = (hospital.inventory || []).reduce((sum, item) => {
          if (bloodgroup && item.group !== bloodgroup) {
            return sum;
          }
          return sum + Number(item.units || 0);
        }, 0);

        return {
          ...hospital,
          matchingUnits,
        };
      })
      .sort((left, right) => Number(left.distanceKm || 999) - Number(right.distanceKm || 999));
  }, [bloodgroup, hospitals]);

  const upcomingDrives = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = pickNearby(
      drives.filter((drive) => {
        if (!drive.date) return true;
        const parsed = new Date(drive.date);
        if (Number.isNaN(parsed.getTime())) return true;
        parsed.setHours(0, 0, 0, 0);
        return parsed >= today;
      }),
      (drive) => (drive.location || "").toLowerCase()
    );

    return filtered
      .sort((left, right) => {
        const leftTime = Date.parse(left.date || "");
        const rightTime = Date.parse(right.date || "");
        if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
        if (Number.isNaN(leftTime)) return 1;
        if (Number.isNaN(rightTime)) return -1;
        return leftTime - rightTime;
      })
      .slice(0, 3);
  }, [drives, pickNearby]);

  const urgentRequests = useMemo(() => {
    const urgencyRank = { critical: 0, urgent: 1, normal: 2 };
    const filtered = pickNearby(
      requests.filter((request) => !bloodgroup || request.bloodGroup === bloodgroup),
      (request) => `${request.location || ""} ${request.hospitalName || ""}`.toLowerCase()
    );

    return filtered
      .sort((left, right) => {
        const leftRank = urgencyRank[(left.urgency || "normal").toLowerCase()] ?? 3;
        const rightRank = urgencyRank[(right.urgency || "normal").toLowerCase()] ?? 3;
        if (leftRank !== rightRank) return leftRank - rightRank;
        const leftTime = Date.parse(left.createdAt || "");
        const rightTime = Date.parse(right.createdAt || "");
        if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
        if (Number.isNaN(leftTime)) return 1;
        if (Number.isNaN(rightTime)) return -1;
        return rightTime - leftTime;
      })
      .slice(0, 3);
  }, [bloodgroup, pickNearby, requests]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Nearby Opportunities</h2>
            <p className="text-sm text-gray-500">
              Live hospitals, drives, and requests near {city || "your area"}.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading nearby opportunities...</p>
        ) : (
          <div className="space-y-6">
            <HospitalAvailabilityMap
              hospitals={mappedHospitals}
              bloodGroup={bloodgroup}
              emptyMessage="Hospital locations will appear here once coordinates are available."
              height={320}
            />

            <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Nearby Hospitals
              </h3>
              {nearbyHospitals.length === 0 ? (
                <p className="text-sm text-gray-500">No hospitals available right now.</p>
              ) : (
                <div className="space-y-3">
                  {nearbyHospitals.map((hospital) => (
                    <div key={hospital.id} className="rounded-xl border border-gray-100 p-4">
                      <p className="font-medium text-gray-900">{hospital.name}</p>
                      <p className="text-sm text-gray-500">
                        {hospital.location || "Location unavailable"}
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        {hospital.distanceKm ? `${hospital.distanceKm} km away` : "Distance unavailable"}
                      </p>
                      <p className="text-sm text-red-600">
                        {bloodgroup
                          ? `${hospital.matchingUnits} unit(s) of ${bloodgroup} available`
                          : `${hospital.matchingUnits} matching unit(s) available`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Upcoming Drives
              </h3>
              {upcomingDrives.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming drives found nearby.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDrives.map((drive) => (
                    <div key={drive._id || drive.title} className="rounded-xl border border-gray-100 p-4">
                      <p className="font-medium text-gray-900">{drive.title}</p>
                      <p className="text-sm text-gray-500">{drive.location || "Location TBA"}</p>
                      <p className="mt-2 text-sm text-gray-600">{formatDate(drive.date)}</p>
                      <p className="text-sm text-red-600">
                        Target: {drive.targetUnits || 0} units
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Urgent Requests
              </h3>
              {urgentRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No urgent public requests found.</p>
              ) : (
                <div className="space-y-3">
                  {urgentRequests.map((request) => (
                    <div
                      key={request._id || `${request.bloodGroup}-${request.createdAt}`}
                      className="rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-gray-900">{request.bloodGroup}</p>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            (request.urgency || "").toLowerCase() === "critical"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {request.urgency || "urgent"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {request.location || request.hospitalName || "Location unavailable"}
                      </p>
                      <p className="text-sm text-gray-600">{request.units || 0} unit(s) requested</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Donor() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [hospitals, setHospitals] = useState([]);
  const [drives, setDrives] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opportunityLoading, setOpportunityLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let ignore = false;

    const loadDashboard = async () => {
      setLoading(true);
      setOpportunityLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/api/v1/donors/me`, {
          headers: { token: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load donor profile");
        }

        const data = await res.json();
        if (ignore) return;

        const donor = data?.donor || {};
        const account = data?.account || {};

        setProfile({
          name: donor.name || account.name || "",
          email: account.email || donor.email || "",
          bloodgroup: donor.bloodgroup || "",
          tel: donor.tel || "",
          city: donor.city || "",
          address: donor.address || "",
          status: donor.status || "Active",
          joined: donor.joined || "",
          lastDonation: donor.lastDonation || "",
          nextEligible: donor.nextEligible || "",
          donationHistory: Array.isArray(donor.donationHistory) ? donor.donationHistory : [],
        });
      } catch {
        if (!ignore) {
          setError("Unable to load your donor data right now.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }

      try {
        const [hospitalsRes, drivesRes, requestsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/hospitals/availability`),
          fetch(`${API_URL}/api/v1/drives/public`),
          fetch(`${API_URL}/api/v1/blood-requests/public?limit=12`),
        ]);

        if (ignore) return;

        const hospitalsData = hospitalsRes.ok ? await hospitalsRes.json() : [];
        const drivesData = drivesRes.ok ? await drivesRes.json() : [];
        const requestsData = requestsRes.ok ? await requestsRes.json() : [];

        setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
        setDrives(Array.isArray(drivesData) ? drivesData : []);
        setRequests(Array.isArray(requestsData) ? requestsData : []);
      } catch {
        if (!ignore) {
          setHospitals([]);
          setDrives([]);
          setRequests([]);
        }
      } finally {
        if (!ignore) {
          setOpportunityLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [navigate, token]);

  const historyItems = useMemo(() => {
    if (profile.donationHistory.length > 0) {
      return profile.donationHistory;
    }

    if (profile.lastDonation) {
      return [
        {
          date: profile.lastDonation,
          location: profile.city || "",
          status: "Recorded",
        },
      ];
    }

    return [];
  }, [profile.city, profile.donationHistory, profile.lastDonation]);

  const handleLogout = () => {
    clearStoredSession();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">
          Loading donor data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Donor Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              View your donor profile, eligibility, donation records, and nearby opportunities.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white shadow-md">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-xl font-semibold text-red-600">
                {(profile.name || "D").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.name || "Donor"}
                </h2>
                <p className="text-sm text-gray-500">{profile.email || "No email available"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Field label="Blood Group" value={profile.bloodgroup} />
              <Field label="Phone" value={profile.tel} />
              <Field label="City" value={profile.city} />
              <Field
                label="Status"
                value={profile.status}
                valueClassName="font-medium text-green-600"
              />
              <Field label="Address" value={profile.address} />
              <Field label="Joined" value={formatDate(profile.joined)} />
            </div>
          </div>
        </div>

        <EligibilityStatus
          lastDonation={profile.lastDonation}
          nextEligible={profile.nextEligible}
        />
        <DonationHistory items={historyItems} lastDonation={profile.lastDonation} />
        <NearbyOpportunities
          hospitals={hospitals}
          drives={drives}
          requests={requests}
          bloodgroup={profile.bloodgroup}
          city={profile.city}
          loading={opportunityLoading}
        />
      </div>
    </div>
  );
}
