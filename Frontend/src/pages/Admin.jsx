import { Gauge } from "@mui/x-charts/Gauge";
import { LineChart } from "@mui/x-charts/LineChart";
import { FaUser } from "react-icons/fa";
import { PieChart } from "@mui/x-charts/PieChart";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n.jsx";
import { clearStoredSession } from "../utils/auth.js";

const Admin = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => (token ? { token: `Bearer ${token}` } : {}), [token]);

  const [donors, setDonors] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    clearStoredSession();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [donorsRes, prospectsRes, hospitalsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/donors`, { headers: authHeader }),
          fetch(`${API_URL}/api/v1/prospects`, { headers: authHeader }),
          fetch(`${API_URL}/api/v1/hospitals/availability`),
        ]);

        const donorsData = donorsRes.ok ? await donorsRes.json() : [];
        const prospectsData = prospectsRes.ok ? await prospectsRes.json() : [];
        const hospitalsData = hospitalsRes.ok ? await hospitalsRes.json() : [];

        if (active) {
          setDonors(Array.isArray(donorsData) ? donorsData : []);
          setProspects(Array.isArray(prospectsData) ? prospectsData : []);
          setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
        }
      } catch (err) {
        if (active) {
          setDonors([]);
          setProspects([]);
          setHospitals([]);
        }
      }

      if (!token) {
        if (active) {
          setRequests([]);
          setLoading(false);
        }
        return;
      }

      try {
        const requestsRes = await fetch(`${API_URL}/api/v1/blood-requests`, {
          headers: authHeader,
        });
        const requestsData = requestsRes.ok ? await requestsRes.json() : [];
        if (active) {
          setRequests(Array.isArray(requestsData) ? requestsData : []);
        }
      } catch (err) {
        if (active) {
          setError(t("admin.loadError"));
          setRequests([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [API_URL, authHeader, t, token]);

  const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (value) => {
    const date = parseDate(value);
    if (!date) return "--";
    return date.toLocaleDateString();
  };

  const donorRows = useMemo(() => {
    return donors.map((donor) => ({
      id: donor._id || donor.id,
      name: donor.name || "",
      bloodGroup: donor.bloodgroup || donor.bloodType || "--",
      phone: donor.tel || donor.phone || "--",
      joined: donor.joined || donor.date || donor.lastDonation || "",
      lastDonation: donor.lastDonation || donor.date || "",
    }));
  }, [donors]);

  const requestRows = useMemo(() => {
    return requests.map((request) => ({
      id: request._id,
      patientName: request.patientName || "--",
      bloodGroup: request.bloodGroup || "--",
      units: request.units || 0,
      status: request.status || "pending",
      urgency: request.urgency || "normal",
      createdAt: request.createdAt,
    }));
  }, [requests]);

  const prospectRows = useMemo(() => {
    return prospects.map((prospect) => {
      const status =
        typeof prospect.status === "number"
          ? prospect.status
          : String(prospect.status || "").toLowerCase() === "approved"
            ? 1
            : 0;
      return { id: prospect._id || prospect.id, status };
    });
  }, [prospects]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const totalDonors = donorRows.length;
  const donationsToday = donorRows.filter((donor) => {
    const key = parseDate(donor.lastDonation || donor.joined);
    return key ? key.toISOString().slice(0, 10) === todayKey : false;
  }).length;
  const donorsLast30 = donorRows.filter((donor) => {
    const date = parseDate(donor.joined || donor.lastDonation);
    if (!date) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  const pendingRequests = requestRows.filter((r) => r.status === "pending").length;
  const urgentRequests = requestRows.filter(
    (r) => r.status === "pending" && r.urgency === "urgent"
  ).length;

  const inventoryTotals = useMemo(() => {
    const totals = {};
    hospitals.forEach((hospital) => {
      (hospital.inventory || []).forEach((item) => {
        if (!item.group) return;
        totals[item.group] = (totals[item.group] || 0) + Number(item.units || 0);
      });
    });
    return totals;
  }, [hospitals]);

  const unitsInStock = useMemo(() => {
    return Object.values(inventoryTotals).reduce((sum, value) => sum + value, 0);
  }, [inventoryTotals]);

  const inventoryRows = useMemo(() => {
    return Object.entries(inventoryTotals)
      .map(([group, units]) => ({ group, units }))
      .sort((a, b) => a.units - b.units);
  }, [inventoryTotals]);

  const lowStockGroups = inventoryRows.filter((item) => item.units <= 2).length;

  const recentDonors = useMemo(() => {
    return [...donorRows]
      .sort((a, b) => {
        const ad = parseDate(a.joined || a.lastDonation);
        const bd = parseDate(b.joined || b.lastDonation);
        return (bd?.getTime() || 0) - (ad?.getTime() || 0);
      })
      .slice(0, 3);
  }, [donorRows]);

  const recentRequests = useMemo(() => {
    return [...requestRows]
      .sort((a, b) => {
        const ad = parseDate(a.createdAt);
        const bd = parseDate(b.createdAt);
        return (bd?.getTime() || 0) - (ad?.getTime() || 0);
      })
      .slice(0, 3);
  }, [requestRows]);

  const recentActivity = useMemo(() => {
    const events = [];
    recentDonors.forEach((donor) => {
      events.push({
        id: `donor-${donor.id}`,
        date: donor.joined || donor.lastDonation,
        label: t("admin.recentActivity.donor", {
          name: donor.name || "--",
          bloodGroup: donor.bloodGroup || "--",
        }),
      });
    });
    recentRequests.forEach((request) => {
      events.push({
        id: `request-${request.id}`,
        date: request.createdAt,
        label: t("admin.recentActivity.request", {
          bloodGroup: request.bloodGroup,
          units: request.units,
        }),
      });
    });
    return events
      .sort((a, b) => {
        const ad = parseDate(a.date);
        const bd = parseDate(b.date);
        return (bd?.getTime() || 0) - (ad?.getTime() || 0);
      })
      .slice(0, 3);
  }, [recentDonors, recentRequests, t]);

  const prospectsCompletion = useMemo(() => {
    if (!prospectRows.length) return 0;
    const approved = prospectRows.filter((p) => p.status === 1).length;
    return Math.round((approved / prospectRows.length) * 100);
  }, [prospectRows]);

  const donorsTotalChart = totalDonors;

  const trend = useMemo(() => {
    const labels = [];
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(date.toLocaleString(undefined, { month: "short" }));
      data.push(0);
    }
    donorRows.forEach((donor) => {
      const date = parseDate(donor.joined || donor.lastDonation);
      if (!date) return;
      const diff =
        (now.getFullYear() - date.getFullYear()) * 12 +
        (now.getMonth() - date.getMonth());
      if (diff >= 0 && diff < 6) {
        const index = 5 - diff;
        data[index] += 1;
      }
    });
    return { labels, data };
  }, [donorRows]);

  const pieData = useMemo(() => {
    const counts = {};
    donorRows.forEach((donor) => {
      if (!donor.bloodGroup) return;
      counts[donor.bloodGroup] = (counts[donor.bloodGroup] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value], idx) => ({ id: idx, value, label }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [donorRows]);

  const alertText = t("admin.alertsDynamic", {
    lowStock: lowStockGroups,
    urgent: urgentRequests,
    pending: pendingRequests,
  });

  const inventoryStatus = (units) => {
    if (units <= 2) return { label: t("status.low"), cls: "text-red-600" };
    if (units <= 5) return { label: t("status.medium"), cls: "text-yellow-600" };
    return { label: t("status.healthy"), cls: "text-green-600" };
  };

  return (
    <div className="flex flex-wrap justify-between min-h-screen bg-gray-50">
      <div className="w-full px-[20px] mt-[20px]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-[16px] py-[10px] rounded-md shadow-sm">
          {alertText}
        </div>
        {error && (
          <div className="mt-[12px] bg-red-50 text-red-700 border border-red-100 px-[16px] py-[10px] rounded-md shadow-sm">
            {error}
          </div>
        )}
        <div className="flex flex-wrap gap-[20px] mt-[20px]">
          <div className="bg-white h-[110px] w-[220px] rounded-lg border border-gray-200 shadow-sm p-[16px] hover:shadow-md transition">
            <p className="text-[14px] text-gray-500">{t("admin.kpi.totalDonors")}</p>
            <h3 className="text-[26px] font-bold text-gray-800">
              {loading ? "--" : totalDonors.toLocaleString()}
            </h3>
            <span className="text-[12px] text-green-600">
              {t("admin.kpi.totalDonorsSubDynamic", { count: donorsLast30 })}
            </span>
          </div>
          <div className="bg-white h-[110px] w-[220px] rounded-lg border border-gray-200 shadow-sm p-[16px] hover:shadow-md transition">
            <p className="text-[14px] text-gray-500">{t("admin.kpi.donationsToday")}</p>
            <h3 className="text-[26px] font-bold text-gray-800">
              {loading ? "--" : donationsToday}
            </h3>
            <span className="text-[12px] text-green-600">
              {t("admin.kpi.donationsTodaySubDynamic", { count: donationsToday })}
            </span>
          </div>
          <div className="bg-white h-[110px] w-[220px] rounded-lg border border-gray-200 shadow-sm p-[16px] hover:shadow-md transition">
            <p className="text-[14px] text-gray-500">{t("admin.kpi.pendingRequests")}</p>
            <h3 className="text-[26px] font-bold text-gray-800">
              {loading ? "--" : pendingRequests}
            </h3>
            <span className="text-[12px] text-red-600">
              {t("admin.kpi.pendingRequestsSubDynamic", { count: urgentRequests })}
            </span>
          </div>
          <div className="bg-white h-[110px] w-[220px] rounded-lg border border-gray-200 shadow-sm p-[16px] hover:shadow-md transition">
            <p className="text-[14px] text-gray-500">{t("admin.kpi.unitsInStock")}</p>
            <h3 className="text-[26px] font-bold text-gray-800">
              {loading ? "--" : unitsInStock.toLocaleString()}
            </h3>
            <span className="text-[12px] text-gray-500">
              {t("admin.kpi.unitsInStockSubDynamic", { count: hospitals.length })}
            </span>
          </div>
          <div className="bg-white h-[160px] w-[320px] rounded-lg border border-gray-200 shadow-sm p-[16px] hover:shadow-md transition">
            <h4 className="text-[16px] font-semibold text-gray-800">
              {t("admin.recentActivity.title")}
            </h4>
            <ul className="mt-[10px] text-[13px] text-gray-600 space-y-[6px]">
              {loading && <li>{t("admin.loading")}</li>}
              {!loading && recentActivity.length === 0 && (
                <li>{t("admin.recentActivity.empty")}</li>
              )}
              {!loading &&
                recentActivity.map((item) => <li key={item.id}>{item.label}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full px-[20px] mt-[20px]">
        <h3 className="text-[20px] font-semibold text-gray-800 mb-[12px] border-b border-gray-200 pb-[6px]">
          {t("admin.data.title")}
        </h3>
        <div className="flex flex-wrap gap-[20px]">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[520px] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-[10px]">
              <h4 className="text-[16px] font-semibold text-gray-800">
                {t("admin.data.donorsTitle")}
              </h4>
              <span className="text-[12px] text-gray-500">{t("admin.data.donorsRange")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
                  <tr>
                    <th className="py-[6px]">{t("admin.table.name")}</th>
                    <th className="py-[6px]">{t("admin.table.bloodGroup")}</th>
                    <th className="py-[6px]">{t("admin.table.phone")}</th>
                    <th className="py-[6px]">{t("admin.table.date")}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {loading && (
                    <tr>
                      <td className="py-[8px]" colSpan={4}>
                        {t("admin.loading")}
                      </td>
                    </tr>
                  )}
                  {!loading && recentDonors.length === 0 && (
                    <tr>
                      <td className="py-[8px]" colSpan={4}>
                        {t("admin.empty")}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    recentDonors.map((donor) => (
                      <tr key={donor.id} className="border-b hover:bg-gray-50">
                        <td className="py-[6px]">{donor.name}</td>
                        <td className="py-[6px]">{donor.bloodGroup}</td>
                        <td className="py-[6px]">{donor.phone}</td>
                        <td className="py-[6px]">{formatDate(donor.joined)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[520px] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-[10px]">
              <h4 className="text-[16px] font-semibold text-gray-800">
                {t("admin.data.requestsTitle")}
              </h4>
              <span className="text-[12px] text-gray-500">
                {t("admin.data.requestsRange")}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
                  <tr>
                    <th className="py-[6px]">{t("admin.table.patient")}</th>
                    <th className="py-[6px]">{t("admin.table.bloodGroup")}</th>
                    <th className="py-[6px]">{t("admin.table.units")}</th>
                    <th className="py-[6px]">{t("admin.table.status")}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {loading && (
                    <tr>
                      <td className="py-[8px]" colSpan={4}>
                        {t("admin.loading")}
                      </td>
                    </tr>
                  )}
                  {!loading && recentRequests.length === 0 && (
                    <tr>
                      <td className="py-[8px]" colSpan={4}>
                        {t("admin.empty")}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    recentRequests.map((request) => {
                      const statusClass =
                        request.status === "approved"
                          ? "text-green-600"
                          : request.status === "rejected"
                            ? "text-red-600"
                            : request.urgency === "urgent"
                              ? "text-red-600"
                              : "text-yellow-600";
                      const statusLabel =
                        request.urgency === "urgent" && request.status === "pending"
                          ? t("status.urgent")
                          : t(`status.${request.status}`);
                      return (
                        <tr key={request.id} className="border-b hover:bg-gray-50">
                          <td className="py-[6px]">{request.patientName}</td>
                          <td className="py-[6px]">{request.bloodGroup}</td>
                          <td className="py-[6px]">{request.units}</td>
                          <td className={`py-[6px] ${statusClass}`}>{statusLabel}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[520px] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-[10px]">
              <h4 className="text-[16px] font-semibold text-gray-800">
                {t("admin.data.inventoryTitle")}
              </h4>
              <span className="text-[12px] text-gray-500">
                {t("admin.data.inventoryRange")}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
                  <tr>
                    <th className="py-[6px]">{t("admin.table.bloodGroup")}</th>
                    <th className="py-[6px]">{t("admin.table.units")}</th>
                    <th className="py-[6px]">{t("admin.table.status")}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {loading && (
                    <tr>
                      <td className="py-[8px]" colSpan={3}>
                        {t("admin.loading")}
                      </td>
                    </tr>
                  )}
                  {!loading && inventoryRows.length === 0 && (
                    <tr>
                      <td className="py-[8px]" colSpan={3}>
                        {t("admin.empty")}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    inventoryRows.slice(0, 6).map((item) => {
                      const status = inventoryStatus(item.units);
                      return (
                        <tr key={item.group} className="border-b hover:bg-gray-50">
                          <td className="py-[6px]">{item.group}</td>
                          <td className="py-[6px]">{item.units}</td>
                          <td className={`py-[6px] ${status.cls}`}>{status.label}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex flex-wrap">
          <div className="bg-white m-[30px] h-[300px] w-[300px] rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-[16px]">
            <div className="flex items-center justify-between">
              <h4 className="text-[16px] font-semibold text-gray-800">
                {t("admin.charts.prospectsTitle")}
              </h4>
              <span className="text-[12px] text-gray-500">{prospectsCompletion}%</span>
            </div>
            <div className="flex items-center justify-center mt-[8px]">
              <Gauge
                value={prospectsCompletion}
                startAngle={0}
                endAngle={360}
                innerRadius="80%"
                outerRadius="100%"
                width={200}
                height={200}
              />
            </div>
            <p className="text-[12px] text-gray-500 text-center">
              {t("admin.charts.prospectsCompletion")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white m-[30px] h-[300px] w-[300px] rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-[16px]">
        <div className="flex items-center justify-between">
          <h4 className="text-[16px] font-semibold text-gray-800">
            {t("admin.charts.donorsTitle")}
          </h4>
          <span className="text-[12px] text-gray-500">{t("admin.charts.donorsPeriod")}</span>
        </div>
        <div className="flex items-center justify-center mt-[12px]">
          <div className="h-[180px] w-[180px] border-[16px] border-red-400 border-solid rounded-full flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold text-gray-800">
              {loading ? "--" : donorsTotalChart}
            </span>
            <span className="text-[12px] text-gray-500">{t("admin.charts.donorsTotal")}</span>
          </div>
        </div>
      </div>

      <div className="bg-white m-[30px] h-[320px] w-[420px] rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-[16px]">
        <div className="flex items-center justify-between mb-[6px]">
          <h4 className="text-[16px] font-semibold text-gray-800">
            {t("admin.charts.trendTitle")}
          </h4>
          <span className="text-[12px] text-gray-500">{t("admin.charts.trendPeriod")}</span>
        </div>
        <LineChart
          xAxis={[{ data: trend.labels }]}
          series={[{ data: trend.data }]}
          width={380}
          height={220}
        />
      </div>

      <div className="flex flex-col bg-white m-[20px] h-[520px] w-[220px] rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-[16px]">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center cursor-pointer text-left"
        >
          <FaUser />
          <span className="ml-[10px] font-semibold">{t("admin.sidebar.logout")}</span>
        </button>

        <div className="mt-[20px] text-[13px] text-gray-600">
          <h2 className="font-bold">{t("admin.sidebar.recentDonors")}</h2>
          <ul className="mt-[6px] space-y-[4px]">
            {loading && <li>{t("admin.loading")}</li>}
            {!loading && recentDonors.length === 0 && <li>{t("admin.empty")}</li>}
            {!loading &&
              recentDonors.map((donor, index) => (
                <li key={donor.id}>
                  {index + 1}. {donor.name}
                </li>
              ))}
          </ul>
        </div>

        <div className="mt-[16px]">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-[8px]">
            {t("admin.sidebar.bloodGroups")}
          </h3>
          {loading ? (
            <div className="text-[12px] text-gray-500">{t("admin.loading")}</div>
          ) : pieData.length === 0 ? (
            <div className="text-[12px] text-gray-500">{t("admin.empty")}</div>
          ) : (
            <PieChart
              width={140}
              height={140}
              slotProps={{ legend: { hidden: true } }}
              series={[
                {
                  data: pieData,
                  innerRadius: 35,
                  outerRadius: 55,
                  paddingAngle: 5,
                  cornerRadius: 5,
                  startAngle: -45,
                  endAngle: 225,
                  cx: 70,
                  cy: 70,
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
