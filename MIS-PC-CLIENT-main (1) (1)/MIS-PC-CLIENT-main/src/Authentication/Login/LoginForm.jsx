import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust path if your folder depth differs

/**
 * LoginForm.jsx
 * -------------------------------------------------------------
 * Single-step authentication for the MIS App:
 *   Username + Password only (no OTP step)
 *
 * Username rules:
 *   - Allowed characters: A-Z, a-z, 0-9, hyphen (-), underscore (_)
 *   - Max length: 20 characters
 *
 * Auth is now handled entirely by AuthContext's login() function
 * (see context/AuthContext.jsx) - it calls the backend via the
 * shared `api` axios instance, saves the JWT + user to
 * localStorage, and keeps every future axios call authenticated.
 *
 * After a successful login, this component redirects based on
 * the role returned by the backend:
 *   - "SYSTEM_ADMIN" -> /admin/dashboard
 *   - anything else  -> /user/dashboard
 * -------------------------------------------------------------
 */

const USERNAME_MAX_LEN = 20;
const USERNAME_REGEX = /^[A-Za-z0-9_-]+$/;
const ADMIN_ROLE = "SYSTEM_ADMIN"; // change if your backend uses a different role string

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    // block characters outside the allowed set as the user types
    if (val === "" || USERNAME_REGEX.test(val)) {
      setUsername(val.slice(0, USERNAME_MAX_LEN));
    }
  };

  const validateUsername = (val) => {
    if (!val) return "Username is required.";
    if (val.length > USERNAME_MAX_LEN) return `Username must be at most ${USERNAME_MAX_LEN} characters.`;
    if (!USERNAME_REGEX.test(val)) return "Only letters, numbers, - and _ are allowed.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (result.user?.role === ADMIN_ROLE) {
      navigate("/admin/dashboard");
    } else {
      navigate("/user/dashboard");
    }
  };

  return (
    <div className="mis-login-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .mis-login-root {
          --bg: #f4f6f9;
          --panel: #ffffff;
          --panel-border: #e3e8ef;
          --field-bg: #f4f6f9;
          --accent: #c9820a;
          --accent-soft: rgba(201,130,10,0.10);
          --steel: #3a6d95;
          --text: #1b2430;
          --muted: #64748b;
          --danger: #d1483c;
          --success: #0f9a90;

          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(1200px 600px at 15% -10%, rgba(58,109,149,0.08), transparent 60%),
            radial-gradient(900px 500px at 110% 110%, rgba(201,130,10,0.06), transparent 60%),
            var(--bg);
          font-family: 'Inter', sans-serif;
          color: var(--text);
          padding: 24px;
        }

        .mis-shell {
          width: 100%;
          max-width: 420px;
          background: var(--panel);
          border: 1px solid var(--panel-border);
          border-radius: 14px;
          padding: 36px 32px 30px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(20,30,45,0.06), 0 8px 24px rgba(20,30,45,0.05);
        }

        .mis-shell::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--steel), var(--accent));
        }

        .mis-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
        }

        .mis-badge {
          width: 42px;
          height: 42px;
          border-radius: 9px;
          background: var(--accent-soft);
          border: 1px solid rgba(201,130,10,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Chakra Petch', sans-serif;
          font-weight: 700;
          color: var(--accent);
          font-size: 15px;
          flex-shrink: 0;
        }

        .mis-title {
          font-family: 'Chakra Petch', sans-serif;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: var(--text);
        }

        .mis-subtitle {
          font-size: 12.5px;
          color: var(--muted);
          margin-top: 2px;
        }

        .mis-field {
          margin-bottom: 18px;
        }

        .mis-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 6px;
          letter-spacing: 0.2px;
        }

        .mis-label-count {
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }

        .mis-input-wrap {
          position: relative;
        }

        .mis-input {
          width: 100%;
          background: var(--field-bg);
          border: 1px solid var(--panel-border);
          border-radius: 8px;
          padding: 11px 42px 11px 13px;
          color: var(--text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .mis-input::placeholder {
          color: #a3adba;
        }

        .mis-input:focus {
          border-color: var(--steel);
          box-shadow: 0 0 0 3px rgba(58,109,149,0.12);
        }

        .mis-input-icon-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          padding: 4px;
        }

        .mis-input-icon-btn:hover { color: var(--text); }

        .mis-hint {
          font-size: 11px;
          color: var(--muted);
          margin-top: 6px;
        }

        .mis-error {
          background: rgba(209,72,60,0.08);
          border: 1px solid rgba(209,72,60,0.25);
          color: #b23a2f;
          font-size: 12.5px;
          padding: 9px 12px;
          border-radius: 7px;
          margin-bottom: 16px;
        }

        .mis-btn {
          width: 100%;
          background: linear-gradient(90deg, var(--steel), #2f5c7d);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.15s ease, transform 0.1s ease;
          margin-top: 6px;
        }

        .mis-btn:hover:not(:disabled) { opacity: 0.92; }
        .mis-btn:active:not(:disabled) { transform: scale(0.99); }
        .mis-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .mis-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: mis-spin 0.7s linear infinite;
        }

        @keyframes mis-spin {
          to { transform: rotate(360deg); }
        }

        .mis-footer {
          text-align: center;
          margin-top: 22px;
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.3px;
        }
      `}</style>

      <div className="mis-shell">
        <div className="mis-header">
          <div className="mis-badge">MIS</div>
          <div>
            <div className="mis-title">MIS Access Portal</div>
            <div className="mis-subtitle">Sign in to continue</div>
          </div>
        </div>

        {error && <div className="mis-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mis-field">
            <label className="mis-label" htmlFor="mis-username">
              <span>Username</span>
              <span className="mis-label-count">{username.length}/{USERNAME_MAX_LEN}</span>
            </label>
            <div className="mis-input-wrap">
              <input
                id="mis-username"
                type="text"
                className="mis-input"
                placeholder="e.g. himanshu_21"
                value={username}
                onChange={handleUsernameChange}
                maxLength={USERNAME_MAX_LEN}
                autoComplete="username"
                required
              />
            </div>
            <div className="mis-hint">Letters, numbers, - and _ only. Max {USERNAME_MAX_LEN} characters.</div>
          </div>

          <div className="mis-field">
            <label className="mis-label" htmlFor="mis-password">
              <span>Password</span>
            </label>
            <div className="mis-input-wrap">
              <input
                id="mis-password"
                type={showPassword ? "text" : "password"}
                className="mis-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="mis-input-icon-btn"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <button type="submit" className="mis-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="mis-spinner" /> Signing in
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mis-footer">SECURE MIS ACCESS</div>
      </div>
    </div>
  );
}