import { firebaseAdmin } from "../config/firebase.js";

function authVerifyToken(request, response, next) {
    const headerToken = request.headers.authorization;
    if (!headerToken) {
        return response.send({ message: "No token provided" }).status(401);
    }

    if (headerToken && headerToken.split(" ")[0] !== "Bearer") {
        response.send({ message: "Invalid token" }).status(401);
    }

    const token = headerToken.split(" ")[1];
    firebaseAdmin
        .auth()
        .verifyIdToken(token)
        .then(() => next())
        .catch(() =>
            response.send({ message: "Could not authorize" }).status(403)
        );
}

export { authVerifyToken };
