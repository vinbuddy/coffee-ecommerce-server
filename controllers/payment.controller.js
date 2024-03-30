import env from "dotenv";
import moment from "moment";
import querystring from "qs";
import crypto from "crypto";
import https from "https";

import { sortObject } from "../utils/utils.js";

env.config();

async function createVnPayUrl(req, res) {
    try {
        process.env.TZ = "Asia/Ho_Chi_Minh";

        let date = new Date();
        let createDate = moment(date).format("YYYYMMDDHHmmss");

        let ipAddr =
            req.headers["x-forwarded-for"] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        let tmnCode = process.env.vnp_TmnCode;
        let secretKey = process.env.vnp_HashSecret;
        let vnpUrl = process.env.vnp_Url;
        let returnUrl = process.env.vnp_ReturnUrl;
        let orderId = moment(date).format("DDHHmmss");

        let amount = req.body.total_payment; // request
        let bankCode = req.body.bankCode; // request
        let locale = req.body.language;

        if (!locale) locale = "vn";
        let currCode = "VND";
        let vnp_Params = {};

        vnp_Params["vnp_Version"] = "2.1.0";
        vnp_Params["vnp_Command"] = "pay";
        vnp_Params["vnp_TmnCode"] = tmnCode;
        vnp_Params["vnp_Amount"] = amount * 100;
        vnp_Params["vnp_Locale"] = locale;
        vnp_Params["vnp_CurrCode"] = currCode;
        vnp_Params["vnp_TxnRef"] = orderId;
        vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
        vnp_Params["vnp_OrderType"] = "other";
        vnp_Params["vnp_ReturnUrl"] = returnUrl;
        vnp_Params["vnp_IpAddr"] = ipAddr;
        vnp_Params["vnp_CreateDate"] = createDate;
        if (bankCode) {
            vnp_Params["vnp_BankCode"] = bankCode;
        } else {
            vnp_Params["vnp_BankCode"] = "VNBANK";
        }

        vnp_Params = sortObject(vnp_Params);

        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

        vnp_Params["vnp_SecureHash"] = signed;
        vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

        return res.status(200).json({
            status: 200,
            message: "Create vnpay url successfully",
            payment_url: vnpUrl,
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function createMomoUrl(req, res) {
    try {
        let partnerCode = "MOMO";
        let accessKey = "F8BBA842ECF85";
        let secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
        let date = new Date();
        let requestId = partnerCode + moment(date).format("YYYYMMDDHHmmss");
        let orderId = requestId;
        let orderInfo = "Thanh toán bằng MoMo cho đơn: " + orderId;
        let redirectUrl = process.env.momo_ReturnUrl;
        let ipnUrl = process.env.momo_ReturnUrl;
        let amount = req.body.total_payment;
        // let requestType = "captureWallet"
        let requestType = "payWithATM";
        let extraData = ""; //pass empty value if your merchant does not have stores

        let rawSignature =
            "accessKey=" +
            accessKey +
            "&amount=" +
            amount +
            "&extraData=" +
            extraData +
            "&ipnUrl=" +
            ipnUrl +
            "&orderId=" +
            orderId +
            "&orderInfo=" +
            orderInfo +
            "&partnerCode=" +
            partnerCode +
            "&redirectUrl=" +
            redirectUrl +
            "&requestId=" +
            requestId +
            "&requestType=" +
            requestType;

        let signature = crypto
            .createHmac("sha256", secretkey)
            .update(rawSignature)
            .digest("hex");

        //json object send to MoMo endpoint
        const requestBody = JSON.stringify({
            partnerCode: partnerCode,
            accessKey: accessKey,
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: "en",
        });

        const options = {
            hostname: "test-payment.momo.vn",
            port: 443,
            path: "/v2/gateway/api/create",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(requestBody),
            },
        };

        const reqq = https.request(options, (momoRes) => {
            momoRes.setEncoding("utf8");

            momoRes.on("data", (body) => {
                const momo_payment_url = JSON.parse(body).payUrl;

                return res.status(200).json({
                    status: 200,
                    message: "Create momo payment url successfully",
                    payment_url: momo_payment_url,
                });
            });
            momoRes.on("end", () => {
                console.log("No more data in response.");
            });
        });

        req.on("error", (e) => {
            return res.status(400).json({ status: 400, message: e.message });
        });

        reqq.write(requestBody);
        reqq.end();
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

export { createVnPayUrl, createMomoUrl };
