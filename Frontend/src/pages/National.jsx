import { useLanguage } from "../i18n.jsx";

const National = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 px-[20px] py-[20px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-800">
            {t("national.title")}
          </h1>
          <p className="text-[13px] text-gray-500">{t("national.subtitle")}</p>
        </div>
        <button className="bg-red-600 text-white text-[13px] font-semibold px-[14px] py-[8px] rounded-md shadow-sm hover:bg-red-700 transition">
          {t("national.actions.broadcast")}
        </button>
      </div>

      <div className="flex flex-wrap gap-[16px] mt-[20px]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("national.kpi.totalUnits")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">12,480</h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("national.kpi.regionsCritical")}</p>
          <h3 className="text-[26px] font-bold text-red-600">2</h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("national.kpi.alertsActive")}</p>
          <h3 className="text-[26px] font-bold text-gray-800">6</h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px] w-[220px]">
          <p className="text-[12px] text-gray-500">{t("national.kpi.expiring")}</p>
          <h3 className="text-[26px] font-bold text-yellow-600">210</h3>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px] mb-[12px]">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-800">
              {t("national.section.bloodMap")}
            </h2>
            <p className="text-[12px] text-gray-500">
              {t("national.section.bloodMapSubtitle")}
            </p>
          </div>
          <span className="text-[12px] text-gray-500">{t("national.section.mapHint")}</span>
        </div>
        <div className="h-[260px] rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center text-[12px] text-gray-500">
          {t("national.section.mapPlaceholder")}
        </div>
      </div>

      <div className="grid gap-[20px] mt-[20px] lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
          <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
            {t("national.section.alerts")}
          </h2>
          <ul className="space-y-[10px] text-[13px] text-gray-700">
            <li className="border border-gray-200 rounded-md px-[10px] py-[8px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Priority 1 - O-</span>
                <span className="text-[12px] bg-red-100 text-red-700 px-[8px] py-[4px] rounded-full">
                  {t("national.alerts.priority")}
                </span>
              </div>
              <p className="text-[12px] text-gray-500">Nationwide alert - 45 mins ago</p>
            </li>
            <li className="border border-gray-200 rounded-md px-[10px] py-[8px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold">National shortage - AB+</span>
                <span className="text-[12px] bg-yellow-100 text-yellow-700 px-[8px] py-[4px] rounded-full">
                  {t("national.alerts.warning")}
                </span>
              </div>
              <p className="text-[12px] text-gray-500">Targeted to 4 regions</p>
            </li>
            <li className="border border-gray-200 rounded-md px-[10px] py-[8px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Flood response - Littoral</span>
                <span className="text-[12px] bg-blue-100 text-blue-700 px-[8px] py-[4px] rounded-full">
                  {t("national.alerts.info")}
                </span>
              </div>
              <p className="text-[12px] text-gray-500">Broadcast sent to hospitals</p>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
          <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
            {t("national.section.insights")}
          </h2>
          <div className="space-y-[12px]">
            <div className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] text-gray-700">
              <p className="font-semibold">{t("national.insights.demandTrend")}</p>
              <p className="text-[12px] text-gray-500">+12% vs last month</p>
            </div>
            <div className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] text-gray-700">
              <p className="font-semibold">{t("national.insights.distribution")}</p>
              <p className="text-[12px] text-gray-500">O+ 38%, A+ 24%, B+ 16%</p>
            </div>
            <div className="border border-gray-200 rounded-md px-[10px] py-[8px] text-[13px] text-gray-700">
              <p className="font-semibold">{t("national.insights.forecast")}</p>
              <p className="text-[12px] text-gray-500">Projected shortage in 2 regions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
          {t("national.section.audit")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="text-gray-600 border-b bg-gray-50 text-[12px] uppercase tracking-wide">
              <tr>
                <th className="py-[6px]">{t("national.table.from")}</th>
                <th className="py-[6px]">{t("national.table.to")}</th>
                <th className="py-[6px]">{t("national.table.units")}</th>
                <th className="py-[6px]">{t("national.table.status")}</th>
                <th className="py-[6px]">{t("national.table.date")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b hover:bg-gray-50">
                <td className="py-[6px]">Centre</td>
                <td className="py-[6px]">Littoral</td>
                <td className="py-[6px]">84</td>
                <td className="py-[6px] text-green-600">{t("national.audit.surplus")}</td>
                <td className="py-[6px]">Feb 18</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-[6px]">North West</td>
                <td className="py-[6px]">South West</td>
                <td className="py-[6px]">46</td>
                <td className="py-[6px] text-yellow-600">{t("national.audit.balanced")}</td>
                <td className="py-[6px]">Feb 20</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-[6px]">Far North</td>
                <td className="py-[6px]">Centre</td>
                <td className="py-[6px]">120</td>
                <td className="py-[6px] text-red-600">{t("national.audit.deficit")}</td>
                <td className="py-[6px]">Feb 21</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-[20px] bg-white rounded-lg border border-gray-200 shadow-sm p-[16px]">
        <h2 className="text-[16px] font-semibold text-gray-800 mb-[10px]">
          {t("national.section.policy")}
        </h2>
        <div className="text-[13px] text-gray-700 space-y-[8px]">
          <p>{t("national.policy.title")}</p>
          <p className="text-gray-500">{t("national.policy.note")}</p>
          <button className="mt-[6px] border border-gray-300 text-[12px] font-semibold px-[12px] py-[6px] rounded-md hover:bg-gray-100 transition">
            {t("national.policy.cta")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default National;
