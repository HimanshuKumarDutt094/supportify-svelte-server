import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
const MONGO_URI = process.env.MONGO_URI;
let client;
const production = process.env.NODE_ENV === 'production';
async function connectToDatabase() {
	if (!client) {
		client = new MongoClient(MONGO_URI);

		try {
			await client.connect();
		} catch (error) {
			console.error('Error connecting to MongoDB:', error);
			throw error;
		}
	}

	return client;
}

export default async function serverless(request, response) {
	try {
		const client = await connectToDatabase();
		const db = client.db('supportify-svelte');
		const users = db.collection('users');
		const sub = request.query.query.toString();
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
