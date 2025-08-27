import { captcha } from './server.js';

export const load = () => {
	const challenge = captcha.getChallenge({ ip: '1.2.3.4' });
	return { challenge };
};
