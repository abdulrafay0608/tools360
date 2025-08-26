"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect for navbar
  // useEffect(() => {
  //   const handleScroll = () => {
  //     setIsScrolled(window.scrollY > 10);
  //   };

  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border border-gray-200 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-lg shadow-md py-2"
          : "bg-white/80 backdrop-blur-md py-3"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
              T
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Tools360
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              pathname === "/"
                ? "bg-blue-100 text-blue-700 shadow-inner"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
            }`}
          >
            All Tools
          </Link>
          {/* <Link
            href="/categories"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              pathname === "/categories"
                ? "bg-blue-100 text-blue-700 shadow-inner"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
            }`}
          >
            Categories
          </Link> */}
          <Link
            href="/about"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              pathname === "/about"
                ? "bg-blue-100 text-blue-700 shadow-inner"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
            }`}
          >
            About
          </Link>

          {/* CTA Button */}
          <Link
            href="/contact"
            className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 transform hover:-translate-y-0.5"
          >
            Contact
          </Link>
        </nav>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Toggle Menu"
        >
          <div className="w-5 h-5 relative">
            <span
              className={`absolute left-0 top-1/2 w-5 h-0.5 bg-gray-700 transform transition duration-300 ${
                isOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
              }`}
            ></span>
            <span
              className={`absolute left-0 top-1/2 w-5 h-0.5 bg-gray-700 transform transition duration-300 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            ></span>
            <span
              className={`absolute left-0 top-1/2 w-5 h-0.5 bg-gray-700 transform transition duration-300 ${
                isOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"
              }`}
            ></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu with Slide Animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 py-3 bg-white border-t border-gray-200">
          <nav className="flex flex-col space-y-2">
            <Link
              href="/"
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === "/"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Tools
            </Link>
            <Link
              href="/categories"
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === "/categories"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Categories
            </Link>
            <Link
              href="/about"
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === "/about"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium text-center shadow-md mt-2"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
