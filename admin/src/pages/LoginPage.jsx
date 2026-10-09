import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function LoginPage() {
  const { admin, login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (admin) return <Navigate to="/" replace />;

  return (
    <main className="auth">
      <form className="panel" onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
          await login(email, password);
        } catch (loginError) {
          setError(loginError.message || "Unable to sign in.");
        } finally {
          setLoading(false);
        }
      }}>
        <h1>HelperBook Admin</h1>
        <p>Simple Staff Management for Small Businesses</p>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
    </main>
  );
}
