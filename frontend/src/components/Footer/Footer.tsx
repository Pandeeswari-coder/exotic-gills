import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <span className="footer__logo-icon">&#x1F41F;</span>
            <span className="footer__logo-text">Exotic Gills and Fins</span>
          </Link>
          <p className="footer__tagline">
            Bringing the world's finest Discus fish directly to hobbyists since 2014.
          </p>
        </div>

        <div className="footer__col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/shop">All Fish</Link></li>
            <li><Link to="/shop?category=discus">Discus</Link></li>
            <li><Link to="/shop?category=tropical">Tropical</Link></li>
            <li><Link to="/shop?available=true">In Stock</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/shipping">Shipping Info</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/cart">My Cart</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; {year} Exotic Gills and Fins. All rights reserved.</p>
        <p>Designed for fish enthusiasts worldwide.</p>
      </div>
    </footer>
  );
};

export default Footer;
