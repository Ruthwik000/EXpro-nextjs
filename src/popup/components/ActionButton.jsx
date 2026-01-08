import React from 'react';

const ActionButton = ({ label, onClick, variant = 'primary' }) => {
  const baseClasses = "w-full py-2 px-3 rounded-md text-sm font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-700 text-gray-200 hover:bg-gray-600",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {label}
    </button>
  );
};

export default ActionButton;
