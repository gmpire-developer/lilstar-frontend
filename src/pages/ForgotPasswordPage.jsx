import { useState } from "react";
import { Link } from "react-router-dom";
import { FiKey, FiMail, FiSend } from "react-icons/fi";

import { requestPasswordReset } from "../services/authService";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await requestPasswordReset({ email: email.trim() });
      setMessage(response.message || "Reset request sent for admin approval.");
      setEmail("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to send reset request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel reveal auth-panel">
      <h2 className="icon-title">
        <FiKey /> Forgot Password
      </h2>

      {message ? <div className="alert">{message}</div> : null}
      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="forgot-email">Staff Email</label>
        <div className="input-with-icon">
          <FiMail />
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          <FiSend />
          {submitting ? "Sending..." : "Send Request"}
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

export default ForgotPasswordPage;
