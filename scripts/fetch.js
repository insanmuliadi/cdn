import fs from 'fs';
import https from 'https';
import path from 'path';

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

      const dir = 'data';
      const filepath = path.join(dir, `${source}.json`);

      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filepath, JSON.stringify({ posts }, null, 2));

      console.log(`✅ Saved ${posts.length} posts to ${filepath}`);
    }
  } catch (err) {
    console.error(err);
  }
}

fetchAndSaveFeeds();
