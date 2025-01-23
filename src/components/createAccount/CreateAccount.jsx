import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import styles from "./CreateAccount.module.css";

const CreateAccount = () => {
  const [formData, setFormData] = useState({
    idNumber: "",
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, idNumber, name } = formData;

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Use setDoc to store the user data with uid as document ID
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        idNumber,
        name,
        email,
        createdAt: new Date(),
      });

      // Initialize userChats document in Firestore for the new user
      await setDoc(doc(db, "userChats", user.uid), {
        chats: [], // Initialize with an empty array
        lastUpdated: new Date(),
      });

      setSuccess("Account created successfully! Please log in.");
      setError("");

      // Clear the form fields
      setFormData({
        idNumber: "",
        name: "",
        email: "",
        password: "",
      });

      console.log("User details and userChats initialized in Firestore!");
    } catch (err) {
      console.error("Error creating account:", err.message);
      setError(err.message);
      setSuccess("");
    }
  };

  return (
    <div className={styles.outerContainer}>
      <div className={styles.logoContainer}>
        <img src="/logo.png" alt="Logo" className={styles.logo} />
      </div>

      <div className={styles.createAccountContainer}>
        <h2>Create Account</h2>
        <p>Fill in your details to create a new account.</p>

        {/* Success/Error Messages */}
        {success && <p style={{ color: "green" }}>{success}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="idNumber"
            placeholder="ID Number"
            value={formData.idNumber}
            onChange={handleChange}
            required
            className={styles.inputField}
          />
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className={styles.inputField}
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.inputField}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className={styles.inputField}
          />
          <button type="submit" className={styles.createButton}>
            Create Account
          </button>
        </form>

        {/* Render Login Button */}
        {success && (
          <Link to="/login" className={styles.loginButton}>
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default CreateAccount;
