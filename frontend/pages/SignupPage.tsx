import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SignupPageProps {
  setSession: (session: any) => void;
}

export default function SignupPage({ setSession }: SignupPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email || !password) {
      alert("Please enter an email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Signup failed: ${data.message || "Unknown error"}`);
      } else {
        // Save session to localStorage
        const sessionObj = data.session || data;
        localStorage.setItem("supabase_session", JSON.stringify(sessionObj));
        setSession(sessionObj);

        // Redirect to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Network error. Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Sign Up</h2>

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
          onClick={handleSignup}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p style={{ textAlign: "center", marginTop: "12px" }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "blue", cursor: "pointer" }}
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}
