import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import { useLanguage } from "../i18n.jsx";
import { getAuthSession } from "../utils/auth.js";

const Footer = () => {
  const { t } = useLanguage();
  const { user } = getAuthSession();

  const buildProtectedLink = (path) =>
    user?.role
      ? { to: path }
      : { to: "/login", state: { from: path } };

  return (
    <div className="bg-red-600 text-white px-[200px] h-[60vh] mt-[50px]">
      <div className="flex justify-between py-[5%]">
        <div className="flex flex-col items-start">
          <img
            src="/logo1.png"
            alt=""
            height={100}
            width={100}
            className="block filter brightness-0"
          />
          <span className="mt-0 leading-tight">
            {t("footer.tagline")}
          </span>
        </div>

        <div className="text-right">
          <h3 className="text-xl font-semibold">{t("footer.quickLinks")}</h3>
          <ul className="mt-2 space-y-2">
            <li className="hover:underline">
              <ScrollLink to="hero" smooth={true} duration={1000}>
                {t("footer.home")}
              </ScrollLink>
            </li>
            <li className="hover:underline">
              <ScrollLink to="featured" smooth={true} duration={1000}>
                {t("footer.aboutUs")}
              </ScrollLink>
            </li>
            <li className="hover:underline">
              <ScrollLink to="donate" smooth={true} duration={1000}>
                {t("footer.donate")}
              </ScrollLink>
            </li>
            <li className="hover:underline">
              <RouterLink {...buildProtectedLink("/request-blood")}>
                {t("footer.requestBlood")}
              </RouterLink>
            </li>
            <li className="hover:underline">
              <ScrollLink to="contact" smooth={true} duration={1000}>
                {t("footer.contactUs")}
              </ScrollLink>
            </li>
            <li className="hover:underline">
              <RouterLink to="/login">{t("footer.admin")}</RouterLink>
            </li>
            <li className="hover:underline">
              <RouterLink {...buildProtectedLink("/hospital-apply")}>
                {t("footer.hospitalApply")}
              </RouterLink>
            </li>
          </ul>
        </div>

        <div className="w-full md:w-1/3">
          <h3 className="text-xl font-semibold">{t("footer.contactTitle")}</h3>
          <p className="mt-2">{t("footer.phone")}: 677109469</p>
          <p className="mt-2">{t("footer.email")}: agbornaomi@gmail.com</p>
        </div>
      </div>

      <div className="mt-8 border-t border-red-800 pt-4 text-center">
        <p>{t("footer.rights")}</p>
        <div className="flex justify-center space-x-4 mt-4">
          <a
            href="https://facebook.com"
            aria-label="Facebook"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            target="_blank"
            rel="noreferrer"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://twitter.com"
            aria-label="Twitter"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            target="_blank"
            rel="noreferrer"
          >
            <FaTwitter />
          </a>
          <a
            href="https://instagram.com"
            aria-label="Instagram"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            target="_blank"
            rel="noreferrer"
          >
            <FaInstagram />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
