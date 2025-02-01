import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { redisClient } from 'src/config/redis.config';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(
    user: User,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = { email: user.email, sub: user.id };

    const { accessToken, refreshToken } = await this.generateTokens(payload);
    // Cache the session in Redis
    await this.cacheToken(user.id.toString(), accessToken);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async logout(userId: string) {
    // Remove the token from Redis
    await redisClient.del(`auth:${userId}`);
    return { message: 'Logged out successfully' };
  }

  async signup(signupDto: SignupDto): Promise<{
    message: string;
  }> {
    const { email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Ema  x`il already exists');
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create a new user
    await this.userService.create({
      ...signupDto,
      password: hashedPassword,
    });
    return { message: 'User registered successfully' };
  }

  async validateToken(userId: string, token: string): Promise<boolean> {
    const storedToken = await redisClient.get(`auth:${userId}`);
    return storedToken === token;
  }

  async validateUser(email: string, password: string) {
    return this.userService.validateUser(email, password);
  }

  async cacheToken(userId: string, token: string): Promise<void> {
    await redisClient.set(`auth:${userId}`, token, 'EX', 3600); // Token expires in 1 hour
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Verify the refresh token
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    // Ensure the token matches the stored refresh token
    const storedToken = await redisClient.get(`refresh:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const newPayload = { email: payload.email, sub: payload.sub };
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(newPayload);

    // Update refresh token in Redis
    await redisClient.set(
      `refresh:${userId}`,
      newRefreshToken,
      'EX',
      7 * 24 * 60 * 60,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  private async generateTokens(user) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(user),
      this.jwtService.signAsync(user, { expiresIn: '7d' }),
    ]);

    await this.userService.update(user.sub, {
      refreshToken: await hash(refreshToken, 10),
    });

    return { accessToken, refreshToken };
  }
}
