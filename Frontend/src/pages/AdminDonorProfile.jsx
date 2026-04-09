import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaHeartbeat,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRegClock,
  FaTint,
  FaUser,
} from "react-icons/fa";
import { useLanguage } from "../i18n.jsx";

const formatDate = (value, fallback) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const statusTone = (status = "") => {
  const normalized = status.toLowerCase();
  if (normalized.includes("active")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (normalized.includes("pending")) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const AdminDonorProfile = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { token: `Bearer ${token}` } : {};
  }, []);
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDonor = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/api/v1/donors/find/${id}`, {
          headers: authHeader,
        });
        if (!res.ok) throw new Error("Failed to load donor");

        const data = await res.json();
        if (!active) return;
        setDonor(data);
      } catch {
        if (active) setError(t("donorProfile.loadError"));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDonor();

    return () => {
      active = false;
    };
  }, [API_URL, authHeader, id, t]);

  const detailRows = useMemo(() => {
    if (!donor) return [];

    return [
      { icon: FaPhoneAlt, label: t("donors.phone"), value: donor.tel || donor.phone },
      { icon: FaEnvelope, label: t("donors.email"), value: donor.email },
      { icon: FaMapMarkerAlt, label: t("donors.city"), value: donor.city },
      { icon: FaMapMarkerAlt, label: t("donors.address"), value: donor.address },
      { icon: FaRegClock, label: t("donors.lastDonationLabel"), value: formatDate(donor.lastDonation, "") },
      { icon: FaRegClock, label: t("donors.nextEligible"), value: formatDate(donor.nextEligible, "") },
      { icon: FaHeartbeat, label: t("donors.diseases"), value: donor.diseases },
      { icon: FaUser, label: t("donors.status"), value: donor.status },
    ];
  }, [donor, t]);

  const spotlightCards = useMemo(() => {
    if (!donor) return [];

    return [
      {
        label: t("donors.bloodGroup"),
        value: donor.bloodgroup || donor.bloodType || t("profilePage.emptyValue"),
        icon: FaTint,
      },
      {
        label: t("donors.lastDonationLabel"),
        value: formatDate(donor.lastDonation, t("profilePage.emptyValue")),
        icon: FaRegClock,
      },
      {
        label: t("donors.nextEligible"),
        value: formatDate(donor.nextEligible, t("profilePage.emptyValue")),
        icon: FaHeartbeat,
      },
    ];
  }, [donor, t]);

  const displayValue = (value) => value || t("profilePage.emptyValue");
  const donorInitials = (donor?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#fffaf5_24%,#f8fafc_100%)] px-[20px] py-[28px]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-40px] top-[10px] h-[220px] w-[220px] rounded-full bg-red-100/80 blur-3xl" />
        <div className="absolute right-[12%] top-[100px] h-[180px] w-[180px] rounded-full bg-orange-100/75 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1160px]">
        <div className="rounded-[30px] bg-[linear-gradient(135deg,#7f1d1d_0%,#b91c1c_42%,#fb923c_100%)] p-[1px] shadow-[0_26px_80px_rgba(127,29,29,0.18)]">
          <div className="rounded-[29px] bg-[linear-gradient(140deg,rgba(255,255,255,0.94),rgba(255,251,235,0.92))] p-[22px]">
            <div className="flex flex-wrap items-start justify-between gap-[18px]">
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[92px] w-[92px] items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,#fee2e2_0%,#fecaca_100%)] text-[28px] font-semibold text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  {donorInitials || "?"}
                </div>
                <div>
                  <div className="inline-flex items-center gap-[8px] rounded-full border border-red-200 bg-white/85 px-[12px] py-[6px] text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700">
                    <FaTint className="text-[12px]" />
                    {t("donorProfile.title")}
                  </div>
                  <h1 className="mt-[14px] text-[31px] font-semibold leading-[1.05] text-slate-900">
                    {displayValue(donor?.name)}
                  </h1>
                  <div className="mt-[12px] flex flex-wrap items-center gap-[10px]">
                    <span className={`inline-flex rounded-full border px-[10px] py-[5px] text-[12px] font-semibold ${statusTone(donor?.status || "")}`}>
                      {displayValue(donor?.status)}
                    </span>
                    <span className="inline-flex items-center gap-[8px] rounded-full border border-slate-200 bg-white px-[12px] py-[5px] text-[13px] font-medium text-slate-700">
                      <FaEnvelope className="text-[11px] text-red-500" />
                      {displayValue(donor?.email)}
                    </span>
                    <span className="inline-flex items-center gap-[8px] rounded-full border border-slate-200 bg-white px-[12px] py-[5px] text-[13px] font-medium text-slate-700">
                      <FaPhoneAlt className="text-[11px] text-red-500" />
                      {displayValue(donor?.tel || donor?.phone)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/admin/donors"
                className="inline-flex items-center justify-center gap-[8px] rounded-full border border-slate-200 bg-white px-[16px] py-[11px] text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FaArrowLeft className="text-[12px]" />
                {t("donorProfile.back")}
              </Link>
            </div>

            <div className="mt-[24px] grid gap-[12px] md:grid-cols-3">
              {spotlightCards.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-red-100 bg-white/88 px-[16px] py-[14px] shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-center gap-[10px] text-slate-500">
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-red-50 text-red-600">
                      <Icon className="text-[13px]" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</span>
                  </div>
                  <p className="mt-[12px] text-[17px] font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-[24px] rounded-[24px] border border-slate-200 bg-white px-[22px] py-[18px] text-[14px] text-slate-600 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            {t("donorProfile.loading")}
          </div>
        ) : error ? (
          <div className="mt-[24px] rounded-[24px] border border-red-100 bg-red-50 px-[22px] py-[18px] text-[14px] text-red-700 shadow-[0_18px_48px_rgba(127,29,29,0.08)]">
            {error}
          </div>
        ) : (
          <div className="mt-[22px] grid gap-[18px] lg:grid-cols-[0.88fr_1.12fr]">
            <aside className="rounded-[28px] border border-slate-200 bg-white p-[22px] shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <h2 className="text-[18px] font-semibold text-slate-900">{t("donorProfile.summaryTitle")}</h2>
              <p className="mt-[6px] text-[13px] leading-[1.6] text-slate-500">
                {t("donorProfile.summaryBody")}
              </p>

              <div className="mt-[18px] space-y-[12px]">
                <div className="rounded-[22px] bg-[linear-gradient(135deg,#fff5f5_0%,#fffaf5_100%)] p-[16px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t("donorProfile.statusCard")}
                  </p>
                  <p className="mt-[8px] text-[19px] font-semibold text-slate-900">
                    {displayValue(donor?.status)}
                  </p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-[16px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t("donors.city")}
                  </p>
                  <p className="mt-[8px] text-[16px] font-semibold text-slate-900">
                    {displayValue(donor?.city)}
                  </p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-[16px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t("donors.address")}
                  </p>
                  <p className="mt-[8px] text-[15px] font-medium leading-[1.6] text-slate-800">
                    {displayValue(donor?.address)}
                  </p>
                </div>
              </div>
            </aside>

            <section className="rounded-[28px] border border-slate-200 bg-white p-[22px] shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <h2 className="text-[18px] font-semibold text-slate-900">{t("donorProfile.detailsTitle")}</h2>
              <p className="mt-[6px] text-[13px] leading-[1.6] text-slate-500">
                {t("donorProfile.detailsBody")}
              </p>

              <div className="mt-[18px] grid gap-[14px] md:grid-cols-2">
                {detailRows.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-[16px]"
                  >
                    <div className="flex items-center gap-[10px] text-slate-500">
                      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-red-50 text-red-600">
                        <Icon className="text-[13px]" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">{label}</span>
                    </div>
                    <p className="mt-[12px] text-[15px] font-semibold leading-[1.6] text-slate-900">
                      {displayValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDonorProfile;
