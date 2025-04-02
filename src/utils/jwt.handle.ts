import pkg from "jsonwebtoken";
const { sign, verify } = pkg;
const JWT_SECRET = process.env.JWT_SECRET || "token.010101010101";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh.010101010101";

// Generar un token JWT con datos adicionales
const generateToken = (id: string, email: string) => {
    const jwt = sign({ id, email }, JWT_SECRET, { expiresIn: '20s' });
    return jwt;
};

// Generar un refresh token
const generateRefreshToken = (id: string) => {
    const refreshToken = sign({ id }, REFRESH_SECRET, { expiresIn: '7d' });
    return refreshToken;
};

// Verificar el token JWT
const verifyToken = (jwt: string) => {
    const isOk = verify(jwt, JWT_SECRET);
    return isOk;
};

// Verificar el refresh token
const verifyRefreshToken = (refreshToken: string) => {
    const isOk = verify(refreshToken, REFRESH_SECRET);
    return isOk;
};

export { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken };