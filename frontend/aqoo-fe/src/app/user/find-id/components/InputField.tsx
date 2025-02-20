"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

// 여러 개의 ref를 하나로 병합하는 헬퍼 함수
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (value: T) => {
    refs.forEach(ref => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, register, error, ...rest }, ref) => {
    const { ref: registerRef, ...restRegister } = register;
    return (
      <div>
        <label className="block text-sm font-semibold text-blue-800 mb-1">
          {label}
        </label>
        <input
          ref={mergeRefs(ref, registerRef)}
          {...restRegister}
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
