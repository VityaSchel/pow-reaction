import { defineParams } from '@sveltejs/kit/params';

export const params = defineParams({
	pageid: (param) => (/^[a-zA-Z0-9_-]{0,16}$/.test(param) ? param : undefined)
});
