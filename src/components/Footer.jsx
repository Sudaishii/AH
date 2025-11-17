import { Button } from "react-aria-components";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">SugboWorks</h3>
            <p className="footer-description">
              Empowering businesses with innovative HR solutions for a smarter workforce.
            </p>
            <div className="social-links">
              <Button className="social-btn" aria-label="Facebook">
                <Facebook size={20} />
              </Button>
              <Button className="social-btn" aria-label="Twitter">
                <Twitter size={20} />
              </Button>
              <Button className="social-btn" aria-label="LinkedIn">
                <Linkedin size={20} />
              </Button>
            </div>
          </div>
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><Button className="footer-link-btn" onPress={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</Button></li>
              <li><Button className="footer-link-btn" onPress={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Services</Button></li>
              <li><Button className="footer-link-btn" onPress={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" })}>About</Button></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={16} />
                <span>info@sugboworks.com</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+63 945 698 9966</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>Minglanilla Cebu, Philippines</span>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 SugboWorks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
