import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginPageProps {
  setSession: (session: any) => void;
}

export default function LoginPage({ setSession }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter an email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Login failed: ${data.message || "Unknown error"}`);
      } else {
        // Save session to localStorage
        const sessionObj = data.session || data;
        localStorage.setItem("supabase_session", JSON.stringify(sessionObj));
        setSession(sessionObj);

        // Redirect to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Network error. Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Log In</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p style={{ textAlign: "center", marginTop: "12px" }}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            style={{ color: "blue", cursor: "pointer" }}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
