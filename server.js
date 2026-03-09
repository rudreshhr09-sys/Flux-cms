const express = require('express');
const path = require('path');
const app = express();
const PORT = 3500;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n  ✦ FLUX Gallery running at http://localhost:${PORT}\n`);
});
