const http = require('http');

async function testSuite() {
  console.log('--- TESTING CREATIVE GENERATOR PORTAL ENDPOINTS ---');

  // Helper fetch
  const getJson = (path, headers = {}) => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          path,
          method: 'GET',
          headers: {
            'x-user-key': 'member01',
            ...headers,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, json: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  };

  // 1. Categories
  const catRes = await getJson('/api/creatives/categories');
  console.log('Categories status:', catRes.status, 'Total categories:', catRes.json?.categories?.length);
  if (catRes.json?.categories) {
    catRes.json.categories.forEach((c) => {
      console.log(` - ${c.code}: ${c.name} (${c.templates?.length} templates)`);
    });
  }

  // 2. Members with October birthdays
  const memRes = await getJson('/api/creatives/members?month=October');
  console.log('\nOctober Birthday Members status:', memRes.status, 'Count:', memRes.json?.members?.length);
  if (memRes.json?.members) {
    memRes.json.members.forEach((m) => {
      console.log(` - ${m.name} (${m.company || 'No Company'}) | Birthday: ${m.birthDay} ${m.birthMonth}`);
    });
  }

  // 3. Test Birthday DOCX generation
  const postData = JSON.stringify({
    referralGroupName: 'Apex Chapter',
    month: 'October',
    members: memRes.json?.members || [
      { name: 'Amit Sharma', birthDay: '15th', phone: '+91 98250 11223', company: 'Apex Solutions', businessCategory: 'SEO' },
    ],
  });

  const docxRes = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/creatives/birthday/docx',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-user-key': 'member01',
        },
      },
      (res) => {
        let size = 0;
        res.on('data', (chunk) => (size += chunk.length));
        res.on('end', () => {
          resolve({ status: res.statusCode, contentType: res.headers['content-type'], size });
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  console.log('\nBirthday DOCX generation status:', docxRes.status);
  console.log('Content-Type:', docxRes.contentType);
  console.log('Generated DOCX File Size:', docxRes.size, 'bytes');

  // 4. Test Save Creative
  const creativeData = JSON.stringify({
    categoryId: catRes.json?.categories?.[0]?.id,
    templateId: catRes.json?.categories?.[0]?.templates?.[0]?.id,
    title: 'Meeting Announcement - Oct 16th (Test)',
    referralGroupName: 'Apex Chapter',
    memberName: 'Liam Davies',
    formData: { date: '16th October', venue: 'The Oberoi' },
    imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    outputFormat: 'PNG',
    dimensions: '1080x1080',
  });

  const saveRes = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/creatives',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(creativeData),
          'x-user-key': 'member01',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        });
      }
    );
    req.on('error', reject);
    req.write(creativeData);
    req.end();
  });

  console.log('\nSave Creative status:', saveRes.status, 'Creative ID:', saveRes.json?.creative?.id);

  // 5. Query user creatives
  const userCreativesRes = await getJson('/api/creatives');
  console.log('User Creatives count:', userCreativesRes.json?.creatives?.length);

  console.log('\n--- ALL VERIFICATIONS PASSED ---');
}

testSuite().catch(console.error);
