const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const getClientIp = (req) => req.ip || req.socket?.remoteAddress || "";

const verifyTurnstile = async (req, res, next) => {
  const secret = process.env.TURNSTILE_SECRET_KEY || "";
  const token = `${req.body.turnstileToken || ""}`.trim();

  if (!secret) {
    return res.status(503).json({
      message: "Turnstile secret key is missing. Configure TURNSTILE_SECRET_KEY in Backend/.env.",
    });
  }

  if (!token) {
    return res.status(400).json({
      message: "Turnstile verification is required before submitting this form.",
    });
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });

    const remoteip = getClientIp(req);
    if (remoteip) {
      body.set("remoteip", remoteip);
    }

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Turnstile verify request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      return res.status(400).json({
        message: "Turnstile verification failed. Please try again.",
        turnstileErrors: data["error-codes"] || [],
      });
    }

    return next();
  } catch (error) {
    return res.status(502).json({
      message: "Unable to verify Turnstile at the moment. Please try again.",
      error: error.message,
    });
  }
};

module.exports = { verifyTurnstile };
