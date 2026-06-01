import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../redux/store";
import { useAuth } from "../hooks/useAuth";

const TopNavBar: React.FC = () => {
  const navigate = useNavigate()
  const { handleLogout } = useAuth();
  const user = useSelector((state: RootState) => state.userAuth.data.lastName)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = async (option: string) => {
    console.log(option);
    setDropdownOpen(false);
    if (option === "signout") {
      await handleLogout();
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <header className="w-full h-16 bg-white flex items-center justify-between px-6">
      {/* System Name */}
      <div className="text-xl font-bold text-gray-800">Restaurant Management System <span className="text-center text-sm">V 3.0.1</span></div>

      {/* User menu */}
      <div className="relative flex gap-2" ref={dropdownRef}>
        <span>Hello {user}</span>
        <button
          className="flex items-center gap-1 text-gray-700 hover:text-gray-900 focus:outline-none"
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          <FaUserCircle className="w-6 h-6" />
          <FiChevronDown className="w-5 h-5" />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-10 w-60 bg-white border border-gray-200 rounded shadow-lg z-50">
            <button
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 hover:text-[#3d5aa0]"
              onClickCapture={() => {
                navigate('/account_settings')
                setDropdownOpen(false)
              }}
            >
              <FaUserCircle /> Account Settings
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 text-red-400 hover:text-red-600"
              onClick={() => handleOptionClick("signout")}
            >
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavBar;
