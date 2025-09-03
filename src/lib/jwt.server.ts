// @oslojs/jwt + noble ❤️
import {
	joseAlgorithmHS256,
	encodeJWT,
	parseJWT,
	createJWTSignatureMessage,
	JWSRegisteredHeaders,
	JWTRegisteredClaims
} from '@oslojs/jwt';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha2';

type NodeCrypto = typeof import('crypto');
type EdgeCryptoSubtle = Pick<typeof import('crypto'), 'timingSafeEqual'>;
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if ('timingSafeEqual' in crypto) {
		return (crypto as NodeCrypto).timingSafeEqual(a, b);
	} else if ('timingSafeEqual' in crypto.subtle) {
		return (crypto.subtle as EdgeCryptoSubtle).timingSafeEqual(a, b);
	}

	if (a.length !== b.length) return false;
	let out = 0;
	let i = -1;
	while (++i < a.length) {
		out |= a[i] ^ b[i];
	}
	return out === 0;
}

export function sign(payload: object, secret: Uint8Array) {
	const header = { alg: joseAlgorithmHS256, typ: 'JWT' };

	const headerJSON = JSON.stringify(header);
	const payloadJSON = JSON.stringify(payload);

	const signatureMessage = createJWTSignatureMessage(headerJSON, payloadJSON);
	const signature = hmac(sha256, secret, signatureMessage);

	return encodeJWT(headerJSON, payloadJSON, signature);
}

export const verify = (jwt: string, secret: Uint8Array) => {
	const [header, payload, signature, signatureMessage] = parseJWT(jwt);

	const headerParams = new JWSRegisteredHeaders(header);
	const algorithm = headerParams.algorithm();

	if (algorithm !== joseAlgorithmHS256) {
		throw new Error('Unsupported algorithm');
	}

	const expectedSignature = hmac(sha256, secret, signatureMessage);

	if (!timingSafeEqual(expectedSignature, signature)) {
		throw new Error('Invalid signature');
	}

	const claims = new JWTRegisteredClaims(payload);
	if (!claims.verifyExpiration()) throw new Error('Token expired');
	if (claims.hasNotBefore() && !claims.verifyNotBefore()) throw new Error('Token not valid yet');

	return payload;
};
