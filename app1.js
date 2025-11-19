const axios = require("axios");
const { MongoClient } = require("mongodb");
const { set } = require("mongoose");

const { HttpsProxyAgent } = require("https-proxy-agent");
const proxyUrl = "http://proxy9999:UyjOK7iok9822cg@172.121.185.19:8000";

const agent = new HttpsProxyAgent(proxyUrl);

const API_URL = "https://app.undetectable.io/configs/store-json";
const BATCH_SIZE = 100;
const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "mydb";
const COLLECTION_NAME = "config_test";
const cookie =
  "_ym_uid=1763189021308451342; _ym_d=1763195500; _ga=GA1.1.436005009.1763195500; _tt_enable_cookie=1; _ttp=01KA3A8FCEK16HARNR9ZZGBJR1_.tt.1; carrotquest_device_guid=8bfd57bc-b096-4b6e-a7aa-d8b06ab9022c; carrotquest_uid=2106274629713660063; carrotquest_auth_token=user.2106274629713660063.41179-a489318824c7d0e0a95c28b745.0c3b45d64481f48cec57626741f94655ac20cc4737cd2e42; carrotquest_realtime_services_transport=wss; __stripe_mid=d8b5c6ef-4149-4c2d-a5e7-ac238a9a785d9bf7ac; _gcl_au=1.1.1274090139.1763195500.617154809.1763448307.1763448472; cf_clearance=Y_oTrDu6ExfBrYsiYQGUmqf1mUR9KR1eV8pBZp1nutQ-1763448481-1.2.1.1-tbtkwiGWrVTI.43opt8PGnUlYQiTOyAROonddQe3OHjvVvVgNnMLchQGlj0oaRUJ9Vqt60dF8D4N.AcsvWbIJBtD2IxYyH0nRMm22rqwSbx6ENs6_qRl4R3CzJqFyQe_YIz3LO8qipGA33.lED9OZ9wqpUsQz1P3cKneEHJ2cHYr_TQbYxBenUSoTro4USQ7cyytbYJQ0qFAbHPmnXRcF6YDoD7cnCvnGlZRYsXbpBA; _ym_isad=1; carrotquest_hide_all_unread_popups=true; carrotquest_jwt_access=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdHQiOiJhY2Nlc3MiLCJleHAiOjE3NjM0ODY1MTEsImlhdCI6MTc2MzQ4MjkxMSwianRpIjoiOWIyNWU1NGExYzMxNGU2MDk1ZDY5MWNjZTBjODE2NTciLCJhY3QiOiJ3ZWJfdXNlciIsInJvbGVzIjpbInVzZXIuJGFwcF9pZDo0MTE3OS4kdXNlcl9pZDoyMTA2Mjc0NjI5NzEzNjYwMDYzIl0sImFwcF9pZCI6NDExNzksInVzZXJfaWQiOjIxMDYyNzQ2Mjk3MTM2NjAwNjN9.toIEfUcSeYubKYNav7Oj287zMoD7ssYtlibX-X8IKpc; __stripe_sid=63040ce9-0ca0-462d-a0d0-6d1e0a4e22f7e743ab; advanced-frontend=iqil9pg4d0kvrbeau43cb2n3ee; _identity-frontend=e2dd0bb1271d956e20cf78e03c2066634e4c8413e42346caee24265f06016766a%3A2%3A%7Bi%3A0%3Bs%3A18%3A%22_identity-frontend%22%3Bi%3A1%3Bs%3A51%3A%22%5B684384%2C%22aKTFAxqhQagXR5teQRbZBae_OglQSiWm%22%2C2592000%5D%22%3B%7D; _csrf-frontend=e077bf7aa4e97b845c13c6e6981cbb34926d83ed58f726480ae68694220a750fa%3A2%3A%7Bi%3A0%3Bs%3A14%3A%22_csrf-frontend%22%3Bi%3A1%3Bs%3A32%3A%22PjLYWpI2HTRmfYvI8Oqepez-0FOUS-WV%22%3B%7D; carrotquest_session=q8j7qkubk3e0u6pvh1u28zwe58fj9a3y; carrotquest_session_started=1; _ga_G8JB6YSN0V=GS2.1.s1763482905$o18$g1$t1763482942$j23$l0$h0; ttcsid_CUGUUCBC77UA8JMIN9D0=1763482910787::Y48nNyMC2bOuvR22fIw3.14.1763482993418.0; ttcsid=1763482910788::tWVky6lrOLWqCV9-Z1_m.14.1763482993418.0";
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

  let start = 100000;
  let total = 0;
  let keepGoing = 200000;

  while (start <= keepGoing) {
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
