const axios = require("axios");
const { MongoClient } = require("mongodb");
const { set } = require("mongoose");
const fs = require("fs");

const { HttpsProxyAgent } = require("https-proxy-agent");
const proxyUrl = "http://proxy9999:UyjOK7iok9822cg@172.121.185.19:8000";

const agent = new HttpsProxyAgent(proxyUrl);

const API_URL = "https://app.undetectable.io/configs/store-json";
const BATCH_SIZE = 100;
const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "mydb";
const COLLECTION_NAME = "config_test";
const cookie =
  "_ym_uid=1763189021308451342; _ym_d=1763195500; _ga=GA1.1.436005009.1763195500; _tt_enable_cookie=1; _ttp=01KA3A8FCEK16HARNR9ZZGBJR1_.tt.1; carrotquest_device_guid=8bfd57bc-b096-4b6e-a7aa-d8b06ab9022c; carrotquest_uid=2106274629713660063; carrotquest_auth_token=user.2106274629713660063.41179-a489318824c7d0e0a95c28b745.0c3b45d64481f48cec57626741f94655ac20cc4737cd2e42; carrotquest_realtime_services_transport=wss; __stripe_mid=d8b5c6ef-4149-4c2d-a5e7-ac238a9a785d9bf7ac; _gcl_au=1.1.1274090139.1763195500.617154809.1763448307.1763448472; cf_clearance=Y_oTrDu6ExfBrYsiYQGUmqf1mUR9KR1eV8pBZp1nutQ-1763448481-1.2.1.1-tbtkwiGWrVTI.43opt8PGnUlYQiTOyAROonddQe3OHjvVvVgNnMLchQGlj0oaRUJ9Vqt60dF8D4N.AcsvWbIJBtD2IxYyH0nRMm22rqwSbx6ENs6_qRl4R3CzJqFyQe_YIz3LO8qipGA33.lED9OZ9wqpUsQz1P3cKneEHJ2cHYr_TQbYxBenUSoTro4USQ7cyytbYJQ0qFAbHPmnXRcF6YDoD7cnCvnGlZRYsXbpBA; _identity-frontend=e2dd0bb1271d956e20cf78e03c2066634e4c8413e42346caee24265f06016766a%3A2%3A%7Bi%3A0%3Bs%3A18%3A%22_identity-frontend%22%3Bi%3A1%3Bs%3A51%3A%22%5B684384%2C%22aKTFAxqhQagXR5teQRbZBae_OglQSiWm%22%2C2592000%5D%22%3B%7D; _csrf-frontend=e077bf7aa4e97b845c13c6e6981cbb34926d83ed58f726480ae68694220a750fa%3A2%3A%7Bi%3A0%3Bs%3A14%3A%22_csrf-frontend%22%3Bi%3A1%3Bs%3A32%3A%22PjLYWpI2HTRmfYvI8Oqepez-0FOUS-WV%22%3B%7D; advanced-frontend=5me8lifskiej0qmv7j5sq2vr0i; _ym_isad=1; carrotquest_jwt_access=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdHQiOiJhY2Nlc3MiLCJleHAiOjE3NjM1Mzc3NTAsImlhdCI6MTc2MzUzNDE1MCwianRpIjoiOTc1ZWVmMmJmZjU5NGRjOWExYmE0OGY2MmY5M2U3MzgiLCJhY3QiOiJ3ZWJfdXNlciIsInJvbGVzIjpbInVzZXIuJGFwcF9pZDo0MTE3OS4kdXNlcl9pZDoyMTA2Mjc0NjI5NzEzNjYwMDYzIl0sImFwcF9pZCI6NDExNzksInVzZXJfaWQiOjIxMDYyNzQ2Mjk3MTM2NjAwNjN9.cIbvNz8MYxSFER8sp5gCVwytQDLAd5ivSV2gp9X0UrM; __stripe_sid=36e045dd-c6d9-44bd-b3dc-f0cc17eb69d620fa86; carrotquest_session=82ds5q2pmueektx19g4hbdbx8u643m2u; carrotquest_session_started=1; ttcsid_CUGUUCBC77UA8JMIN9D0=1763534147329::Ldq-IaNc7Lk6IH79kWnE.17.1763535882702.0; ttcsid=1763534147329::xyOJzCx_gTzRjo6SZUTK.17.1763535882702.0; _ga_G8JB6YSN0V=GS2.1.s1763534147$o20$g1$t1763535887$j60$l0$h0";
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let start = 0;
if (fs.existsSync("progress.txt")) {
  start = parseInt(fs.readFileSync("progress.txt", "utf8"));
  console.log("▶ Resume:", start);
}
async function fetchBatch(start, pageSize, cookie) {
  const res = await axios.get(API_URL, {
    params: { start, length: pageSize },
    httpsAgent: agent,
    headers: {
      Cookie: cookie,
    },
    timeout: 50000,
  });

  return res.data;
}

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION_NAME);

  console.log("Connected to MongoDB");

  let total = 0;
  let keepGoing = 1000000;

  while (start <= keepGoing) {
    console.log(`Fetching start ${start} ...`);

    let data;
    try {
      dataFetch = await fetchBatch(start, BATCH_SIZE, cookie);
      data = dataFetch.data;
      fs.writeFileSync("progress.txt", start.toString());
    } catch (err) {
      console.error("Fetch error:", err.message);
      break;
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.log("Done — no more data.");
      break;
    }

    try {
      await col.insertMany(data, { ordered: false });
      console.log(`Inserted ${data.length} documents`);
      await delay(1000);
    } catch (err) {
      console.error("Insert error:", err.message);
    }

    total += data.length;
    start += 100;
  }

  console.log(`✔ Completed: total records inserted = ${total}`);
  await client.close();
}

main().catch((e) => console.error(e));
