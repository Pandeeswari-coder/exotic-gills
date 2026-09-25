import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>About Exotic Gills and Fins</h1>
        <p>Dedicated to the art of Chiclids fish keeping since 2023</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <div className="about-section__text">
            <h2>Our Story</h2>
            <p>
              Exotic Gills and Fins was founded in 2023 by a passionate hobbyist who fell in love
              with the majestic Chiclids fish — known as the &quot;King of the Aquarium.&quot;
              What began as a personal hobby quickly grew into a full-scale breeding
              operation dedicated to producing championship-quality fish.
            </p>
            <p>
              Since 2023, we have developed proprietary water conditioning
              techniques and dietary regimens that produce fish with vibrant, true-to-type
              colors and robust health. Every fish we sell has been raised with care and
              individually observed before shipping.
            </p>
          </div>
          <div className="about-section__visual">
            <div className="about-fish-icon">&#x1F41F;</div>
            <p>Founded in 2023</p>
          </div>
        </section>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-number">2+</span>
            <span className="stat-label">Years in Business</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">5,000+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">50+</span>
            <span className="stat-label">Fish Varieties</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">100%</span>
            <span className="stat-label">Live Arrival Guarantee</span>
          </div>
        </div>

        <section className="about-section reverse">
          <div className="about-section__text">
            <h2>Our Promise</h2>
            <p>
              Every fish we ship comes with our live arrival guarantee. We use insulated
              boxes with heat packs and pure oxygen to ensure your fish travel safely
              across the country. We only ship on Monday through Wednesday to avoid fish
              sitting in distribution centers over the weekend.
            </p>
            <p>
              If your fish don&apos;t arrive alive, we will make it right — period.
              That is the Exotic Gills and Fins commitment to every customer.
            </p>
          </div>
          <div className="about-section__visual">
            <div className="about-fish-icon">&#x1F4E6;</div>
            <p>Safe & Secure Shipping</p>
          </div>
        </section>

        <section className="team-section">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <span className="value-icon">&#x1F3C6;</span>
              <h3>Quality First</h3>
              <p>We never compromise on the health and quality of our fish. Every specimen is hand-selected.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">&#x1F4DA;</span>
              <h3>Education</h3>
              <p>We believe informed hobbyists are happy hobbyists. We offer guidance and support freely.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">&#x1F91D;</span>
              <h3>Community</h3>
              <p>We are active members of the aquarium hobby community, participating in shows and forums.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">&#x1F30E;</span>
              <h3>Sustainability</h3>
              <p>All our fish are captive-bred, reducing pressure on wild populations and coral reefs.</p>
            </div>
          </div>
        </section>

        <div className="about-cta">
          <h2>Ready to Add Some Beauty to Your Tank?</h2>
          <p>Browse our collection of premium Chiclids and tropical fish.</p>
          <Link to="/shop" className="cta-btn">Shop Now</Link>
        </div>
      </div>
    </div>
  );
};

export default About;
