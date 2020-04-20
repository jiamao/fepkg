/**
 * 读写package.json
 * 获取依赖和包管理
 */
const fs = require('fs');
const path = require('path');
const cmd = require('node-cmd');
const packageFormat = require('prettier-package-json');

const DependenciesProperty = Symbol('fepkg#DependenciesProperty');

class pkg {
    constructor() {
        this.dependencies = {};
    }

    get name() {
        return this.data.name;
    }

    /**
     * 当前管理的包集合里，我依赖和包
     */
    get dependencies() {
        return this[DependenciesProperty];
    }
    set dependencies(v) {
        this[DependenciesProperty] = v;
    }

    /**
     * 加载package.json
     */
    load(p) {
        this.__packagejson = p;
        if(fs.statSync(p).isFile()) {
            p = path.dirname(p); // 指定为模块目录
        }
        else {
            this.__packagejson = path.join(p, 'package.json');
        }
        this.__path = p;
        this.data = require(this.__packagejson);
        return this;
    }
    /**
     * 把version小版本号自增1
     */
    addVersion() {
        // 修改版本号
        console.log('更新版本号 原版本号：' + this.data.version);
        const versions = this.data.version.split('.');
        versions[versions.length - 1] = parseInt(versions[versions.length - 1], 10) + 1;
        this.data.version = versions.join('.');
        console.log('更新版本号 新版本号：' + this.data.version);
        return this;
    }
    /**
     * 格式化当前package
     */
    format() {
        const json = packageFormat.format(this.data);// 格式化
        return json;
    }
    /**
     * 保存覆盖原package.json
     */
    save(p) {
        p = p || this.__packagejson;
        fs.writeFileSync(p, this.format());
        return this;
    }

    // 发布
    async publish() {
        try {
            // 如果有配置编译命令，则执行它
            if(this.data.scripts['build']) {
                await runCmd('npm run build');
            }
            // 如果有配置发布命令，则执行它
            if(this.data.scripts['publish']) {
                await runCmd('npm run publish');
            }
            // 如果有配置清理命令，则执行它
            if(this.data.scripts['clean']) {
                await runCmd('npm run clean');
            }
            // 如果有配置提交代码命令，则执行它
            if(this.data.scripts['push']) {
                await runCmd('npm run push');
            }
            return true;
        }
        catch(e) {
            // 如果有配置清理命令，则执行它
            if(this.data.scripts['clean']) {
                await runCmd('npm run clean');
            }
            return false;
        }
    }
}

// 执行cmd命令
function runCmd(sh) {
    return new Promise((resolve, reject) => {
        cmd.get(
            sh,
            function(err, data, stderr){
                if(err) {
                    console.error(err);
                    reject && reject(data);
                }
                else {
                    resolve && resolve(data);
                }
            }
        );
    });
    
}

module.exports = {
    /**
     * 加载package.json
     * 返回 pkg实例
     */
    load: (p)=> {
        const pack = new pkg().load(p);
        return pack;
    }
}