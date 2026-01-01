import { google } from "googleapis";
import path from "path";

class GoogleSearchConsoleService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), "service-account.json"),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    this.searchconsole = google.searchconsole({ version: "v1", auth: this.auth });
  }

  /**
   * Fetches search analytics data for a given site.
   * @param {string} siteUrl - The URL of the property in GSC.
   * @param {string} startDate - Start date in YYYY-MM-DD format.
   * @param {string} endDate - End date in YYYY-MM-DD format.
   * @param {number} rowLimit - Number of rows to return.
   * @returns {Promise<Array>} - Array of rows from GSC.
   */
  async getSearchAnalytics(siteUrl, startDate, endDate, rowLimit = 50) {
    try {
      const res = await this.searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit,
        },
      });
      return res.data.rows || [];
    } catch (error) {
      console.error("Error fetching GSC data:", error);
      throw error;
    }
  }

  /**
   * Fetches queries that might indicate user problems (containing 'how', 'why', 'error', 'fix', etc.)
   * This is a heuristic filter before sending to Gemini.
   */
  async getProblematicQueries(siteUrl, startDate, endDate, rowLimit = 100) {
    const rows = await this.getSearchAnalytics(siteUrl, startDate, endDate, rowLimit);
    
    // Basic filtering for "problem" keywords
    const problemKeywords = ['how', 'why', 'error', 'fix', 'issue', 'problem', 'fail', 'setup', 'install', 'config', 'guide', 'tutorial'];
    
    return rows.filter(row => {
      const query = row.keys[0].toLowerCase();
      return problemKeywords.some(keyword => query.includes(keyword));
    });
  }
}

// Singleton instance
let gscInstance = global.gscInstance;

if (!gscInstance) {
  gscInstance = new GoogleSearchConsoleService();
  global.gscInstance = gscInstance;
}

export default gscInstance;
