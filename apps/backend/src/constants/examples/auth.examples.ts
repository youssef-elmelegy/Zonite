import { MOCK_DATA, MOCK_IMAGES } from './global.constants';

export const AuthExamples = {
  register: {
    request: {
      email: MOCK_DATA.email.user,
      password: MOCK_DATA.password.default,
      fullName: MOCK_DATA.name.fullName,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Account created',
        data: {
          message: 'User registered successfully. OTP sent to your email',
          email: MOCK_DATA.email.user,
          otpSent: true,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      conflict: {
        code: 409,
        success: false,
        message: 'Email already registered',
        error: 'ConflictException',
        timestamp: MOCK_DATA.dates.default,
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be a valid email address',
          'password must be at least 8 characters long',
          'fullName must be between 2 and 30 characters',
        ],
        error: 'BadRequestException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Registration failed',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },

  verifyOtp: {
    request: {
      verifyEmail: {
        email: MOCK_DATA.email.user,
        otp: '123456',
        purpose: 'verify_email',
      },
      resetPassword: {
        email: MOCK_DATA.email.user,
        otp: '123456',
        purpose: 'reset_password',
      },
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Email verified successfully',
        data: {
          message: 'Email verified successfully',
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            fullName: MOCK_DATA.name.fullName,
            isEmailVerified: true,
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
      successResetPassword: {
        code: 200,
        success: true,
        message: 'OTP verified successfully',
        data: {
          message: 'OTP verified successfully',
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            fullName: MOCK_DATA.name.fullName,
            isEmailVerified: true,
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid or expired OTP',
        error: 'UnauthorizedException',
        timestamp: MOCK_DATA.dates.default,
      },
      notFound: {
        code: 404,
        success: false,
        message: 'User not found',
        error: 'NotFoundException',
        timestamp: MOCK_DATA.dates.default,
      },
      alreadyVerified: {
        code: 409,
        success: false,
        message: 'Email already verified',
        error: 'ConflictException',
        timestamp: MOCK_DATA.dates.default,
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be a valid email address',
          'otp must be exactly 6 characters',
          'purpose must be one of: verify_email, reset_password',
        ],
        error: 'BadRequestException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to verify email',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },

  setupProfile: {
    request: {
      dateOfBirth: MOCK_DATA.dates.dateOfBirth,
      profileImage: MOCK_IMAGES.avatars.male,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Profile setup completed successfully',
        data: {
          id: MOCK_DATA.id.user,
          email: MOCK_DATA.email.user,
          fullName: MOCK_DATA.name.fullName,
          dateOfBirth: MOCK_DATA.dates.dateOfBirth,
          profileImage: MOCK_IMAGES.avatars.male,
          isEmailVerified: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Email not verified. Please verify your email first',
        error: 'UnauthorizedException',
        timestamp: MOCK_DATA.dates.default,
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'dateOfBirth must be a valid date (YYYY-MM-DD)',
          'profileImage must be a valid URL',
        ],
        error: 'BadRequestException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to complete profile setup',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },

  sendOtp: {
    request: {
      verifyEmail: {
        email: MOCK_DATA.email.user,
        purpose: 'verify_email',
      },
      resetPassword: {
        email: MOCK_DATA.email.user,
        purpose: 'reset_password',
      },
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'OTP sent successfully to your email',
        data: {
          otpSent: true,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      notFound: {
        code: 404,
        success: false,
        message: 'User not found',
        error: 'NotFoundException',
        timestamp: MOCK_DATA.dates.default,
      },
      alreadyVerified: {
        code: 409,
        success: false,
        message: 'Email already verified',
        error: 'ConflictException',
        timestamp: MOCK_DATA.dates.default,
      },
      tooManyAttempts: {
        code: 429,
        success: false,
        message: 'Too many OTP send attempts. Please try again later',
        error: 'TooManyRequestsException',
        timestamp: MOCK_DATA.dates.default,
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be a valid email address',
          'purpose must be one of: verify_email, reset_password',
        ],
        error: 'BadRequestException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to send OTP',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },

  login: {
    request: {
      email: MOCK_DATA.email.user,
      password: MOCK_DATA.password.default,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'User logged in successfully',
        data: {
          id: MOCK_DATA.id.user,
          email: MOCK_DATA.email.user,
          fullName: MOCK_DATA.name.fullName,
          dateOfBirth: MOCK_DATA.dates.dateOfBirth,
          profileImage: MOCK_IMAGES.avatars.male,
          isEmailVerified: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      profileNotSetup: {
        code: 200,
        success: true,
        message: 'Profile setup incomplete. Please complete your profile setup',
        data: {
          message: 'Profile setup incomplete. Please complete your profile setup',
        },
        timestamp: MOCK_DATA.dates.default,
      },
      emailNotVerified: {
        code: 403,
        success: false,
        message: 'Email not verified. Please verify your email before logging in',
        error: 'ForbiddenException',
        timestamp: MOCK_DATA.dates.default,
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid credentials',
        error: 'UnauthorizedException',
        timestamp: MOCK_DATA.dates.default,
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be a valid email address',
          'password must be at least 8 characters long',
        ],
        error: 'BadRequestException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },

  resetPassword: {
    request: {
      newPassword: MOCK_DATA.password.newPassword,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Password reset successfully',
        data: {
          message: 'Password reset successfully',
          reset: true,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      invalidToken: {
        code: 401,
        success: false,
        message: 'Invalid or expired reset token',
        error: 'UnauthorizedException',
        timestamp: MOCK_DATA.dates.default,
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'password must be at least 8 characters long',
          'password must contain at least one uppercase letter, one lowercase letter, and one number',
        ],
        error: 'BadRequestException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to reset password',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },

  changePassword: {
    request: {
      oldPassword: MOCK_DATA.password.default,
      newPassword: MOCK_DATA.password.newPassword,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Password changed successfully',
        data: {
          message: 'Password changed successfully',
          changed: true,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      notFound: {
        code: 404,
        success: false,
        message: 'User not found',
        error: 'NotFoundException',
        timestamp: MOCK_DATA.dates.default,
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'password must be at least 8 characters long',
          'password must contain at least one uppercase letter, one lowercase letter, and one number',
        ],
        error: 'BadRequestException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to change password',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },

  logout: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Logout successful',
        data: {
          message: 'Logout successful',
          loggedOut: true,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },

  checkAuth: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'User authenticated',
        data: {
          isAuthenticated: true,
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            fullName: MOCK_DATA.name.fullName,
            profileImage: MOCK_IMAGES.avatars.male,
            dateOfBirth: MOCK_DATA.dates.dateOfBirth,
            isEmailVerified: true,
            createdAt: MOCK_DATA.dates.default,
            updatedAt: MOCK_DATA.dates.default,
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: MOCK_DATA.dates.default,
      },
      notFound: {
        code: 404,
        success: false,
        message: 'User not found',
        error: 'NotFoundException',
        timestamp: MOCK_DATA.dates.default,
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
