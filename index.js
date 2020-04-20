const pkg = require('./lib/pkg');
const manager = require('./lib/manager');

module.exports = {
    load: function(pkgs) {
        return manager.load(pkgs);
    },
    loadPackage: function(p) {
        return pkg.load(p);
    }
}