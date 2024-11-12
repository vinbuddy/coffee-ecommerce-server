import firebaseAdmin from "firebase-admin";
import dotenv from "dotenv";
// import firebaseCredentials from "../firebaseCredentials.json" with { type: "json" };

dotenv.config();

const firebaseCredentials = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseCredentials),
    storageBucket: "gs://ecommerce-app-83f6e.appspot.com",
});

const bucket = firebaseAdmin.storage().bucket();

export { firebaseAdmin, bucket };
