const open = require('open');

const applications = [
    'http://localhost:3000/',
    'http://localhost:4000/'
];

(async () => {
    await Promise.all(applications.map(application => open(application)));
})()