import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'supportify-svelte';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'users';

app.use(cors());
app.use(express.json());

let client;

async function connectToDatabase() {
	if (!client) {
		client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });

		try {
			await client.connect();
		} catch (error) {
			console.error('Error connecting to MongoDB:', error);
			throw error;
		}
	}

	return client;
}

app.get('/getData/:param', async (req, res) => {
	try {
		const db = await connectToDatabase();
		const collection = db.collection(COLLECTION_NAME);

		const param = req.params.param;
		const user = await collection.findOne({ sub: param });

		if (user) {
			const { name, picture } = user;
			res.json({
				cookies: req.cookies,
				user: name,
				pfp: picture
			});
		} else {
			res.status(404).json({ message: 'User not found' });
		}
	} catch (error) {
		console.error('Error fetching user data:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
