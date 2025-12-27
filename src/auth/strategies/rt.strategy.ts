import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from 'express';
import { ConfigService } from "@nestjs/config";


@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get<string>('RT_SECRET') || 'secret',
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: any) {
        const authHeader = req.headers.authorization;

        if (!authHeader) throw new Error('Refresh token not found');

        const refreshToken = authHeader.replace('Bearer', '').trim();
        return {
            ...payload,
            refreshToken,
        };
    }
}
