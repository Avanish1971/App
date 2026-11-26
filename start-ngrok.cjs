const ngrok = require('@ngrok/ngrok');
(async function() {
  const listener = await ngrok.forward({
    addr: 5000,
    authtoken: '3MVnUOYft98tM2bFSV9adRDe95V_3L7Whr5uCX4nEQ8ESgn6R',
    domain: 'jasmine-edition-panning.ngrok-free.dev'
  });
  console.log('Ngrok API Live at:', listener.url());
  setInterval(() => {}, 1000 * 60 * 60);
})();
