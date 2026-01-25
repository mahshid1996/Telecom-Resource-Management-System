const app = require('./app');
const config = require('../src/config/defaultConfig.json'); 

const PORT = config.port || 3039;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
