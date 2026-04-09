import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n.jsx";

const SuperAdmin = () => {
  const { t } = useLanguage();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { token: `Bearer ${token}` } : {};
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/hospital-applications`, {
        headers: authHeader,
      });
      if (!res.ok) {
        throw new Error("Failed");
      }
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(t("superAdmin.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/hospital-applications/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed");
      }
      const updated = await res.json();
      setApplications((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch (err) {
      setError(t("superAdmin.updateError"));
    }
  };

  const buildRequirements = (item) => {
    const parts = [];
    if (item.licenseNumber) parts.push(t("superAdmin.requirements.license"));
    if (item.accreditationName)
      parts.push(t("superAdmin.requirements.accreditation"));
    if (parts.length === 0) return t("superAdmin.requirements.none");
    return parts.join(", ");
  };

  const resolveType = (type) => {
    if (!type) return "";
    const key = `hospitalApply.types.${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[20px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-800">
            {t("superAdmin.title")}
          </h1>
          <p className="text-[13px] text-gray-500">{t("superAdmin.subtitle")}</p>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px] mb-[10px]">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-800">
              {t("superAdmin.section.applications")}
            </h2>
            <p className="text-[12px] text-gray-500">
              {t("superAdmin.section.applicationsSubtitle")}
            </p>
          </div>
          <span className="text-[12px] text-gray-500">
            {t("superAdmin.section.applicationsHint")}
          </span>
        </div>

        {error && (
          <div className="mb-[10px] bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-[12px] text-gray-500">{t("superAdmin.loading")}</div>
        ) : applications.length === 0 ? (
          <div className="text-[12px] text-gray-500">{t("superAdmin.empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
                <tr>
                  <th className="py-[6px]">{t("superAdmin.applications.hospital")}</th>
                  <th className="py-[6px]">{t("superAdmin.applications.type")}</th>
                  <th className="py-[6px]">{t("superAdmin.applications.region")}</th>
                  <th className="py-[6px]">{t("superAdmin.applications.requirements")}</th>
                  <th className="py-[6px]">{t("superAdmin.applications.status")}</th>
                  <th className="py-[6px]">{t("superAdmin.applications.actions")}</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {applications.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="py-[6px]">{item.facilityName}</td>
                    <td className="py-[6px]">{resolveType(item.facilityType)}</td>
                    <td className="py-[6px]">{item.region}</td>
                    <td className="py-[6px]">{buildRequirements(item)}</td>
                    <td
                      className={`py-[6px] font-semibold ${{
                        pending: "text-yellow-600",
                        approved: "text-green-600",
                        rejected: "text-red-600",
                      }[item.status] || "text-gray-600"}`}
                    >
                      {t(`status.${item.status || "pending"}`)}
                    </td>
                    <td className="py-[6px]">
                      {item.status === "pending" ? (
                        <div className="flex flex-wrap gap-[8px]">
                          <button
                            className="text-[12px] font-semibold px-[10px] py-[4px] rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                            onClick={() => updateStatus(item._id, "approved")}
                          >
                            {t("superAdmin.applications.approve")}
                          </button>
                          <button
                            className="text-[12px] font-semibold px-[10px] py-[4px] rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                            onClick={() => updateStatus(item._id, "rejected")}
                          >
                            {t("superAdmin.applications.reject")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-semibold text-gray-500">
                          {t("superAdmin.applications.reviewed")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;
