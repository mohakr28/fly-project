// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import Header from "../components/Header";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FormCard = ({ title, description, children }) => (
  <div className="bg-secondary rounded-lg shadow-sm border border-border-color">
    <div className="p-6 border-b border-border-color">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </div>
    {children}
  </div>
);

const Profile = () => {
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const { toggleSidebar, theme, toggleTheme } = useOutletContext();

  const token = localStorage.getItem("token");
  const config = { headers: { "x-auth-token": token } };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth`, config);
        setProfileData({ name: res.data.name, email: res.data.email });
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUserData();
  }, []);

  const handleProfileChange = (e) =>
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/users/profile`, profileData, config);
      showMessage("success", "Profile updated successfully!");
    } catch (err) {
      showMessage("error", err.response?.data?.msg || "Update failed.");
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showMessage("error", "New passwords do not match.");
      return;
    }
    try {
      await axios.put(
        `${API_URL}/api/users/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        config
      );
      showMessage("success", "Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      showMessage("error", err.response?.data?.msg || "Update failed.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <Header
        title="Account Settings"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {message.text && (
        <div
          className={`flex items-center gap-3 p-4 text-sm rounded-md ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300"
              : "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Information Card */}
      <FormCard
        title="Profile Information"
        description="Update your account's profile information and email address."
      >
        <form onSubmit={onProfileSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-primary mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="bg-primary px-6 py-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white font-semibold text-sm rounded-md hover:bg-opacity-90 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </FormCard>

      {/* Change Password Card */}
      <FormCard
        title="Change Password"
        description="Ensure your account is using a long, random password to stay secure."
      >
        <form onSubmit={onPasswordSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-text-primary mb-1"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                  className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmNewPassword"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="bg-primary px-6 py-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white font-semibold text-sm rounded-md hover:bg-opacity-90 transition"
            >
              Update Password
            </button>
          </div>
        </form>
      </FormCard>
    </div>
  );
};

export default Profile;
