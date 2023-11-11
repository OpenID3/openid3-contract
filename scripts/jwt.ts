import base64url from "base64url";
import crypto from "crypto";

const JWK = [
    {
        "n": "q5hcowR4IuPiSvHbwj9Rv9j2XRnrgbAAFYBqoLBwUV5GVIiNPKnQBYa8ZEIK2naj9gqpo3DU9lx7d7RzeVlzCS5eUA2LV94--KbT0YgIJnApj5-hyDIaevI1Sf2YQr_cntgVLvxqfW1n9ZvbQSitz5Tgh0cplZvuiWMFPu4_mh6B3ShEKIl-qi-h0cZJlRcIf0ZwkfcDOTE8bqEzWUvlCpCH9FK6Mo9YLjw5LroBcHdUbOg3Keu0uW5SCEi-2XBQgCF6xF3kliciwwnv2HhCPyTiX0paM_sT2uKspYock-IQglQ2TExoJqbYZe6CInSHiAA68fkSkJQDnuRZE7XTJQ",
        "kty": "RSA",
        "e": "AQAB",
        "alg": "RS256",
        "use": "sig",
        "kid": "f5f4bf46e52b31d9b6249f7309ad0338400680cd"
    },
    {
        "alg": "RS256",
        "e": "AQAB",
        "n": "uB-3s136B_Vcme1zGQEg-Avs31_voau8BPKtvbYhB0QOHTtrXCF_wxIH5vWjl-5ts8up8Iy2kVnaItsecGohBAy_0kRgq8oi-n_cZ0i5bspAX5VW0peh_QU3KTlKSBaz3ZD9xMCDWuJFFniHuxLtJ4QtL4v2oDD3pBPNRPyIcZ_LKhH3-Jm-EAvubI5-6lB01zkP5x8f2mp2upqAmyex0jKFka2e0DOBavmGsGvKHKtTnE9oSOTDlhINgQPohoSmir89NRbEqqzeZVb55LWRl_hkiDDOZmcM_oJ8iUbm6vQu3YwCy-ef9wGYEij5GOWLmpYsws5vLVtTE2U-0C_ItQ",
        "kty": "RSA",
        "use": "sig",
        "kid": "f833e8a7fe3fe4b878948219a1684afa373ca86f"
    }
];

const sha256 = (data: string | Buffer) => {
    return crypto.createHash("sha256").update(data).digest();
}

const publicKey = crypto.createPublicKey({
    key: JWK[0], format: 'jwk'
});

export async function parseJwt(jwt: string) {
    const [header, payload, signature] = jwt.split(".");

    // parse base64
    const headerJson = JSON.parse(base64url.decode(header));
    console.log("header: ", headerJson);
    const payloadJson = JSON.parse(base64url.decode(payload));
    console.log("payload: ", payloadJson);
    const signedMessage = Buffer.from(header + "." + payload, 'utf8');
    const signatureBuffer = base64url.toBuffer(signature);

    // generate hash
    const headerAndPayloadHash = sha256(signedMessage);
    console.log(
        "headerAndPayloadHash to verify onchain: ",
        headerAndPayloadHash.toString("hex")
    );

    // verify signature of RSASSA-PKCS1-V1_5
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(signedMessage);
    const verified = verifier.verify(publicKey, signatureBuffer);
    console.log(verified);
}

