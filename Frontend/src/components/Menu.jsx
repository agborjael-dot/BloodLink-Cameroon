
import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n.jsx";
import {
  ADMIN_ROLES,
  NATIONAL_ROLES,
  REGIONAL_ROLES,
  SUPER_ADMIN_ROLES,
  getStoredUser,
  hasRole,
} from "../utils/auth.js";
import {
  FaHome,
  FaUsers,
  FaHospital,
  FaClipboardList,
  FaChartBar,
  FaMapMarkedAlt,
  FaGlobeAfrica,
  FaUserShield,
  FaCalendarAlt,
  FaFileAlt,
  FaHdd,
  FaElementor,
  FaCog,
  FaBox,
} from "react-icons/fa";
const Menu = () => {
  const { lang, setLang, t } = useLanguage();
  const currentUser = getStoredUser();
  const sections = [
    [
      { key: "home", labelKey: "menu.home", icon: FaHome, to: "/admin", roles: ADMIN_ROLES },
    ],
    [
      { key: "donors", labelKey: "menu.donors", icon: FaBox, to: "/admin/donors", roles: ADMIN_ROLES },
      { key: "prospects", labelKey: "menu.prospects", icon: FaUsers, to: "/admin/prospects", roles: ADMIN_ROLES },
      { key: "hospital", labelKey: "menu.hospital", icon: FaHospital, to: "/admin/hospital", roles: ADMIN_ROLES },
      { key: "regional", labelKey: "menu.regional", icon: FaMapMarkedAlt, to: "/admin/regional", roles: REGIONAL_ROLES },
      { key: "national", labelKey: "menu.national", icon: FaGlobeAfrica, to: "/admin/national", roles: NATIONAL_ROLES },
      { key: "superAdmin", labelKey: "menu.superAdmin", icon: FaUserShield, to: "/admin/super", roles: SUPER_ADMIN_ROLES },
      { key: "requests", labelKey: "menu.bloodRequests", icon: FaClipboardList, to: "/admin/requests", roles: ADMIN_ROLES },
      { key: "orders", labelKey: "menu.orders", icon: FaHome },
    ],
    [
      { key: "elements", labelKey: "menu.elements", icon: FaElementor },
      { key: "settings", labelKey: "menu.settings", icon: FaCog },
      { key: "backups", labelKey: "menu.backups", icon: FaHdd },
    ],
    [
      { key: "charts", labelKey: "menu.charts", icon: FaChartBar },
      { key: "logs", labelKey: "menu.allLogs", icon: FaFileAlt },
      { key: "calendar", labelKey: "menu.calendar", icon: FaCalendarAlt },
    ],
  ];

  const itemClass = (isActive) =>
    `flex items-center w-full text-[20px] font-semibold cursor-pointer mt-[20px] px-3 py-2 rounded-md transition-colors duration-150 ${
      isActive ? "bg-red-600" : "bg-transparent hover:bg-red-500/20"
    }`;

  const visibleSections = sections
    .map((section) =>
      section.filter(({ roles }) => {
        if (!roles) return true;
        return hasRole(currentUser, roles);
      })
    )
    .filter((section) => section.length > 0);

  return (
    <div className="h-[100vh] bg-gray-100 p-[20px] w-[350px] shadow-lg">
      <div className="flex items-center justify-between mb-[10px]">
        <span className="text-[14px] font-semibold text-gray-700">
          {t("common.language")}
        </span>
        <select
          className="border border-gray-300 rounded-md px-[8px] py-[4px] text-[13px]"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="en">{t("common.english")}</option>
          <option value="fr">{t("common.french")}</option>
        </select>
      </div>
      <ul className="flex flex-col items-start justify-start mt-[20px] pl-[20px]">
        {visibleSections.map((section, sectionIndex) => (
          <div key={`section-${sectionIndex}`} className="w-full">
            {section.map(({ key, labelKey, icon: Icon, to }) => {
              if (to) {
                return (
                  <li key={key} className="w-full">
                    <NavLink
                      to={to}
                      end={to === "/admin"}
                      className={({ isActive }) => itemClass(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`mr-[15px] ${isActive ? "text-white" : "text-red-500"}`} />
                          <span className={isActive ? "text-white" : "text-black"}>
                            {t(labelKey)}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              }
              return (
                <li key={key} className={itemClass(false)}>
                  <Icon className="mr-[15px] text-red-500" />
                  <span className="text-black">{t(labelKey)}</span>
                </li>
              );
            })}
            {sectionIndex < sections.length - 1 ? (
              <hr className="w-full my-[20px] border-gray-300" />
            ) : null}
          </div>
        ))}

      </ul>

    </div>
  );
};

export default Menu;
