import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from 'express';


@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'RT_SECRET_KEY',
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
