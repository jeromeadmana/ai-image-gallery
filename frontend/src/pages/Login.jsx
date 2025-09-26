import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../services/authService";
import ErrorModal from "../components/errorModal"; // 🔹 Reusable error modal

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [showRegister, setShowRegister] = useState(false);
  const [reg, setReg] = useState({ email: "", password: "", confirm: "" });
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const response = await login({ email, password });
    setLoading(false);

    if (response.success) {
      navigate("/dashboard", { state: { user: response.user } });
    } else {
      if (response.message === "Email not confirmed") {
        setErrorMessage(
          "Your email is not confirmed. Please check your inbox for the confirmation link."
        );
      } else {
        setErrorMessage(response.message || "Login failed. Please try again.");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (reg.password !== reg.confirm) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setRegLoading(true);
    try {
      const response = await register({
        email: reg.email,
        password: reg.password,
      });

      if (response.error) {
        setErrorMessage(response.error);
      } else {
        setShowRegister(false);
        setReg({ email: "", password: "", confirm: "" });
        setErrorMessage(
          "Registration successful! Please check your email to confirm."
        );
      }
    } catch (err) {
      setErrorMessage("Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-80"
      >
        <h2 className="text-2xl mb-6 text-center">Login</h2>

        <div className="mb-4">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded mt-1"
            required
          />
        </div>

        <div className="mb-6">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded mt-1"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p
          className="mt-4 text-center text-blue-600 cursor-pointer hover:underline"
          onClick={() => setShowRegister(true)}
        >
          Don’t have an account? Register
        </p>
      </form>

      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowRegister(false)}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label>Email</label>
                <input
                  type="email"
                  value={reg.email}
                  onChange={(e) => setReg({ ...reg, email: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div className="mb-4">
                <label>Password</label>
                <input
                  type="password"
                  value={reg.password}
                  onChange={(e) => setReg({ ...reg, password: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div className="mb-6">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={reg.confirm}
                  onChange={(e) => setReg({ ...reg, confirm: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {regLoading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />
    </div>
  );
}
