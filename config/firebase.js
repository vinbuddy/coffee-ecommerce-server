import firebaseAdmin from "firebase-admin";
import firebaseCredentials from "../firebaseCredentials.json" with { type: "json" };

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseCredentials),
    storageBucket: "gs://ecommerce-app-83f6e.appspot.com",
});

const bucket = firebaseAdmin.storage().bucket();

export { firebaseAdmin, bucket };
