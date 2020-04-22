# fepkg
npm包发布工具，主动更新依赖发布。

# 安装

```sh
npm i fepkg
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

包版本修改，更新依赖它的包引用。
可以把以下脚本放到项目集根目录。
```js
// prepublish.js
const fepkg = require('fepkg');
const pattern = `{./app-base/*/package.json,./app-fronts/*/package.json}`;// 所有需要处理的包路径集合


// 加载管理的模块，顺序不用管，组件会处理
const pkgs = fepkg.load(pattern, {
    root: __dirname
});

const curpkg = pkgs.getByName('module1');// 从所有包中获取我要修改的包
pkgs.updateVersion(curPkg);// 给module1小版本号加1，这里会同时更新依赖module1的引用版本号
```

然后在你发布需要触发的模块`package.json`中配置一个`scripts`,`npm publish` 勾子 `prepublish`
```js
// package.json
"scripts": {
    "prepublish": "node ../prepublish.js"
  }
```

当每次在模块中执行 `npm publish` 时，会自动把当前模块版本号加1，并更新集合中所有依赖它的模块的依赖版本。