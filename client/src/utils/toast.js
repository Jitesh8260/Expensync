import { toast } from "react-toastify";

// ✅ Safe theme getter
const getTheme = () => {
  try {
    let theme = localStorage.getItem("theme");
    if (!theme) {
      theme = "light"; // default
      localStorage.setItem("theme", theme); // ✅ ensure ek baar set ho jaye
    }
    return theme;
  } catch {
    return "light"; // fallback
  }
};

// ✅ Success toast
export const showSuccessToast = (message) => {
  const theme = getTheme();

  toast.success(message, {
    style: {
      background:
        theme === "dark"
          ? "linear-gradient(135deg, #0f172a, #1e293b)"
          : "linear-gradient(135deg, #f9fafb, #e5e7eb)",
      color: theme === "dark" ? "#22c55e" : "#15803d",
      fontWeight: "500",
      borderLeft: theme === "dark" ? "5px solid #22c55e" : "5px solid #15803d",
      borderRadius: "12px",
      boxShadow:
        theme === "dark"
          ? "0 4px 12px rgba(0,0,0,0.6)"
          : "0 4px 12px rgba(0,0,0,0.1)",
    },
    autoClose: 3000,
  });
};

// ✅ Error toast (unchanged, red)
export const showErrorToast = (message) => {
  toast.error(message, {
    style: {
      borderRadius: "12px",
      fontWeight: "500",
    },
    autoClose: 3000,
  });
};

// ✅ Info toast (same style as success, green accent)
export const showInfoToast = (message) => {
  const theme = getTheme();

  toast.info(message, {
    style: {
      background:
        theme === "dark"
          ? "linear-gradient(135deg, #0f172a, #1e293b)"
          : "linear-gradient(135deg, #f9fafb, #e5e7eb)",
      color: theme === "dark" ? "#22c55e" : "#15803d",
      fontWeight: "500",
      borderLeft: theme === "dark" ? "5px solid #22c55e" : "5px solid #15803d",
      borderRadius: "12px",
      boxShadow:
        theme === "dark"
          ? "0 4px 12px rgba(0,0,0,0.6)"
          : "0 4px 12px rgba(0,0,0,0.1)",
    },
    autoClose: 3000,
  });
};
