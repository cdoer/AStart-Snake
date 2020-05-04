import Util from './util'

function snake(options){
    this.options =Util.extend(defaultOps,options) ;
    this.opt = this.options;
    this.data = [];
    this.canvasDom = document.createElement("canvas");
    this.closeMap = {};
    //维护一个空白映射对象  表明这些位置是空白的  用来随机生成食物
    this.open = {};
    this.init();
    window.devicePixelRatio = 1;
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

        //维护关闭列表
        this.addCloseMap(head);
        this.addCloseMap(body);

        for (let i = 0; i < opt.ySize; i++) {
            for (let j = 0; j < opt.xSize; j++) {
                this.open[this.getKey([i,j])] = [i,j];
            }
        }
        delete this.open[this.getKey(head)];
        delete this.open[this.getKey(body)];


        this.food = this.createFood();
        this.paint();
        var _this = this;
        setTimeout(function () {
            _this.render(_this);
        },33);
    },
    addCloseMap(pos){
        this.closeMap[this.getKey(pos)] = true;
    },
    removeCloseMap(pos){
        delete this.closeMap[this.getKey(pos)];
    },
    render(_this){
        var startTIme = Date.now();
        let pos = _this.findPerfectNode();
        var endTime = Date.now();
        console.log("查找耗时："+(endTime-startTIme)+"毫秒");
        if(pos==null){
            alert("游戏结束了！")
            return;
        }

        _this.head = pos;
        //删除最后一个元素 并且再前面添加一个元素
        _this.data.unshift(pos);
        _this.addCloseMap(pos);
        delete _this.open[_this.getKey(pos)];
        if(_this.posEquals(_this.food,pos)){
            _this.food = _this.createFood();
        }else{
            _this.last = _this.data.pop();
            _this.removeCloseMap(_this.last);
            _this.open[_this.getKey(_this.last)] = _this.last;
        }

        _this.paint();
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function(){
                _this.render(_this)
            });
        } else if (window.webkitRequestAnimationFrame) {
            window.webkitRequestAnimationFrame(function(){
                _this.render(_this)
            });
        } else {
            setTimeout(function(){
                _this.render(_this);
            }, 33);
        }
    },
    createBST:function(){
        //二叉搜索树比较函数 {value:A*算法G+H,pos:坐标}
        return new Util.BST(function (a,b) {
            return a.value-b.value;
        });
    },
    paint(){
        var opt = this.opt;
        var canvas=this.canvas,xSize =opt.xSize,ySzie = opt.ySize,
            unitSize = opt.unitSize,
        data = this.data;
        //绘制线条
        canvas.clearRect(0,0,xSize*unitSize,ySzie*unitSize);
        canvas.strokeStyle = "#ccc";
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
        }
        //绘制蛇
        canvas.fillStyle=opt.headColor;
        this.fillUnit(this.head);//头
        canvas.fillStyle=opt.bodyColor;
        for (let i = 1; i < data.length; i++) {
            this.fillUnit(data[i]);
        }
        //绘制食物
        canvas.fillStyle=opt.headColor;
        this.fillUnit(this.food);
    },
    fillUnit:function(pos){
        var opt = this.opt;
        var canvas=this.canvas,xSize =opt.xSize,ySzie = opt.ySize,
            unitSize = opt.unitSize,
            data = this.data;
        let size = unitSize-2;
        canvas.fillRect(pos[0]*unitSize+1,pos[1]*unitSize+1,size,size);
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
        let index = Math.floor(Math.random()*blankKeys.length);
        let food = this.open[blankKeys[index]];
        delete this.open[blankKeys[index]];
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
    findPerfectNode:function(){//根据A*贪心算法试图寻找局部最优以至全局最优的路径
        this.bst = this.createBST();
        var perfectNode = null,closeMap = {},pos,key,tcloseMap = this.closeMap;
        this.removeCloseMap(this.head);
        this.putBST(this.head);
        while(!this.bst.isEmpty()){
            let node = this.bst.removeMin();
            perfectNode = node.minData;
            pos = perfectNode.pos;
            key = this.getKey(pos);
            if(closeMap[key]) continue;
            if(tcloseMap[key]) continue;
            //将该节点周围四个节点加入bst
            //debugger
            this.putBST([pos[0],pos[1]-1],perfectNode);//上
            this.putBST([pos[0],pos[1]+1],perfectNode);//下
            this.putBST([pos[0]-1,pos[1]],perfectNode);//左
            this.putBST([pos[0]+1,pos[1]],perfectNode);//右
            if(this.posEquals(pos,this.food)){
                //已经找到
                break;
            }
            //加入关闭列表
            closeMap[key] = true;
        }
        this.addCloseMap(this.head);
        if(perfectNode==null||!this.posEquals(perfectNode.pos,this.food)){
            console.log("查找失败！");
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
    putBST(pos,parent) {
        var x = pos[0],y = pos[1];
        if(x<0||x>=this.opt.xSize||y<0||y>=this.opt.ySize) return;
        var d = {
            parent:parent,
            pos:pos,
            value:Math.abs(pos[0]-this.food[0])+Math.abs(pos[1]-this.food[1])
        }
        this.bst.insert(d);
    }

};

snake.prototype = snakeFunc;

let defaultOps = {
    style:"margin:0 auto;background:#fff;display: block;",//画布样式
    headColor:"red",//头颜色
    bodyColor:"#ccc",//身体颜色
    foodColor:"red",//食物颜色
    xSize:60,//矩阵长
    ySize:60,//矩阵宽
    unitSize:10,//单元格大小
    border:"1px solid #ccc"//画布边框
}

export default snake
