
import { useLanguage } from "../i18n.jsx";

const Featured = () => {
  const { t } = useLanguage();
  return (
    <div className="flex px-[200px] mt-[100px]">
        <div className="h-[400px] w-[500px] bg-gray-200 p-6">
            <h1 className="text-[25px] font-semibold">{t("featured.title")}</h1>
            <hr className="bg-red-500 w-[150px] h-[3px] my-[20px]"></hr>
            <span>{t("featured.description")}</span>
            <ul>
                <li className="mt-3">1. {t("featured.items.one")}</li>
                <li className="mt-3">2. {t("featured.items.two")}</li>
                <li className="mt-3">3. {t("featured.items.three")}</li>
                <li className="mt-3">4. {t("featured.items.four")}</li>
                <li className="mt-3">5. {t("featured.items.five")}</li>
            </ul>

        </div>
        <div className="h-[450px] w-[500px] ml-[30px]">
            <img src="Featured1.jpg" alt="Featured Image" className="w-[200px] h-[250px] object-cover rounded-lg" />
        </div>

    </div>
  )
}

export default Featured
