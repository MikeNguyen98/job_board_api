import {
  Controller,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
  Body,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { RefreshTokenDto } from './dto/refreshToken.dto';

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
}
