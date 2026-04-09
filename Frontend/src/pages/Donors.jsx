import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaDownload,
  FaEnvelope,
  FaFilePdf,
  FaSms,
  FaTrash,
  FaEdit,
  FaUser,
} from "react-icons/fa";
import { LineChart } from "@mui/x-charts/LineChart";
import { useLanguage } from "../i18n.jsx";

const initialRows = [
  {
    id: 1,
    name: "Agbor Naomi",
    phone: "677109469",
    email: "agbornaomi@gmail.com",
    city: "Buea",
    address: "Buea, SW",
    bloodType: "A+",
    diseases: "None",
    joined: "2025-12-12",
    lastDonation: "2026-01-18",
    nextEligible: "2026-04-18",
    status: "Active",
    donationHistory: [0, 1, 0, 1, 1, 0],
  },
  {
    id: 2,
    name: "Prince Ndann",
    phone: "699234111",
    email: "princendann@gmail.com",
    city: "Douala",
    address: "Douala, LT",
    bloodType: "O-",
    diseases: "None",
    joined: "2026-01-08",
    lastDonation: "2026-02-02",
    nextEligible: "2026-05-02",
    status: "Active",
    donationHistory: [1, 0, 1, 0, 0, 1],
  },
  {
    id: 3,
    name: "Brenda Eno",
    phone: "655992018",
    email: "brendaeno@gmail.com",
    city: "Yaounde",
    address: "Yaounde, CE",
    bloodType: "B+",
    diseases: "Asthma",
    joined: "2025-11-20",
    lastDonation: "2025-12-15",
    nextEligible: "2026-03-15",
    status: "Inactive",
    donationHistory: [1, 1, 0, 0, 1, 0],
  },
  {
    id: 4,
    name: "Kelly Blessing",
    phone: "690334221",
    email: "kellyblessing@gmail.com",
    city: "Bamenda",
    address: "Bamenda, NW",
    bloodType: "AB+",
    diseases: "None",
    joined: "2026-02-05",
    lastDonation: "2026-02-10",
    nextEligible: "2026-05-10",
    status: "Active",
    donationHistory: [0, 1, 1, 1, 0, 1],
  },
];

const Donors = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const token = localStorage.getItem("token");
  const authHeader = token ? { token: `Bearer ${token}` } : {};
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showNewDonor, setShowNewDonor] = useState(false);
  const [newDonor, setNewDonor] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    bloodType: "A+",
    diseases: "None",
    joined: "",
    lastDonation: "",
  });
  const [createState, setCreateState] = useState({ loading: false, error: "", success: "" });

  const normalizeDonor = (donor) => {
    const statusValue =
      typeof donor.status === "string"
        ? donor.status
        : donor.status === 0
          ? "Active"
          : "Inactive";
    const joinedDate = donor.joined || donor.date || "";
    const lastDonation = donor.lastDonation || donor.date || "";
    return {
      id: donor._id || donor.id,
      name: donor.name || "",
      phone: donor.tel || donor.phone || "",
      email: donor.email || "",
      city: donor.city || "",
      address: donor.address || "",
      bloodType: donor.bloodgroup || donor.bloodType || "",
      diseases: donor.diseases || "",
      joined: joinedDate,
      lastDonation,
      nextEligible: donor.nextEligible || "",
      status: statusValue,
      donationHistory: donor.donationHistory || [0, 0, 0, 0, 0, 0],
    };
  };

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/donors`, {
          headers: authHeader,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          setRows(data.map(normalizeDonor));
        }
      } catch {
        // keep local fallback rows
      }
    };
    fetchDonors();
  }, [API_URL, authHeader]);

  const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const cities = useMemo(
    () => ["All", ...new Set(rows.map((r) => r.city))],
    [rows]
  );

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    const diff = date - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getEligibilityBadge = (dateStr) => {
    const days = daysUntil(dateStr);
    if (days === null || days <= 0) {
      return { label: t("donors.eligible"), cls: "bg-green-100 text-green-700" };
    }
    if (days <= 30) {
      return { label: t("donors.inDays", { days }), cls: "bg-yellow-100 text-yellow-700" };
    }
    return { label: t("donors.inDays", { days }), cls: "bg-red-100 text-red-700" };
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hit =
          r.name.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (bloodFilter !== "All" && r.bloodType !== bloodFilter) return false;
      if (cityFilter !== "All" && r.city !== cityFilter) return false;
      if (dateFilter) {
        const last = new Date(r.lastDonation);
        const filterDate = new Date(dateFilter);
        if (last < filterDate) return false;
      }
      return true;
    });
  }, [rows, search, bloodFilter, cityFilter, dateFilter]);

  const totalDonors = rows.length;
  const activeDonors = rows.filter((r) => r.status === "Active").length;
  const newThisMonth = rows.filter((r) => {
    const joined = new Date(r.joined);
    const today = new Date();
    const diff = (today - joined) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;
  const eligibleNow = rows.filter((r) => {
    const days = daysUntil(r.nextEligible);
    return days === null || days <= 0;
  }).length;

  const handleEdit = (row) => {
    const updatedName = window.prompt(t("donors.editPrompt"), row.name);
    if (updatedName === null) return;
    if (token) {
      fetch(`${API_URL}/api/v1/donors/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name: updatedName }),
      }).catch(() => {});
    }
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, name: updatedName } : r))
    );
  };

  const handleDelete = (id) => {
    const ok = window.confirm(t("donors.deleteConfirm"));
    if (!ok) return;
    if (token) {
      fetch(`${API_URL}/api/v1/donors/${id}`, {
        method: "DELETE",
        headers: authHeader,
      }).catch(() => {});
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRecordDonation = async () => {
    if (!selectedDonor) return;
    if (!token) {
      window.alert(t("donors.authRequired"));
      return;
    }
    const input = window.prompt(t("donors.recordDonationPrompt"), "");
    const payload = input ? { date: input } : {};
    try {
      const res = await fetch(`${API_URL}/api/v1/donors/${selectedDonor.id}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = normalizeDonor(await res.json());
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedDonor(updated);
      window.alert(t("donors.recordDonationSuccess"));
    } catch (err) {
      window.alert(t("donors.recordDonationError"));
    }
  };

  const handleViewProfile = (donorId = selectedDonor?.id) => {
    if (!donorId) return;
    setSelectedDonor(null);
    navigate(`/admin/donors/${donorId}`);
  };

  const handleCreateDonor = async (e) => {
    e.preventDefault();
    setCreateState({ loading: false, error: "", success: "" });
    if (!newDonor.name || !newDonor.phone || !newDonor.bloodType) {
      setCreateState({ loading: false, error: t("donors.validationRequired"), success: "" });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      name: newDonor.name,
      tel: newDonor.phone,
      email: newDonor.email,
      city: newDonor.city,
      address: newDonor.address,
      bloodgroup: newDonor.bloodType,
      diseases: newDonor.diseases,
      joined: newDonor.joined || today,
      lastDonation: newDonor.lastDonation || today,
      date: newDonor.joined || today,
      status: "Active",
    };
    try {
      if (!token) {
        setCreateState({ loading: false, error: t("donors.authRequired"), success: "" });
        return;
      }
      setCreateState({ loading: true, error: "", success: "" });
      const res = await fetch(`${API_URL}/api/v1/donors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      const created = normalizeDonor(saved);
      setRows((prev) => [created, ...prev]);
      setSearch("");
      setBloodFilter("All");
      setCityFilter("All");
      setDateFilter("");
      setSelectedDonor(created);
      setCreateState({ loading: false, error: "", success: t("donors.createSuccess") });
    } catch (err) {
      setCreateState({ loading: false, error: t("donors.createError"), success: "" });
      return;
    }
    setShowNewDonor(false);
    setNewDonor({
      name: "",
      phone: "",
      email: "",
      city: "",
      address: "",
      bloodType: "A+",
      diseases: "None",
      joined: "",
      lastDonation: "",
    });
  };

  const columns = [
    { field: "id", headerName: t("donors.id"), width: 70 },
    { field: "name", headerName: t("donors.name"), flex: 1, minWidth: 160 },
    { field: "phone", headerName: t("donors.phone"), width: 130 },
    { field: "bloodType", headerName: t("donors.bloodGroup"), width: 110 },
    { field: "lastDonation", headerName: t("donors.lastDonation"), width: 130 },
    {
      field: "eligibility",
      headerName: t("donors.eligibility"),
      width: 140,
      renderCell: (params) => {
        const badge = getEligibilityBadge(params.row.nextEligible);
        return (
          <span className={`px-2 py-[2px] rounded-full text-[12px] ${badge.cls}`}>
            {badge.label}
          </span>
        );
      },
    },
    { field: "city", headerName: t("donors.city"), width: 120 },
    {
      field: "edit",
      headerName: t("donors.edit"),
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <button
          className="text-blue-600 hover:underline flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(params.row);
          }}
        >
          <FaEdit />
          {t("donors.edit")}
        </button>
      ),
    },
    {
      field: "profile",
      headerName: t("donors.viewProfile"),
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <button
          type="button"
          className="text-red-600 hover:underline flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile(params.row.id);
          }}
        >
          <FaUser />
          {t("donors.viewProfile")}
        </button>
      ),
    },
    {
      field: "delete",
      headerName: t("donors.delete"),
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <button
          className="text-red-600 hover:underline flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(params.row.id);
          }}
        >
          <FaTrash />
          {t("donors.delete")}
        </button>
      ),
    },
  ];

  const getInitials = (name) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[20px]">
      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-800">{t("donors.title")}</h1>
          <p className="text-[13px] text-gray-500">
            {t("donors.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <button
            className="bg-white border border-gray-200 text-gray-700 px-[10px] py-[8px] rounded-md text-[12px] flex items-center gap-[6px]"
            onClick={() => window.alert(t("donors.exportCsv"))}
          >
            <FaDownload />
            {t("donors.exportCsv")}
          </button>
          <button
            className="bg-white border border-gray-200 text-gray-700 px-[10px] py-[8px] rounded-md text-[12px] flex items-center gap-[6px]"
            onClick={() => window.alert(t("donors.exportPdf"))}
          >
            <FaFilePdf />
            {t("donors.exportPdf")}
          </button>
          <button
            className="bg-[#1e1e1e] text-white px-[12px] py-[8px] rounded-md text-[12px] font-semibold"
            onClick={() => setShowNewDonor(true)}
          >
            {t("common.newDonor")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-[16px] mt-[20px]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("donors.totalDonors")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">{totalDonors}</h3>
          <span className="text-[12px] text-gray-500">{t("donors.allTime")}</span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("donors.activeDonors")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">{activeDonors}</h3>
          <span className="text-[12px] text-green-600">{t("donors.eligibleDonors")}</span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("donors.newThisMonth")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">{newThisMonth}</h3>
          <span className="text-[12px] text-gray-500">{t("donors.last30Days")}</span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("donors.eligibleNow")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">{eligibleNow}</h3>
          <span className="text-[12px] text-gray-500">{t("donors.canDonate")}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] mt-[20px]">
        <div className="flex flex-wrap gap-[10px] items-center">
          <input
            className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] w-[220px]"
            placeholder={t("donors.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] w-[140px]"
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
          >
            {bloodGroups.map((g) => (
              <option key={g} value={g}>
                {g === "All" ? t("common.all") : g}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] w-[140px]"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-[6px]">
            <FaCalendarAlt className="text-gray-500" />
            <input
              type="date"
              className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <button
            className="text-[12px] text-gray-600 underline"
            onClick={() => {
              setSearch("");
              setBloodFilter("All");
              setCityFilter("All");
              setDateFilter("");
            }}
          >
            {t("common.clearFilters")}
          </button>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
          {t("donors.allDonors")}
        </h2>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          autoHeight
          pageSizeOptions={[5, 10]}
          initialState={{
            pagination: { paginationModel: { pageSize: 5, page: 0 } },
          }}
          onRowClick={(params) => setSelectedDonor(params.row)}
        />
      </div>

      {selectedDonor && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedDonor(null)}
          />
          <div className="absolute right-0 top-0 h-full w-[320px] bg-white shadow-xl p-[16px] overflow-y-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <div className="h-[42px] w-[42px] rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    {getInitials(selectedDonor.name)}
                  </div>
                  <div>
                  <h3 className="text-[16px] font-semibold text-gray-800">
                    {selectedDonor.name}
                  </h3>
                  <span className="text-[12px] text-gray-500">
                    {selectedDonor.bloodType}
                  </span>
                </div>
              </div>
              <button
                className="text-[12px] text-gray-500 underline"
                onClick={() => setSelectedDonor(null)}
              >
                {t("common.close")}
              </button>
            </div>

            <div className="mt-[16px] text-[13px] text-gray-600 space-y-[6px]">
              <div>
                <span className="font-semibold">{t("donors.phone")}:</span>{" "}
                {selectedDonor.phone}
              </div>
              <div>
                <span className="font-semibold">{t("donors.email")}:</span>{" "}
                {selectedDonor.email}
              </div>
              <div>
                <span className="font-semibold">{t("donors.city")}:</span> {selectedDonor.city}
              </div>
              <div>
                <span className="font-semibold">{t("donors.address")}:</span>{" "}
                {selectedDonor.address}
              </div>
              <div>
                <span className="font-semibold">{t("donors.lastDonationLabel")}:</span>{" "}
                {selectedDonor.lastDonation}
              </div>
              <div className="flex items-center gap-[6px]">
                <span className="font-semibold">{t("donors.nextEligible")}:</span>{" "}
                <span
                  className={`px-2 py-[2px] rounded-full text-[12px] ${
                    getEligibilityBadge(selectedDonor.nextEligible).cls
                  }`}
                >
                  {getEligibilityBadge(selectedDonor.nextEligible).label}
                </span>
              </div>
            </div>

            <div className="mt-[16px]">
              <h4 className="text-[14px] font-semibold text-gray-800 mb-[6px]">
                {t("donors.donationHistory")}
              </h4>
              <LineChart
                xAxis={[{ data: [1, 2, 3, 4, 5, 6] }]}
                series={[
                  {
                    data: selectedDonor.donationHistory || [0, 0, 0, 0, 0, 0],
                  },
                ]}
                width={260}
                height={120}
              />
            </div>

            <div className="mt-[16px]">
              <h4 className="text-[14px] font-semibold text-gray-800 mb-[8px]">
                {t("donors.quickActions")}
              </h4>
              <div className="flex flex-wrap gap-[8px]">
                <button className="border border-gray-200 px-[10px] py-[6px] rounded-md text-[12px] flex items-center gap-[6px]">
                  <FaSms />
                  {t("donors.sendSms")}
                </button>
                <button className="border border-gray-200 px-[10px] py-[6px] rounded-md text-[12px] flex items-center gap-[6px]">
                  <FaEnvelope />
                  {t("donors.sendEmail")}
                </button>
                <button
                  className="border border-gray-200 px-[10px] py-[6px] rounded-md text-[12px] flex items-center gap-[6px]"
                  onClick={handleRecordDonation}
                >
                  <FaCalendarAlt />
                  {t("donors.recordDonation")}
                </button>
                <button className="border border-gray-200 px-[10px] py-[6px] rounded-md text-[12px] flex items-center gap-[6px]">
                  <FaCalendarAlt />
                  {t("donors.schedule")}
                </button>
                <button
                  type="button"
                  className="border border-gray-200 px-[10px] py-[6px] rounded-md text-[12px] flex items-center gap-[6px]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleViewProfile();
                  }}
                >
                  <FaUser />
                  {t("donors.viewProfile")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewDonor && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowNewDonor(false)}
          />
          <div className="absolute inset-x-0 top-[10%] mx-auto w-[90%] max-w-[520px] bg-white rounded-lg shadow-xl p-[16px] z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-gray-800">
                {t("donors.form.title")}
              </h3>
              <button
                className="text-[12px] text-gray-500 underline"
                onClick={() => setShowNewDonor(false)}
              >
                {t("common.close")}
              </button>
            </div>

            <form className="mt-[12px] grid grid-cols-1 gap-[10px]" onSubmit={handleCreateDonor}>
              {createState.error && (
                <div className="bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {createState.error}
                </div>
              )}
              {createState.success && (
                <div className="bg-green-50 text-green-700 border border-green-100 px-[10px] py-[8px] rounded-md text-[12px]">
                  {createState.success}
                </div>
              )}
              <input
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("donors.form.fullName")}
                value={newDonor.name}
                onChange={(e) => setNewDonor({ ...newDonor, name: e.target.value })}
              />
              <input
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("donors.form.phone")}
                value={newDonor.phone}
                onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
              />
              <input
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("donors.form.email")}
                value={newDonor.email}
                onChange={(e) => setNewDonor({ ...newDonor, email: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                <input
                  className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                  placeholder={t("donors.form.city")}
                  value={newDonor.city}
                  onChange={(e) => setNewDonor({ ...newDonor, city: e.target.value })}
                />
                <select
                  className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                  value={newDonor.bloodType}
                  onChange={(e) => setNewDonor({ ...newDonor, bloodType: e.target.value })}
                >
                  {bloodGroups.filter((g) => g !== "All").map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("donors.form.address")}
                value={newDonor.address}
                onChange={(e) => setNewDonor({ ...newDonor, address: e.target.value })}
              />
              <input
                className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px]"
                placeholder={t("donors.form.diseases")}
                value={newDonor.diseases}
                onChange={(e) => setNewDonor({ ...newDonor, diseases: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                <div>
                  <label className="text-[12px] text-gray-500">{t("donors.form.joined")}</label>
                  <input
                    type="date"
                    className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] w-full"
                    value={newDonor.joined}
                    onChange={(e) => setNewDonor({ ...newDonor, joined: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[12px] text-gray-500">{t("donors.form.lastDonation")}</label>
                  <input
                    type="date"
                    className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] w-full"
                    value={newDonor.lastDonation}
                    onChange={(e) => setNewDonor({ ...newDonor, lastDonation: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createState.loading}
                className="bg-[#1e1e1e] text-white px-[12px] py-[8px] rounded-md text-[13px] font-semibold w-full sm:w-auto disabled:opacity-60"
              >
                {createState.loading ? t("donors.form.creating") : t("donors.form.create")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors;
