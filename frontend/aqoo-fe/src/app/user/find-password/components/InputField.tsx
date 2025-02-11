"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, ...rest }, ref) => {
    return (
      <div>
        <label className="block text-sm font-semibold text-blue-800 mb-1">
          {label}
        </label>
        <input
          ref={ref}
          {...rest}
          className={`w-full px-3 py-2 border border-blue-300 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 transition ${
            rest.disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
          }`}
        />
        {error && <span className="text-red-500 text-xs">{error}</span>}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
