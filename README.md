# fepkg
npm包发布工具，主动更新依赖发布。


# 管理包配置
需要在包对应的sciprts中你要执行的命令。
会检查是否有配，如果没有某条命令，它就不会被执行。
执行顺序为：`build -> publish -> clean -> push`。
```json
"scripts": {
    "build": "tsc -p tsconfig.json", // 需要编译ts
    "publish": "npm publish",
    "clean": "ets clean",   // 清理
    "push": "git add . && git commit -m'update moduole' && git push"
  }
```

执行包发布

```js
const fepkg = require('fepkg');
// const pattern = `{./app/*/package.json,./app2/*/package.json,./app3.json}`;// 也可以用blob来批量加载
// const pkgs fepkg.load(pattern, {root: __dirname});
const pkgs = fepkg.load([
    '/data/packages/pkg1',
    '/data/packages/pkg2',
    '/data/packages/pkg3'
    ]);

//  发布
pkgs.publish().then(p=> {
    console.log('publish success');
}).catch(e=>{
    console.log('publish failed');
});
```

# 包管理功能
你也可以用此项目管修改`package.json`文件。
```js
const fepkg = require('fepkg');
const pkg = fepkg.loadPackage('/data/packages/pkg1');
pkg.addVersion();// 增加版本号
pkg.scripts['build'] = 'tsc';// 修改编译命令
pkg.save();// 保存到 package.json  , 这里也可以指定其它路径
```