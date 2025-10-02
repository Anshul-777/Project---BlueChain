import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", { email, password });
      if (res.data.success) {
        navigate("/home", { state: { user: res.data.user } });
      }
    } catch (err) {
      alert("Login failed!");
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center">
      <form onSubmit={handleLogin} className="p-4 border rounded bg-light">
        <h2>Login</h2>
        <input type="email" className="form-control my-2" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="form-control my-2" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;