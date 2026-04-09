import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n.jsx";

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITEKEY || "";
const getTurnstileErrorMessage = (errorCode) => {
  const code = `${errorCode || ""}`;

  if (code.startsWith("300")) {
    return "Turnstile challenge failed temporarily. Resetting the check automatically. Please try again.";
  }

  if (code.startsWith("110200")) {
    return "Turnstile rejected this hostname. Add your current local hostname in Cloudflare Turnstile settings.";
  }

  if (code.startsWith("110100") || code.startsWith("110110") || code.startsWith("400020")) {
    return "Turnstile site key is invalid. Check the site key in Frontend/.env.";
  }

  if (code.startsWith("400070")) {
    return "Turnstile site key is disabled in Cloudflare.";
  }

  if (code.startsWith("200500")) {
    return "Turnstile could not reach challenges.cloudflare.com. Disable blockers, VPN, or try another network.";
  }

  return `Turnstile could not verify the request (${code || "unknown error"}). Refresh and try again.`;
};

const loadTurnstileScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.turnstile) {
      resolve(window.turnstile);
      return;
    }

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error("Unable to load Cloudflare Turnstile."));
    document.head.appendChild(script);
  });

const Contacts = () => {
  const { t } = useLanguage();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    tel: "",
    email: "",
    address: "",
    weight: "",
    bloodgroup: "A+",
    age: "",
    diseases: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);

  const clearTurnstileRetry = () => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const scheduleTurnstileRetry = () => {
    clearTurnstileRetry();
    retryTimeoutRef.current = window.setTimeout(() => {
      retryTimeoutRef.current = null;
      if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.reset(widgetIdRef.current);
      }
    }, 1500);
  };

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) {
      return undefined;
    }

    let isMounted = true;

    loadTurnstileScript()
      .then((turnstile) => {
        if (!isMounted || !turnstileRef.current) return;

        if (widgetIdRef.current !== null) {
          turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action: "prospect_form",
          size: "flexible",
          retry: "auto",
          "retry-interval": 8000,
          "refresh-expired": "auto",
          "refresh-timeout": "auto",
          callback: (token) => {
            clearTurnstileRetry();
            setTurnstileToken(token);
            setTurnstileReady(true);
            setError("");
          },
          "expired-callback": () => {
            clearTurnstileRetry();
            setTurnstileToken("");
            setTurnstileReady(false);
            setError("Turnstile expired. Complete the check again before submitting.");
          },
          "timeout-callback": () => {
            clearTurnstileRetry();
            setTurnstileToken("");
            setTurnstileReady(false);
            setError("Turnstile timed out. Please complete the check again.");
          },
          "error-callback": (errorCode) => {
            const code = `${errorCode || ""}`;
            setTurnstileToken("");
            setTurnstileReady(false);
            setError(getTurnstileErrorMessage(code));
            if (code.startsWith("300")) {
              scheduleTurnstileRetry();
            }
            return false;
          },
        });
      })
      .catch((scriptError) => {
        if (isMounted) {
          setTurnstileReady(false);
          setError(scriptError.message);
        }
      });

    return () => {
      isMounted = false;
      clearTurnstileRetry();
    };
  }, []);

  const resetTurnstile = () => {
    clearTurnstileRetry();
    if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setTurnstileToken("");
    setTurnstileReady(false);
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.tel || !form.bloodgroup) {
      setError(t("contacts.validationRequired"));
      return;
    }

    if (!TURNSTILE_SITE_KEY) {
      setError("Turnstile site key is missing. Set VITE_TURNSTILE_SITEKEY in the frontend env.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete Turnstile verification before submitting.");
      return;
    }

    setStatus("submitting");
    try {
      const payload = {
        ...form,
        date: new Date().toISOString().slice(0, 10),
        turnstileToken,
      };
      const res = await fetch(`${API_URL}/api/v1/prospects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let backendMessage = "";
        try {
          const data = await res.json();
          backendMessage = data.message || "";
        } catch {
          backendMessage = "";
        }
        throw new Error(backendMessage || t("contacts.error"));
      }
      setSuccess(t("contacts.success"));
      setForm({
        name: "",
        tel: "",
        email: "",
        address: "",
        weight: "",
        bloodgroup: "A+",
        age: "",
        diseases: "",
      });
      resetTurnstile();
    } catch (err) {
      setError(err.message || t("contacts.error"));
      resetTurnstile();
    } finally {
      setStatus("idle");
    }
  };
  return (
    <div className="flex items-center justify-center my-[100px]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col bg-gray-100 w-[50%] h-auto p-[50px]"
        >
            <span className="text-[20px] my-[20px]">{t("contacts.title")}</span>
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-100 px-[10px] py-[8px] rounded-md text-[12px]">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 border border-green-100 px-[10px] py-[8px] rounded-md text-[12px]">
                {success}
              </div>
            )}
            <label htmlFor="" className="text-[18px] mt-[10px] font-semibold">
              {t("contacts.name")}:
            </label>
            <input
              type="text"
              className="w-[350px] p-[15px]"
              placeholder={t("contacts.placeholders.name")}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
            <label htmlFor="" className="text-[18px] mt-[10px] font-semibold">
              {t("contacts.telephone")}:
            </label>
            <input
              type="text"
              className="w-[350px] p-[15px]"
              placeholder={t("contacts.placeholders.telephone")}
              value={form.tel}
              onChange={(e) => updateField("tel", e.target.value)}
            />
            <label htmlFor="" className="text-[18px] mt-[10px] font-semibold">
              {t("contacts.email")}:
            </label>
            <input
              type="email"
              className="w-[350px] p-[15px]"
              placeholder={t("contacts.placeholders.email")}
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
            <label htmlFor="" className="text-[18px] mt-[10px] font-semibold">
              {t("contacts.address")}:
            </label>
            <input
              type="text"
              className="w-[350px] p-[15px]"
              placeholder={t("contacts.placeholders.address")}
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
             <label htmlFor="" className="text-[18px] mt-[10px] font-semibold">
              {t("contacts.weight")}:
            </label>
            <input
              type="number"
              className="w-[350px] p-[15px]"
              placeholder={t("contacts.placeholders.weight")}
              value={form.weight}
              onChange={(e) => updateField("weight", e.target.value)}
            />
            <label htmlFor="" className="text-[18px] mt-[10px] font-semibold">
              {t("contacts.bloodGroup")}:
            </label>
           <select
            className="w-[350px] p-[15px]"
            value={form.bloodgroup}
            onChange={(e) => updateField("bloodgroup", e.target.value)}
           >
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
           </select>
            <label htmlFor="" className="text-[18px] mt-[10px] font-semibold">
              {t("contacts.age")}:
            </label>
            <input
              type="number"
              className="w-[350px] p-[15px]"
              placeholder={t("contacts.placeholders.age")}
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
            />
            <label htmlFor="" className="text-[18px] mt-[10px] font-semibold">
              {t("contacts.diseases")}:
            </label>
            <textarea
              className="w-[350px] p-[15px]"
              placeholder={t("contacts.placeholders.diseases")}
              rows={3}
              value={form.diseases}
              onChange={(e) => updateField("diseases", e.target.value)}
            />
            <div className="mt-4">
              <div ref={turnstileRef} />
              {!turnstileReady && TURNSTILE_SITE_KEY ? (
                <p className="mt-2 text-[12px] text-gray-500">
                  Complete the Turnstile check before submitting.
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="bg-red-500 p-3 mt-3 w-[350px] cursor-pointer text-white disabled:opacity-60"
            >
              {status === "submitting" ? t("contacts.submitting") : t("contacts.submit")}
            </button>
        </form>
        </div>
    
  )
}

export default Contacts
