import Util from './util'

/***
 * auth by yang
 * email 1249492252@qq.com
 * http://blog.yxyvpn.com/
 * @param options
 */

function snake(options){
    this.options =Util.extend(defaultOps,options) ;
    this.opt = this.options;
    this.data = [];
    this.canvasDom = document.createElement("canvas");
    this.closeMap = {};
    //维护一个空白映射对象  表明这些位置是空白的  用来随机生成食物
    this.open = {};
    this.count = 0;
    this.maxcount = 0;
    this.followLast= false;
    Util.debug = !!this.opt.debug;
    this.init();
}


let snakeFunc = {
    init: function () {
        //初始化画板
        var opt = this.opt, canvasDom = this.canvasDom;
        canvasDom.style = opt.style;
        var gameWidth = this.gameWidth = opt.xSize * opt.unitSize;
        var gameHeight = this.gameHeight = opt.ySize * opt.unitSize ;
        canvasDom.style.width = gameWidth+"px";
        canvasDom.style.height = gameHeight+"px";
        canvasDom.style.border = opt.border;
        document.querySelector("body").append(canvasDom);
        var canvas=this.canvas = canvasDom.getContext("2d");
        //绘制不清晰  百度说要加下面这行
        let pixelRatio = this.getPixelRatio(canvas);
        canvas.width  = gameWidth;
        canvas.height = gameHeight;
        canvas.canvas.width  = gameWidth*pixelRatio;
        canvas.canvas.height = gameHeight*pixelRatio;
        //绘制不清晰  百度说要加下面这行
        canvas.scale(pixelRatio, pixelRatio);
        //随机生成头的位置
        let head =this.head = this.randomPos();
        this.data.push(head);


        //根据头的位置随机生成方向 如果x==0  则方向不能往右，如果x==xSize-1  则不能往左, 其它方向同理
        //randomOrientation已经做了方向的处理
        let randomOrientation = this.randomOrientation();
        var body;
        switch (randomOrientation) {
            case 0:
                body = [head[0],head[1]+1];
                break;
            case 1:
                body = [head[0]-1,head[1]];
                break;
            case 2:
                body = [head[0],head[1]-1];
                break;
            case 3:
                body = [head[0]+1,head[1]];
                break;
        }
        this.data.push(body);

        for (let i = 0; i < opt.ySize; i++) {
            for (let j = 0; j < opt.xSize; j++) {
                this.open[this.getKey([i,j])] = [i,j];
            }
        }

        //维护关闭列表
        this.addCloseMap(head);
        this.addCloseMap(body);

        this.food = this.createFood();
        this.paint();
        var _this = this;
        setTimeout(function () {
            _this.render(_this);
        },33);
    },
    addCloseMap(pos){
        this.closeMap[this.getKey(pos)] = true;
        delete this.open[this.getKey(pos)];
    },
    removeCloseMap(pos){
        delete this.closeMap[this.getKey(pos)];
        this.open[this.getKey(pos)] = pos;
    },
    render: function (_this) {
        let pos = null, maxcount = _this.maxcount;
        let size = _this.data.length;
        var last = _this.data[size - 1],head = _this.head,food = _this.food;
        _this.removeCloseMap(last);
        if(_this.followLast){
            _this.count++;
            pos = _this.findPerfectNode(head, last, true);
            if(_this.count>=_this.maxcount){
                _this.count=0;
                _this.followLast = false;
                Util.log("================count = "+_this.count)
            }
        }else{
            var startTIme = Date.now();
            pos = _this.findPerfectNode(head, food);
            var endTime = Date.now();
            Util.log("查找耗时："+(endTime-startTIme)+"毫秒,成功="+(pos!=null));
            if (pos != null) {
                //使用这个位置看是否能找到自己的尾巴，如果不能则随机走一步
                var lastFind = _this.findPerfectNode(pos, last);
                _this.removeCloseMap(pos);
                if (lastFind == null) {
                    pos = null;
                    Util.log("不能找到尾巴！");
                }else{
                    Util.log("能找到尾巴！");
                }
            }
        }
        if(pos==null){
            pos = _this.findPerfectNode(head, last, true);
            Util.log("跟着尾巴走");
            _this.followLast= true;
            let num = Object.keys(_this.open).length;
            //随机跟着尾巴走得次数   使用剩余得空白位置  减少绕圈太多得情况
            _this.maxcount = Math.max(Math.floor(Math.random()*(num*0.25)),1);
        }
        _this.addCloseMap(last);
        Util.log("closeMap=" + Object.keys(_this.closeMap).length + "" +
            ";size=" + _this.data.length + ";blank=" + Object.keys(_this.open).length);
        if (pos == null) {
            alert("游戏结束了！")
            return;
        }
        _this.head = pos;
        //删除最后一个元素 并且在前面添加一个元素
        _this.data.unshift(pos);
        _this.addCloseMap(pos);
        if (_this.posEquals(food, pos)) {
            _this.food = _this.createFood();
            if (_this.food == null) {
                alert("恭喜，吃满了！");
                return;
            }
        } else {
            _this.last = _this.data.pop();
            _this.removeCloseMap(_this.last);

        }
        _this.paint();
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function () {
                _this.render(_this)
            });
        } else if (window.webkitRequestAnimationFrame) {
            window.webkitRequestAnimationFrame(function () {
                _this.render(_this)
            });
        } else {
            setTimeout(function () {
                _this.render(_this);
            }, 33);
        }
    },
    switchNext: function (type,findNode) {//废弃不用
        //根据当前的位置选择一个离食物或者其它目标最远的位置走
        var distantBst = new Util.BST(function (a, b) {
            return a.value - b.value;
        });
        var head = this.head, resGH,closeMap = this.closeMap,food = this.food;
        if(!findNode){
            findNode = food;
        }
        var neighbors = [
            [head[0], head[1] - 1],
            [head[0], head[1] + 1],
            [head[0] - 1, head[1]],
            [head[0] + 1, head[1]]
        ];
        var validPoss = [];
        for (let i = 0; i < neighbors.length; i++) {
            const neighbor = neighbors[i];
            if(closeMap[this.getKey(neighbor)]) continue;
            resGH = this.calcGH(neighbor, findNode);
            if(resGH>=0){
                distantBst.insert({
                    pos:neighbor,
                    value: resGH
                });
                validPoss.push(neighbor);
            }
        }
        switch (type) {
            case 1:
                if(!distantBst.isEmpty()){
                    return distantBst.findMin().data.pos;
                }
                break;
            case 3:
                if(!distantBst.isEmpty()){
                    return distantBst.findMax().data.pos;
                }
                break;
            case 2:
                //随机位置
                return validPoss[Math.floor(Math.random()*validPoss.length)];
                break;
        }
        return null;
    },
    calcGH(src,des){//A*计算GH值
        var x = src[0],y=src[1];
        if(x<0||x>=this.opt.xSize||y<0||y>=this.opt.ySize) return;
        x = des[0],y=des[1];
        if(x<0||x>=this.opt.xSize||y<0||y>=this.opt.ySize) return;
        return Math.abs(src[0]-des[0])+Math.abs(src[1]-des[1]);
    },
    createBST(flag){
        //二叉搜索树比较函数 {value:A*算法G+H,pos:坐标}
        if(flag){//距离最远
            return new Util.BST(function (a,b) {
                return b.value-a.value;
            });
        }
        return new Util.BST(function (a,b) {//距离最近
            return a.value-b.value;
        });
    },
    paint(){//绘制函数
        var opt = this.opt;
        var canvas=this.canvas,xSize =opt.xSize,ySzie = opt.ySize,
            unitSize = opt.unitSize,
        data = this.data;
        //清空画布
        canvas.clearRect(0,0,xSize*unitSize,ySzie*unitSize);
        //绘制线条
        /*canvas.strokeStyle = "#ccc";
        canvas.lineWidth = 1;
        for (let i = 1; i < ySzie; i++) {
            canvas.beginPath();
            canvas.moveTo(i*unitSize,0);
            canvas.lineTo(i*unitSize,ySzie*unitSize);
            canvas.stroke();
            canvas.closePath();
        }
        for (let j = 0; j < xSize; j++) {
            canvas.beginPath();
            canvas.moveTo(0,j*unitSize);
            canvas.lineTo(xSize*unitSize,j*unitSize);
            canvas.stroke();
            canvas.closePath();
        }*/
        //绘制蛇
        canvas.fillStyle=opt.headColor;
        this.fillUnit(this.head);//头
        canvas.fillStyle=opt.bodyColor;
        for (let i = 1; i < data.length-1; i++) {
            this.fillUnit(data[i]);
        }
        //绘制尾巴
        canvas.fillStyle=opt.tailColor;
        this.fillUnit(this.data[this.data.length-1]);
        //绘制食物
        canvas.fillStyle=opt.foodColor;
        this.fillUnit(this.food);
    },
    fillUnit:function(pos){
        var opt = this.opt;
        var canvas=this.canvas,xSize =opt.xSize,ySzie = opt.ySize,
            unitSize = opt.unitSize,
            data = this.data;
        let size = unitSize;
        canvas.fillRect(pos[0]*unitSize,pos[1]*unitSize,size,size);
    },
    getPixelRatio(context) {
        var backingStore = context.backingStorePixelRatio ||
            context.webkitBackingStorePixelRatio ||
            context.mozBackingStorePixelRatio ||
            context.msBackingStorePixelRatio ||
            context.oBackingStorePixelRatio ||
            context.backingStorePixelRatio || 1;
        return (window.devicePixelRatio || 1) / backingStore;
    },
    createFood:function(){
        var blankKeys = Object.keys(this.open);
        if(blankKeys.length==0){
            return null;
        }
        let index = Math.floor(Math.random()*blankKeys.length);
        let food = this.open[blankKeys[index]];
        delete this.open[this.getKey(food)];
        return food;
    },
    randomPos(){
        var _this = this;
        return [Math.floor(Math.random()*_this.opt.xSize),Math.floor(Math.random()*_this.opt.ySize)];
    },
    randomOrientation() {
        // 1 上   2右  3 下  4 左
        let head = this.data[0];
        let x = head[0], y = head[1];
        let wz = [1,1,1,1];
        if(x==0) wz[1] = 0;
        else if(x==this.opt.xSize-1) wz[3] = 0;

        if(y==0) wz[2] = 0;
        else if(y==this.opt.ySize-1) wz[0] = 0;

        let wz2 = [];
        for (let i = 0; i < wz.length; i++) {
            let w = wz[i];
            if(w==1){
                wz2.push(i);
            }
        }
        return wz2[Math.floor(Math.random()*wz2.length)];
    },
    findPerfectNode:function(startNode,findNode,flag){//根据A*贪心算法试图寻找局部最优以至全局最优的路径
        this.bst = this.createBST(flag);
        var perfectNode = null,closeMap = {},pos,key,tcloseMap = this.closeMap;
        this.removeCloseMap(startNode);
        this.putBST(startNode,findNode);
        while(!this.bst.isEmpty()){
            let node = this.bst.removeMin();
            perfectNode = node.minData;
            pos = perfectNode.pos;
            key = this.getKey(pos);
            if(closeMap[key]||tcloseMap[key]) continue;
            //将该节点周围四个节点加入bst
            this.putBST([pos[0],pos[1]-1],findNode,perfectNode);//上
            this.putBST([pos[0],pos[1]+1],findNode,perfectNode);//下
            this.putBST([pos[0]-1,pos[1]],findNode,perfectNode);//左
            this.putBST([pos[0]+1,pos[1]],findNode,perfectNode);//右
            if(this.posEquals(pos,findNode)){
                //已经找到
                break;
            }
            //加入关闭列表
            closeMap[key] = true;
        }
        this.addCloseMap(startNode);
        if(perfectNode==null||!this.posEquals(perfectNode.pos,findNode)){
            Util.log("查找失败！");
            return;
        }
        //回溯
        while(perfectNode.parent){
            var parent = perfectNode.parent;
            if(parent.parent==null){
                break;
            }
            perfectNode = parent;
        }
        return perfectNode.pos;
    },
    getKey(pos){
        return "x="+pos[0]+":y="+pos[1];
    },
    posEquals(pos1,pos2){
        if(pos1[0]==pos2[0]&&pos1[1]==pos2[1]) return true;
        return false;
    },
    putBST(startNode,findNode,parent) {
        var x = startNode[0],y = startNode[1];
        if(x<0||x>=this.opt.xSize||y<0||y>=this.opt.ySize) return;
        var d = {
            parent:parent,
            pos:startNode,
            value:this.calcGH(startNode,findNode)
        }
        this.bst.insert(d);
    }

};

snake.prototype = snakeFunc;

let defaultOps = {
    debug:true,//是否开启日志，控制台打印运行状态
    style:"margin:0 auto;background:#fff;display: block;",//画布样式
    headColor:"pink",//头颜色
    bodyColor:"#ccc",//身体颜色
    foodColor:"red",//食物颜色
    tailColor:"blue",//尾巴颜色
    xSize:30,//矩阵长
    ySize:30,//矩阵宽
    unitSize:20,//单元格大小
    border:"1px solid red"//画布边框
}

export default snake
