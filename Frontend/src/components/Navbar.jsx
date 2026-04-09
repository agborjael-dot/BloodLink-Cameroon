import { useEffect, useState } from "react";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n.jsx";
import { clearStoredSession, getAuthSession } from "../utils/auth.js";

const Navbar = () => {
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({});

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getAuthSession().user || {});
    };

    syncUser();
    window.addEventListener("storage", syncUser);

    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const handleLogout = () => {
    clearStoredSession();
    setCurrentUser({});
    navigate("/login", { replace: true });
  };

  const buildProtectedLink = (path) =>
    currentUser?.role
      ? { to: path }
      : { to: "/login", state: { from: path } };

  return (
    <div className="flex items-center justify-between h-[80px] px-[200px]">
        <img
          src="logo1.png"
          alt={t("navbar.logoAlt")}
          className="h-[120px] w-auto cursor-pointer filter brightness-0"
        />
<div className="flex items-center gap-[20px]">
  <div className="flex items-center justify-evenly cursor-pointer">
    <ScrollLink to="hero" smooth={true} duration={1000} className="mr-3 text-[18px] font-semibold">
      {t("navbar.home")}
    </ScrollLink>
    <ScrollLink to="cnts" smooth={true} duration={1000} className="mr-3 text-[18px] font-semibold">
      {t("navbar.cnts")}
    </ScrollLink>
    <ScrollLink to="featured" smooth={true} duration={1000} className="mr-3 text-[18px] font-semibold">
      {t("navbar.aboutUs")}
    </ScrollLink>
    <ScrollLink to="contact" smooth={true} duration={1000} className="mr-3 text-[18px] font-semibold">
      {t("navbar.contactUs")}
    </ScrollLink>
    <RouterLink {...buildProtectedLink("/request-blood")} className="mr-3 text-[18px] font-semibold">
      {t("navbar.requestBlood")}
    </RouterLink>
    <RouterLink {...buildProtectedLink("/hospital-apply")} className="mr-3 text-[18px] font-semibold">
      {t("navbar.hospitalApply")}
    </RouterLink>
    {currentUser?.role ? (
      <button
        type="button"
        onClick={handleLogout}
        className="mr-3 text-[18px] font-semibold"
      >
        {t("common.logout")}
      </button>
    ) : (
      <RouterLink to="/login" className="mr-3 text-[18px] font-semibold">
        {t("login.signIn")}
      </RouterLink>
    )}
  </div>
  <div className="flex items-center gap-[6px]">
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
</div>
    </div>

  )
}

export default Navbar
