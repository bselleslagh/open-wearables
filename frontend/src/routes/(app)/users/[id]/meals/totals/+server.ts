import { json } from '@sveltejs/kit';
import { parsePeriod } from '$lib/filters/period';
import { toMealTotals } from '$lib/meals/totals';
import { fetchConnections } from '$lib/server/connections';
import { knownProvider } from '$lib/server/events';
import { requireToken } from '$lib/server/guard';
import { fetchMealTotals } from '$lib/server/meals';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const accessToken = await requireToken(locals);
	const asked = url.searchParams.get('provider') ?? '';
	const provider = asked
		? knownProvider(await fetchConnections(params.id, accessToken), asked)
		: '';

	const totals = await fetchMealTotals(params.id, accessToken, {
		period: parsePeriod(url.searchParams),
		provider
	});

	return json(toMealTotals(totals));
};
