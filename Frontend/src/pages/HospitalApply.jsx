import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n.jsx";
import { clearStoredSession, getAuthSession } from "../utils/auth.js";

const HospitalApply = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const { token } = getAuthSession();
  const authHeader = useMemo(() => (token ? { token: `Bearer ${token}` } : {}), [token]);
  const [form, setForm] = useState({
    facilityName: "",
    facilityType: "",
    region: "",
    address: "",
    licenseNumber: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    notes: "",
  });
  const [accreditationFile, setAccreditationFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.facilityName || !form.facilityType || !form.region || !form.licenseNumber) {
      setError(t("hospitalApply.validationRequired"));
      return;
    }

    setStatus("submitting");
    try {
      const payload = {
        ...form,
        accreditationName: accreditationFile ? accreditationFile.name : "",
      };

      const res = await fetch(`${API_URL}/api/v1/hospital-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const message = await getErrorMessage(res, t("hospitalApply.error"));

        if (res.status === 401 || res.status === 403) {
          clearStoredSession();
          navigate("/login", {
            replace: true,
            state: { from: "/hospital-apply" },
          });
          return;
        }

        throw new Error(message);
      }

      setSuccess(t("hospitalApply.success"));
      setForm({
        facilityName: "",
        facilityType: "",
        region: "",
        address: "",
        licenseNumber: "",
        contactPerson: "",
        email: "",
        phone: "",
        website: "",
        notes: "",
      });
      setAccreditationFile(null);
    } catch (err) {
      setError(err.message || t("hospitalApply.error"));
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[30px]">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-wrap gap-[24px] items-start">
          <div className="flex-1 min-w-[280px]">
            <h1 className="text-[24px] font-semibold text-gray-800">
              {t("hospitalApply.title")}
            </h1>
            <p className="text-[13px] text-gray-500 mt-[6px]">
              {t("hospitalApply.subtitle")}
            </p>

            <div className="mt-[18px] bg-white border border-gray-200 rounded-lg shadow-sm p-[16px]">
              <h3 className="text-[14px] font-semibold text-gray-800">
                {t("hospitalApply.requirementsTitle")}
              </h3>
              <ul className="mt-[10px] text-[13px] text-gray-600 space-y-[6px]">
                <li>{t("hospitalApply.requirements.item1")}</li>
                <li>{t("hospitalApply.requirements.item2")}</li>
                <li>{t("hospitalApply.requirements.item3")}</li>
                <li>{t("hospitalApply.requirements.item4")}</li>
              </ul>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 min-w-[320px] bg-white border border-gray-200 rounded-lg shadow-sm p-[18px]"
          >
            <div className="grid gap-[12px]">
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
                  {t("hospitalApply.fields.name")}
                </label>
                <input
                  type="text"
                  placeholder={t("hospitalApply.placeholders.name")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.facilityName}
                  onChange={(e) => updateField("facilityName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("hospitalApply.fields.type")}
                </label>
                <select
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.facilityType}
                  onChange={(e) => updateField("facilityType", e.target.value)}
                >
                  <option value="">{t("hospitalApply.placeholders.type")}</option>
                  <option value="public">{t("hospitalApply.types.public")}</option>
                  <option value="private">{t("hospitalApply.types.private")}</option>
                  <option value="faith">{t("hospitalApply.types.faith")}</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("hospitalApply.fields.region")}
                </label>
                <input
                  type="text"
                  placeholder={t("hospitalApply.placeholders.region")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.region}
                  onChange={(e) => updateField("region", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("hospitalApply.fields.address")}
                </label>
                <input
                  type="text"
                  placeholder={t("hospitalApply.placeholders.address")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("hospitalApply.fields.license")}
                </label>
                <input
                  type="text"
                  placeholder={t("hospitalApply.placeholders.license")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.licenseNumber}
                  onChange={(e) => updateField("licenseNumber", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("hospitalApply.fields.accreditation")}
                </label>
                <input
                  type="file"
                  className="mt-[6px] w-full border border-dashed border-gray-300 rounded-md px-[10px] py-[8px] text-[12px]"
                  onChange={(e) => setAccreditationFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("hospitalApply.fields.contactPerson")}
                </label>
                <input
                  type="text"
                  placeholder={t("hospitalApply.placeholders.contactPerson")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.contactPerson}
                  onChange={(e) => updateField("contactPerson", e.target.value)}
                />
              </div>
              <div className="grid gap-[12px] md:grid-cols-2">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700">
                    {t("hospitalApply.fields.email")}
                  </label>
                  <input
                    type="email"
                    placeholder={t("hospitalApply.placeholders.email")}
                    className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700">
                    {t("hospitalApply.fields.phone")}
                  </label>
                  <input
                    type="tel"
                    placeholder={t("hospitalApply.placeholders.phone")}
                    className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("hospitalApply.fields.website")}
                </label>
                <input
                  type="text"
                  placeholder={t("hospitalApply.placeholders.website")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700">
                  {t("hospitalApply.fields.notes")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("hospitalApply.placeholders.notes")}
                  className="mt-[6px] w-full border border-gray-300 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-[16px] flex flex-wrap items-center justify-between gap-[12px]">
              <span className="text-[12px] text-gray-500">
                {t("hospitalApply.helper")}
              </span>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="bg-red-600 text-white text-[13px] font-semibold px-[16px] py-[8px] rounded-md shadow-sm hover:bg-red-700 transition disabled:opacity-60"
              >
                {status === "submitting"
                  ? t("hospitalApply.submitting")
                  : t("hospitalApply.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HospitalApply;
