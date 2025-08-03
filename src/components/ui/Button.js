// components/ui/Button.js
import React from "react";
import { FaSpinner } from "react-icons/fa";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  isLoading = false,
  className = "",
  disabled = false,
  type = "button",
  ...props
}) => {
  // Variant styles
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline:
      "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
  };

  // Size styles
  const sizes = {
    xs: "text-xs px-2.5 py-1",
    sm: "text-sm px-3 py-2",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };
  const spinnerSizes = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Disabled state
  const disabledStyles =
    disabled || isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer";

  // Combine all classes
  const buttonClasses = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${disabledStyles}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <FaSpinner className={`animate-spin mr-2 ${spinnerSizes[size]}`} />
      )}

      {/* Left icon (only when not loading) */}
      {!isLoading && icon && iconPosition === "left" && (
        <span className="mr-2">{icon}</span>
      )}

      {/* Button text */}
      {children}

      {/* Right icon (only when not loading) */}
      {!isLoading && icon && iconPosition === "right" && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button;
