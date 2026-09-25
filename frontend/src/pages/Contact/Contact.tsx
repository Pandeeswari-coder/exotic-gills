import React from 'react';
import './Contact.css';

const HOURS = [
  { day: 'Tuesday',   time: '10:00 AM – 8:00 PM' },
  { day: 'Wednesday', time: '10:00 AM – 8:00 PM' },
  { day: 'Thursday',  time: '10:00 AM – 8:00 PM' },
  { day: 'Friday',    time: '10:00 AM – 8:00 PM' },
  { day: 'Saturday',  time: '10:00 AM – 8:00 PM' },
  { day: 'Sunday',    time: '10:00 AM – 8:00 PM' },
  { day: 'Monday',    time: 'Closed' },
];

const Contact: React.FC = () => {
  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1 className="contact-hero__title">Contact Us</h1>
        <p className="contact-hero__sub">We'd love to hear from you — reach out any way you like</p>
      </div>

      <div className="contact-grid">

        {/* Phone */}
        <div className="contact-card">
          <div className="contact-card__icon phone">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.07 6.07l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <h3>Phone</h3>
          <a href="tel:+917358144900" className="contact-card__value">+91 7358144900</a>
        </div>

        {/* WhatsApp */}
        <div className="contact-card">
          <div className="contact-card__icon whatsapp">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
          </div>
          <h3>WhatsApp</h3>
          <a href="https://wa.me/917358144900" target="_blank" rel="noreferrer" className="contact-card__value">+91 7358144900</a>
        </div>

        {/* Email */}
        <div className="contact-card">
          <div className="contact-card__icon email">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h3>Email Address</h3>
          <a href="mailto:info@exoticgillsandfins.com" className="contact-card__value">info@exoticgillsandfins.com</a>
        </div>

        {/* Opening Hours */}
        <div className="contact-card contact-card--hours">
          <div className="contact-card__icon hours">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3>Opening Hours</h3>
          <ul className="hours-list">
            {HOURS.map(({ day, time }) => (
              <li key={day} className={time === 'Closed' ? 'hours-list__row closed' : 'hours-list__row'}>
                <span className="hours-list__day">{day}</span>
                <span className="hours-list__time">{time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Location */}
        <div className="contact-card">
          <div className="contact-card__icon location">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h3>Location</h3>
          <p className="contact-card__value">
            Exotic Gills and Fins<br />
            Chennai, Tamil Nadu<br />
            India
          </p>
          <a
            href="https://maps.google.com/?q=Chennai,Tamil+Nadu,India"
            target="_blank"
            rel="noreferrer"
            className="contact-card__map-link"
          >
            View on Map →
          </a>
        </div>

      </div>
    </div>
  );
};

export default Contact;
