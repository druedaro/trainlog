import fs from 'fs';

async function run() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  // Real valid tiny webm file (empty or minimal)
  const fakeWebm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81, 0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x02, 0x42, 0x85, 0x81, 0x02]);

  let body = `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="audio"; filename="recording.webm"\r\n';
  body += 'Content-Type: audio/webm\r\n\r\n';

  const bodyBuffer = Buffer.concat([
    Buffer.from(body),
    fakeWebm,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  try {
    const res = await fetch('http://localhost:3001/api/transcribeAudio', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': 'Bearer test'
      },
      body: bodyBuffer
    });

    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

run();
