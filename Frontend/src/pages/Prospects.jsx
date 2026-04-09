import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { FaCheck, FaTimes, FaUserClock } from "react-icons/fa";
import { useLanguage } from "../i18n.jsx";

const Prospects = () => {
  const { t } = useLanguage();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const [rows, setRows] = useState([]);
  const token = localStorage.getItem("token");
  const authHeader = token ? { token: `Bearer ${token}` } : {};
  const [actionState, setActionState] = useState({ loadingId: null, error: "", success: "" });

  const normalizeProspect = (prospect) => {
    const submittedRaw = prospect.date || prospect.createdAt || "";
    const submitted = submittedRaw
      ? new Date(submittedRaw).toISOString().slice(0, 10)
      : "";
    const statusValue =
      typeof prospect.status === "number"
        ? prospect.status === 1
          ? "Approved"
          : prospect.status === 2
            ? "Rejected"
            : "Pending"
        : prospect.status || "Pending";
    return {
      id: prospect._id || prospect.id,
      name: prospect.name || "",
      phone: prospect.tel || prospect.phone || "",
      address: prospect.address || "",
      bloodType: prospect.bloodgroup || prospect.bloodType || "",
      diseases: prospect.diseases || "None",
      submitted,
      status: statusValue,
      email: prospect.email || "",
      weight: prospect.weight || "",
      age: prospect.age || "",
    };
  };

  useEffect(() => {
    const fetchProspects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/prospects`, {
          headers: authHeader,
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (Array.isArray(data)) {
          setRows(data.map(normalizeProspect));
          return;
        }
        setRows([]);
      } catch (err) {
        setRows([]);
      }
    };
    fetchProspects();
  }, [API_URL, authHeader]);

  const handleApprove = async (row) => {
    if (!token) {
      setActionState({ loadingId: null, error: t("prospects.authRequired"), success: "" });
      return;
    }
    if (row.status !== "Pending") return;
    setActionState({ loadingId: row.id, error: "", success: "" });
    const today = new Date().toISOString().slice(0, 10);
    const donorPayload = {
      name: row.name,
      tel: row.phone,
      email: row.email,
      address: row.address,
      bloodgroup: row.bloodType,
      diseases: row.diseases,
      weight: row.weight || undefined,
      age: row.age || undefined,
      date: today,
      joined: today,
      lastDonation: today,
      status: "Active",
    };
    try {
      const donorRes = await fetch(`${API_URL}/api/v1/donors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(donorPayload),
      });
      if (!donorRes.ok) throw new Error("Donor create failed");
      await fetch(`${API_URL}/api/v1/prospects/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ status: 1 }),
      }).catch(() => {});
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: "Approved" } : r))
      );
      setActionState({ loadingId: null, error: "", success: t("prospects.approveSuccess") });
    } catch (err) {
      setActionState({ loadingId: null, error: t("prospects.actionError"), success: "" });
    }
  };

  const handleReject = async (row) => {
    if (!token) {
      setActionState({ loadingId: null, error: t("prospects.authRequired"), success: "" });
      return;
    }
    if (row.status !== "Pending") return;
    setActionState({ loadingId: row.id, error: "", success: "" });
    try {
      await fetch(`${API_URL}/api/v1/prospects/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ status: 2 }),
      });
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: "Rejected" } : r))
      );
      setActionState({ loadingId: null, error: "", success: t("prospects.rejectSuccess") });
    } catch (err) {
      setActionState({ loadingId: null, error: t("prospects.actionError"), success: "" });
    }
  };

  const pendingCount = rows.filter((r) => r.status === "Pending").length;
  const latestRows = useMemo(() => rows.slice(0, 3), [rows]);

  const columns = [
    { field: "id", headerName: t("prospects.id"), width: 70 },
    { field: "name", headerName: t("prospects.name"), flex: 1, minWidth: 160 },
    { field: "phone", headerName: t("prospects.phone"), width: 130 },
    { field: "address", headerName: t("prospects.address"), flex: 1, minWidth: 160 },
    { field: "bloodType", headerName: t("prospects.bloodType"), width: 120 },
    { field: "diseases", headerName: t("prospects.diseases"), flex: 1, minWidth: 140 },
    { field: "submitted", headerName: t("prospects.submitted"), width: 120 },
    {
      field: "status",
      headerName: t("prospects.status"),
      width: 120,
      renderCell: (params) => {
        const value = params.value;
        const statusLabel =
          value === "Approved"
            ? t("status.approved")
            : value === "Rejected"
            ? t("status.rejected")
            : t("status.pending");
        const color =
          value === "Approved"
            ? "bg-green-100 text-green-700"
            : value === "Rejected"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";
        return (
          <span className={`px-2 py-[2px] rounded-full text-[12px] ${color}`}>
            {statusLabel}
          </span>
        );
      },
    },
    {
      field: "actions",
      headerName: t("prospects.actions"),
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[4px] sm:gap-[8px]">
          <button
            className="text-green-700 hover:underline flex items-center gap-1 text-[12px] sm:text-[13px] disabled:opacity-50"
            onClick={() => handleApprove(params.row)}
            disabled={params.row.status !== "Pending" || actionState.loadingId === params.row.id}
          >
            <FaCheck />
            {actionState.loadingId === params.row.id ? t("prospects.approving") : t("prospects.approve")}
          </button>
          <button
            className="text-red-600 hover:underline flex items-center gap-1 text-[12px] sm:text-[13px] disabled:opacity-50"
            onClick={() => handleReject(params.row)}
            disabled={params.row.status !== "Pending" || actionState.loadingId === params.row.id}
          >
            <FaTimes />
            {actionState.loadingId === params.row.id ? t("prospects.rejecting") : t("prospects.reject")}
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[20px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-800">
            {t("prospects.title")}
          </h1>
          <p className="text-[13px] text-gray-500">
            {t("prospects.subtitle")}
          </p>
        </div>
        <button className="bg-[#1e1e1e] text-white px-[12px] sm:px-[14px] py-[8px] sm:py-[10px] cursor-pointer font-semibold rounded-md text-[13px] sm:text-[14px]">
          {t("common.newProspect")}
        </button>
      </div>
      {actionState.error && (
        <div className="mt-[10px] bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
          {actionState.error}
        </div>
      )}
      {actionState.success && (
        <div className="mt-[10px] bg-green-50 text-green-700 border border-green-100 px-[10px] py-[8px] rounded-md text-[12px]">
          {actionState.success}
        </div>
      )}

      <div className="flex flex-wrap gap-[20px] mt-[20px]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[260px]">
          <div className="flex items-center gap-[10px] text-gray-700">
            <FaUserClock />
            <span className="font-semibold">{t("prospects.pendingProspects")}</span>
          </div>
          <div className="mt-[12px] text-[30px] font-bold text-gray-800">
            {pendingCount}
          </div>
          <p className="text-[12px] text-gray-500">{t("prospects.awaitingReview")}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[360px]">
          <h3 className="text-[16px] font-semibold text-gray-800">
            {t("prospects.latestProspects")}
          </h3>
          <ul className="mt-[10px] text-[13px] text-gray-600 space-y-[6px]">
            {latestRows.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <span>{r.name}</span>
                <span className="text-gray-500">{r.bloodType}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
          {t("prospects.allProspects")}
        </h2>
        <DataGrid
          rows={rows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          autoHeight
          pageSizeOptions={[5, 10]}
          initialState={{
            pagination: { paginationModel: { pageSize: 5, page: 0 } },
          }}
        />
      </div>
    </div>
  )
}

export default Prospects
