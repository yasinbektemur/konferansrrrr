import {defineConfig} from '@playwright/test';
import {mkdtempSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const directory=mkdtempSync(join(tmpdir(),'radar-e2e-'));
const executable=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??(existsSync('/opt/google/chrome/chrome')?'/opt/google/chrome/chrome':undefined);
export default defineConfig({testDir:'./e2e',workers:1,use:{baseURL:'http://localhost:3119',headless:true,actionTimeout:15000,trace:'retain-on-failure',launchOptions:{executablePath:executable,args:['--no-sandbox']}},webServer:{command:'npm start -- -p 3119',url:'http://localhost:3119',reuseExistingServer:false,env:{DATABASE_PATH:join(directory,'app.db')}},reporter:'list'});
