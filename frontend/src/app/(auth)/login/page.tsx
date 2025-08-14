'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useApi from '@/hook/useApi';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();
  const { callApi, isLoading, error } = useApi();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;
    setErrors({});

    try {
      const res = await callApi({
        method: 'POST',
        url: '/auth/login/',
        data: { email, password },
      });

      if (!res) {
        setErrors({ general: 'No response from server. Please try again.' });
        return;
      }

      if ((res as any).error) {
        setErrors({ general: (res as any).error });
        return;
      }

      
      if ((res as any).access_token) {
        const token = (res as any).access_token;

        // Save token in cookie (expires in 7 days)
        document.cookie = `access_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

        router.push('/dashboard');
        return;
      }


      setErrors({ general: 'Unexpected response from server.' });
    } catch (err: any) {
      setErrors({ general: err.message || 'Something went wrong.' });
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
  };

  const handleSignUp = () => {
    console.log('Sign up clicked');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
      <div className="relative z-10 w-full max-w-md">
        {/* Main Form Container */}
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Luminex</h1>
            <p className="text-slate-600 text-lg">Begin Your Quest</p>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-white text-slate-900 placeholder-slate-500 focus:outline-none transition-all duration-300 ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-3 focus:ring-red-100'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-100'
                }`}
                placeholder="Enter your email"
                required
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white text-slate-900 placeholder-slate-500 focus:outline-none transition-all duration-300 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-3 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-100'
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6.878-6.878L21 3m-6.878 6.878a3 3 0 00-4.243-4.243m6.878 6.878L12 12m-3.172-3.172l-6.878 6.878"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                'Log In & Continue the Quest'
              )}
            </button>
          </form>

          {/* Links Section */}
          <div className="flex justify-between items-center mt-6 text-sm">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:text-blue-700 transition-colors duration-300"
            >
              Forgot Password?
            </button>
            <div className="text-slate-600">
              Don't have an account yet?
              <button
                type="button"
                onClick={handleSignUp}
                className="text-blue-600 hover:text-blue-700 ml-1 transition-colors duration-300"
              >
                Sign up now
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-xs">
            Need help? Contact support@luminex.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
