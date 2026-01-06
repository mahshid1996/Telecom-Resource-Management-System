const mongoose = require('mongoose');
const config = require('config');
const app = require('./app');

mongoose.connect(config.get('mongodb'), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PORT = config.get('port') || 3030;
app.listen(PORT, () => {
  console.log(`REST API running on port ${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});

