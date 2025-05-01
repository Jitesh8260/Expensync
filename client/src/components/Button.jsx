import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom

const Button = ({ styles }) => {
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleClick = () => {
    navigate("/login"); // Navigate to the login page when the button is clicked
  };

  return (
    <button
      type="button"
      onClick={handleClick} // Set onClick to trigger navigation
      className={`
        py-4 px-6 font-poppins font-medium text-[18px]
        text-white dark:text-black 
        bg-[linear-gradient(135deg,_#00aaff,_#38bdf8)] 
        dark:bg-[linear-gradient(135deg,_#00f6ff,_#38bdf8)] 
        rounded-[10px] outline-none 
        transition-all duration-300 
        hover:brightness-110 hover:shadow-md 
        ${styles}
      `}
    >
      Get Started
    </button>
  );
};

export default Button;
