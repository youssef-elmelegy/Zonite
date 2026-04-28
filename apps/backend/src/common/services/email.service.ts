import { Injectable, Logger } from '@nestjs/common';
import {
  verifyOtpTemplate,
  welcomeTemplate,
  passwordResetOtpTemplate,
} from '@/common/email-templates';
import { env } from '@/env';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  /** OTP validity window in minutes — used consistently for both DB expiry and email display */
  readonly OTP_EXPIRY_MINUTES = 10;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    }) as unknown as Transporter;
  }

  /**
   * Generate a random OTP code
   */
  generateOtp(length: number = 6): string {
    const otp = Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
    return otp;
  }

  /**
   * Send OTP verification email
   */
  async sendOtpEmail(to: string, otp: string, userName: string): Promise<void> {
    try {
      const htmlContent = verifyOtpTemplate(otp, userName, this.OTP_EXPIRY_MINUTES);

      await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject: 'Verify Your Email - Zonite',
        html: htmlContent,
      });

      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email after successful profile setup
   */
  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    try {
      const htmlContent = welcomeTemplate(firstName);

      await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject: 'Welcome to Zonite!',
        html: htmlContent,
      });

      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send password reset OTP email
   */
  async sendPasswordResetOtpEmail(to: string, otp: string, userName: string): Promise<void> {
    try {
      const htmlContent = passwordResetOtpTemplate(otp, userName, this.OTP_EXPIRY_MINUTES);

      await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject: 'Reset Your Password - Zonite',
        html: htmlContent,
      });

      this.logger.log(`Password reset OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Calculate OTP expiration time using the class constant
   */
  getOtpExpirationTime(minutes: number = this.OTP_EXPIRY_MINUTES): Date {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + minutes);
    return expirationTime;
  }

  /**
   * Check if OTP has expired
   */
  isOtpExpired(expirationTime: Date | null): boolean {
    if (!expirationTime) return true;
    return new Date() > expirationTime;
  }

  /**
   * Check if reset token has expired
   */
  isResetTokenExpired(expirationTime: Date): boolean {
    return new Date() > expirationTime;
  }
}
