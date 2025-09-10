import { useEffect } from "react"; // 👈 Add this
import { useTheme } from "../context/ThemeContext";
import styles from "../style";
import { checkBackend } from "../api/api";
import Layout from "../components/Layout";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Stats from "../components/Stats";
import Business from "../components/Business";
import Billing from "../components/Billing";
import CardDeal from "../components/CardDeal";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";
import Clients from "../components/Clients";
import Footer from "../components/Footer";

const Landing = () => {
  const { theme } = useTheme();

  // Test backend connection
 useEffect(() => {
  const testBackend = async () => {
    try {
      const data = await checkBackend();
      console.log("Backend says:", data);
    } catch (err) {
      console.error("❌ Backend error:", err);
    }
  };
  testBackend();
}, []);

  return (
    <div className={`bg-[var(--color-primary)] text-[var(--color-dim-white)] w-full overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      <Navbar />
      <div className={`bg-[var(--color-primary)] text-[var(--color-dim-white)] ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <Hero />
        </div>
      </div>
      <div className={`bg-primary ${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Stats />
          <Business />
          <Billing />
          <CardDeal />
          <Testimonials />
          <Clients />
          <CTA />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Landing;
