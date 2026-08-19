import fs from 'fs';

async function run() {
  try {
    const res = await fetch('http://localhost:3001/api/generateExplore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      },
      body: JSON.stringify({ category: 'general' })
    });
    
    if (!res.ok) {
      console.error("Failed:", await res.text());
    } else {
      const data = await res.json();
      console.log("Generated:", data.articles?.length, "articles");
      if (data.articles) {
        data.articles.forEach(a => console.log(a.title, "| category:", a.category));
      }
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

run();
