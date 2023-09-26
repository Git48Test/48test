import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook from react-router-dom
import Admin from "./Admin";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate hook

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        setMessage("Logged in successfully!");

        // Redirect based on account type
        if (data.accountType === "admin") {
          navigate(<Admin />); // Use navigate to redirect to admin page
        } else {
          navigate("/home"); // Use navigate to redirect to user home page
        }
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Error logging in.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />
        <button type="submit">Login</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Login;
