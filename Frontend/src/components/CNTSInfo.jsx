import { useLanguage } from "../i18n.jsx";

const CNTSInfo = () => {
  const { t } = useLanguage();
  return (
    <section className="bg-white px-[200px] py-[60px]">
      <div className="flex flex-wrap items-start gap-[40px]">
        <div className="flex-1 min-w-[260px]">
          <h2 className="text-[28px] font-bold text-gray-800">{t("cnts.aboutTitle")}</h2>
          <p className="mt-[12px] text-[16px] text-gray-600">
            {t("cnts.aboutBody")}
          </p>
          <a
            className="inline-block mt-[16px] text-red-600 font-semibold"
            href="https://cnts-nbts.cm/"
            target="_blank"
            rel="noreferrer"
          >
            {t("cnts.visitWebsite")}
          </a>
        </div>
        <div className="w-[340px] bg-gray-100 p-[24px] shadow-xl">
          <h3 className="text-[18px] font-semibold">{t("cnts.contactTitle")}</h3>
          <div className="mt-[12px] text-[15px] text-gray-700 space-y-[8px]">
            <div>
              <span className="font-semibold">{t("cnts.addressLabel")}:</span> Cameroon, AV
              Jean-paul II-Yaounde, BP:33165
            </div>
            <div>
              <span className="font-semibold">{t("cnts.emailLabel")}:</span>{" "}
              <a className="text-red-600" href="mailto:support@cnts-nbts.cm">
                support@cnts-nbts.cm
              </a>
            </div>
            <div>
              <span className="font-semibold">{t("cnts.phoneLabel")}:</span>{" "}
              <a className="text-red-600" href="tel:+237222208383">
                +237 222208383
              </a>{" "}
              /{" "}
              <a className="text-red-600" href="tel:+237222208706">
                +237 222208706
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CNTSInfo;
