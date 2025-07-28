import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Home,
  Mail,
  Lock,
  Key,
  User,
  Building,
  CheckCircle
} from 'lucide-react';
import { 
  authenticateUser, 
  createUser, 
  getFarmByCode, 
  addMemberToFarm,
  validateEmail, 
  validatePassword,
  validateFarmCode
} from '../utils/authUtils';

const LoginPage = ({ onNavigate, onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login', 'join'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    farmCode: '',
    name: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // For join flow: 1: Farm Code, 2: Account Details
  const [farmInfo, setFarmInfo] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateJoinStep1 = () => {
    const newErrors = {};

    if (!validateFarmCode(formData.farmCode)) {
      newErrors.farmCode = 'Please enter a valid farm code (6 characters: letters and numbers)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateJoinStep2 = () => {
    const newErrors = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = authenticateUser(formData.email, formData.password);
      
      if (!result.success) {
        setErrors({ submit: result.error });
        return;
      }

      // Success - call login success callback
      onLoginSuccess(result);

    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinStep1 = async () => {
    if (!validateJoinStep1()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const farm = getFarmByCode(formData.farmCode);
      
      if (!farm) {
        setErrors({ farmCode: 'Farm code not found. Please check the code and try again.' });
        return;
      }

      setFarmInfo(farm);
      setStep(2);

    } catch (error) {
      console.error('Farm code validation error:', error);
      setErrors({ farmCode: 'Error validating farm code. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinStep2 = async () => {
    if (!validateJoinStep2()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Create user account
      const userResult = createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        farmCode: formData.farmCode,
        role: 'member'
      });

      if (!userResult.success) {
        setErrors({ submit: userResult.error });
        return;
      }

      // Add user to farm members
      const addMemberResult = addMemberToFarm(formData.farmCode, formData.email);
      
      if (!addMemberResult.success) {
        setErrors({ submit: addMemberResult.error });
        return;
      }

      // Success - call login success callback
      onLoginSuccess({
        user: userResult.user,
        farm: farmInfo
      });

    } catch (error) {
      console.error('Join farm error:', error);
      setErrors({ submit: 'Failed to join farm. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (mode === 'join' && step === 2) {
      setStep(1);
      setFarmInfo(null);
    }
  };

  const renderLoginForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Sign In</h3>
        <p className="text-slate-600">Access your farm's cattle management system</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password}
            </p>
          )}
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {errors.submit}
          </p>
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </button>

      <div className="text-center">
        <p className="text-slate-600 mb-4">Don't have an account?</p>
        <button
          onClick={() => setMode('join')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Join with Farm Code
        </button>
      </div>
    </div>
  );

  const renderJoinStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Join Farm</h3>
        <p className="text-slate-600">Enter your farm code to join the team</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Farm Code
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={formData.farmCode}
            onChange={(e) => handleInputChange('farmCode', e.target.value.toUpperCase())}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.farmCode ? 'border-red-300' : 'border-slate-300'
            }`}
            placeholder="Enter farm code"
          />
        </div>
        {errors.farmCode && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.farmCode}
          </p>
        )}
        <p className="mt-2 text-sm text-slate-500">
          Ask your farm owner for the farm code to join the team.
        </p>
      </div>

      <button
        onClick={handleJoinStep1}
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        {isSubmitting ? 'Validating...' : 'Continue'}
      </button>

      <div className="text-center">
        <button
          onClick={() => setMode('login')}
          className="text-slate-600 hover:text-slate-800"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );

  const renderJoinStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Create Account</h3>
        <p className="text-slate-600">Join {farmInfo?.name}</p>
      </div>

      {/* Farm Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <Building className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="font-semibold text-blue-900">{farmInfo?.name}</h4>
            <p className="text-blue-700 text-sm">Farm Code: {farmInfo?.code}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password}
            </p>
          )}
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {errors.submit}
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="text-slate-600 hover:text-slate-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleJoinStep2}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {isSubmitting ? 'Joining...' : 'Join Farm'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Holstein Pro</h1>
              <p className="text-sm text-slate-600">
                {mode === 'login' ? 'Sign In' : 'Join Farm'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
          {mode === 'login' && renderLoginForm()}
          {mode === 'join' && step === 1 && renderJoinStep1()}
          {mode === 'join' && step === 2 && renderJoinStep2()}
        </div>

        {/* Back to Landing */}
        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('landing')}
            className="text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Landing</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 