import { writeFileSync, mkdirSync } from 'fs';
import https from 'https';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Untuk dapatkan __dirname di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FEED_URLS = [
  {
    url: 'https://www.goinsan.com/feeds/posts/summary/-/lifestyle?alt=json&orderby=updated&max-results=4',
    source: 'lifestyle'
  },
  {
    url: 'https://www.goinsan.com/feeds/posts/summary/-/gadget?alt=json&orderby=updated&max-results=4',
    source: 'gadget'
  }
];

function fetchFeed({ url, source }) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const entries = json.feed.entry || [];
          const posts = entries.map(entry => ({
            title: entry.title?.$t || '',
            thumbnail: entry.media$thumbnail.url || '',
            link: entry.link?.find(l => l.rel === 'alternate')?.href || '',
            published: entry.published?.$t || '',
          }));
          resolve({ source, posts });
        } catch (e) {
          reject(`❌ Gagal parse JSON dari ${url}`);
        }
      });
    }).on('error', err => {
      reject(`❌ Gagal fetch dari ${url}: ${err.message}`);
    });
  });
}

async function fetchAndSaveFeeds() {
  try {
    for (const feed of FEED_URLS) {
      console.log(`📥 Fetching from ${feed.source}`);
      const { source, posts } = await fetchFeed(feed);

      const dir = join(__dirname, '../data');
      const filepath = join(dir, `${source}.json`);

      mkdirSync(dir, { recursive: true });
      writeFileSync(filepath, JSON.stringify({ posts }, null, 2));

      console.log(`✅ Saved ${posts.length} posts to ${filepath}`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1); // exit with error
  }
}

fetchAndSaveFeeds();
