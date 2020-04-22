/**
 * 读写package.json
 * 获取依赖和包管理
 */
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
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
    load(p, options) {
        if(options && options.root) {
            p = path.join(options.root, p);
        }
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
        //console.log('更新版本号 原版本号：' + this.data.version);
        const versions = this.data.version.split('.');
        versions[versions.length - 1] = parseInt(versions[versions.length - 1], 10) + 1;
        this.data.version = versions.join('.');
        this.versionUpdated = true;// 标识已更新
        this.save();
        console.log('更新 ' + this.name + ' 版本号 新版本号：' + this.data.version);
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
                await runCmd('npm run build', this.__path);
            }
            // 如果有配置发布命令，则执行它
            if(this.data.scripts['deploy']) {
                await runCmd('npm run deploy', this.__path);
            }
            
            // 如果有配置清理命令，则执行它
            if(this.data.scripts['clean']) {
                await runCmd('npm run clean', this.__path);
            }
            // 如果有配置提交代码命令，则执行它
            if(this.data.scripts['push']) {
                await runCmd('npm run push', this.__path);
            }
            return true;
        }
        catch(e) {
            //console.log(e);
            // 如果有配置清理命令，则执行它
            if(this.data.scripts['clean']) {
                await runCmd('npm run clean', this.__path);
            }
            return false;
        }
    }
}

// 执行cmd命令
function runCmd(sh, cwd) {
    return new Promise((resolve, reject) => {
        var pro = exec(
            `cd ${cwd} && ${sh}`,
            function(err, data, stderr){  
                 
                console.log(data);           
                if(err) {
                    console.error('error ', err);
                    reject && reject({
                        process: pro,
                        data
                    });
                }
                else {
                    resolve && resolve({
                        process: pro,
                        data
                    });
                }
                pro.kill();
            }
        );
    });
    
}

module.exports = {
    /**
     * 加载package.json
     * 返回 pkg实例
     */
    load: (p, options)=> {
        const pack = new pkg().load(p, options);
        return pack;
    }
}