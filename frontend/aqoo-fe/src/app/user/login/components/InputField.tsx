"use client";

import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  placeholder,
  register,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-blue-800 mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        {...register}
        className="w-full px-3 py-2 border border-blue-300 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
      />
    </div>
  );
};

export default InputField;
