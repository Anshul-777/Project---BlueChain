import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirm) return alert("Passwords do not match!");
    try {
      const res = await axios.post("http://localhost:5000/api/signup", { name, email, password });
      if (res.data.success) {
        navigate("/login");
      }
    } catch (err) {
      alert("Signup failed!");
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center">
      <form onSubmit={handleSignup} className="p-4 border rounded bg-light">
        <h2>Signup</h2>
        <input type="text" className="form-control my-2" placeholder="Name" onChange={(e) => setName(e.target.value)} />
        <input type="email" className="form-control my-2" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="form-control my-2" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <input type="password" className="form-control my-2" placeholder="Confirm Password" onChange={(e) => setConfirm(e.target.value)} />
        <button type="submit" className="btn btn-success w-100">Signup</button>
      </form>
    </div>
  );
}

export default SignupPage;