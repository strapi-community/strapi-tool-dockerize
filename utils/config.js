const _config = {};
const setConfig = newConfig => Object.assign(_config, newConfig);
const getConfig = () => _config;

module.exports = { setConfig, getConfig };
