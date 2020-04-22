/**
 * npm publish 前执行的处理，
 * 只需要在你发布的包的scripts中配置  prepublish 执行当前脚本即可
 */
const path = require('path');
const fepkg = require('../index');

// 加载当前执行的项目
const curPkgPath = path.join(process.cwd(), 'package.json');
const pkgtmp = fepkg.loadPackage(curPkgPath);
if(!pkgtmp || !pkgtmp.name) {
    throw Error('无法获取当前发布项目');
}


const pattern = `./*/package.json`;// 所有需要处理的包路径集合


// 加载管理的模块，顺序不用管，组件会处理
const pkgs = fepkg.load(pattern, {
    root: __dirname
});

const curPkg = pkgs.getByName(pkgtmp.name);
if(!curPkg) {
    throw Error(`${pkgtmp.name} 不在发布项目列表中，请查看正确的配置`);
}

console.log('预发布模块', curPkg.name);

// 发布前更新包版本号
pkgs.updateVersion(curPkg);