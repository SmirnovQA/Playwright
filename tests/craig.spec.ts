import { test, expect } from '@playwright/test';

test.describe('Craigslist add to fav test', () => {

    
  // Replace these with actual credentials or use environment variables
  const USERNAME = process.env.CRAIGSLIST_USERNAME || 'YPUR_USERNAME';
  const PASSWORD = process.env.CRAIGSLIST_PASSWORD || 'YOUR_PASSWORD';
  const SEARCHURL = process.env.CRAIGSLIST_SEARCHURL || 'https://denver.craigslist.org/search/sss?query=';
  const FAVURL = process.env.CRAIGLIST_FAVURL || 'https://denver.craigslist.org/favorites';
  test('Login search and add to fav', async ({ request, page }) => {
    const query = "Mustang 68";
    const loginUrl = 'https://accounts.craigslist.org/login';
    const loginData = {
      inputEmailHandle: USERNAME,
      inputPassword: PASSWORD,
    };

    //request to login endpoint
    const response = await request.post(loginUrl, {
      form: loginData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://accounts.craigslist.org/login',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // Check successful login
    const responseUrl = response.url();
    const status = response.status();

    console.log(`Response URL: ${responseUrl}`);
    console.log(`Status Code: ${status}`);

    // Assert that the response indicates a successful login
    expect(status).toBe(200);

    //verify cookies are set
    const cookies = await response.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
    expect(cookies.length).toBeGreaterThan(0); //cookies are set
 
    //search with query
    await page.goto (`${SEARCHURL}${query}`)
    expect(page.url()).toContain('query=Mustang');
    //count search results
    const resultItems = page.locator('data-pid');
    expect(resultItems).toBeVisible();
    const resultCount = await resultItems.count();
    console.log(`Found ${resultCount} search results for "Mustang 68"`);
    expect(resultCount).toBeGreaterThan(0);
    //extract posting IDs from data-pid for the first 5 items
    const maxItems = Math.min(resultCount, 5);
    const postingIds: string[] = [];

    for (let i = 0; i < maxItems; i++) {
        const item = resultItems.nth(i);
        const postingId = await item.getAttribute('data-pid');
        if (postingId) {
          postingIds.push(postingId);
        }
      }
        console.log(`Found posting IDs: ${postingIds.join(', ')}`);
        expect(postingIds.length).toBeGreaterThan(0); //at least 1 id found
        //add first 5 items to favorites
        const favoritesUrl = 'https://wapi.craigslist.org/web/v8/user/favorites/sync?cc=US&lang=en';
    
        for (const postingId of postingIds) {
            const favoriteData = {
              favesToAdd: postingId,
            };

            const response = await request.post(favoritesUrl, {
              form: favoriteData,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://accounts.craigslist.org/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              },
            });

            expect(response.status()).toBe(200);
        }
        //navigate to favorites page and verify items are added
        await page.goto(`${FAVURL}`);
        expect(page.url()).toContain('favorites');
        await page.waitForSelector('data-pid');

    const favoriteItems = page.locator('data-pid');
    expect(favoriteItems).toBeVisible();
    const favoriteCount = await favoriteItems.count();
    console.log(`Found ${favoriteCount} items on favorites page`);
    });

test.afterAll(async ({ }) => {
  // Optionally, clean up or log out if needed
  console.log('Test completed.');
});
});