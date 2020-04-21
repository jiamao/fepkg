
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
    load(pkgs) {
        if(Array.isArray(pkgs)) {
            for(let i=0; i<pkgs.length; i++) {
                this.load(pkgs[i]);
            }
        }
        else {
            const pkg = pkgMr.load(pkgs);
            if(!this.packages) this.packages = [];
            this.packages.push(pkg);
        }
        return this;
    }
    /**
     * 分析包集合依赖
     */
    initDeps() {
        for(var i=0; i<this.packages.length; i++) {
            const pkg = this.packages[i];
            // 从它的依赖里查找是否有当前管理的包
            for(var k in pkg.dependencies) {
                const deppkg = this.getByName(k);// 是否存在管理包集里
                if(!deppkg) continue;
                pkg.dependencies[k] = deppkg;
            }
        } 
        return this;
    }
    /**
     * 按照依赖排序， 被依赖的排在前面。
     */
    sort() {
        // 被依赖的排在前面，先发布
        this.packages.sort((p1, p2) => {
            // p1 依赖p2
            if(p1.dependencies && p1.dependencies[p2.name]) {
                return 1;
            }
             // p2 依赖p1
            else if(p1.dependencies && p1.dependencies[p2.name]) {
                return -1;
            }
            return 0;
        });
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
                cpkg.save();
            }
        } 
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
                console.log(` publish success \n`);
            }
        }
        // 发布所有
        else {
            for(var i=0; i<this.packages.length; i++) {
                const cpkg = this.packages[i];
                this.publish(cpkg);
            } 
        }
        return this;
    }
}

module.exports = {
    load: function(pkgs) {
        return new Manager().load(pkgs);
    }
}