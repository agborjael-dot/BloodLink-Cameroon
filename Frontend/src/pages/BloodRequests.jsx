import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n.jsx";

const BloodRequests = () => {
  const { t } = useLanguage();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { token: `Bearer ${token}` } : {};
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/blood-requests`, {
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(t("bloodRequests.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/blood-requests/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setRequests((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch (err) {
      setError(t("bloodRequests.updateError"));
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  const resolveUrgency = (value) => {
    const key = `bloodRequests.urgency.${value || "normal"}`;
    const translated = t(key);
    return translated === key ? value : translated;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[20px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-800">
            {t("bloodRequests.title")}
          </h1>
          <p className="text-[13px] text-gray-500">{t("bloodRequests.subtitle")}</p>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        {error && (
          <div className="mb-[10px] bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-[12px] text-gray-500">{t("bloodRequests.loading")}</div>
        ) : requests.length === 0 ? (
          <div className="text-[12px] text-gray-500">{t("bloodRequests.empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
                <tr>
                  <th className="py-[6px]">{t("bloodRequests.table.patient")}</th>
                  <th className="py-[6px]">{t("bloodRequests.table.bloodGroup")}</th>
                  <th className="py-[6px]">{t("bloodRequests.table.units")}</th>
                  <th className="py-[6px]">{t("bloodRequests.table.urgency")}</th>
                  <th className="py-[6px]">{t("bloodRequests.table.hospital")}</th>
                  <th className="py-[6px]">{t("bloodRequests.table.contact")}</th>
                  <th className="py-[6px]">{t("bloodRequests.table.status")}</th>
                  <th className="py-[6px]">{t("bloodRequests.table.date")}</th>
                  <th className="py-[6px]">{t("bloodRequests.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {requests.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="py-[6px]">{item.patientName}</td>
                    <td className="py-[6px]">{item.bloodGroup}</td>
                    <td className="py-[6px]">{item.units}</td>
                    <td className="py-[6px]">{resolveUrgency(item.urgency)}</td>
                    <td className="py-[6px]">{item.hospitalName || "-"}</td>
                    <td className="py-[6px]">
                      <div className="text-[12px] text-gray-600">
                        <div>{item.contactName || "-"}</div>
                        <div>{item.contactPhone || "-"}</div>
                      </div>
                    </td>
                    <td
                      className={`py-[6px] font-semibold ${{
                        pending: "text-yellow-600",
                        approved: "text-green-600",
                        rejected: "text-red-600",
                      }[item.status] || "text-gray-600"}`}
                    >
                      {t(`status.${item.status || "pending"}`)}
                    </td>
                    <td className="py-[6px]">{formatDate(item.createdAt)}</td>
                    <td className="py-[6px]">
                      {item.status === "pending" ? (
                        <div className="flex flex-wrap gap-[8px]">
                          <button
                            className="text-[12px] font-semibold px-[10px] py-[4px] rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                            onClick={() => updateStatus(item._id, "approved")}
                          >
                            {t("bloodRequests.approve")}
                          </button>
                          <button
                            className="text-[12px] font-semibold px-[10px] py-[4px] rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                            onClick={() => updateStatus(item._id, "rejected")}
                          >
                            {t("bloodRequests.reject")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-semibold text-gray-500">
                          {t("bloodRequests.reviewed")}
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

export default BloodRequests;
