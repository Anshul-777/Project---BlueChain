import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css"; // css alag rakhenge

function LandingPage() {
  return (
    <div className="landing d-flex flex-column justify-content-center align-items-center text-center">
      {/* Top Heading */}
      <h1 className="main-heading">BLUECARBON</h1>

      {/* Sub Headings */}
      <h2 className="sub-heading">WELCOME TO BLUECARBON</h2>
      <h3 className="third-heading">YOUR SMART CARBON TRACKING APP</h3>

      {/* Paragraph */}
      <p className="para">
        BlueCarbon helps users track their carbon footprint and contribute to
        environmental protection. Simple forms, easy reports, and impactful
        results - all in one place.
      </p>

      {/* Buttons */}
      <div className="mt-3">
        <Link to="/login" className="btn custom-btn mx-2">Login</Link>
        <Link to="/signup" className="btn custom-btn mx-2">Signup</Link>
      </div>

      {/* Bottom small heading */}
      <p className="mt-3 small-text">
        Join thousands of users making a difference today
      </p>
    </div>
  );
}

export default LandingPage;