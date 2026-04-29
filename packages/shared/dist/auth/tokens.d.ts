export type AuthTokens = {
    accessToken: string;
    refreshToken?: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
};
export type AccessTokenPayload = {
    sub: string;
    email: string;
    role: 'user' | 'admin';
    fullName: string;
    iat: number;
    exp: number;
};
export type RefreshTokenPayload = {
    sub: string;
    jti: string;
    iat: number;
    exp: number;
};
//# sourceMappingURL=tokens.d.ts.map