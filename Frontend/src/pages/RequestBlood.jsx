import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n.jsx";
import { clearStoredSession, getAuthSession } from "../utils/auth.js";

const RequestBlood = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const { token } = getAuthSession();
  const authHeader = useMemo(() => (token ? { token: `Bearer ${token}` } : {}), [token]);
  const formRef = useRef(null);
  const [form, setForm] = useState({
    patientName: "",
    bloodGroup: "",
    units: "",
    urgency: "normal",
    hospitalName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    location: "",
    notes: "",
  });
  const [filters, setFilters] = useState({
    query: "",
    group: "",
    component: "",
    distance: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastRequest, setLastRequest] = useState(null);
  const [feedback, setFeedback] = useState({
    type: "",
    priority: "",
    message: "",
  });
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState("");

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ query: "", group: "", component: "", distance: "" });
  };

  const getErrorMessage = async (response, fallback) => {
    try {
      const data = await response.json();
      if (typeof data === "string" && data.trim()) {
        return data;
      }

      return data?.message || fallback;
    } catch {
      return fallback;
    }
  };

  const handleEmergency = () => {
    updateField("urgency", "urgent");
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const fetchHospitals = async () => {
    setHospitalsLoading(true);
    setHospitalsError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/hospitals/availability`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setHospitals(Array.isArray(data) ? data : []);
    } catch (err) {
      setHospitalsError(t("requestBlood.nearby.error"));
    } finally {
      setHospitalsLoading(false);
    }
  };

  const fetchLastRequest = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/blood-requests/public/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setLastRequest(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHospitals();
    const storedId = localStorage.getItem("lastRequestId");
    if (storedId) {
      fetchLastRequest(storedId);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.patientName || !form.bloodGroup || !form.units || !form.contactPhone) {
      setError(t("requestBlood.validationRequired"));
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch(`${API_URL}/api/v1/blood-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          ...form,
          units: Number(form.units),
        }),
      });

      if (!res.ok) {
        const message = await getErrorMessage(res, t("requestBlood.error"));

        if (res.status === 401 || res.status === 403) {
          clearStoredSession();
          navigate("/login", {
            replace: true,
            state: { from: "/request-blood" },
          });
          return;
        }

        throw new Error(message);
      }

      const data = await res.json();
      setLastRequest(data);
      if (data?._id) {
        localStorage.setItem("lastRequestId", data._id);
      }
      setSuccess(t("requestBlood.success"));
      setForm({
        patientName: "",
        bloodGroup: "",
        units: "",
        urgency: "normal",
        hospitalName: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        location: "",
        notes: "",
      });
    } catch (err) {
      setError(err.message || t("requestBlood.error"));
    } finally {
      setStatus("idle");
    }
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    setFeedbackSuccess("");
    if (!feedback.type || !feedback.message) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...feedback,
          requestId: lastRequest?._id || "",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setFeedbackSuccess(t("requestBlood.feedback.success"));
      setFeedback({ type: "", priority: "", message: "" });
    } catch {
      // ignore
    }
  };

  const filteredHospitals = hospitals.filter((hospital) => {
    if (filters.query && !hospital.name.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.distance && hospital.distanceKm > Number(filters.distance)) {
      return false;
    }
    if (filters.group || filters.component) {
      const match = (hospital.inventory || []).some((item) => {
        const groupMatch = !filters.group || item.group === filters.group;
        const componentMatch = !filters.component || item.component === filters.component;
        return groupMatch && componentMatch;
      });
      if (!match) return false;
    }
    return true;
  });

  const componentLabel = (key) => t(`requestBlood.components.${key}`);
  const trackerSteps = [
    { key: "submitted", label: t("requestBlood.tracker.submitted") },
    { key: "pending", label: t("requestBlood.tracker.pending") },
    { key: "approved", label: t("requestBlood.tracker.approved") },
    { key: "inTransit", label: t("requestBlood.tracker.inTransit") },
    { key: "received", label: t("requestBlood.tracker.received") },
  ];
  const statusOrder = ["pending", "approved", "inTransit", "received"];
  const currentStatus = lastRequest?.status || "pending";
  const trackerIndex = statusOrder.indexOf(currentStatus);
  const currentStep = lastRequest ? Math.max(0, trackerIndex + 1) : -1;
  const isRejected = lastRequest?.status === "rejected";

  const showManifest = lastRequest?.manifest;
  const messages = lastRequest?.messages || [];

  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[30px]">
      <div className="max-w-[1150px] mx-auto">
        <div>
          <h1 className="text-[24px] font-semibold text-gray-800">
            {t("requestBlood.title")}
          </h1>
          <p className="text-[13px] text-gray-500 mt-[6px]">
            {t("requestBlood.subtitle")}
          </p>
        </div>

        <div className="mt-[20px] bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <div>
              <h2 className="text-[16px] font-semibold text-gray-800">
                {t("requestBlood.search.title")}
              </h2>
              <p className="text-[12px] text-gray-500">
                {t("requestBlood.search.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12px] font-semibold text-gray-600 border border-gray-200 px-[10px] py-[6px] rounded-md hover:bg-gray-50 w-full sm:w-auto"
            >
              {t("requestBlood.search.reset")}
            </button>
          </div>
          <div className="mt-[12px] grid gap-[12px] md:grid-cols-4">
            <input
              type="text"
              placeholder={t("requestBlood.search.query")}
              className="border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
              value={filters.query}
              onChange={(e) => updateFilter("query", e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
              value={filters.group}
              onChange={(e) => updateFilter("group", e.target.value)}
            >
              <option value="">{t("requestBlood.search.bloodGroup")}</option>
              <option value="O-">{t("requestBlood.bloodGroups.oNeg")}</option>
              <option value="O+">{t("requestBlood.bloodGroups.oPos")}</option>
              <option value="A-">{t("requestBlood.bloodGroups.aNeg")}</option>
              <option value="A+">{t("requestBlood.bloodGroups.aPos")}</option>
              <option value="B-">{t("requestBlood.bloodGroups.bNeg")}</option>
              <option value="B+">{t("requestBlood.bloodGroups.bPos")}</option>
              <option value="AB-">{t("requestBlood.bloodGroups.abNeg")}</option>
              <option value="AB+">{t("requestBlood.bloodGroups.abPos")}</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
              value={filters.component}
              onChange={(e) => updateFilter("component", e.target.value)}
            >
              <option value="">{t("requestBlood.search.component")}</option>
              <option value="whole">{t("requestBlood.components.whole")}</option>
              <option value="plasma">{t("requestBlood.components.plasma")}</option>
              <option value="platelets">{t("requestBlood.components.platelets")}</option>
              <option value="prbc">{t("requestBlood.components.prbc")}</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
              value={filters.distance}
              onChange={(e) => updateFilter("distance", e.target.value)}
            >
              <option value="">{t("requestBlood.search.distance")}</option>
              <option value="5">{t("requestBlood.search.distance5")}</option>
              <option value="10">{t("requestBlood.search.distance10")}</option>
              <option value="20">{t("requestBlood.search.distance20")}</option>
              <option value="50">{t("requestBlood.search.distance50")}</option>
            </select>
          </div>
        </div>

        <div className="mt-[20px] bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
          <h2 className="text-[16px] font-semibold text-gray-800">
            {t("requestBlood.nearby.title")}
          </h2>
          <div className="mt-[12px] space-y-[10px]">
            {hospitalsError && (
              <div className="text-[12px] text-red-600">{hospitalsError}</div>
            )}
            {hospitalsLoading ? (
              <div className="text-[12px] text-gray-500">{t("requestBlood.nearby.loading")}</div>
            ) : filteredHospitals.length === 0 ? (
              <div className="text-[12px] text-gray-500">
                {t("requestBlood.nearby.empty")}
              </div>
            ) : (
              filteredHospitals.map((hospital) => (
                <div
                  key={hospital._id || hospital.id}
                  className="border border-gray-200 rounded-md px-[12px] py-[10px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-[8px]">
                    <div>
                      <p className="font-semibold text-gray-800">{hospital.name}</p>
                      <p className="text-[12px] text-gray-500">
                        {hospital.location} - {t("requestBlood.nearby.distanceLabel", { km: hospital.distanceKm })}
                      </p>
                    </div>
                    <span className="text-[12px] text-gray-500">
                      {t("requestBlood.nearby.availableLabel")}
                    </span>
                  </div>
                  <div className="mt-[8px] flex flex-wrap gap-[8px]">
                    {(hospital.inventory || []).map((item, index) => (
                      <span
                        key={`${hospital._id || hospital.id}-${index}`}
                        className="text-[12px] bg-gray-100 text-gray-700 px-[8px] py-[4px] rounded-full"
                      >
                        {item.group} {componentLabel(item.component)} - {item.units}{t("requestBlood.unitsSuffix")}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-[20px] grid gap-[20px] lg:grid-cols-[1.1fr_0.9fr]">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-[18px]"
          >
            <div className="grid gap-[12px]">
              <h2 className="text-[16px] font-semibold text-gray-800">
                {t("requestBlood.formTitle")}
              </h2>
              {error && (
                <div className="bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 text-green-700 border border-green-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {success}
                </div>
              )}
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("requestBlood.fields.patientName")}
                </label>
                <input
                  type="text"
                  placeholder={t("requestBlood.placeholders.patientName")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.patientName}
                  onChange={(e) => updateField("patientName", e.target.value)}
                />
              </div>
              <div className="grid gap-[12px] md:grid-cols-2">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700">
                    {t("requestBlood.fields.bloodGroup")}
                  </label>
                  <select
                    className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                    value={form.bloodGroup}
                    onChange={(e) => updateField("bloodGroup", e.target.value)}
                  >
                    <option value="">{t("requestBlood.placeholders.bloodGroup")}</option>
                    <option value="O-">{t("requestBlood.bloodGroups.oNeg")}</option>
                    <option value="O+">{t("requestBlood.bloodGroups.oPos")}</option>
                    <option value="A-">{t("requestBlood.bloodGroups.aNeg")}</option>
                    <option value="A+">{t("requestBlood.bloodGroups.aPos")}</option>
                    <option value="B-">{t("requestBlood.bloodGroups.bNeg")}</option>
                    <option value="B+">{t("requestBlood.bloodGroups.bPos")}</option>
                    <option value="AB-">{t("requestBlood.bloodGroups.abNeg")}</option>
                    <option value="AB+">{t("requestBlood.bloodGroups.abPos")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700">
                    {t("requestBlood.fields.units")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={t("requestBlood.placeholders.units")}
                    className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                    value={form.units}
                    onChange={(e) => updateField("units", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("requestBlood.fields.urgency")}
                </label>
                <select
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.urgency}
                  onChange={(e) => updateField("urgency", e.target.value)}
                >
                  <option value="normal">{t("requestBlood.urgency.normal")}</option>
                  <option value="urgent">{t("requestBlood.urgency.urgent")}</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("requestBlood.fields.hospitalName")}
                </label>
                <input
                  type="text"
                  placeholder={t("requestBlood.placeholders.hospitalName")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.hospitalName}
                  onChange={(e) => updateField("hospitalName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("requestBlood.fields.contactName")}
                </label>
                <input
                  type="text"
                  placeholder={t("requestBlood.placeholders.contactName")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                />
              </div>
              <div className="grid gap-[12px] md:grid-cols-2">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700">
                    {t("requestBlood.fields.contactPhone")}
                  </label>
                  <input
                    type="tel"
                    placeholder={t("requestBlood.placeholders.contactPhone")}
                    className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                    value={form.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700">
                    {t("requestBlood.fields.contactEmail")}
                  </label>
                  <input
                    type="email"
                    placeholder={t("requestBlood.placeholders.contactEmail")}
                    className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                    value={form.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("requestBlood.fields.location")}
                </label>
                <input
                  type="text"
                  placeholder={t("requestBlood.placeholders.location")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("requestBlood.fields.notes")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("requestBlood.placeholders.notes")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-[16px] flex flex-wrap items-center justify-between gap-[12px]">
              <span className="text-[12px] text-gray-500">
                {t("requestBlood.helper")}
              </span>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="bg-red-600 text-white text-[13px] font-semibold px-[16px] py-[8px] rounded-md shadow-sm hover:bg-red-700 transition disabled:opacity-60 w-full sm:w-auto"
              >
                {status === "submitting"
                  ? t("requestBlood.submitting")
                  : t("requestBlood.submit")}
              </button>
            </div>
          </form>

          <div className="space-y-[16px]">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
              <h3 className="text-[15px] font-semibold text-gray-800">
                {t("requestBlood.emergency.title")}
              </h3>
              <p className="text-[12px] text-gray-600 mt-[6px]">
                {t("requestBlood.emergency.body")}
              </p>
              <button
                type="button"
                onClick={handleEmergency}
                className="mt-[10px] bg-red-600 text-white text-[12px] font-semibold px-[12px] py-[6px] rounded-md hover:bg-red-700 w-full sm:w-auto"
              >
                {t("requestBlood.emergency.button")}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
              <h3 className="text-[15px] font-semibold text-gray-800">
                {t("requestBlood.confirmation.title")}
              </h3>
              {lastRequest ? (
                <div className="mt-[8px] text-[12px] text-gray-600 space-y-[6px]">
                  <div>
                    <span className="font-semibold">{t("requestBlood.confirmation.idLabel")}:</span>
                    <span className="ml-[6px]">{lastRequest._id || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">{t("requestBlood.confirmation.statusLabel")}:</span>
                    <span className="ml-[6px]">{t(`status.${lastRequest.status || "pending"}`)}</span>
                  </div>
                  <div>
                    <span className="font-semibold">{t("requestBlood.confirmation.summaryLabel")}:</span>
                    <span className="ml-[6px]">
                      {lastRequest.bloodGroup} - {lastRequest.units}{t("requestBlood.unitsSuffix")}
                    </span>
                  </div>
                  <p className="text-gray-500">{t("requestBlood.confirmation.note")}</p>
                </div>
              ) : (
                <p className="mt-[8px] text-[12px] text-gray-500">
                  {t("requestBlood.confirmation.empty")}
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
              <h3 className="text-[15px] font-semibold text-gray-800">
                {t("requestBlood.tracker.title")}
              </h3>
              {lastRequest ? (
                <div className="mt-[10px] space-y-[8px]">
                  {trackerSteps.map((step, index) => {
                    const isComplete = index <= currentStep;
                    const isCurrent = index === currentStep;
                    return (
                      <div key={step.key} className="flex items-center gap-[8px]">
                        <span
                          className={`h-[8px] w-[8px] rounded-full ${
                            isComplete ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <span
                          className={`text-[12px] ${
                            isCurrent ? "text-gray-800 font-semibold" : "text-gray-600"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                  {isRejected && (
                    <p className="text-[12px] text-red-600">
                      {t("requestBlood.tracker.rejected")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-[8px] text-[12px] text-gray-500">
                  {t("requestBlood.tracker.empty")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-[20px] grid gap-[20px] lg:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
            <h3 className="text-[15px] font-semibold text-gray-800">
              {t("requestBlood.manifest.title")}
            </h3>
            {showManifest ? (
              <div className="mt-[10px] text-[12px] text-gray-600 space-y-[6px]">
                <div>
                  <span className="font-semibold">{t("requestBlood.manifest.bagId")}:</span>
                  <span className="ml-[6px]">{lastRequest.manifest?.bagId}</span>
                </div>
                <div>
                  <span className="font-semibold">{t("requestBlood.manifest.component")}:</span>
                  <span className="ml-[6px]">
                    {componentLabel(lastRequest.manifest?.component || "whole")}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">{t("requestBlood.manifest.temperature")}:</span>
                  <span className="ml-[6px]">{lastRequest.manifest?.temperature}</span>
                </div>
                <div>
                  <span className="font-semibold">{t("requestBlood.manifest.eta")}:</span>
                  <span className="ml-[6px]">{lastRequest.manifest?.eta}</span>
                </div>
                <div>
                  <span className="font-semibold">{t("requestBlood.manifest.fromHospital")}:</span>
                  <span className="ml-[6px]">{lastRequest.manifest?.fromHospital}</span>
                </div>
              </div>
            ) : (
              <p className="mt-[8px] text-[12px] text-gray-500">
                {t("requestBlood.manifest.empty")}
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
            <h3 className="text-[15px] font-semibold text-gray-800">
              {t("requestBlood.messaging.title")}
            </h3>
            {messages.length > 0 ? (
              <ul className="mt-[10px] text-[12px] text-gray-600 space-y-[8px]">
                {messages.map((message, index) => (
                  <li
                    key={`${message.createdAt || index}-${index}`}
                    className="border border-gray-200 rounded-md px-[10px] py-[6px]"
                  >
                    {message.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-[8px] text-[12px] text-gray-500">
                {t("requestBlood.messaging.empty")}
              </p>
            )}
            <p className="mt-[8px] text-[12px] text-gray-500">
              {t("requestBlood.messaging.helper")}
            </p>
          </div>
        </div>

        <div className="mt-[20px] bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
          <h3 className="text-[15px] font-semibold text-gray-800">
            {t("requestBlood.feedback.title")}
          </h3>
          <p className="text-[12px] text-gray-500 mt-[4px]">
            {t("requestBlood.feedback.subtitle")}
          </p>
          {feedbackSuccess && (
            <div className="mt-[10px] bg-green-50 text-green-700 border border-green-100 px-[10px] py-[8px] rounded-md text-[12px]">
              {feedbackSuccess}
            </div>
          )}
          <form onSubmit={handleFeedbackSubmit} className="mt-[12px] grid gap-[12px]">
            <div className="grid gap-[12px] md:grid-cols-2">
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("requestBlood.feedback.issueType")}
                </label>
                <select
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={feedback.type}
                  onChange={(e) => setFeedback((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">{t("requestBlood.feedback.typePlaceholder")}</option>
                  <option value="request">{t("requestBlood.feedback.types.request")}</option>
                  <option value="response">{t("requestBlood.feedback.types.response")}</option>
                  <option value="technical">{t("requestBlood.feedback.types.technical")}</option>
                  <option value="other">{t("requestBlood.feedback.types.other")}</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("requestBlood.feedback.priorityLabel")}
                </label>
                <select
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={feedback.priority}
                  onChange={(e) => setFeedback((prev) => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="">{t("requestBlood.feedback.priorityPlaceholder")}</option>
                  <option value="low">{t("requestBlood.feedback.priority.low")}</option>
                  <option value="medium">{t("requestBlood.feedback.priority.medium")}</option>
                  <option value="high">{t("requestBlood.feedback.priority.high")}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-gray-700">
                {t("requestBlood.feedback.message")}
              </label>
              <textarea
                rows={3}
                placeholder={t("requestBlood.feedback.messagePlaceholder")}
                className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                value={feedback.message}
                onChange={(e) => setFeedback((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-gray-900 text-white text-[12px] font-semibold px-[14px] py-[8px] rounded-md w-full sm:w-auto"
              >
                {t("requestBlood.feedback.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestBlood;
