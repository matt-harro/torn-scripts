//////// PDA TESTING SCRIPT ////////
// Change the url to the raw text url you desire
const url =
  'https://raw.githubusercontent.com/matt-harro/torn-scripts/master/alert.js';

(async function () {
  try {
    const response = await PDA_httpGet(url);
    const code = response.responseText;

    await PDA_evaluateJavascript(code);

    console.log('JavaScript code has been fetched and executed');
  } catch (error) {
    console.log(`Error while fetching Javascript code: ${error}`); // TEST
  }
})();
c;
