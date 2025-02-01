import {
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserProfileDto } from '../user/entities/user-profile.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { SignupDto } from './dto/signup.dto';
import { GoogleAuthGuard } from './guards/google.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req: { user: { userId: string } },
  ): Promise<{ message: string }> {
    return this.authService.logout(req.user.userId);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(LocalAuthGuard)
  @Post('register')
  async signup(@Body() signupDto: SignupDto): Promise<{ message: string }> {
    try {
      return await this.authService.signup(signupDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('An error occurred during registration');
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(
      refreshTokenDto.userId,
      refreshTokenDto.refreshToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate-token')
  validateToken(@Request() req: { user: { email: string } }) {
    return { valid: true, user: req.user };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth(@Req() req: { user: UserProfileDto }) {
    return req.user;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleAuthRedirect(@Req() req) {
    return {
      message: 'Google Authentication successful',
      user: req.user,
    };
  }
}
