import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../src/routes/lib/db.js';
import dotenv from 'dotenv';
dotenv.config();
const production = process.env.NODE_ENV === 'production';

export default async function serverless(request: VercelRequest, response: VercelResponse) {
	try {
		const client = await connectToDatabase();
		const db = client.db('supportify-svelte');
		const users = db.collection('users');
		const sub = request.query.query as string;
		const user = await users.findOne({ sub });
		const username = user.name;
		const pfp = user.picture;
		response.setHeader(
			'Access-Control-Allow-Origin',
			production ? 'https://supportify-svelte.vercel.app' : 'http://localhost:3000'
		);
		response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
		response.setHeader(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept'
		);

		response.status(200).json({
			cookies: request.cookies,
			user: username,
			pfp: pfp
		});
	} catch (error) {
		console.error('Error fetching user data:', error);
		response
			.status(500)
			.send({ error: 'Internal Server Error api req failed for some reason,', request });
	}
}
