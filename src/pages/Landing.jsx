import Carousel from "../components/Carousel";
import NavTabs from "../components/NavTabs";
import Services from "../components/Services";
import About from "../components/About";
import Footer from "../components/Footer";

import { slides } from "../data/carouselData";
import "../styles/Landing.css";

const Landing = () => {
  return (
    <div className="App">
      <NavTabs />

      <Carousel data={slides} />

      <Services />

      <About />

      <Footer />

    </div>
  );
};

export default Landing;
