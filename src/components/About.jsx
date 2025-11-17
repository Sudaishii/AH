import React from 'react'

import { Target, Users, Award } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="about-section" aria-labelledby="about-title">
      <div className="container">
        <h2 id="about-title" className="section-title">About SugboWorks</h2>
        <div className="about-content">
          <div className="about-text">
            <p>
              SugboWorks is a leading provider of Human Resource Information Systems (HRIS) designed to empower businesses in managing their most valuable asset – their people. Founded with a vision to simplify HR processes, we deliver innovative solutions that drive efficiency, compliance, and employee satisfaction.
            </p>
            <p>
              Our platform integrates seamlessly with your workflow, offering tools for recruitment, onboarding, performance management, and more. Trusted by organizations across industries, SugboWorks helps you build a thriving workforce in today's dynamic business environment.
            </p>
          </div>
          <div className="about-values" role="list">
            <div className="value-item" role="listitem">
              <Target size={32} className="value-icon" aria-hidden="true" />
              <div className="value-content">
                <h3 className="value-title">Innovation</h3>
                <p className="value-description">Cutting-edge technology for modern HR needs.</p>
              </div>
            </div>
            <div className="value-item" role="listitem">
              <Users size={32} className="value-icon" aria-hidden="true" />
              <div className="value-content">
                <h3 className="value-title">People-Centric</h3>
                <p className="value-description">Solutions designed with employees and managers in mind.</p>
              </div>
            </div>
            <div className="value-item" role="listitem">
              <Award size={32} className="value-icon" aria-hidden="true" />
              <div className="value-content">
                <h3 className="value-title">Excellence</h3>
                <p className="value-description">Committed to quality, security, and customer success.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
