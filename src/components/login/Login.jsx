import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase"; // Ensure correct import
import styles from "./login.module.css";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Initialize navigation hook

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    try {
      // Attempt login using Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      setError(""); // Clear any previous errors
      console.log("User logged in:", userCredential.user);

      if (onLogin) {
        onLogin(); // Call the onLogin function passed from the parent component
      }

      // Redirect to chat after successful login
      navigate("/chat");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      console.error("Login error:", err.message);
    }
  };

  return (
    <div className={styles.outerContainer}>
      <div className={styles.loginContainer}>
        <div className={styles.loginContent}>
          <h2>Welcome Back</h2>
          <p>Log in to access real-time chat with your community</p>

          {/* Display error message */}
          {error && <p style={{ color: "red" }}>{error}</p>}

          <form className={styles.formContainer} onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.inputField}
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={styles.inputField}
            />
            <button type="submit" className={styles.loginButton}>
              Login
            </button>
          </form>

          <div className={styles.loginOptions}>
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
            <a href="#" className={styles.forgotPassword}>
              Forgot Password?
            </a>
          </div>


          <p className={styles.signupText}>
            Don’t have an account? <a href="/CreateAccount">Sign up</a>
          </p>
        </div>
      </div>

      <div className={styles.logoContainer}>
        <img src="/logo.png" alt="Web Logo" className={styles.logo} />
      </div>
    </div>
  );
};

export default Login;
