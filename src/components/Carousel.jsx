import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/Carousel.css';
import { Cn } from '../utils/cn';

const Carousel = ({ data = [] }) => {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (data.length === 0) {
      setSlide(0);
    } else if (slide >= data.length) {
      setSlide(0);
    }
   
  }, [data.length]);

  const nextSlide = () => {
    if (data.length === 0) return;
    setSlide(prev => (prev === data.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (data.length === 0) return;
    setSlide(prev => (prev === 0 ? data.length - 1 : prev - 1));
  };

  // Auto-play effect
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); 

    return () => clearInterval(interval); 
  }, [slide, data]);

  if (!data || data.length === 0) return null;

  return (

    <div id="home" className="carousel">
      <ChevronLeft onClick={prevSlide} className="arrow arrow-left"  />

      {data.map((item, idx) => (
        <img
          key={idx}
          src={item.src}
          alt={item.alt}
          className={slide === idx ? "slide" : "slide slide-hidden"}
        />
      ))}

      <div className="carousel-text">
        <h1>The <span className='highlight'>Smartest</span> Way <br />to Manage your People</h1>
        <h4 className="carousel-subtitle">Automate every aspect of your HR operations with comprehensive tools for managing employee data, attendance, leave, payroll and analytics.</h4>
      
      </div>

      <ChevronRight onClick={nextSlide} className="arrow arrow-right" />
      
      <span className="indicators">
        {data.map((_, idx) => (
          <button
            key={idx}
            className={slide === idx ? "indicator" : "indicator indicator-inactive"}
            onClick={() => setSlide(idx)}
          />
        ))}
      </span>
    </div>
  );
};

export default Carousel;
