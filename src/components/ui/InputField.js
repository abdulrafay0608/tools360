import React from "react";
import clsx from "clsx";

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  className = "",
  ...props
}) => (
  <div className="flex flex-col w-full">
    {label && (
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      className={clsx(
        "px-3 py-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm",
        className
      )}
      {...props}
    />
  </div>
);

export default InputField;
