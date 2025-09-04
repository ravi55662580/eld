const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const { username, email, password, firstName, lastName, role, carrierId } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email 
        ? 'User with this email already exists' 
        : 'Username already taken'
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    role: role || 'driver',
    carrierId: role === 'admin' ? undefined : carrierId
  });

  // Generate token
  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        carrierId: user.carrierId
      },
      token
    }
  });
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const { login, password } = req.body;

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      { email: login.toLowerCase() },
      { username: login }
    ]
  }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid login credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is inactive. Please contact your administrator.'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid login credentials'
    });
  }

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  // Generate token
  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        carrierId: user.carrierId,
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('carrierId', 'name dotNumber');

  res.json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * Update user profile
 * PUT /api/v1/auth/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const fieldsToUpdate = {};
  const allowedFields = ['firstName', 'lastName', 'email'];

  // Only update allowed fields that are provided
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      fieldsToUpdate[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

/**
 * Change password
 * PUT /api/v1/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
