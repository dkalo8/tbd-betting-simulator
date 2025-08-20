import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(req, res, next) {
    const auth = req.headers.authorization || "";
    const idToken = auth.replace(/^Bearer\s+/, "");
    if (!idToken) {
        return res.status(401).json({ error: "Missing Authorization Header" });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        req.user = { _id: payload.sub, email: payload.email, name: payload.name };
        next();
    } catch (e) {
        console.error("Google token verify error:", e);
        res.status(401).json({ error: "Invalid Google ID token" });
    }
}