import { useNavigate } from "react-router-dom";  // For React Router v6
import styles from "../style";
import { arrowUp } from "../assets";

const GetStarted = () => {
  const navigate = useNavigate();  // Hook to use navigation in v6

  // Function to handle click event
  const handleGetStartedClick = () => {
    navigate("/login");  // Redirect to login page
  };

  return (
    <div
      className={`${styles.flexCenter} w-[140px] h-[140px] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-600 dark:to-blue-700 p-[2px] cursor-pointer`}
      onClick={handleGetStartedClick} // On click, trigger the function
    >
      <div
        className={`${styles.flexCenter} flex-col bg-white dark:bg-slate-800 w-[100%] h-[100%] rounded-full`}
      >
        <div className={`${styles.flexStart} flex-row`}>
          <p className="font-poppins font-medium text-[18px] leading-[23.4px] text-neutral-800 dark:text-neutral-200">
            <span className="text-gradient">Get</span>
          </p>
          <img
            src={arrowUp}
            alt="arrow-up"
            className="w-[23px] h-[23px] object-contain mix-blend-difference"
          />
        </div>

        <p className="font-poppins font-medium text-[18px] leading-[23.4px] text-neutral-800 dark:text-neutral-200">
          <span className="text-gradient">Started</span>
        </p>
      </div>
    </div>
  );
};

export default GetStarted;
