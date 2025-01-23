import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import styles from "./adminLogin.module.css";

// List of allowed admin emails or UIDs
const ADMIN_EMAILS = ["admin@gmail.com"];
const ADMIN_UIDS = ["PwV8rrkSc2MkBPIzKql26GPoVKh1"]; // Replace with the full UID

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the logged-in user is an admin
      if (ADMIN_EMAILS.includes(user.email) || ADMIN_UIDS.includes(user.uid)) {
        navigate("/admin/chatList", { replace: true });
      } else {
        setError("You do not have permission to access the admin panel.");
      }
    } catch (err) {
      console.error("Error during login:", err.message);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.outerContainer}>
      <div className={styles.logoContainer}>
        <img src="/adminlogo.png" alt="Admin Logo" className={styles.logo} />
      </div>
      <div className={styles.loginContainer}>
        <h2>Admin Login</h2>
        <p>Log in to manage chats and groups</p>
        {error && (
          <p className={styles.errorMessage} role="alert" aria-live="assertive">
            {error}
          </p>
        )}
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.inputField}
              autoComplete="email"
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={styles.inputField}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className={styles.loginButton}
            disabled={!formData.email || !formData.password || loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
