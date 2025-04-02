import { Request, Response } from "express";
import { registerNewUser, loginUser, googleAuth, refreshAccessToken } from "../auth/auth_service.js";

const registerCtrl = async ({ body }: Request, res: Response) => {
    try {
        const { email, password, name, age } = body;

        // Validación de campos requeridos
        if (!email || !password || !name) {
            return res.status(400).json({ message: "Todos los campos (email, password, name) son obligatorios." });
        }

        const responseUser = await registerNewUser(body);
        if (responseUser === "ALREADY_USER") {
            return res.status(409).json({ message: "El usuario ya existe." });
        }

        res.json(responseUser);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

const loginCtrl = async ({ body }: Request, res: Response) => {
    try {
        const { name, email, password } = body;
        const responseUser = await loginUser({name, email, password });

        if (responseUser === 'INCORRECT_PASSWORD') {
            return res.status(403).json({ message: 'Contraseña incorrecta' });
        }

        if (responseUser === 'NOT_FOUND_USER') {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.json(responseUser);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

const googleAuthCtrl = async(req: Request, res: Response) =>{
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URL;
    if (!redirectUri) {
        console.error(" ERROR: GOOGLE_OAUTH_REDIRECT_URL no està definida a .env");
        return res.status(500).json({ message: "Error interno de configuración" });
    }
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'; //ojo tema versió
    const options = new URLSearchParams({ // codi amb el que google respon
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
        
    });
    const fullUrl= `${rootUrl}?${options.toString()}`;
    console.log("Redireccionando a:", fullUrl); 
    res.redirect(fullUrl);
}

const googleAuthCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        
        if (!code) {
            return res.status(400).json({ message: 'Código de autorización faltante' });
        }

        const authData = await googleAuth(code);
        
        if (!authData) {
            return res.redirect('/login?error=authentication_failed');
        }
        
        console.log(authData.token)
        // Configurar cookies no https (secure)--> acces des del web.
        res.cookie('token', authData.token, {
            httpOnly: true,
            secure: false, 
            sameSite: 'none',
            maxAge: 86400000 // 1 día
        });  
        console.log(authData.token);
        res.redirect(`http://localhost:4200/?token=${authData.token}`);   
    } catch (error: any) {
        console.error('Error en callback de Google:', error);
        res.redirect('/login?error=server_error');
    }
};

const refreshTokenCtrl = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        const response = await refreshAccessToken(refreshToken);

        if (response === "INVALID_REFRESH_TOKEN") {
            return res.status(403).json({ message: "Refresh token inválido" });
        }

        if (response === "USER_NOT_FOUND") {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        return res.json(response);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export { registerCtrl, loginCtrl, googleAuthCtrl, googleAuthCallback, refreshTokenCtrl };