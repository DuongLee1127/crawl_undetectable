const axios = require("axios");
const { MongoClient } = require("mongodb");
const { set } = require("mongoose");

const API_URL = "https://app.undetectable.io/configs/store-json";
const BATCH_SIZE = 100;
const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "mydb";
const COLLECTION_NAME = "configs";
const cookie =
  "__stripe_mid=d8b5c6ef-4149-4c2d-a5e7-ac238a9a785d9bf7ac; __stripe_sid=c4b8cb55-c65b-46d2-8c42-81b7435f68482304f9; _csrf-frontend=fe9610eff8b4a50a08c5a79f57a1035761f419ca69efdf01523b290958b7dbe4a%3A2%3A%7Bi%3A0%3Bs%3A14%3A%22_csrf-frontend%22%3Bi%3A1%3Bs%3A32%3A%22RQ5Ia_HiOWEoE7V8Djt-WoMRiDoUn-6W%22%3B%7D; _ga=GA1.1.436005009.1763195500; _ga_G8JB6YSN0V=GS2.1.s1763361989$o5$g1$t1763362872$j58$l0$h0; _gcl_au=1.1.1274090139.1763195500; _identity-frontend=6c488d69a2ccafde14955e3ea401dfcfaeaed3723ed7fc02b23fb9a18fcbe66ba%3A2%3A%7Bi%3A0%3Bs%3A18%3A%22_identity-frontend%22%3Bi%3A1%3Bs%3A51%3A%22%5B683230%2C%229AMHmufPpD1wDJXn1NmIbCRmwmyEqSVA%22%2C2592000%5D%22%3B%7D; _tt_enable_cookie=1; _ttp=01KA3A8FCEK16HARNR9ZZGBJR1_.tt.1; _ym_d=1763195500; _ym_isad=1; _ym_uid=1763189021308450000; advanced-frontend=c18pojurst7brtmkfja214qco9; carrotquest_auth_token=user.2106274629713660063.41179-a489318824c7d0e0a95c28b745.0c3b45d64481f48cec57626741f94655ac20cc4737cd2e42; carrotquest_device_guid=8bfd57bc-b096-4b6e-a7aa-d8b06ab9022c; carrotquest_jwt_access=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdHQiOiJhY2Nlc3MiLCJleHAiOjE3NjMzNjU1OTMsImlhdCI6MTc2MzM2MTk5MywianRpIjoiM2VjYTYxMjE3MzI5NGYyNDg4ZDljMjBiZmI2MGVmMjMiLCJhY3QiOiJ3ZWJfdXNlciIsInJvbGVzIjpbInVzZXIuJGFwcF9pZDo0MTE3OS4kdXNlcl9pZDoyMTA2Mjc0NjI5NzEzNjYwMDYzIl0sImFwcF9pZCI6NDExNzksInVzZXJfaWQiOjIxMDYyNzQ2Mjk3MTM2NjAwNjN9._c-F8rvx3JzRm0kmrY3btRm-dBYNV3v_2KHnTCC4mK0; carrotquest_realtime_services_transport=wss; carrotquest_session=fdlsbry36poekb5wxzu0fgcc7xjlgd14; carrotquest_session_started=1; carrotquest_uid=2106274629713660000; ttcsid=1763361993092::Djbj-fx2IURmFqC5XLo-.5.1763362908705.0; ttcsid_CUGUUCBC77UA8JMIN9D0=1763361993091::O-KUEQMnjkLqpd6rOsyQ.5.1763362908705.0";
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchBatch(start, pageSize, cookie) {
  const res = await axios.get(API_URL, {
    params: { start, length: pageSize },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "sec-ch-ua":
        '"Chromium";v="131", "Not A(Brand";v="24", "Google Chrome";v="131"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      Cookie: cookie,
    },
  });

  return res.data;
}

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION_NAME);

  console.log("Connected to MongoDB");

  let page = 170700;
  let total = 0;
  let keepGoing = true;

  while (keepGoing) {
    console.log(`Fetching page ${page} ...`);

    let data;
    try {
      dataFetch = await fetchBatch(page, BATCH_SIZE, cookie);
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
    page += 100;
  }

  console.log(`✔ Completed: total records inserted = ${total}`);
  await client.close();
}

main().catch((e) => console.error(e));
