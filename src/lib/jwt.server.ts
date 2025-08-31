// @oslojs/jwt + noble ❤️
import {
	joseAlgorithmHS256,
	joseAlgorithmES256,
	joseAlgorithmRS256,
	encodeJWT,
	parseJWT,
	createJWTSignatureMessage,
	JWSRegisteredHeaders,
	JWTRegisteredClaims
} from '@oslojs/jwt';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha2';
import { p256 } from '@noble/curves/nist';

type Algorithm = typeof joseAlgorithmHS256 | typeof joseAlgorithmES256 | typeof joseAlgorithmRS256;

function calculateSignature(input: Uint8Array, secret: Uint8Array, algorithm: Algorithm) {
	let signature: Uint8Array;
	if (algorithm === 'HS256') {
		signature = hmac(sha256, secret, input);
	} else if (algorithm === 'ES256') {
		signature = p256.sign(sha256(input), secret).toBytes();
	} else if (algorithm === 'RS256') {
		throw new Error('RS256 not supported. Sorry!');
		// const keyBuffer = secret.buffer;
		// if (!(keyBuffer instanceof ArrayBuffer)) throw new Error('Invalid key buffer');
		// const key = await crypto.subtle.importKey(
		// 	'pkcs8',
		// 	keyBuffer,
		// 	{
		// 		name: 'RSASSA-PKCS1-v1_5',
		// 		hash: { name: 'SHA-256' }
		// 	},
		// 	false,
		// 	['sign']
		// );
		// const inputBuffer = input.buffer;
		// if (!(inputBuffer instanceof ArrayBuffer)) throw new Error('Invalid input buffer');
		// const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, inputBuffer);
		// signature = new Uint8Array(signatureBuffer);
	} else {
		throw new Error('Unsupported algorithm');
	}

	return signature;
}

export async function sign(
	payload: object,
	secret: Uint8Array,
	options: {
		algorithm?: Algorithm;
	} = {
		algorithm: joseAlgorithmHS256
	}
) {
	const algorithm = options.algorithm ?? joseAlgorithmHS256;

	const header = { alg: algorithm, typ: 'JWT' };

	const headerJSON = JSON.stringify(header);
	const payloadJSON = JSON.stringify(payload);

	const signatureMessage = createJWTSignatureMessage(headerJSON, payloadJSON);
	const signature = calculateSignature(signatureMessage, secret, algorithm);

	return encodeJWT(headerJSON, payloadJSON, signature);
}

function isSupportedAlgorithm(alg: string): alg is Algorithm {
	return alg === joseAlgorithmHS256 || alg === joseAlgorithmES256 || alg === joseAlgorithmRS256;
}

export const verify = (jwt: string, secret: Uint8Array) => {
	const [header, payload, signature, signatureMessage] = parseJWT(jwt);

	const headerParams = new JWSRegisteredHeaders(header);
	const algorithm = headerParams.algorithm();

	if (!isSupportedAlgorithm(algorithm)) {
		throw new Error('Unsupported algorithm');
	}
	if (algorithm === joseAlgorithmRS256) {
		throw new Error('RS256 not supported. Sorry!');
	}

	const expectedSignature = calculateSignature(signatureMessage, secret, algorithm);
	if (
		!(crypto.subtle as unknown as Pick<typeof import('crypto'), 'timingSafeEqual'>).timingSafeEqual(
			expectedSignature,
			signature
		)
	) {
		throw new Error('Invalid signature');
	}

	const claims = new JWTRegisteredClaims(payload);
	if (!claims.verifyExpiration()) throw new Error('Token expired');
	if (claims.hasNotBefore() && !claims.verifyNotBefore()) throw new Error('Token not valid yet');

	return payload;
};
