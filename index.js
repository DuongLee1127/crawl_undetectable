const axios = require("axios");
const { MongoClient } = require("mongodb");
const { set } = require("mongoose");

const { HttpsProxyAgent } = require("https-proxy-agent");
const proxyUrl = "http://proxy9999:Ddksis87222khsddk982@172.121.185.136:8000";

const agent = new HttpsProxyAgent(proxyUrl);

const API_URL = "https://app.undetectable.io/configs/store-json";
const BATCH_SIZE = 100;
const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "mydb";
const COLLECTION_NAME = "configs";
const cookie =
  "_tt_enable_cookie=1; __stripe_mid=b267ee39-93f4-4248-9d47-10853ce6e231b6c2fa; _ga=GA1.1.436005009.1763195500; _gcl_au=1.1.1274090139.1763195500; _ttp=01KA3A8FCEK16HARNR9ZZGBJR1_.tt.1; _ym_d=1763195500; _ym_uid=1763189021308451342; carrotquest_auth_token=user.2106274629713660063.41179-a489318824c7d0e0a95c28b745.0c3b45d64481f48cec57626741f94655ac20cc4737cd2e42; carrotquest_device_guid=8bfd57bc-b096-4b6e-a7aa-d8b06ab9022c; carrotquest_uid=2106274629713660063; _ym_isad=1; carrotquest_realtime_services_transport=wss; carrotquest_jwt_access=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdHQiOiJhY2Nlc3MiLCJleHAiOjE3NjM0NTI5NzYsImlhdCI6MTc2MzQ0OTM3NiwianRpIjoiN2RmOWNjNTlkYzA0NGU1OGI5NzkwNGIxMTlmZTFmN2EiLCJhY3QiOiJ3ZWJfdXNlciIsInJvbGVzIjpbInVzZXIuJGFwcF9pZDo0MTE3OS4kdXNlcl9pZDoyMTA2Mjc0NjI5NzEzNjYwMDYzIl0sImFwcF9pZCI6NDExNzksInVzZXJfaWQiOjIxMDYyNzQ2Mjk3MTM2NjAwNjN9.EF0fEtzrhOt7gVwFr98bAhjXHfboW6DUHr3x0aaWjTc; __stripe_sid=8f4cf7cb-110a-4d85-9168-08d2b53e962794d74b; advanced-frontend=532nuh4ekpuofgpijke22ea2cu; _csrf-frontend=dd94a2c25c63247b38241efa70960b8655b52beb3d9dd9b655a71c5a18e6cf26a%3A2%3A%7Bi%3A0%3Bs%3A14%3A%22_csrf-frontend%22%3Bi%3A1%3Bs%3A32%3A%22_Bh2GOV1ctZMMc8JoNvLol3NOBt8urQH%22%3B%7D; carrotquest_session=2aywq0voovt9sdegy1bjo8efzcb07olw; _ga_G8JB6YSN0V=GS2.1.s1763449375$o3$g1$t1763450414$j59$l0$h0; carrotquest_session_started=1; ttcsid_CUGUUCBC77UA8JMIN9D0=1763449377477::JluMt5wScN17VW2gYDKJ.3.1763450415950.0; ttcsid=1763449377478::fPmCB5QC6NPpy5ksmaj5.3.1763450415950.0";
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchBatch(start, pageSize, cookie) {
  const res = await axios.get(API_URL, {
    params: { start, length: pageSize },
    httpsAgent: agent,
    headers: {
      Cookie: cookie,
    },
  });

  console.log(res.data);

  return res.data;
}

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION_NAME);

  console.log("Connected to MongoDB");

  let start = 226400;
  let total = 0;
  let keepGoing = true;

  while (keepGoing) {
    console.log(`Fetching start ${start} ...`);

    let data;
    try {
      dataFetch = await fetchBatch(start, BATCH_SIZE, cookie);
      data = dataFetch.data;
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
      await delay(300);
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
