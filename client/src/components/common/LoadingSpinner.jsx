import React from "react";

const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>

        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
      </div>

      {text && (
        <p className="mt-4 text-gray-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Inline spinner for buttons/tables
export const InlineSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

export default LoadingSpinner;
