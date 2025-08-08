// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Login = () => {
  const [formData, setFormData] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ ==== إضافة منطق تطبيق الثيم ====
  useEffect(() => {
    // اقرأ الثيم الحالي من الـ local storage عند تحميل الصفحة
    const currentTheme = localStorage.getItem("theme");
    const root = window.document.documentElement;

    // طبّق الكلاس المناسب لضمان عرض الألوان الصحيحة
    if (currentTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);
  // ===================================

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    // ✅ استخدام كلاسات الألوان المتغيرة
    <div className="bg-primary text-text-primary flex items-center justify-center min-h-screen transition-colors duration-200">
      {/* بطاقة تسجيل الدخول مع التنسيقات المتغيرة */}
      <div className="bg-secondary p-8 sm:p-10 rounded-xl shadow-lg w-full max-w-md text-center border border-border-color">
        <h2 className="text-3xl font-bold text-text-primary mb-2">Login</h2>
        <p className="text-text-secondary mb-6">
          Access your FlightDeck dashboard.
        </p>

        <form onSubmit={onSubmit}>
          <div className="text-left mb-5">
            <label
              htmlFor="login"
              className="block font-semibold text-text-primary mb-2"
            >
              Email or Username
            </label>
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={onChange}
              required
              className="w-full px-4 py-2 bg-primary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="text-left mb-6">
            <label
              htmlFor="password"
              className="block font-semibold text-text-primary mb-2"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              required
              className="w-full px-4 py-2 bg-primary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="bg-error-light text-error p-3 rounded-lg mb-4 text-sm font-semibold">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent-dark transition duration-200"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-8">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-accent hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
