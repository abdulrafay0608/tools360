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
    primary:
      "bg-[#173d34] text-white hover:bg-[#245b4c] focus-visible:outline-[#235c4f]",
    secondary:
      "bg-[#edf3ef] text-[#29493e] hover:bg-[#e1ebe5] focus-visible:outline-[#235c4f]",
    danger:
      "bg-[#a13c2f] text-white hover:bg-[#842f25] focus-visible:outline-[#a13c2f]",
    outline:
      "border border-[#b8c9c0] bg-white text-[#29493e] hover:bg-[#f2f7f4] focus-visible:outline-[#235c4f]",
    ghost:
      "bg-transparent text-[#405950] hover:bg-[#edf3ef] focus-visible:outline-[#235c4f]",
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
    "inline-flex min-h-10 items-center justify-center rounded-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  // Disabled state
  const disabledStyles =
    disabled || isLoading ? "" : "cursor-pointer";

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
