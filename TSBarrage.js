(function (window) {
    /**
     * @description 弹幕控制对象
     * @param parent 容纳弹幕池的容器
     * @constructor
     */
    function TSBarrage(parent) {
        this._init(parent);
    }

    TSBarrage.prototype = {
        constructor: TSBarrage,

        _init: function (parent) {
            this.parent = parent;
            this.parent.style.position = "relative";
            // 新建弹幕池
            this.pond = document.createElement("div");
            this.pond.style.width = "100%";
            this.pond.style.height = "100%";
            this.pond.style.position = "absolute";
            this.parent.style.overflow = "hidden";
            this.parent.appendChild(this.pond);
            // 控制弹幕位置的数组
            this.arrBarrage = [];
            // 让弹幕移动的定时器
            this.timer = null;
            // 默认字体大小和行高
            this.fontSize = 18;
            this.lineHeight = 20;
            // 计算行数
            this.lineNum = parseInt(this.pond.offsetHeight / this.lineHeight);
            for (var i = 0; i < this.lineNum; i++) {
                this.arrBarrage[i] = [];
            }
        },

        /**
         * @description 添加一条弹幕
         * @param option object{text,color}
         */
        addBarrage: function (option) {
            // 初始化一条弹幕
            option.fontSize = this.fontSize;
            var barrage = new Barrage(option);
            barrage.textWrap.style.left = this.pond.offsetWidth + "px";
            // 弹幕行满并且存在最后一条弹幕完全走出弹幕池右边的行时插入的位置
            var pushNum = 0;
            // 最后一条弹幕走的最远的距离
            var maxX = this.pond.offsetWidth;
            // 插入弹幕
            for (var i = 0; i < this.lineNum; i++) {
                var arrLine = this.arrBarrage[i];
                // 在某些改变行数的操作后要判断当前行是否存在，不存在则添加
                if(!arrLine){
                    arrLine = [];
                    this.arrBarrage.push(arrLine);
                }
                var arrLinePop = arrLine[arrLine.length - 1];
                // 如果当前行存在弹幕
                if (arrLinePop) {
                    // 当前行的最后一条弹幕已经走到一定的位置
                    if (arrLinePop.sheathe() === false) {
                        // 将弹幕插入当前行，并设置弹幕top值
                        arrLine.push(barrage);
                        barrage.textWrap.style.top = i * this.lineHeight + "px";
                        // 初始化其他判断数据
                        pushNum = false;
                        // 结束循环
                        break;
                    }
                    // 当前行的最后一条弹幕还没走到一定的位置
                    else {
                        // 判断当前行的最后一条弹幕走的位置是不是最远
                        if (arrLinePop.sheathe() < maxX) {
                            // 重新赋值最远值
                            maxX = arrLinePop.sheathe();
                            // 记录当前行数
                            pushNum = i;
                        }
                    }
                }
                // 当前行不存在弹幕
                else {
                    // 直接将弹幕插入当前行并设置top值
                    arrLine.push(barrage);
                    barrage.textWrap.style.top = i * this.lineHeight + "px";
                    // 初始化其他判断数据
                    pushNum = false;
                    // 结束循环
                    break;
                }
            }
            // 在上面的操作中没有在任何一行插入弹幕（即所有弹幕行都有未走出弹幕池右边的弹幕存在）,在最后一条弹幕走的最远的那一行插入
            if (pushNum !== false) {
                console.log(pushNum);
                this.arrBarrage[pushNum].push(barrage);
                barrage.textWrap.style.top = pushNum * this.lineHeight + "px";
            }
            // 添加到弹幕池
            this.pond.appendChild(barrage.textWrap);
            // 有新的弹幕添加时启动发射器
            this.shoot();
        },

        // 发射器
        shoot: function () {
            var self = this;
            // 判断下次定时器循环是否执行
            var next = true;
            // 如果不存在定时器就新建一个
            if (!self.timer) {
                self.timer = setInterval(function () {
                    // 上次发射弹幕的循环结束了
                    if (next) {
                        // 这次循环开始了，设置next为false
                        next = false;
                        // 判断是否停止计时器
                        var timeToStop = true;
                        for (var i = 0; i < self.arrBarrage.length; i++) {
                            var arrLine = self.arrBarrage[i];
                            if (arrLine.length !== 0) {
                                // 如果当前行还存在弹幕，不让定时器停止
                                timeToStop = false;
                                for (var j = 0; j < arrLine.length; j++) {
                                    // 更新弹幕的位置
                                    if (arrLine[j].update()) {
                                        // 弹幕超过可视区域，删除
                                        self.pond.removeChild(arrLine[j].textWrap);
                                        arrLine.splice(j, 1);
                                    }
                                }
                            }
                        }
                        if (timeToStop) {
                            clearInterval(self.timer);
                            self.timer = null;
                        }
                        // 这次循环结束了，可以开始下次循环
                        next = true;
                    }

                }, 16);
            }
        },

        /**
         * @description 改变字体大小
         * @param fontSize num
         */
        changeFontSize: function (fontSize) {
            this.fontSize = fontSize ? fontSize >= 18 ? fontSize : 18 : 18;
            this.lineHeight = fontSize + 2;
            // 计算行数
            this.lineNum = parseInt(this.pond.offsetHeight / this.lineHeight);
        },

        /**
         * @description 改变弹幕池位置
         * @param position num:0,1,2
         */
        changePosition: function (position) {
            var self = this;

            function changeHeight(num) {
                self.pond.style.height = self.parent.offsetHeight * num + "px";
                self.lineNum = parseInt(self.pond.offsetHeight / self.lineHeight);
            }

            // 根据索引改变弹幕池的位置
            [
                // 全屏
                function () {
                    changeHeight(1);
                },

                // 顶部
                function () {
                    changeHeight(2 / 5);
                    self.pond.style.bottom = "";
                    self.pond.style.top = "0";
                },

                // 底部
                function () {
                    changeHeight(2 / 5);
                    self.pond.style.bottom = "0";
                    self.pond.style.top = "";
                }
            ][position]();
        }
    };

    /**
     * @description 弹幕对象
     * @param option
     * @constructor
     */
    function Barrage(option) {
        this._init(option)
    }

    Barrage.prototype = {
        constructor: Barrage,

        _init: function (option) {
            this.text = option.text || "默认文字";
            // 创建一个新的p元素作为弹幕
            this.textWrap = document.createElement("p");
            this.textWrap.innerHTML = this.text;
            this.textWrap.style.fontSize = option.fontSize + "px";
            this.textWrap.style.color = option.color || "white";
            this.textWrap.style.textShadow = "0 0 4px black";
            this.textWrap.style.position = "absolute";
            // 让p元素不换行，可以自动获得宽度
            this.textWrap.style.whiteSpace = "nowrap";
            this.textWrap.style.cursor = "pointer";
            // 根据文本长度改变速度
            this.speed = 1 + this.text.length / (this.text.length + 200) * 15;
            // 最后一条弹幕走的距离
            this.x = 0;
            // 是否停止移动
            this.stop = false;
            var self = this;

            // 鼠标移入移出时改变运动状态
            this.textWrap.onmouseover = function () {
                self.stop = true;
                self.textWrap.style.zIndex = "1";
            };
            this.textWrap.onmouseout = function () {
                self.stop = false;
                self.textWrap.style.zIndex = "0";
            }
        },

        /**
         * @description 更新弹幕位置
         * @returns {boolean}
         */
        update: function () {
            if (!this.stop) {
                this.x += this.speed;
                // this.textWrap.style.transform = "translate(-" + this.x + "px,0)";
                this.textWrap.style.left = this.textWrap.offsetLeft - this.speed + "px";
                // 如果移出了弹幕池，返回真值
                if (this.textWrap.offsetLeft < (-this.textWrap.offsetWidth)) {
                    return true;
                }
            }
        },

        /**
         * @description 判断移动距离
         * @returns {*}
         */
        sheathe: function () {
            var wrapLeft = this.textWrap.offsetLeft;
            var pw = this.textWrap.parentNode.offsetWidth;
            // 距离弹幕池右边有一定的空间，可以容纳下一条弹幕
            if ((wrapLeft - pw  + (pw * 7 / 8)) < (-this.textWrap.offsetWidth)) {
                return false;
            }
            // 不能容纳下一条弹幕则返回移动的距离
            else {
                return wrapLeft;
            }
        }
    };

    window.TSBarrage = TSBarrage;
})(window);