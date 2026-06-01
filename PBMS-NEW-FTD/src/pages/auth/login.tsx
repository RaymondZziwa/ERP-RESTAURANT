import React, { useState } from 'react';
import { 
  FiEye, 
  FiEyeOff, 
  FiMail, 
  FiLock, 
  FiArrowRight,
  FiPhone
} from 'react-icons/fi';
import { fetchDataStart, fetchDataSuccess, fetchDataFailure } from "../../redux/slices/auth/userAuthSlice";
import { baseURL, system } from '../../libs/apiConfig';
import { AuthEndpoints } from '../../endpoints/auth/authEndpoints';
import { useDispatch } from 'react-redux';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const LoginComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const dispatch = useDispatch();
  const navigate = useNavigate()


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  e.stopPropagation(); 
  
  if (isLoading) return;
  
  setIsLoading(true);
  dispatch(fetchDataStart());
  
  try {
    const response = await axios.post(
      `${baseURL}${AuthEndpoints.LOGIN}`,
      { 
        email, 
        password, 
        rememberMe, 
        loginMethod 
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        timeout: 10000, // 10 second timeout
      }
    );
    
    console.log('Login response:', response.data.user);
    
    // Dispatch success action if needed
    dispatch(fetchDataSuccess(response.data.user));

    navigate('/dashboard')
    
  } catch (error: unknown) {
    console.error('Login failed:', error);

    // Handle different error types
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        console.error('Server error:', error.response.data);
        toast.error((error.response.data as { message?: string })?.message || 'Login failed');
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error:', error.request);
        toast.error('Network error. Please check your connection.');
      } else {
        // Something else happened
        console.error('Error:', error.message);
        toast.error('An unexpected error occurred');
      }

      // Dispatch failure action if needed
      dispatch(fetchDataFailure(error.message));
    } else {
      toast.error('An unexpected error occurred');
      dispatch(fetchDataFailure(error instanceof Error ? error.message : 'Login failed'));
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Toaster
        position="top-right"
        richColors
        expand={false}
        toastOptions={{
            style: {
              fontSize: "14px",
              borderRadius: "8px",
            },
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-200 rounded-full opacity-50"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-300 rounded-full opacity-30"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-full max-w-md bg-gray-700 rounded-xl flex items-center justify-center p-4 shadow-lg mb-6">
            <span className="text-white font-bold text-md tracking-wide">{ system === "PBMS" ? 'Restaurant Manager' : 'DEIN COMPANY LTD'}</span>
          </div>
          
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm w-full">
            <h2 className="text-3xl font-bold text-gray-800">
              Welcome Back
            </h2>
            <p className="mt-2 text-gray-600 text-sm">
              Sign in to access your account
            </p>

            {/* Login Method Toggle */}
            <div className="mt-6 flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  loginMethod === 'email' 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiMail className="inline mr-2" />
                Email
              </button>
              <button
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  loginMethod === 'phone' 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiPhone className="inline mr-2" />
                Phone
              </button>
            </div>

            {/* Login Form */}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Email/Phone Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loginMethod === 'email' ? (
                      <FiMail className="h-5 w-5 text-gray-400 group-focus-within:text-gray-700 transition-colors" />
                    ) : (
                      <FiPhone className="h-5 w-5 text-gray-400 group-focus-within:text-gray-700 transition-colors" />
                    )}
                  </div>
                  <input
                    id="login"
                    name="login"
                    type={loginMethod === 'email' ? 'email' : 'tel'}
                    autoComplete={loginMethod === 'email' ? 'email' : 'tel'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-3 py-4 bg-white border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all duration-300"
                    placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your phone number'}
                  />
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 group-focus-within:text-gray-700 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-10 py-4 bg-white border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all duration-300"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-700 transition-colors" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-700 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div 
                      className={`w-4 h-4 border-2 rounded transition-all duration-300 cursor-pointer ${
                        rememberMe 
                          ? 'bg-gray-700 border-gray-700' 
                          : 'bg-white border-gray-400 hover:border-gray-600'
                      }`}
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      {rememberMe && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                  <label 
                    htmlFor="remember-me" 
                    className="ml-2 block text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#forgot-password"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <div className="group">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Sign in
                      <FiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            {/* <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to the platform?</span>
              </div>
            </div> */}

            {/* Sign Up Link */}
            {/* <div className="mt-4 text-center">
              <button className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium group">
                Contact administrator
                <FiUser className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div> */}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} { system === "PBMS" ? 'Restaurant Manager' : 'DEIN COMPANY LTD'}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;