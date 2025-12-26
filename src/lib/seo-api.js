import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "./service-account.json", // Google Cloud se
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});

const searchconsole = google.searchconsole({ version: "v1", auth });

const res = await searchconsole.searchanalytics.query({
  siteUrl: "https://example.com/",
  requestBody: {
    startDate: "2024-11-01",
    endDate: "2024-11-30",
    dimensions: ["query"],
    rowLimit: 50,
  },
});

console.log(res.data.rows);
