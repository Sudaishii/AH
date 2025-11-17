import React, { useState, useEffect } from "react";
import { Tabs, TabList, Tab, SelectionIndicator, Button } from "react-aria-components";
import { Rocket, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/NavTabs.css";
import logo from "../assets/Logo.png";

const NavTabs = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("home");

  const handleScroll = (id) => {
    setSelectedTab(id);
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const section = document.getElementById(id);
    if (section) {
      const offset = 100; 
      const elementPosition = section.offsetTop;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    const sections = ["home", "services", "about"];
    const observers = sections.map((id) => {
      const element = document.getElementById(id);
     if (!element) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setSelectedTab(id);
            }
          });
        },
        { threshold: 0.5 }
      );
      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Left: Logo */}
        <div className="nav-logo">
          <img src={logo} alt="SugboWorks Logo" className="logo-img" />
          <span className="logo-text">SugboWorks</span>
        </div>

        <Tabs selectedKey={selectedTab} aria-label="Main Navigation">
          <TabList className="nav-tablist">
            <Tab
              id="home"
              className="nav-tab"
              onPress={() => handleScroll("home")}
            >
              <span>Home</span>
              <SelectionIndicator className="selection-indicator" />
            </Tab>

            <Tab
              id="services"
              className="nav-tab"
              onPress={() => handleScroll("services")}
            >
              <span>Services</span>
              <SelectionIndicator className="selection-indicator" />
            </Tab>

            <Tab
              id="about"
              className="nav-tab"
              onPress={() => handleScroll("about")}
            >
              <span>About</span>
              <SelectionIndicator className="selection-indicator" />
            </Tab>
          </TabList>
        </Tabs>

        <div className="nav-action">
          <Button className="get-started-btn" onPress={() => navigate('/register')}>
            Get Started
            <Rocket size={18} style={{ marginLeft: "0.5rem" }} />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavTabs;
