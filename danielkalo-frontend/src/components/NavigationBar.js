// src/components/NavigationBar.js
import { NavLink, Link } from 'react-router-dom';
import './NavigationBar.css';

import Login from './Login';
import Logout from './Logout';

function NavigationBar({ user, setUser }) {
  return (
    <header className="tbd-nav">
      <nav className="nav-inner">
        {/* logo link -> Home page */}
        <Link to="/" className="logo-link">
          <img 
            src={`${process.env.PUBLIC_URL}/images/small_tbd_logo.png`} 
            alt="TBD logo" 
            height="36" />
        </Link>

        {/* menu items */}
        <NavLink to="/games" end className="tbd-link">Today's Games</NavLink>
        <NavLink to="/games/upcoming" className="tbd-link">Upcoming Games</NavLink>
        {user && (
          <>
           <NavLink to="/my-sims" className="tbd-link">My Sims</NavLink>
           <NavLink to="/watchlist" className="tbd-link">Watchlist</NavLink>
          </>
        )}

        {/* spacer to push auth to the right */}
        <div style={{ flex: 1 }} />

        {/* auth buttons */}
        {user 
          ? <Logout setUser={setUser} /> 
          : <Login setUser={setUser} />
        }
      </nav>
    </header>
  );
}

export default NavigationBar;