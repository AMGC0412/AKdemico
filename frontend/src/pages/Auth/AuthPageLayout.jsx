import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import './AuthPageLayout.css';

const AuthPageLayout = () => {
  return (
    <div className="pop-auth-container">
      <div className="pop-auth-card">
        <Link to="/" className="pop-brand">
          <span className="pop-logo-icon">🦉</span>
          <span className="pop-logo-text">AKDÉMICO</span>
        </Link>
        
        <nav className="pop-nav">
          <NavLink to="/auth/login" className={({isActive}) => isActive ? 'active' : ''}>Login</NavLink>
          <NavLink to="/auth/registro" className={({isActive}) => isActive ? 'active' : ''}>Registro</NavLink>
        </nav>

        <div className="pop-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;