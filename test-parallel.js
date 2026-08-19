import fs from 'fs';

async function run() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  const cats = ['training', 'nutrition', 'mindset', 'recovery'];
  const start = Date.now();
  
  const promises = cats.map(cat => fetch('http://localhost:3001/api/generateExplore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test'
    },
    body: JSON.stringify({ category: cat })
  }));
  
  try {
    const responses = await Promise.all(promises);
    for (const res of responses) {
      if (!res.ok) {
        console.error("Failed:", await res.text());
      } else {
        const data = await res.json();
        console.log("Generated:", data.articles?.length, "articles");
      }
    }
    console.log("Parallel Time:", Date.now() - start, "ms");
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

run();
