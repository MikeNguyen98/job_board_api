import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { redisClient } from 'src/config/redis.config';

const regexPattern = /^(?:\/auth\b)(?:\/[\w\/!$*\t\r\n\-]+)/gm;

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(
    req: Request & { user?: { userId: string }; originalUrl: string },
    res: Response,
    next: () => void,
  ) {
    const authHeader = req.headers['authorization'];

    if (req.originalUrl.match(regexPattern)) {
      return next(); // Skip token validation for the login route
    }
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token); // Validate token structure
      const cachedToken = await redisClient.get(`auth:${payload.sub}`);

      if (cachedToken !== token) {
        throw new UnauthorizedException('Invalid token');
      }

      req.user = { userId: payload.sub }; // Attach user info to the request object
      next();
    } catch (error) {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
