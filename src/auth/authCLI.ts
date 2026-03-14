import { ensureSFSession, forceSFLogin } from './salesforceAuth';

const force = process.argv.includes('--force');

(async () => {
  try {
    await (force ? forceSFLogin() : ensureSFSession());
    console.log('\nAuth ready.');
  } catch (err) {
    console.error('Auth setup failed:', err);
    process.exit(1);
  }
})();