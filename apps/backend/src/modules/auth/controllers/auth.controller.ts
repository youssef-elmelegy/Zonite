import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '@/common/decorators';
import { CurrentUser } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards';
import { RefreshTokenGuard } from '@/common/guards';
import { successResponse } from '@/utils';
import type { SuccessResponse } from '@/types';
import type { CurrentUser as CurrentUserType } from '@zonite/shared';
import { AuthService } from '../services/auth.service';
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  type RegistrationResponse,
  VerifyOtpDto,
  VerifyOtpResponse,
  SetupProfileDto,
  SetupProfileResponse,
  SendOtpDto,
  SendOtpResponse,
  AuthResponse,
  RefreshTokenResponse,
  LogoutResponse,
  ResetPasswordResponse,
  ChangePasswordDto,
  ChangePasswordResponse,
  CheckAuthResponse,
} from '../dto';
import { AuthLoginDecorator, AuthRegisterDecorator, AuthSendOtpDecorator } from '../decorators';
import { AuthVerifyOtpDecorator } from '../decorators/verify-otp-endpoint.decorator';
import { AuthSetupProfileDecorator } from '../decorators/setup-profile-endpoint.decorator';
import { AuthRefreshTokenDecorator } from '../decorators/refresh-token-endpoint.decorator';
import { AuthResetPasswordDecorator } from '../decorators/reset-password-endpoint.decorator';
import { AuthChangePasswordDecorator } from '../decorators/change-password-endpoint.decorator';
import { AuthLogoutDecorator } from '../decorators/logout-endpoint.decorator';
import { AuthCheckAuthDecorator } from '../decorators/check-auth-endpoint.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @AuthRegisterDecorator()
  async register(@Body() dto: RegisterDto): Promise<SuccessResponse<RegistrationResponse>> {
    this.logger.debug(`Register attempt: ${dto.email}`);
    const result = await this.authService.register(dto);
    this.logger.log(`User registered: ${result.email} (otpSent=${result.otpSent})`);
    return successResponse(result, 'Account created', HttpStatus.CREATED);
  }

  @Public()
  @Post('verify-otp')
  @AuthVerifyOtpDecorator()
  async verifyOtp(
    @Res({ passthrough: true }) res: Response,
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<SuccessResponse<VerifyOtpResponse>> {
    this.logger.debug(
      `OTP verification attempt: ${verifyOtpDto.email} (purpose=${verifyOtpDto.purpose})`,
    );
    const result = await this.authService.verifyOtp(res, verifyOtpDto);
    this.logger.log(`OTP verified for user: ${result.user.id}`);
    return successResponse(result, 'OTP verified', HttpStatus.OK);
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup-profile')
  @AuthSetupProfileDecorator()
  async setupProfile(
    @CurrentUser('id') userId: string,
    @Body() setupProfileDto: SetupProfileDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponse<SetupProfileResponse>> {
    this.logger.debug(`Profile setup attempt: ${userId}`);
    const result = await this.authService.setupProfile(userId, setupProfileDto, res);
    this.logger.log(`Profile setup completed for user: ${userId}`);
    return successResponse(result, 'Profile setup completed successfully', HttpStatus.OK);
  }

  @Public()
  @Post('send-otp')
  @AuthSendOtpDecorator()
  async sendOtp(@Body() sendOtpDto: SendOtpDto): Promise<SuccessResponse<SendOtpResponse>> {
    this.logger.debug(`Send OTP attempt: ${sendOtpDto.email} (purpose=${sendOtpDto.purpose})`);
    const result = await this.authService.sendOtp(sendOtpDto);
    this.logger.log(`OTP sent: otpSent=${result.otpSent} to ${sendOtpDto.email}`);
    return successResponse(result, 'OTP sent', HttpStatus.OK);
  }

  @Public()
  @Post('login')
  @AuthLoginDecorator()
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponse<AuthResponse>> {
    this.logger.debug(`Login attempt: ${loginDto.email})`);
    const result = await this.authService.login(res, loginDto);

    if ('user' in result && result.user) {
      this.logger.log(`User logged in: ${result.id}`);
    } else {
      this.logger.log(`User needs to complete profile setup: ${loginDto.email}`);
    }
    return successResponse(result, 'Login successful', HttpStatus.OK);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @AuthRefreshTokenDecorator()
  async refreshTokens(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponse<RefreshTokenResponse>> {
    this.logger.debug(`Token refresh: ${userId}`);
    const result = await this.authService.refreshTokens(userId, res);
    return successResponse(result, 'Tokens refreshed successfully', HttpStatus.OK);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get('me')
  // @HttpCode(HttpStatus.OK)
  // async me(@CurrentUser() user: CurrentUserType) {
  //   return successResponse({ user }, 'Authenticated');
  // }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @AuthLogoutDecorator()
  async logout(
    @CurrentUser() user: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponse<LogoutResponse>> {
    const result = await this.authService.logout(res, user.id);
    return successResponse(result, 'Logged out', HttpStatus.OK);
  }

  // @Public()
  // @Post('forgot-password')
  // @HttpCode(HttpStatus.OK)
  // async forgotPassword(@Body() dto: ForgotPasswordDto) {
  //   await this.authService.forgotPassword(dto.email);
  //   return successResponse(null, 'If this email exists, an OTP has been sent');
  // }

  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  @AuthResetPasswordDecorator()
  async resetPassword(
    @CurrentUser('id') userId: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<SuccessResponse<ResetPasswordResponse>> {
    this.logger.debug(`Reset password attempt for user: ${userId}`);
    const result = await this.authService.resetPassword(userId, resetPasswordDto.newPassword);
    return successResponse(result, 'Password reset successful', HttpStatus.OK);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @AuthChangePasswordDecorator()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<SuccessResponse<ChangePasswordResponse>> {
    this.logger.debug(`Change password attempt: ${userId}`);
    const result = await this.authService.changePassword(
      userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
    return successResponse(result, 'Password changed successfully', HttpStatus.OK);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check')
  @HttpCode(HttpStatus.OK)
  @AuthCheckAuthDecorator()
  async checkAuth(@CurrentUser('id') userId: string): Promise<SuccessResponse<CheckAuthResponse>> {
    this.logger.debug(`Auth check: ${userId}`);
    const result = await this.authService.checkAuth(userId);
    return successResponse(result, 'User authenticated', HttpStatus.OK);
  }
}
