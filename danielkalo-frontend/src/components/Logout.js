import { googleLogout } from '@react-oauth/google';
import './Logout.css';


function Logout({ setUser }) {
    const logOut = () => {
        googleLogout();
        setUser(null);
        localStorage.setItem("login", null);
        console.log('Logout made successfully');
    };

    return (
    <button onClick={logOut} type="button" className="logout-btn">
      <img
        src={`${process.env.PUBLIC_URL}/images/google_icon.png`}
        alt="Google logout"
      />
      Sign Out
    </button>
  );
}

export default Logout;