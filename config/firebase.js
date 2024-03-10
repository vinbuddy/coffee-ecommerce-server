import firebaseAdmin from "firebase-admin";
var firebaseCredentials = require("../firebaseCredentials.json");

firebaseAdmin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
});

export { firebaseAdmin };
