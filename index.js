const pkg = require('./lib/pkg');
const manager = require('./lib/manager');

module.exports = {
    load: function(pkgs, options) {
        return manager.load(pkgs, options);
    },
    loadPackage: function(p, options) {
        return pkg.load(p, options);
    }
}