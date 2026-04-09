import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n.jsx";
import HospitalAvailabilityMap from "../components/HospitalAvailabilityMap.jsx";

const Hospital = () => {
  const { t } = useLanguage();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => (token ? { token: `Bearer ${token}` } : {}), [token]);
  const [requests, setRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromHospital: "",
    toHospital: "",
    bloodGroup: "O+",
    units: "1",
    eta: "",
    notes: "",
  });
  const [transferState, setTransferState] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const [showStockForm, setShowStockForm] = useState(false);
  const [stockForm, setStockForm] = useState({
    hospitalId: "",
    group: "O+",
    component: "whole",
    units: "",
  });
  const [stockState, setStockState] = useState({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const availabilityRes = await fetch(`${API_URL}/api/v1/hospitals/availability`);
        const availabilityData = await availabilityRes.json();
        if (Array.isArray(availabilityData)) {
          setHospitals(availabilityData);
        } else {
          setHospitals([]);
        }
      } catch (err) {
        setHospitals([]);
      }

      if (!token) {
        setRequests([]);
        setTransfers([]);
        setLoading(false);
        return;
      }

      try {
        const [requestsRes, transfersRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/blood-requests`, { headers: authHeader }),
          fetch(`${API_URL}/api/v1/transfers`, { headers: authHeader }),
        ]);
        if (requestsRes.ok) {
          const requestData = await requestsRes.json();
          setRequests(Array.isArray(requestData) ? requestData : []);
        } else {
          setRequests([]);
        }
        if (transfersRes.ok) {
          const transferData = await transfersRes.json();
          setTransfers(Array.isArray(transferData) ? transferData : []);
        } else {
          setTransfers([]);
        }
      } catch (err) {
        setError(t("hospital.loadError"));
        setRequests([]);
        setTransfers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL, authHeader, t, token]);

  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const fulfilledRequests = requests.filter((r) =>
    ["approved", "received"].includes(r.status)
  ).length;
  const criticalRequests = requests.filter(
    (r) => r.urgency === "urgent" && r.status === "pending"
  ).length;

  const nearbyHospitals = useMemo(() => {
    return [...hospitals]
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
      .slice(0, 3);
  }, [hospitals]);

  const lowStockItems = useMemo(() => {
    const items = [];
    hospitals.forEach((hospital) => {
      (hospital.inventory || []).forEach((item) => {
        if (item.units <= 2) {
          items.push({ ...item, hospital: hospital.name });
        }
      });
    });
    return items;
  }, [hospitals]);

  const stockGroups = useMemo(() => {
    const grouped = {};
    hospitals.forEach((hospital) => {
      (hospital.inventory || []).forEach((item) => {
        if (!item.group) return;
        grouped[item.group] = (grouped[item.group] || 0) + Number(item.units || 0);
      });
    });
    return Object.entries(grouped)
      .map(([group, units]) => ({ group, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 3);
  }, [hospitals]);

  const recentActivity = useMemo(() => {
    const events = [];
    requests.forEach((req) => {
      events.push({
        id: req._id,
        createdAt: req.createdAt || req.date,
        label: t("hospital.recent.request", {
          bloodGroup: req.bloodGroup || "--",
          units: req.units || 0,
        }),
      });
    });
    transfers.forEach((transfer) => {
      events.push({
        id: transfer._id,
        createdAt: transfer.createdAt,
        label: t("hospital.recent.transfer", {
          bloodGroup: transfer.bloodGroup || "--",
          units: transfer.units || 0,
        }),
      });
    });
    return events
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);
  }, [requests, t, transfers]);

  const openTransferForm = () => {
    const hospitalNames = hospitals.map((hospital) => hospital.name).filter(Boolean);
    setTransferForm((prev) => ({
      ...prev,
      fromHospital: prev.fromHospital || hospitalNames[0] || "",
      toHospital: prev.toHospital || hospitalNames[1] || "",
    }));
    setShowTransferForm(true);
  };

  const openStockForm = () => {
    const firstHospital = hospitals[0];
    setStockForm((prev) => ({
      ...prev,
      hospitalId: prev.hospitalId || firstHospital?._id || "",
    }));
    setShowStockForm(true);
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const getTransferStatus = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("transit")) {
      return { label: t("status.inTransit"), cls: "text-blue-600" };
    }
    if (normalized.includes("received")) {
      return { label: t("status.received"), cls: "text-green-600" };
    }
    if (normalized.includes("approved")) {
      return { label: t("status.approved"), cls: "text-green-600" };
    }
    return { label: t("status.pending"), cls: "text-yellow-600" };
  };

  const getRequestStatus = (request) => {
    if (request.urgency === "urgent" && request.status === "pending") {
      return { label: t("status.urgent"), cls: "text-red-600" };
    }
    if (request.status === "approved") {
      return { label: t("status.approved"), cls: "text-green-600" };
    }
    if (request.status === "received") {
      return { label: t("status.received"), cls: "text-green-600" };
    }
    if (request.status === "rejected") {
      return { label: t("status.rejected"), cls: "text-red-600" };
    }
    return { label: t("status.pending"), cls: "text-yellow-600" };
  };

  const handleCreateTransfer = async (event) => {
    event.preventDefault();
    setTransferState({ loading: false, error: "", success: "" });
    if (!token) {
      setTransferState({ loading: false, error: t("hospital.authRequired"), success: "" });
      return;
    }
    if (!transferForm.fromHospital || !transferForm.toHospital || !transferForm.bloodGroup || !transferForm.units) {
      setTransferState({ loading: false, error: t("hospital.transferForm.validationRequired"), success: "" });
      return;
    }
    try {
      setTransferState({ loading: true, error: "", success: "" });
      const res = await fetch(`${API_URL}/api/v1/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          ...transferForm,
          units: Number(transferForm.units),
          status: "pending",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      setTransfers((prev) => [saved, ...prev]);
      setTransferState({ loading: false, error: "", success: t("hospital.transferForm.success") });
      setShowTransferForm(false);
      setTransferForm({
        fromHospital: "",
        toHospital: "",
        bloodGroup: "O+",
        units: "1",
        eta: "",
        notes: "",
      });
    } catch (err) {
      setTransferState({ loading: false, error: t("hospital.transferForm.error"), success: "" });
    }
  };

  const handleUpdateStock = async (event) => {
    event.preventDefault();
    setStockState({ loading: false, error: "", success: "" });
    if (!token) {
      setStockState({ loading: false, error: t("hospital.authRequired"), success: "" });
      return;
    }
    if (!stockForm.hospitalId || !stockForm.group || !stockForm.component || stockForm.units === "") {
      setStockState({ loading: false, error: t("hospital.stockForm.validationRequired"), success: "" });
      return;
    }
    try {
      setStockState({ loading: true, error: "", success: "" });
      const res = await fetch(`${API_URL}/api/v1/hospitals/${stockForm.hospitalId}/inventory`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          group: stockForm.group,
          component: stockForm.component,
          units: Number(stockForm.units),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setHospitals((prev) =>
        prev.map((hospital) => (hospital._id === updated._id ? updated : hospital))
      );
      setStockState({ loading: false, error: "", success: t("hospital.stockForm.success") });
      setShowStockForm(false);
      setStockForm((prev) => ({ ...prev, units: "" }));
    } catch (err) {
      setStockState({ loading: false, error: t("hospital.stockForm.error"), success: "" });
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[20px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-800">
            {t("hospital.title")}
          </h1>
          <p className="text-[13px] text-gray-500">{t("hospital.subtitle")}</p>
        </div>
        <button
          className="bg-red-600 text-white text-[13px] font-semibold px-[14px] py-[8px] rounded-md shadow-sm hover:bg-red-700 transition"
          onClick={openTransferForm}
        >
          {t("hospital.actions.initiateTransfer")}
        </button>
      </div>
      {error && (
        <div className="mt-[10px] bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-[16px] mt-[20px]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("hospital.kpi.totalRequests")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">
            {loading ? "--" : totalRequests}
          </h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("hospital.kpi.pending")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">
            {loading ? "--" : pendingRequests}
          </h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("hospital.kpi.fulfilled")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">
            {loading ? "--" : fulfilledRequests}
          </h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("hospital.kpi.critical")}</p>
          <h3 className="text-[26px] font-bold text-red-600">
            {loading ? "--" : criticalRequests}
          </h3>
        </div>
      </div>

      <div className="mt-[20px] grid gap-[16px] md:grid-cols-2 xl:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
          <p className="text-[12px] uppercase tracking-wide text-red-600 font-semibold">
            {t("hospital.alerts.lowStockTitle")}
          </p>
          {loading && (
            <p className="text-[13px] text-gray-600 mt-[6px]">{t("hospital.loading")}</p>
          )}
          {!loading && lowStockItems.length === 0 && (
            <p className="text-[13px] text-gray-600 mt-[6px]">{t("hospital.alerts.lowStockNone")}</p>
          )}
          {!loading && lowStockItems.length > 0 && (
            <ul className="mt-[6px] text-[13px] text-gray-600 space-y-[4px]">
              {lowStockItems.slice(0, 3).map((item, idx) => (
                <li key={`${item.hospital}-${item.group}-${idx}`}>
                  {item.hospital}: {item.group} ({item.units})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
          <p className="text-[12px] uppercase tracking-wide text-yellow-600 font-semibold">
            {t("hospital.alerts.expiryTitle")}
          </p>
          <p className="text-[13px] text-gray-600 mt-[6px]">
            {t("hospital.alerts.expiryBody")}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
          <p className="text-[12px] uppercase tracking-wide text-blue-600 font-semibold">
            {t("hospital.alerts.emergencyTitle")}
          </p>
          <p className="text-[13px] text-gray-600 mt-[6px]">
            {t("hospital.alerts.emergencyBody")}
          </p>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px] mb-[12px]">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-800">
              {t("hospital.section.h2hMap")}
            </h2>
            <p className="text-[12px] text-gray-500">
              {t("hospital.section.h2hMapSubtitle")}
            </p>
          </div>
          <span className="text-[12px] text-gray-500">{t("hospital.section.mapHint")}</span>
        </div>
        <div className="grid gap-[16px] lg:grid-cols-[2fr_1fr]">
          <HospitalAvailabilityMap
            hospitals={hospitals}
            emptyMessage={t("hospital.section.mapPlaceholder")}
            height={240}
          />
          <div className="space-y-[10px] text-[13px] text-gray-700">
            {loading && (
              <div className="text-[12px] text-gray-500">{t("hospital.section.nearbyLoading")}</div>
            )}
            {!loading && nearbyHospitals.length === 0 && (
              <div className="text-[12px] text-gray-500">{t("hospital.section.nearbyEmpty")}</div>
            )}
            {!loading &&
              nearbyHospitals.map((hospital) => {
                const totalUnits = (hospital.inventory || []).reduce(
                  (sum, item) => sum + Number(item.units || 0),
                  0
                );
                const groups = Array.from(
                  new Set((hospital.inventory || []).map((item) => item.group))
                )
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(", ");
                const statusLabel =
                  totalUnits > 0 ? t("hospital.section.available") : t("status.pending");
                const statusCls =
                  totalUnits > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700";
                return (
                  <div
                    key={hospital._id || hospital.name}
                    className="flex items-center justify-between border border-gray-200 rounded-md px-[10px] py-[8px]"
                  >
                    <div>
                      <p className="font-semibold">{hospital.name}</p>
                      <p className="text-[12px] text-gray-500">
                        {groups || t("hospital.section.noGroups")} -{" "}
                        {t("hospital.section.distanceLabel", {
                          km: hospital.distanceKm ?? "--",
                        })}
                      </p>
                    </div>
                    <span className={`text-[12px] px-[8px] py-[4px] rounded-full ${statusCls}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <div className="flex items-center justify-between mb-[10px]">
          <h2 className="text-[16px] font-semibold text-gray-800">
            {t("hospital.section.transferStatus")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
              <tr>
                <th className="py-[6px]">{t("hospital.table.from")}</th>
                <th className="py-[6px]">{t("hospital.table.to")}</th>
                <th className="py-[6px]">{t("hospital.table.bloodGroup")}</th>
                <th className="py-[6px]">{t("hospital.table.units")}</th>
                <th className="py-[6px]">{t("hospital.table.status")}</th>
                <th className="py-[6px]">{t("hospital.table.eta")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading && (
                <tr>
                  <td className="py-[10px] text-[12px] text-gray-500" colSpan={6}>
                    {t("hospital.loading")}
                  </td>
                </tr>
              )}
              {!loading && transfers.length === 0 && (
                <tr>
                  <td className="py-[10px] text-[12px] text-gray-500" colSpan={6}>
                    {t("hospital.table.emptyTransfers")}
                  </td>
                </tr>
              )}
              {!loading &&
                transfers.map((transfer) => {
                  const status = getTransferStatus(transfer.status);
                  return (
                    <tr key={transfer._id} className="border-b hover:bg-gray-50">
                      <td className="py-[6px]">{transfer.fromHospital}</td>
                      <td className="py-[6px]">{transfer.toHospital}</td>
                      <td className="py-[6px]">{transfer.bloodGroup}</td>
                      <td className="py-[6px]">{transfer.units}</td>
                      <td className={`py-[6px] ${status.cls}`}>{status.label}</td>
                      <td className="py-[6px]">{transfer.eta || "--"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
          {t("hospital.section.requests")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
              <tr>
                <th className="py-[6px]">{t("hospital.table.patient")}</th>
                <th className="py-[6px]">{t("hospital.table.bloodGroup")}</th>
                <th className="py-[6px]">{t("hospital.table.units")}</th>
                <th className="py-[6px]">{t("hospital.table.status")}</th>
                <th className="py-[6px]">{t("hospital.table.date")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading && (
                <tr>
                  <td className="py-[10px] text-[12px] text-gray-500" colSpan={5}>
                    {t("hospital.loading")}
                  </td>
                </tr>
              )}
              {!loading && requests.length === 0 && (
                <tr>
                  <td className="py-[10px] text-[12px] text-gray-500" colSpan={5}>
                    {t("hospital.table.emptyRequests")}
                  </td>
                </tr>
              )}
              {!loading &&
                requests.map((request) => {
                  const status = getRequestStatus(request);
                  return (
                    <tr key={request._id} className="border-b hover:bg-gray-50">
                      <td className="py-[6px]">{request.patientName}</td>
                      <td className="py-[6px]">{request.bloodGroup}</td>
                      <td className="py-[6px]">{request.units}</td>
                      <td className={`py-[6px] ${status.cls}`}>{status.label}</td>
                      <td className="py-[6px]">{formatDate(request.createdAt)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-[20px] mt-[20px]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[420px]">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-gray-800">
              {t("hospital.section.stock")}
            </h3>
            <button
              className="text-[11px] text-red-600 underline"
              onClick={openStockForm}
            >
              {t("hospital.stockForm.updateButton")}
            </button>
          </div>
          <ul className="mt-[10px] text-[13px] text-gray-600 space-y-[6px]">
            {loading && <li>{t("hospital.loading")}</li>}
            {!loading && stockGroups.length === 0 && <li>{t("hospital.empty")}</li>}
            {!loading &&
              stockGroups.map((item) => (
                <li key={item.group}>
                  {item.group}: {item.units}
                </li>
              ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[420px]">
          <h3 className="text-[16px] font-semibold text-gray-800">
            {t("hospital.section.recent")}
          </h3>
          <ul className="mt-[10px] text-[13px] text-gray-600 space-y-[6px]">
            {loading && <li>{t("hospital.loading")}</li>}
            {!loading && recentActivity.length === 0 && <li>{t("hospital.recent.empty")}</li>}
            {!loading &&
              recentActivity.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
          </ul>
        </div>
      </div>

      {showTransferForm && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowTransferForm(false)}
          />
          <div className="absolute inset-x-0 top-[10%] mx-auto w-[90%] max-w-[520px] bg-white rounded-lg shadow-xl p-[16px] z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-gray-800">
                {t("hospital.transferForm.title")}
              </h3>
              <button
                className="text-[12px] text-gray-500 underline"
                onClick={() => setShowTransferForm(false)}
              >
                {t("common.close")}
              </button>
            </div>

            <form className="mt-[12px] grid grid-cols-1 gap-[10px]" onSubmit={handleCreateTransfer}>
              {transferState.error && (
                <div className="bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {transferState.error}
                </div>
              )}
              {transferState.success && (
                <div className="bg-green-50 text-green-700 border border-green-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {transferState.success}
                </div>
              )}
              {hospitals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                  <select
                    className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                    value={transferForm.fromHospital}
                    onChange={(e) => setTransferForm({ ...transferForm, fromHospital: e.target.value })}
                  >
                    <option value="">{t("hospital.transferForm.fromHospital")}</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital._id || hospital.name} value={hospital.name}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                    value={transferForm.toHospital}
                    onChange={(e) => setTransferForm({ ...transferForm, toHospital: e.target.value })}
                  >
                    <option value="">{t("hospital.transferForm.toHospital")}</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital._id || hospital.name} value={hospital.name}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                  <input
                    className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                    placeholder={t("hospital.transferForm.fromHospital")}
                    value={transferForm.fromHospital}
                    onChange={(e) => setTransferForm({ ...transferForm, fromHospital: e.target.value })}
                  />
                  <input
                    className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                    placeholder={t("hospital.transferForm.toHospital")}
                    value={transferForm.toHospital}
                    onChange={(e) => setTransferForm({ ...transferForm, toHospital: e.target.value })}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                <select
                  className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={transferForm.bloodGroup}
                  onChange={(e) => setTransferForm({ ...transferForm, bloodGroup: e.target.value })}
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                  placeholder={t("hospital.transferForm.units")}
                  value={transferForm.units}
                  onChange={(e) => setTransferForm({ ...transferForm, units: e.target.value })}
                />
              </div>
              <input
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("hospital.transferForm.eta")}
                value={transferForm.eta}
                onChange={(e) => setTransferForm({ ...transferForm, eta: e.target.value })}
              />
              <textarea
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("hospital.transferForm.notes")}
                rows={3}
                value={transferForm.notes}
                onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              />
              <button
                type="submit"
                disabled={transferState.loading}
                className="bg-red-600 text-white px-[12px] py-[8px] rounded-md text-[13px] font-semibold w-full sm:w-auto disabled:opacity-60"
              >
                {transferState.loading ? t("hospital.transferForm.creating") : t("hospital.transferForm.create")}
              </button>
            </form>
          </div>
        </div>
      )}

      {showStockForm && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowStockForm(false)}
          />
          <div className="absolute inset-x-0 top-[10%] mx-auto w-[90%] max-w-[520px] bg-white rounded-lg shadow-xl p-[16px] z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-gray-800">
                {t("hospital.stockForm.title")}
              </h3>
              <button
                className="text-[12px] text-gray-500 underline"
                onClick={() => setShowStockForm(false)}
              >
                {t("common.close")}
              </button>
            </div>

            <form className="mt-[12px] grid grid-cols-1 gap-[10px]" onSubmit={handleUpdateStock}>
              {stockState.error && (
                <div className="bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {stockState.error}
                </div>
              )}
              {stockState.success && (
                <div className="bg-green-50 text-green-700 border border-green-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {stockState.success}
                </div>
              )}
              {hospitals.length > 0 ? (
                <select
                  className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={stockForm.hospitalId}
                  onChange={(e) => setStockForm({ ...stockForm, hospitalId: e.target.value })}
                >
                  <option value="">{t("hospital.stockForm.hospital")}</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id || hospital.name} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[12px] text-gray-500">{t("hospital.empty")}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                <select
                  className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={stockForm.group}
                  onChange={(e) => setStockForm({ ...stockForm, group: e.target.value })}
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={stockForm.component}
                  onChange={(e) => setStockForm({ ...stockForm, component: e.target.value })}
                >
                  {["whole", "plasma", "platelets", "prbc"].map((component) => (
                    <option key={component} value={component}>
                      {component}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("hospital.stockForm.units")}
                value={stockForm.units}
                onChange={(e) => setStockForm({ ...stockForm, units: e.target.value })}
              />
              <button
                type="submit"
                disabled={stockState.loading}
                className="bg-red-600 text-white px-[12px] py-[8px] rounded-md text-[13px] font-semibold w-full sm:w-auto disabled:opacity-60"
              >
                {stockState.loading ? t("hospital.stockForm.updating") : t("hospital.stockForm.update")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospital;
