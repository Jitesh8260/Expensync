import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Player } from '@lottiefiles/react-lottie-player';
import Layout from "../components/Layout";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    localStorage.setItem("token", "dummy-token");
    alert("Login Bypassed Successfully!");
    navigate("/home");
    // Uncomment to enable real login functionality
    // const res = await fetch("http://localhost:5000/api/auth/login", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(formData),
    // });
    // const data = await res.json();
    // if (data.token) {
    //   localStorage.setItem("token", data.token);
    //   alert("Login Successful!");
    //   navigate("/home");
    // } else {
    //   alert(data.msg);
    // }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-4 transition-colors duration-300">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden md:flex border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-shadow duration-300">
          {/* Animation Section */}
          <div className="md:w-5/12 bg-[#001f3f] dark:bg-blue-900 p-6 flex items-center justify-center rounded-tl-3xl rounded-bl-3xl">
            <Player
              autoplay
              loop
              src="/animations/login.json"
              style={{ height: '300px', width: '300px' }}
            />
          </div>

          {/* Form Section */}
          <div className="md:w-7/12 p-8 md:p-10 flex items-center justify-center bg-white dark:bg-slate-900">
            <div className="w-full">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-gray-100 mb-6 text-center transition-all duration-300 transform hover:scale-105">
                Welcome Back
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 text-slate-800 dark:text-gray-100 bg-gray-100 dark:bg-slate-800 transition-transform duration-300 hover:scale-105"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={handleChange}
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 text-slate-800 dark:text-gray-100 bg-gray-100 dark:bg-slate-800 transition-transform duration-300 hover:scale-105"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg shadow-md hover:bg-green-600 dark:hover:bg-green-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-all duration-300 transform hover:scale-105"
                >
                  Login
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-slate-700 dark:text-gray-300">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300"
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
