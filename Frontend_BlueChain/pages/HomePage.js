// HomePage.jsx
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Navbar,
  Nav,
  Container,
  Offcanvas,
  Button,
  Card,
  Row,
  Col,
} from "react-bootstrap";

function HomePage() {
  const location = useLocation();
  const user = location.state?.user;

  const today = new Date().toLocaleDateString();

  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="homepage" style={{ minHeight: "100vh", background: "linear-gradient( 90deg , #9E45D9, #BA3A3A, #BD8A44)"}}>
      {/* Navbar */}
      <Navbar bg="primary" variant="dark" expand={false} fixed="top" className="px-3" style={{ background: "linear-gradient( 90deg , #9E45D9, #BA3A3A, #BD8A44)"}}>
        <Container fluid>
          {/* Sidebar toggle */}
          <Button
            variant="outline-light"
            onClick={() => setShowSidebar(true)}
            className="me-2"
          >
            ☰
          </Button>

          {/* Logo */}
          <Navbar.Brand className="d-flex align-items-center">
            <img
              src="/logo.jpg"
              width="40"
              height="40"
              className="me-2 rounded-circle"
              alt="logo"
            />
            <span className="fw-bold">BLUECARBON</span>
          </Navbar.Brand>

          {/* Center Nav Items */}
          <Nav className="mx-auto d-flex flex-row">
            <Nav.Link as={Link} to="/dashboard" className="text-white" style={{ fontSize:'18px', marginRight: '100px'}}>
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/register" className="text-white" style={{ fontSize:'18px',marginRight: '100px'}}>
              Register
            </Nav.Link>
            <Nav.Link as={Link} to="/project" className="text-white" style={{fontSize:'18px',marginRight: '100px'}} >
              Project
            </Nav.Link>
            <Nav.Link as={Link} to="/mrv" className="text-white" style={{fontSize:'18px',marginRight: '100px'}}>
              MRV
            </Nav.Link>
            <Nav.Link as={Link} to="/verification" className="text-white" style={{fontSize:'18px',marginRight: '100px'}} >
           verification
            </Nav.Link>
          </Nav>

          {/* Admin Name */}
          <div className="text-white fw-bold border px-2 rounded">{user?.name || "Admin"}</div>
        </Container>
      </Navbar>

      {/* Sidebar */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="bg-dark text-white">
          <Nav className="flex-column gap-2">
            <Nav.Link as={Link} to="/dashboard" className="text-white">Overview</Nav.Link>
            <Nav.Link as={Link} to="/dashboard" className="text-white ms-3">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/project" className="text-white mt-2">Project</Nav.Link>
            <Nav.Link as={Link} to="/manage" className="text-white ms-3">Manage</Nav.Link>
            <Nav.Link as={Link} to="/report" className="text-white ms-3">Report</Nav.Link>
            <Nav.Link as={Link} to="/register" className="text-white ms-3">Register</Nav.Link>
            <Nav.Link as={Link} to="/credits" className="text-white ms-3">Credits</Nav.Link>
            <Nav.Link as={Link} to="/history" className="text-white ms-3">History</Nav.Link>
            <Nav.Link as={Link} to="/monitoring" className="text-white mt-2">Monitoring</Nav.Link>
            <Nav.Link as={Link} to="/verified" className="text-white ms-3">Verified</Nav.Link>
            <Nav.Link as={Link} to="/pending" className="text-white ms-3">Pending</Nav.Link>
            <Nav.Link as={Link} to="/rejected" className="text-white ms-3">Rejected</Nav.Link>
            <Nav.Link as={Link} to="/ai" className="text-white mt-2">AI</Nav.Link>
            <Nav.Link as={Link} to="/analysis" className="text-white ms-3">Analysis</Nav.Link>
            <div className="mt-3 border-top pt-3">
              <p className="mb-1">Name: {user?.name || "Admin"}</p>
              <Nav.Link as={Link} to="/settings" className="text-white">Settings</Nav.Link>
            </div>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <Container fluid className="pt-5 mt-5">
        <div className="d-flex justify-content-end text-muted small "><strong>{today}</strong></div>
        <h2 className="fw-bold text-black p-3 mb-4"style={{ backgroundColor: "0d6efd" , borderRadius: '8px'}}>Dashboard</h2>
        {/* Dashboard Box */}
        <Card className="p-3 mt-3 shadow-sm w-100 w-lg-75" style={{ backgroundColor: "#ecedeeff" }}>
          <div className="d-flex justify-content-between align-items-center">
            <strong>Connect to Web Server → Blockchain Connection Required</strong>
            <Button variant="success" as={Link} to="/connect">Connect</Button>
          </div>
        </Card>

        {/* Project Section */}
        <div className="d-flex justify-content-between align-items-center mt-4"  style={{ position: "relative", left: "11px", top: "1px" }}>
          <h3 className="fw-bold">Project</h3>
          <Button
            variant="primary"
            as={Link}
            to="/registerform"
            style={{ position: "relative", right: "1240px", top: "1px" }}
          >
            + Create
          </Button>
        </div>

        <Row className="mt-3 g-3">
          {/* Project Box */}
          <Col lg={6} md={12}>
            <Card className="p-3 shadow-sm" style={{ backgroundColor: "#f5f6f7ff" }}>
             <p><strong>Project Name:</strong> Null</p>
              <p><strong>Project ID:</strong> Null</p>
              <p><strong>Plant:</strong> Null</p>
              <p><strong>Location:</strong> Null</p>
              <Button variant="link">View Details</Button>
            </Card>
          </Col>

          {/* Activity Box */}
          <Col lg={6} md={12}>
            <Card className="p-3 shadow-sm h-100" style={{ backgroundColor: "#f0f4f9ff" }}>
              <h5>Activity</h5>
              <div className="d-flex justify-content-between mt-2">
                <span>Carbon Credits</span>
                <Button variant="link" as={Link} to="/credits">View</Button>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <span>Wallet</span>
                <Button variant="link" as={Link} to="/wallet">Open</Button>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <span>Pending Projects</span>
                <span>Null</span>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
         {/* Project Cards */}
        <div className="d-flex gap-3 mt-4">
          <Card className="p-3 text-center shadow-sm" style={{marginLeft:"150px"}}>
            <Link to="/manage" className="text-decoration-none position-relative" style={{width:200,height:150,top:"60px"}}>Manage Projects</Link>
          </Card>
          <Card className="p-3 text-center shadow-sm"style={{marginLeft:"150px"}}>
            <Link to="/history" className="text-decoration-none position-relative" style={{width:200,height:150,top:"60px"}}>History Project</Link>
          </Card>
          <Card className="p-3 text-center shadow-sm"style={{marginLeft:"150px"}}>
            <Link to="/verified" className="text-decoration-none position-relative"style={{width:200,height:150,top:"60px"}}>Verified Total</Link>
          </Card>
        </div>
      <footer className="bg-dark text-white text-center mt-5 py-3">
        <p className="mb-1">© 2025 BlueCarbon. All rights reserved.</p>
        <Nav className="justify-content-center">
          <Nav.Link as={Link} to="/about" className="text-white">About</Nav.Link>
          <Nav.Link as={Link} to="/contact" className="text-white">Contact</Nav.Link>
          <Nav.Link as={Link} to="/privacy" className="text-white">Privacy Policy</Nav.Link>
        </Nav>
      </footer>
    
    </div>
  );
}

export default HomePage;