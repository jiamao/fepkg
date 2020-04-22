
const glob = require('glob');
const pkgMr = require('./pkg');

/**
 * 加载多个模块， 分析其依赖关系
 */
class Manager {
    constructor() {
        this.packages = [];
    }

    /**
     * 加载多个包并分析依赖
     * @param {Array} pkgs 多个管理包的路径
     */
    load(pkgs, options) {
        if(Array.isArray(pkgs)) {
            for(let i=0; i<pkgs.length; i++) {
                this.load(pkgs[i], options);
            }
        }
        // 如果是表达式，则用glob来加载
        else if(/\*|,/.test(pkgs)) {
            const ps = glob.sync(pkgs, {
                cwd: options?options.root:''
            });
            this.load(ps, options);
        }
        else {
            const pkg = pkgMr.load(pkgs, options);
            if(!this.packages) this.packages = [];
            this.packages.push(pkg);
        } 
        return this;
    }
    /**
     * 分析包集合依赖, 返回所有没有依赖的根包
     */
    initDeps() {
        console.log('处理依赖关系...');
        for(var i=0; i<this.packages.length; i++) {
            const pkg = this.packages[i];
            if(!pkg || !pkg.data || !pkg.data.dependencies) continue;
            // 从它的依赖里查找是否有当前管理的包
            for(var k in pkg.data.dependencies) {
                const deppkg = this.getByName(k);// 是否存在管理包集里
                if(!deppkg) continue;
                pkg.dependencies[k] = deppkg;
                console.log(pkg.name, '依赖', deppkg.name);
                pkg.hasDependency = true;// 标记有依赖管理模块
            }
        } 
        return this;
    }
    /**
     * 通过名称获取包信息
     * @param {string} name 包名称
     */
    getByName(name) {
        for(var i=0;i<this.packages.length;i++) {
            if(this.packages[i].name === name) return this.packages[i];
        }        
    }

    // 更新所有依赖包的版本号
    updateDependenciesVersion(pkg) {
        for(var i=0; i<this.packages.length; i++) {
            const cpkg = this.packages[i];
            if(!cpkg || !cpkg.data || !cpkg.data.dependencies) continue;
            const deps = cpkg.data.dependencies[pkg.name];
            // 存在表示有依赖，则更新它的版本
            if(deps) {
                const nver = '^' + pkg.data.version;
                console.log(`更新 ${cpkg.name} 的依赖 ${pkg.name} ${nver}`);
                cpkg.data.dependencies[pkg.name] = nver;
                cpkg.needPublish = true;// 标记需要发布
                cpkg.save();

                //this.updateVersion(cpkg); // 自已的依赖已变更，需要检查一下自已是否需要更新版本号
            }
        } 
    }
    /**
     * 更新包版本，并更新依赖它的包版本
     * @param {pkg} pkg 需要更新的包
     */
    updateVersion(pkg) {
        // 如果当次发布，这个包已更新过，则不需要再更新
        if(pkg.versionUpdated) return;

        pkg.addVersion(); // 更新版本
        this.updateDependenciesVersion(pkg);// 更新依赖它的包版本
    }
    // 发布单个或所有包
    async publish(name) {
        if(name) {
            const pkg = typeof name ==='string'? this.getByName(name) : name;
            console.log(`\n start publish ${pkg.name}`);
            if(!pkg) return;
            pkg.addVersion(); // 更新版本
            this.updateDependenciesVersion(pkg);// 更新依赖它的包版本
            pkg.save();// 保存版本号
            const ret = await pkg.publish();// 发布
            if(!ret) {
                throw Error(`pubish ${pkg.name} failed`);
            }
            else {
                console.log(` publish ${pkg.name} success \n`);
                pkg.isPublished = true;// 标记已发布
            }
        }
        // 发布所有
        else {
            this.initDeps();
            
            // 先发布没有任何依赖的
            for(var i=0; i<this.packages.length; i++) {
                var cpkg = this.packages[i];
                console.log(cpkg.name, ' hasDependency ', cpkg.hasDependency)
                if(!cpkg.hasDependency) await this.publish(cpkg);
            } 
            var hasNonPublished = false;
            // 最多轮徇1000次，处理所有依赖都被发布的包，最后没处理完的就直接管理了不管依赖否
            for(var k=0; k<1000; k++) {
                hasNonPublished = false;
                for(var i=0; i<this.packages.length; i++) {
                    var cpkg = this.packages[i];
                    // 未发布但需要发布
                    if(!cpkg.isPublished && cpkg.needPublish) {
                        hasNonPublished = true;// 有未发布的
                        var depsPublished = true;
                        // 判断是否有未发布的依赖项，有则不发布
                        if(cpkg.dependencies) {
                            for(var name in cpkg.dependencies) {
                                if(cpkg.dependencies[name] && !cpkg.dependencies[name].isPublished) {
                                    depsPublished = false;
                                    break;
                                }
                            }
                        }
                        if(depsPublished) await this.publish(cpkg);
                    }
                } 
                if(hasNonPublished) break;// 所有都已布就直接break
            }
            // 最后还有未发布的，直接发布
            if(hasNonPublished) {
                // 需要发布还没有发布的  最后清理全发
                for(var i=0; i<this.packages.length; i++) {
                    var cpkg = this.packages[i];
                    if(!cpkg.isPublished && cpkg.needPublish) await this.publish(cpkg);
                } 
            }
        }
        return this;
    }
}

module.exports = {
    load: function(pkgs, options) {
        return new Manager().load(pkgs, options);
    }
}