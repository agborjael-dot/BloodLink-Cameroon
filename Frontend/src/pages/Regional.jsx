import { useLanguage } from "../i18n.jsx";

import { useEffect, useMemo, useState } from "react";

const Regional = () => {
  const { t } = useLanguage();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => (token ? { token: `Bearer ${token}` } : {}), [token]);
  const [hospitals, setHospitals] = useState([]);
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [driveForm, setDriveForm] = useState({
    title: "",
    location: "",
    date: "",
    targetUnits: "",
    status: "upcoming",
    notes: "",
  });
  const [driveState, setDriveState] = useState({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [availabilityRes, donorsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/hospitals/availability`),
          fetch(`${API_URL}/api/v1/donors`, { headers: authHeader }),
        ]);
        if (availabilityRes.ok) {
          const availabilityData = await availabilityRes.json();
          setHospitals(Array.isArray(availabilityData) ? availabilityData : []);
        } else {
          setHospitals([]);
        }
        if (donorsRes.ok) {
          const donorData = await donorsRes.json();
          setDonors(Array.isArray(donorData) ? donorData : []);
        } else {
          setDonors([]);
        }
      } catch (err) {
        setHospitals([]);
        setDonors([]);
      }

      if (!token) {
        setRequests([]);
        setTransfers([]);
        setDrives([]);
        setLoading(false);
        return;
      }

      try {
        const [requestsRes, transfersRes, drivesRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/blood-requests`, { headers: authHeader }),
          fetch(`${API_URL}/api/v1/transfers`, { headers: authHeader }),
          fetch(`${API_URL}/api/v1/drives`, { headers: authHeader }),
        ]);
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setRequests(Array.isArray(requestsData) ? requestsData : []);
        } else {
          setRequests([]);
        }
        if (transfersRes.ok) {
          const transfersData = await transfersRes.json();
          setTransfers(Array.isArray(transfersData) ? transfersData : []);
        } else {
          setTransfers([]);
        }
        if (drivesRes.ok) {
          const drivesData = await drivesRes.json();
          setDrives(Array.isArray(drivesData) ? drivesData : []);
        } else {
          setDrives([]);
        }
      } catch (err) {
        setError(t("regional.loadError"));
        setRequests([]);
        setTransfers([]);
        setDrives([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL, authHeader, t, token]);

  const totalUnits = useMemo(() => {
    return hospitals.reduce((sum, hospital) => {
      const units = (hospital.inventory || []).reduce(
        (acc, item) => acc + Number(item.units || 0),
        0
      );
      return sum + units;
    }, 0);
  }, [hospitals]);

  const pendingRequestedUnits = useMemo(() => {
    return requests
      .filter((request) => request.status === "pending")
      .reduce((sum, request) => sum + Number(request.units || 0), 0);
  }, [requests]);

  const daysCover =
    pendingRequestedUnits > 0
      ? (totalUnits / pendingRequestedUnits).toFixed(1)
      : "--";

  const redZoneCount = useMemo(() => {
    return hospitals.filter((hospital) =>
      (hospital.inventory || []).some((item) => Number(item.units || 0) <= 2)
    ).length;
  }, [hospitals]);

  const expiringUnits = useMemo(() => {
    return hospitals.reduce((sum, hospital) => {
      const lowUnits = (hospital.inventory || [])
        .filter((item) => Number(item.units || 0) <= 2)
        .reduce((acc, item) => acc + Number(item.units || 0), 0);
      return sum + lowUnits;
    }, 0);
  }, [hospitals]);

  const donorsByCity = useMemo(() => {
    return donors.reduce((acc, donor) => {
      const key = (donor.city || "").trim().toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [donors]);

  const performanceRows = useMemo(() => {
    const avgDonors = hospitals.length ? donors.length / hospitals.length : 0;
    return hospitals.slice(0, 3).map((hospital) => {
      const locationKey = (hospital.location || "").trim().toLowerCase();
      const donorCount = donorsByCity[locationKey] || 0;
      const delta = avgDonors
        ? Math.round(((donorCount - avgDonors) / avgDonors) * 100)
        : 0;
      const recruitment = avgDonors ? `${delta >= 0 ? "+" : ""}${delta}%` : "--";
      const inboundTransfers = transfers.filter(
        (transfer) => transfer.toHospital === hospital.name
      ).length;
      const relianceRatio = transfers.length
        ? inboundTransfers / transfers.length
        : 0;
      const reliance =
        relianceRatio > 0.66 ? "high" : relianceRatio > 0.33 ? "medium" : "low";
      const status =
        delta >= 10 ? "high" : delta >= 0 ? "medium" : "low";
      return {
        name: hospital.name,
        recruitment,
        reliance,
        status,
      };
    });
  }, [donors.length, donorsByCity, hospitals, transfers]);

  const overviewItems = useMemo(() => {
    return hospitals.slice(0, 3).map((hospital) => {
      const total = (hospital.inventory || []).reduce(
        (sum, item) => sum + Number(item.units || 0),
        0
      );
      const groups = Array.from(
        new Set((hospital.inventory || []).map((item) => item.group))
      )
        .filter(Boolean)
        .slice(0, 2)
        .join(", ");
      return {
        name: hospital.location || hospital.name,
        groups,
        total,
        status: total >= 8 ? "stable" : "low",
      };
    });
  }, [hospitals]);

  const disputeItems = useMemo(() => {
    return transfers.slice(0, 3).map((transfer) => {
      const statusRaw = (transfer.status || "pending").toLowerCase();
      const status =
        statusRaw.includes("received")
          ? "resolved"
          : statusRaw.includes("transit")
            ? "inReview"
            : "open";
      return {
        id: transfer._id,
        summary: `${transfer.fromHospital} ↔ ${transfer.toHospital} • ${transfer.units} units ${transfer.bloodGroup}`,
        status,
      };
    });
  }, [transfers]);

  const driveItems = useMemo(() => {
    return drives.slice(0, 3).map((drive) => ({
      id: drive._id,
      title: drive.title,
      status: drive.status || "upcoming",
      date: drive.date,
      targetUnits: drive.targetUnits,
      collectedUnits: drive.collectedUnits,
      location: drive.location,
    }));
  }, [drives]);

  const handleCreateDrive = async (event) => {
    event.preventDefault();
    setDriveState({ loading: false, error: "", success: "" });
    if (!token) {
      setDriveState({ loading: false, error: t("regional.authRequired"), success: "" });
      return;
    }
    if (!driveForm.title || !driveForm.date || !driveForm.targetUnits) {
      setDriveState({ loading: false, error: t("regional.drives.validationRequired"), success: "" });
      return;
    }
    try {
      setDriveState({ loading: true, error: "", success: "" });
      const res = await fetch(`${API_URL}/api/v1/drives`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          ...driveForm,
          targetUnits: Number(driveForm.targetUnits),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      setDrives((prev) => [saved, ...prev]);
      setDriveState({ loading: false, error: "", success: t("regional.drives.success") });
      setShowDriveForm(false);
      setDriveForm({
        title: "",
        location: "",
        date: "",
        targetUnits: "",
        status: "upcoming",
        notes: "",
      });
    } catch (err) {
      setDriveState({ loading: false, error: t("regional.drives.error"), success: "" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[20px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-800">
            {t("regional.title")}
          </h1>
          <p className="text-[13px] text-gray-500">{t("regional.subtitle")}</p>
        </div>
        <button
          className="bg-red-600 text-white text-[13px] font-semibold px-[14px] py-[8px] rounded-md shadow-sm hover:bg-red-700 transition"
          onClick={() => setShowDriveForm(true)}
        >
          {t("regional.actions.newDrive")}
        </button>
      </div>
      {error && (
        <div className="mt-[10px] bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-[16px] mt-[20px]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("regional.kpi.daysCover")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">
            {loading ? "--" : daysCover}
          </h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("regional.kpi.totalUnits")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">
            {loading ? "--" : totalUnits.toLocaleString()}
          </h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("regional.kpi.redZone")}</p>
          <h3 className="text-[26px] font-bold text-red-600">
            {loading ? "--" : redZoneCount}
          </h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("regional.kpi.expiring")}</p>
          <h3 className="text-[26px] font-bold text-yellow-600">
            {loading ? "--" : expiringUnits}
          </h3>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px] mb-[12px]">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-800">
              {t("regional.section.overview")}
            </h2>
            <p className="text-[12px] text-gray-500">
              {t("regional.section.overviewSubtitle")}
            </p>
          </div>
          <span className="text-[12px] text-gray-500">{t("regional.section.mapHint")}</span>
        </div>
        <div className="grid gap-[16px] lg:grid-cols-[2fr_1fr]">
          <div className="h-[240px] rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center text-[12px] text-gray-500">
            {t("regional.section.mapPlaceholder")}
          </div>
          <div className="space-y-[10px] text-[13px] text-gray-700">
            {loading && (
              <div className="text-[12px] text-gray-500">{t("regional.loading")}</div>
            )}
            {!loading && overviewItems.length === 0 && (
              <div className="text-[12px] text-gray-500">{t("regional.empty")}</div>
            )}
            {!loading &&
              overviewItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between border border-gray-200 rounded-md px-[10px] py-[8px]"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[12px] text-gray-500">
                      {item.groups || t("regional.overview.noGroups")} â€¢ {item.total} units
                    </p>
                  </div>
                  <span
                    className={`text-[12px] px-[8px] py-[4px] rounded-full ${
                      item.status === "stable"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status === "stable"
                      ? t("regional.overview.statusStable")
                      : t("regional.overview.statusLow")}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
          {t("regional.section.performance")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
              <tr>
                <th className="py-[6px]">{t("regional.table.hospital")}</th>
                <th className="py-[6px]">{t("regional.table.recruitment")}</th>
                <th className="py-[6px]">{t("regional.table.h2hReliance")}</th>
                <th className="py-[6px]">{t("regional.table.status")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading && (
                <tr>
                  <td className="py-[10px] text-[12px] text-gray-500" colSpan={4}>
                    {t("regional.loading")}
                  </td>
                </tr>
              )}
              {!loading && performanceRows.length === 0 && (
                <tr>
                  <td className="py-[10px] text-[12px] text-gray-500" colSpan={4}>
                    {t("regional.empty")}
                  </td>
                </tr>
              )}
              {!loading &&
                performanceRows.map((row) => {
                  const statusColor =
                    row.status === "high"
                      ? "text-green-600"
                      : row.status === "medium"
                        ? "text-yellow-600"
                        : "text-red-600";
                  const statusLabel =
                    row.status === "high"
                      ? t("regional.performance.high")
                      : row.status === "medium"
                        ? t("regional.performance.medium")
                        : t("regional.performance.low");
                  const relianceLabel =
                    row.reliance === "high"
                      ? t("regional.performance.high")
                      : row.reliance === "medium"
                        ? t("regional.performance.medium")
                        : t("regional.performance.low");
                  return (
                    <tr key={row.name} className="border-b hover:bg-gray-50">
                      <td className="py-[6px]">{row.name}</td>
                      <td className="py-[6px]">{row.recruitment}</td>
                      <td className="py-[6px]">{relianceLabel}</td>
                      <td className={`py-[6px] ${statusColor}`}>{statusLabel}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-[20px] mt-[20px] lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
          <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
            {t("regional.section.disputes")}
          </h2>
          <ul className="space-y-[10px] text-[13px] text-gray-700">
            {loading && (
              <li className="text-[12px] text-gray-500">{t("regional.loading")}</li>
            )}
            {!loading && disputeItems.length === 0 && (
              <li className="text-[12px] text-gray-500">{t("regional.disputes.empty")}</li>
            )}
            {!loading &&
              disputeItems.map((item) => {
                const badgeColor =
                  item.status === "resolved"
                    ? "bg-green-100 text-green-700"
                    : item.status === "inReview"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700";
                const statusLabel =
                  item.status === "resolved"
                    ? t("regional.disputes.resolved")
                    : item.status === "inReview"
                      ? t("regional.disputes.inReview")
                      : t("regional.disputes.open");
                return (
                  <li
                    key={item.id}
                    className="border border-gray-200 rounded-md px-[10px] py-[8px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {t("regional.disputes.transferLabel", { id: item.id?.slice(-4) || "----" })}
                      </span>
                      <span className={`text-[12px] px-[8px] py-[4px] rounded-full ${badgeColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500">{item.summary}</p>
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
          <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
            {t("regional.section.drives")}
          </h2>
          <ul className="space-y-[10px] text-[13px] text-gray-700">
            {loading && (
              <li className="text-[12px] text-gray-500">{t("regional.loading")}</li>
            )}
            {!loading && driveItems.length === 0 && (
              <li className="text-[12px] text-gray-500">{t("regional.drives.empty")}</li>
            )}
            {!loading &&
              driveItems.map((drive) => {
                const statusLabel =
                  drive.status === "completed"
                    ? t("regional.drives.completed")
                    : drive.status === "scheduled"
                      ? t("regional.drives.scheduled")
                      : t("regional.drives.upcoming");
                const badgeColor =
                  drive.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700";
                return (
                  <li
                    key={drive.id}
                    className="border border-gray-200 rounded-md px-[10px] py-[8px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{drive.title}</span>
                      <span className={`text-[12px] px-[8px] py-[4px] rounded-full ${badgeColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500">
                      {drive.date || t("regional.drives.dateTbd")} â€¢ {t("regional.drives.targetLabel")}{" "}
                      {drive.targetUnits}
                      {drive.status === "completed" && drive.collectedUnits
                        ? ` â€¢ ${drive.collectedUnits} ${t("regional.drives.collectedLabel")}`
                        : ""}
                    </p>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {showDriveForm && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowDriveForm(false)}
          />
          <div className="absolute inset-x-0 top-[10%] mx-auto w-[90%] max-w-[520px] bg-white rounded-lg shadow-xl p-[16px] z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-gray-800">
                {t("regional.drives.form.title")}
              </h3>
              <button
                className="text-[12px] text-gray-500 underline"
                onClick={() => setShowDriveForm(false)}
              >
                {t("common.close")}
              </button>
            </div>

            <form className="mt-[12px] grid grid-cols-1 gap-[10px]" onSubmit={handleCreateDrive}>
              {driveState.error && (
                <div className="bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {driveState.error}
                </div>
              )}
              {driveState.success && (
                <div className="bg-green-50 text-green-700 border border-green-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {driveState.success}
                </div>
              )}
              <input
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("regional.drives.form.titlePlaceholder")}
                value={driveForm.title}
                onChange={(e) => setDriveForm({ ...driveForm, title: e.target.value })}
              />
              <input
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("regional.drives.form.locationPlaceholder")}
                value={driveForm.location}
                onChange={(e) => setDriveForm({ ...driveForm, location: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[12px] text-gray-500">{t("regional.drives.form.date")}</label>
                  <input
                    type="date"
                    className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] w-full"
                    value={driveForm.date}
                    onChange={(e) => setDriveForm({ ...driveForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[12px] text-gray-500">{t("regional.drives.form.target")}</label>
                  <input
                    type="number"
                    className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] w-full"
                    value={driveForm.targetUnits}
                    onChange={(e) => setDriveForm({ ...driveForm, targetUnits: e.target.value })}
                  />
                </div>
              </div>
              <select
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                value={driveForm.status}
                onChange={(e) => setDriveForm({ ...driveForm, status: e.target.value })}
              >
                <option value="upcoming">{t("regional.drives.upcoming")}</option>
                <option value="scheduled">{t("regional.drives.scheduled")}</option>
                <option value="completed">{t("regional.drives.completed")}</option>
              </select>
              <textarea
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("regional.drives.form.notesPlaceholder")}
                rows={3}
                value={driveForm.notes}
                onChange={(e) => setDriveForm({ ...driveForm, notes: e.target.value })}
              />
              <button
                type="submit"
                disabled={driveState.loading}
                className="bg-red-600 text-white px-[12px] py-[8px] rounded-md text-[13px] font-semibold w-full sm:w-auto disabled:opacity-60"
              >
                {driveState.loading ? t("regional.drives.form.creating") : t("regional.drives.form.create")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Regional;

