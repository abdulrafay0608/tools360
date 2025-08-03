"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 transition-colors duration-200"
        >
          Tools360
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6 text-base font-medium">
          <Link
            href="/"
            className="text-gray-600 hover:text-blue-500 transition duration-200"
          >
            Tools
          </Link>
          <Link
            href="/about"
            className="text-gray-600 hover:text-blue-500 transition duration-200"
          >
            About
          </Link>
        </nav>

        {/* Mobile Toggle Button with SVG */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-blue-600 focus:outline-none transition-transform duration-200"
          aria-label="Toggle Menu"
        >
          {isOpen ? (
            // Close Icon (X)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // Hamburger Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2 animate-fade-in-down">
          <Link
            href="/"
            className="block text-gray-700 hover:text-blue-500 transition duration-200"
            onClick={() => setIsOpen(false)}
          >
            Tools
          </Link>
          <Link
            href="/about"
            className="block text-gray-700 hover:text-blue-500 transition duration-200"
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
        </div>
      )}
    </header>
  );
}
