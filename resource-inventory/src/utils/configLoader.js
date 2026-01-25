const axios = require('axios');
const { applog } = require('../../src/services/logger.service.js');

async function loadMasterConfig(app) {
  try {
    const response = await axios.get('http://localhost:3030/master-config?type=Policy');
    console.log(JSON.stringify(response.data))
    applog('info', new Date().toISOString(), 'Response data:'+ JSON.stringify(response.data));

    const configs = response.data;

    const logicalPolicy = configs.find(c => c.name === 'LogicalResourcePolicy');
    const physicalPolicy = configs.find(c => c.name === 'PhysicalResourcePolicy');

    app.set('logicalPolicy', logicalPolicy);
    app.set('physicalPolicy', physicalPolicy);
    applog('info', new Date().toISOString(), 'Master config loaded successfully');
  } catch (err) {
    applog('error', new Date().toISOString(), 'Error loading master config:'+ err.response?.data || err.message);
    throw err; 
  }
}

module.exports = { loadMasterConfig };
