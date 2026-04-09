import Hero from "../components/Hero"
import Navbar from "../components/Navbar"
import Featured from "../components/Featured"
import Contacts from "../components/Contacts"
import Footer from "../components/Footer"
import CNTSInfo from "../components/CNTSInfo"
import {Element} from "react-scroll"


const Home = () => {
  return (
    <div>
      <Navbar />
      <Element name="hero">
        <Hero />
      </Element>

      <Element name="cnts">
        <CNTSInfo />
      </Element>

      <Element name="featured">
        <Featured />
      </Element>
      <Element name="donate">
       <Contacts />
      </Element>

      <Element name="contact">
        <Footer />
      </Element>

    </div>
  )
}

export default Home
