import { card } from "../assets";
import styles, { layout } from "../style";
import Button from "./Button";

const CardDeal = () => (
  <section className={layout.section}>
    <div className={layout.sectionInfo}>
      <h2 className={styles.heading2}>
        Discover the best card for <br className="sm:block hidden" /> managing
        your expenses.
      </h2>
      <p className={`${styles.paragraph} max-w-[470px] mt-5`}>
        Finding the right credit card can be overwhelming, but with Expensync, you can track all your spending in one place. Choose the card that helps you maximize rewards, build credit, and stay on top of your finances — all in real-time.
      </p>

      <Button styles={`mt-10`} />
    </div>

    <div className={layout.sectionImg}>
      <img src={card} alt="credit card" className="w-[100%] h-[100%]" />
    </div>
  </section>
);

export default CardDeal;
