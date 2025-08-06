import { Container } from 'react-bootstrap';
import './Home.css';

function Home() {
  return (
    <Container className="text-center mt-4">
      <h1 className="fw-bold mb-4">Welcome to TBD: A Developing Sports Page</h1>
      <img 
      src={`${process.env.PUBLIC_URL}/images/large_tbd_logo.png`} 
      alt="TBD banner" 
      className="home-logo" />
    </Container>
  );
}

export default Home;