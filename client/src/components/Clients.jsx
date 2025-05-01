import { clients } from "../constants";
import styles from "../style";

const Clients = () => (
  <section id="partners" className={`${styles.flexCenter} my-4`}>
    <div className={`${styles.flexCenter} flex-wrap w-full`}>
      {clients.map((client) => (
        <div
          key={client.id}
          className={`flex-1 ${styles.flexCenter} sm:min-w-[192px] min-w-[120px] m-5 transition-all duration-300 hover:scale-105 `}
        >
          <img
            src={client.logo}
            alt={`${client.name}_logo`}
            className="sm:w-[192px] w-[100px] object-contain"
          />
        </div>
      ))}
    </div>
  </section>
);

export default Clients;
