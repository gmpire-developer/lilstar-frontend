import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiKey, FiLock } from "react-icons/fi";

import { completePasswordReset } from "../services/authService";

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Invalid reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await completePasswordReset({
        token,
        new_password: newPassword
      });

      setMessage(response.message || "Password reset successful.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel reveal auth-panel">
      <h2 className="icon-title">
        <FiKey /> Reset Password
      </h2>

      {message ? (
        <div className="alert icon-alert">
          <FiCheckCircle /> {message}
        </div>
      ) : null}
      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="reset-new-password">New Password</label>
        <div className="input-with-icon">
          <FiLock />
          <input
            id="reset-new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>

        <label htmlFor="reset-confirm-password">Confirm Password</label>
        <div className="input-with-icon">
          <FiLock />
          <input
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>

        <p className="subtle-text">{PASSWORD_POLICY_MESSAGE}</p>

        <button type="submit" className="btn btn-primary" disabled={submitting || !token}>
          {submitting ? "Updating..." : "Reset Password"}
        </button>
      </form>

      <div className="inline-links-row">
        <Link to="/manage/login" className="topbar__link">
          Back to Login
        </Link>
      </div>
    </section>
  );
}

export default ResetPasswordPage;
