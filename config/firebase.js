import firebaseAdmin from "firebase-admin";
import firebaseCredentials from "../firebaseCredentials.json" with { type: "json" };;
// var firebaseCredentials = require("../firebaseCredentials.json");

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseCredentials),
});

export { firebaseAdmin };
