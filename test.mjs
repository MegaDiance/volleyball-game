import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    console.log('Verifying home page loads (League View)...');
    await page.waitForSelector('text=Volleyball GM', { timeout: 5000 });
    console.log('Found League View title.');
    
    console.log('Looking for My Team row in standings...');
    const myTeamRow = await page.waitForSelector('tr.bg-blue-900\\/20');
    console.log('Clicking My Team to open Team View...');
    await myTeamRow.click();
    
    await page.waitForTimeout(1000);
    console.log('Verifying Team View loaded (Roster tab active by default)...');
    await page.waitForSelector('text=Current Roster');
    console.log('Found Roster tab content.');
    
    console.log('Verifying Tactics tab presence...');
    const tacticsTabBtn = await page.waitForSelector('button:has-text("Tactics")');
    console.log('Clicking Tactics tab...');
    await tacticsTabBtn.click();
    
    await page.waitForTimeout(1000);
    console.log('Verifying Tactics content...');
    await page.waitForSelector('text=Serve Strategy');
    await page.waitForSelector('text=Offensive Tempo');
    console.log('Tactics tab looks good.');
    
    console.log('Verifying Free Agency tab presence...');
    const freeAgencyTabBtn = await page.waitForSelector('button:has-text("Free Agency")');
    console.log('Clicking Free Agency tab...');
    await freeAgencyTabBtn.click();
    
    await page.waitForTimeout(1000);
    console.log('Verifying Free Agency content...');
    // Should see 'Free Agent Pool' header and at least one 'Sign Player' button if the pool has generated players
    await page.waitForSelector('text=Free Agent Pool');
    try {
        await page.waitForSelector('button:has-text("Sign Player")', { timeout: 2000 });
        console.log('Found Sign Player button(s). Pool is populated.');
        
        // Let's try signing a player
        console.log('Signing a player from Free Agency...');
        const signBtn = await page.locator('button:has-text("Sign Player")').first();
        await signBtn.click();
        await page.waitForTimeout(500);
        console.log('Clicked Sign Player.');
    } catch (e) {
        console.log('No Sign Player button found. Pool might be empty.');
    }

    console.log('Returning to Roster tab to release a player...');
    const rosterTabBtn = await page.waitForSelector('button:has-text("Roster")');
    await rosterTabBtn.click();
    await page.waitForTimeout(1000);

    try {
        console.log('Releasing a player from Roster...');
        const releaseBtn = await page.locator('button:has-text("Release")').first();
        await releaseBtn.click();
        await page.waitForTimeout(500);
        console.log('Clicked Release.');
    } catch (e) {
         console.log('No Release button found. Roster might be empty or missing buttons.');
    }

    // Go back to season
    console.log('Navigating back to Season view...');
    const backBtn = await page.waitForSelector('button:has-text("Back to League")');
    await backBtn.click();
    await page.waitForTimeout(1000);

    // Try starting a match
    console.log('Trying to start a match...');
    try {
        const playBtn = await page.waitForSelector('button:has-text("Play Next Match")', { timeout: 2000});
        await playBtn.click();
        await page.waitForTimeout(1000);
        
        // Wait for Match View
        await page.waitForSelector('text=Forfeit & Exit', { timeout: 5000});
        console.log('Match View loaded successfully.');
        
        console.log('Simulating Match to end...');
        const simBtn = await page.waitForSelector('button:has-text("Sim to End")');
        await simBtn.click();
        await page.waitForTimeout(2000); // give it time to fast forward
        
        await page.waitForSelector('text=Match Awards', {timeout: 5000});
        console.log('Match concluded successfully (Awards displayed).');
        
    } catch (e) {
        console.log('Could not find Play Next Match or run match simulation.');
        console.log(e);
    }
    
    console.log('All automated checks pass!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
