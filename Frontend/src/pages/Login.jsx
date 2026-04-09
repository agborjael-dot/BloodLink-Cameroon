import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
const ADMIN_ROLES = ["admin", "superAdmin", "regional", "national"];

const getErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch (error) {
    return fallback;
  }
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("signin");
  const [step, setStep] = useState("credentials");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectUser = (user) => {
    const from = typeof location.state?.from === "string" ? location.state.from : "";
    if (from && from !== "/login" && from.startsWith("/")) {
      navigate(from, { replace: true });
      return;
    }

    if (ADMIN_ROLES.includes(user.role)) {
      navigate("/admin", { replace: true });
      return;
    }

    navigate("/donor", { replace: true });
  };

  const resetTransientState = () => {
    setStep("credentials");
    setOtp("");
    setOtpToken("");
    setConfirmPassword("");
    setError("");
    setMessage("");
    setLoading(false);
    setShowPassword(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetTransientState();
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to create account."));
      }

      setMode("signin");
      setPassword("");
      setConfirmPassword("");
      setMessage("Account created successfully. Sign in to receive your OTP.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to start login."));
      }

      const data = await response.json();
      if (!data.otpToken) {
        throw new Error("OTP session could not be created. Please try again.");
      }

      setOtpToken(data.otpToken || "");
      setOtp("");
      setStep("otp");
      setMessage(data.message || "Enter the verification code sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpToken, otp }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "OTP verification failed."));
      }

      const data = await response.json();
      const token = data.token || data.accessToken;

      if (!token || !data.user) {
        throw new Error("Login response is incomplete. Please try again.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data.user));

      redirectUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpToken }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to resend OTP."));
      }

      const data = await response.json();
      setOtpToken(data.otpToken || otpToken);
      setOtp("");
      setMessage(data.message || "A new verification code has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    resetTransientState();
  };

  const renderPasswordInput = ({ value, onChange, placeholder }) => (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 pr-11 focus:outline-none focus:ring-2 focus:ring-red-400"
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition hover:text-gray-700"
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
      >
        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md">
        <div className="mb-4 grid grid-cols-2 rounded-md bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "signin" ? "bg-white text-red-600 shadow-sm" : "text-gray-600"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-white text-red-600 shadow-sm" : "text-gray-600"
            }`}
          >
            Create Account
          </button>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          {mode === "signup"
            ? "Create Account"
            : step === "credentials"
              ? "Sign In"
              : "Verify OTP"}
        </h1>
        <p className="mb-4 text-sm text-gray-600">
          {mode === "signup"
            ? "Use your name, email, and password the first time you access the app."
            : step === "credentials"
            ? "Enter your email and password to receive a one-time verification code."
            : `Enter the 6-digit code sent to ${email}.`}
        </p>

        {message && (
          <p className="mb-4 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p>
        )}

        {error && (
          <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
        )}

        {mode === "signup" ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              required
            />

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              required
            />

            {renderPasswordInput({
              value: password,
              onChange: (event) => setPassword(event.target.value),
              placeholder: "Password",
            })}

            {renderPasswordInput({
              value: confirmPassword,
              onChange: (event) => setConfirmPassword(event.target.value),
              placeholder: "Confirm password",
            })}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-red-600 px-3 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        ) : step === "credentials" ? (
          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              required
            />

            {renderPasswordInput({
              value: password,
              onChange: (event) => setPassword(event.target.value),
              placeholder: "Password",
            })}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-red-600 px-3 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit OTP"
              className="w-full rounded-md border border-gray-300 px-3 py-2 tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-red-400"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-red-600 px-3 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify and Sign In"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleResendOtp}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              Resend OTP
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleBackToLogin}
              className="w-full text-sm font-medium text-gray-500 transition hover:text-gray-700 disabled:opacity-60"
            >
              Back to email and password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
