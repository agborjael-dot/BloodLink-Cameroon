
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n.jsx";
import { getAuthSession } from "../utils/auth.js";

const Hero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navigateToProtectedPage = (path) => {
    if (getAuthSession().user) {
      navigate(path);
      return;
    }

    navigate("/login", { state: { from: path } });
  };

  return (
    <div className="bg-[url('/hero1.jpg')] bg-no-repeat bg-cover bg-center h-[90vh] px-[200px]">

<div className="flex flex-col text-white w-[50%] pt-[10%]">

    <span className="text-[30px] mt-3">{t("hero.tagline")}</span>
    <h1 className="text-[38px] mt-3">{t("hero.headline")}</h1>
    <div className="flex items-center mt-[20px]">
        <button className="bg-red-500 p-[10px] w-[200px] text-white cursor-pointer mr-9">
          {t("hero.donateNow")}
        </button>
        <button
          className="bg-gray-500 p-[10px] w-[200px] text-white cursor-pointer mr-9"
          onClick={() => navigateToProtectedPage("/request-blood")}
        >
          {t("hero.requestBlood")}
        </button>

    </div>

</div>
    </div>
  )
}

export default Hero
