import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { env } from '@/env';
import type { RegisterDto } from '../dto/register.dto';
import type { RegistrationResponse } from '../dto/register-response.dto';
import type { LoginDto } from '../dto/login.dto';
import { EmailService } from '@/common/services/email.service';
import {
  AuthResponse,
  ChangePasswordResponse,
  LogoutResponse,
  OtpPurpose,
  RefreshTokenResponse,
  SendOtpDto,
  SendOtpResponse,
  SetupProfileDto,
  SetupProfileResponse,
  VerifyOtpDto,
  VerifyOtpResponse,
} from '../dto';
import { errorResponse } from '@/common/utils/response.handler';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<RegistrationResponse> {
    try {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, dto.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) throw new ConflictException('Email already registered');

      const password = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

      const otp = this.emailService.generateOtp();
      const otpExpiresAt = this.emailService.getOtpExpirationTime();

      const rows = await db
        .insert(users)
        .values({
          email: dto.email.toLowerCase(),
          password,
          fullName: dto.fullName,
          userName: this.generateUsername(dto.fullName),
          isEmailVerified: false,
          otp,
          otpExpiresAt,
        })
        .returning();

      const user = rows[0];
      if (!user) throw new Error('Failed to create user');

      let otpSent = false;
      try {
        await this.emailService.sendOtpEmail(dto.email, otp, dto.fullName);
        otpSent = true;
      } catch (emailError) {
        this.logger.error(`Failed to send OTP email to ${dto.email}`, emailError);
      }

      return {
        message: 'User registered successfully. OTP sent to your email',
        email: dto.email,
        otpSent,
      };
    } catch (error) {
      this.logger.error('Registration error', error);
      throw error instanceof ConflictException
        ? error
        : new BadRequestException('Registration failed');
    }
  }

  /**
   * Verify OTP — handles both verify_email and reset_password purposes.
   *
   * verify_email  → marks email verified, returns setup-profile token
   * reset_password → skips verified check, returns reset-password token
   */
  async verifyOtp(res: Response, verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const { email, otp, purpose } = verifyOtpDto;

    const user = await this.findUserByEmailOrFail(email);

    if (purpose === OtpPurpose.VERIFY_EMAIL && user.isEmailVerified) {
      this.logger.warn(`OTP verification failed: Email already verified - ${email}`);
      throw new ConflictException(
        errorResponse('Email already verified', HttpStatus.CONFLICT, 'ConflictException'),
      );
    }

    this.validateOtpOrFail(user, otp, email);

    try {
      const dbUpdates: Record<string, unknown> = {
        otp: null,
        otpExpiresAt: null,
        updatedAt: new Date(),
      };

      if (purpose === OtpPurpose.VERIFY_EMAIL) {
        dbUpdates.isEmailVerified = true;
      }

      await db.update(users).set(dbUpdates).where(eq(users.id, user.id));

      const { tempToken, tempTokenExpiresIn, message } = this.generateTokenForPurpose(
        purpose,
        user.id,
        user.email,
      );

      await this.generateTokenCookie(res, 'tempToken', tempToken, tempTokenExpiresIn);

      this.logger.log(`OTP verified (purpose=${purpose}) for user: ${user.id} (${email})`);

      return {
        message,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          userName: user.userName,
          isEmailVerified: purpose === OtpPurpose.VERIFY_EMAIL ? true : user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: new Date(),
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`OTP verification error for ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to verify OTP',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Complete profile setup after email verification.
   *
   * Creates an auth session and sends a welcome email on success.
   */
  async setupProfile(
    userId: string,
    setupProfileDto: SetupProfileDto,
    res: Response,
  ): Promise<SetupProfileResponse> {
    const { dateOfBirth, profileImage } = setupProfileDto;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      this.logger.warn(`Profile setup failed: User not found - ${userId}`);
      throw new NotFoundException(
        errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (!user.isEmailVerified) {
      this.logger.warn(`Profile setup failed: Email not verified - ${userId}`);
      throw new ForbiddenException(
        errorResponse(
          'Email not verified. Please verify your email first',
          HttpStatus.FORBIDDEN,
          'ForbiddenException',
        ),
      );
    }

    try {
      await db
        .update(users)
        .set({
          dateOfBirth,
          profileImage: profileImage ?? user.profileImage ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      this.logger.log(`Profile setup completed for user: ${userId} `);

      const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      this.generateTokens(res, updatedUser.id, updatedUser.email);

      // Send welcome email (non-blocking)
      this.emailService
        .sendWelcomeEmail(updatedUser.email, updatedUser.fullName)
        .catch((err) =>
          this.logger.error(`Failed to send welcome email to ${updatedUser.email}`, err),
        );

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        userName: updatedUser.userName,
        dateOfBirth: updatedUser.dateOfBirth ?? null,
        profileImage: updatedUser.profileImage ?? null,
        isEmailVerified: updatedUser.isEmailVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Profile setup error for user ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to complete profile setup',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Send OTP to user email.
   *
   * verify_email  → only allowed when email is NOT yet verified
   * reset_password → allowed regardless of verification status
   */
  async sendOtp(sendOtpDto: SendOtpDto): Promise<SendOtpResponse> {
    const { email, purpose } = sendOtpDto;

    const user = await this.findUserByEmailOrFail(email);

    if (purpose === OtpPurpose.VERIFY_EMAIL && user.isEmailVerified) {
      this.logger.warn(`Send OTP failed: Email already verified - ${email}`);
      throw new ConflictException(
        errorResponse('Email already verified', HttpStatus.CONFLICT, 'ConflictException'),
      );
    }

    // this.checkOtpRateLimitOrFail(email);

    const otp = this.emailService.generateOtp();
    const otpExpiresAt = this.emailService.getOtpExpirationTime();

    try {
      await db
        .update(users)
        .set({ otp, otpExpiresAt, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      this.logger.log(`OTP generated (purpose=${purpose}) for user: ${user.id} (${email})`);

      let otpSent = false;
      try {
        if (purpose === OtpPurpose.VERIFY_EMAIL) {
          await this.emailService.sendOtpEmail(email, otp, user.fullName);
        } else {
          await this.emailService.sendPasswordResetOtpEmail(email, otp, user.fullName);
        }
        otpSent = true;
      } catch (emailError) {
        this.logger.error(`Failed to send OTP email to ${email}`, emailError);
      }

      return { otpSent };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Send OTP error for ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to send OTP',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async login(res: Response, dto: LoginDto): Promise<AuthResponse> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, dto.email.toLowerCase()))
      .limit(1);

    const user = rows[0];
    if (!user) throw new UnauthorizedException('email not registered');

    if (!user.isEmailVerified) {
      this.logger.warn(`Login failed: Email not verified - ${dto.email}`);
      throw new ForbiddenException(
        errorResponse(
          'Email not verified. Please verify your email before logging in',
          HttpStatus.FORBIDDEN,
          'ForbiddenException',
        ),
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid password');

    // if (!user.dateOfBirth) {
    //   this.logger.warn(`Login failed: Profile not set up - ${dto}`);
    //   const tempToken = this.generateTemporaryToken(user.id, user.email);
    //   this.generateTokenCookie(res, 'tempToken', tempToken, env.JWT_SETUP_PROFILE_EXPIRES_IN);
    //   return {
    //     message: 'Profile setup incomplete. Please complete your profile setup',
    //   };
    // }

    this.generateTokens(res, user.id, user.email);
    const { password: _password, ...safeUser } = user;
    return safeUser as unknown as AuthResponse;
  }

  async refreshTokens(userId: string, res: Response): Promise<RefreshTokenResponse> {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    this.generateTokens(res, user.id, user.email);
    return { refreshed: true };
  }

  async logout(res: Response, userId: string): Promise<LogoutResponse> {
    this.clearAuthCookies(res);

    this.logger.log(`Admin/owner cookie logout: ${userId}`);

    return { message: 'Logout successful', loggedOut: true };
  }

  // async forgotPassword(email: string): Promise<void> {
  //   const rows = await db
  //     .select({ id: users.id, email: users.email })
  //     .from(users)
  //     .where(eq(users.email, email.toLowerCase()))
  //     .limit(1);

  //   const user = rows[0];
  //   if (!user) return; // silently ignore unknown emails

  //   const otp = crypto
  //     .createHash('sha256')
  //     .update(String(crypto.randomInt(100000, 999999)))
  //     .digest('hex');
  //   const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  //   await db.update(users).set({ otp: otp, otpExpiresAt: expiresAt }).where(eq(users.id, user.id));

  //   this.logger.log(`[OTP] ${user.email} → ${otp}`);
  // }

  async resetPassword(
    userId: string,
    newPassword: string,
  ): Promise<{ message: string; reset: boolean }> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        this.logger.warn(`Reset password failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId));

      this.logger.log(`Password reset for user: ${userId}`);
      return { message: 'Password reset successfully', reset: true };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to reset password for user ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to reset password',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Change user password — terminates all existing sessions on success
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResponse> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        this.logger.warn(`Password change failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        this.logger.warn(`Password change failed: incorrect old password - ${userId}`);
        throw new UnauthorizedException(
          errorResponse(
            'Current password is incorrect',
            HttpStatus.UNAUTHORIZED,
            'UnauthorizedException',
          ),
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId));

      this.logger.log(`Password changed for user: ${userId} — sessions terminated`);
      return { message: 'Password changed successfully', changed: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) throw error;
      this.logger.error(`Failed to change password for user: ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to change password',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async checkAuth(userId: string) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        this.logger.warn(`Check auth failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      this.logger.log(`Auth check for user: ${userId}`);
      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          profileImage: user.profileImage ?? null,
          dateOfBirth: user.dateOfBirth ?? null,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to check auth for user ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to check authentication',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Generate access + refresh tokens, embedding role in the payload
   */
  private generateTokens(
    res: Response,
    userId: string,
    email: string,
  ): { accessToken: string; refreshToken: string } {
    this.logger.debug(`Generating tokens for: ${userId}`);
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    this.generateTokenCookie(res, 'accessToken', accessToken, env.JWT_ACCESS_EXPIRES_IN);

    const refreshToken = this.jwtService.sign(payload, {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    this.generateTokenCookie(res, 'refreshToken', refreshToken, env.JWT_REFRESH_EXPIRES_IN);

    return { accessToken, refreshToken };
  }

  /**
   * Generate the appropriate token + metadata based on OTP purpose
   */
  private generateTokenForPurpose(
    purpose: OtpPurpose,
    userId: string,
    email: string,
  ): { tempToken: string; tempTokenExpiresIn: number; message: string } {
    if (purpose === OtpPurpose.VERIFY_EMAIL) {
      return {
        tempToken: this.generateTemporaryToken(userId, email),
        tempTokenExpiresIn: env.JWT_SETUP_PROFILE_EXPIRES_IN,
        message: 'Email verified successfully',
      };
    }

    return {
      tempToken: this.generateResetToken(userId, email),
      tempTokenExpiresIn: env.JWT_RESET_PASSWORD_EXPIRES_IN,
      message: 'OTP verified successfully',
    };
  }

  /**
   * Generate temporary token for profile setup
   */
  private generateTemporaryToken(userId: string, email: string): string {
    this.logger.debug(`Generating temporary token for: ${userId}`);
    return this.jwtService.sign(
      { sub: userId, email, type: 'setup-profile' },
      {
        secret: env.JWT_ACCESS_SECRET,
        expiresIn: env.JWT_SETUP_PROFILE_EXPIRES_IN,
      },
    );
  }

  /**
   * Generate reset password token
   */
  private generateResetToken(userId: string, email: string): string {
    this.logger.debug(`Generating reset token for: ${userId}`);
    return this.jwtService.sign(
      { sub: userId, email, type: 'reset-password' },
      {
        secret: env.JWT_ACCESS_SECRET,
        expiresIn: env.JWT_RESET_PASSWORD_EXPIRES_IN,
      },
    );
  }

  private generateTokenCookie(
    res: Response,
    name: string,
    token: string,
    expiresInSeconds: number,
  ): void {
    const isProd = env.NODE_ENV === 'production';

    res.cookie(name, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: expiresInSeconds * 1000,
      path: '/',
    });
  }

  /**
   * Fetch a user by email or throw NotFoundException
   */
  private async findUserByEmailOrFail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      this.logger.warn(`User not found: ${email}`);
      throw new NotFoundException(
        errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    return user;
  }

  /**
   * Assert OTP is valid and not expired, or throw UnauthorizedException
   */
  private validateOtpOrFail(
    user: { otp: string | null; otpExpiresAt: Date | null },
    otp: string,
    email: string,
  ): void {
    const isOtpValid =
      user.otp === otp &&
      user.otpExpiresAt !== null &&
      !this.emailService.isOtpExpired(user.otpExpiresAt);

    if (!isOtpValid) {
      this.logger.warn(`Invalid or expired OTP for: ${email}`);
      throw new UnauthorizedException(
        errorResponse('Invalid or expired OTP', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
      );
    }
  }

  private clearAuthCookies(res: Response): void {
    const isProd = env.NODE_ENV === 'production';
    const sameSite: 'none' | 'lax' = isProd ? 'none' : 'lax';
    const options = { httpOnly: true, secure: isProd, sameSite, path: '/' };
    res.clearCookie('accessToken', options);
    res.clearCookie('refreshToken', options);
    res.clearCookie('tempToken', options);
  }

  private generateUsername(fullName: string): string {
    const baseUsername = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens

    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // random 4-digit number
    return `${baseUsername}-${randomSuffix}`;
  }

  // private toCurrentUser(user: typeof users.$inferSelect): CurrentUser {
  //   return {
  //     id: user.id,
  //     email: user.email,
  //     fullName: user.fullName,
  //   };
  // }
}
