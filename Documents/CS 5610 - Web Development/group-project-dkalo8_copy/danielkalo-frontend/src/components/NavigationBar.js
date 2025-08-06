import { NavLink, Link } from 'react-router-dom';
import './NavigationBar.css';

function NavigationBar() {
  return (
    <header className="tbd-nav">
      <nav className="nav-inner">
        {/* logo link → Home page */}
        <Link to="/" className="logo-link">
          <img 
            src={`${process.env.PUBLIC_URL}/images/small_tbd_logo.png`} 
            alt="TBD logo" 
            height="36" />
        </Link>

        {/* menu items */}
        <NavLink to="/games" className="tbd-link">Today's Games</NavLink>
        <NavLink to="/my-sims" className="tbd-link">My Sims</NavLink>
      </nav>
    </header>
  );
}

export default NavigationBar;
