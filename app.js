import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const port = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'supportify-svelte';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'users';

app.use(cors());
app.use(express.json());

let client;
async function fetchTorrents({ query}) {
 
  const torrents = [];
  const tgxUrl = 'https://tgx.sb/torrents.php?search=' + query + '&lang=1&nox=2&sort=seeders&order=desc';
  let html;
  try {
    html = await axios.get(tgxUrl);
  } catch (error) {
    console.error(error);
    return null;
  }

  const $ = cheerio.load(html.data);
  console.log(html.data);
  $('div.tgxtablerow.txlight').each((i, element) => {
    const torrent = {
      title: $(element).find(':nth-child(4) div a b').text(),
      url: 'https://tgx.sb' + $(element).find('a.txlight').attr('href'),
      magnet: $(element).find('.tgxtablecell.collapsehide.rounded.txlight a').next().attr('href'),
      seed: $(element).find(':nth-child(11) > span > font:nth-child(1) > b').text().replace(/\.|,/g, ''),
      leech: $(element).find(':nth-child(11) > span > font:nth-child(2) > b').text().replace(/\.|,/g, ''),
      size: $(element).find(':nth-child(8)').text()
    };
    if (torrent.size) {
      torrents.push(torrent);
    }
  });
  return {torrent: torrents };
}

app.get('/', async (req, res) => {
    try {
      
      const searchTerm = req.query.search;
      const lang = req.query.lang || 1;
      const nox = req.query.nox || 2;
  
      const torrentData = await fetchTorrents({ query: searchTerm });
  
      if (torrentData) {
        res.json(torrentData);
      } else {
        res.status(404).json({ error: 'Torrents not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
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
		const d = await connectToDatabase();
		const db = d.db(DATABASE_NAME);
		const collection = db.collection(COLLECTION_NAME);

		const param = req.params.param;
		const user = await collection.findOne({ sub: param });

		if (user) {
			const { sub, name, picture } = user;
			res.json({
				sub: sub,
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
