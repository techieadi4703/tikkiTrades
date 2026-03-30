import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
async function test() {
  try {
    const res = await yahooFinance.search('RELIANCE.NS', { newsCount: 5 });
    console.log("Search worked:", !!res);
    console.log("News returned:", res.news?.length);
    if (res.news?.length) {
      console.log("First headline:", res.news[0].title);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
