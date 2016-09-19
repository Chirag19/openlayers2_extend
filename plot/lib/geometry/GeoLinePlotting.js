/**
 * @requires OpenLayers.Geometry.LineString
 */

/**
 *
 * Class: OpenLayers.Geometry.GeoLinePlotting
 * 标绘扩展线符号类。
 * 该类是抽象类，具体的符号由其子类表现。子类必须实现方法 calculateParts()。
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.LineString>
 */
OpenLayers.Geometry.GeoLinePlotting = OpenLayers.Class(
    OpenLayers.Geometry.LineString, {
        /**
         * Property: _controlPoints
         * 定义控制点字段
         * 用于存储标绘扩展符号的所有控制点
         */
        _controlPoints: [],

        /**
         * Constructor: OpenLayers.Geometry.GeoLinePlotting
         * 标绘扩展线符号类。
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 控制点数组
         */
        initialize: function (points) {
            OpenLayers.Geometry.LineString.prototype.initialize.apply(this, arguments);
            this._controlPoints = points;

            if (points && points.length > 0) {
                this.calculateParts();
            }
        },
        /**
         * APIMethod: getArea
         * 获得区域面积，从区域的外部口径减去计此区域内部口径算所得的面积。
         *
         * Returns:
         * {float} 几何对象的面积。
         */
        getArea: function () {
            var area = 0.0;
            if (this.components && (this.components.length > 0)) {
                area += Math.abs(this.components[0].getArea());
                for (var i = 1, len = this.components.length; i < len; i++) {
                    area -= Math.abs(this.components[i].getArea());
                }
            }
            return area;
        },

        /**
         * APIMethod: getControlPoints
         * 获取符号控制点
         */
        getControlPoints: function () {
            return this._controlPoints;
        },

        /**
         * APIMethod: setControlPoint
         * 设置控制点
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 控制点数组
         */
        setControlPoint: function (points) {
            if (points && points.length && points.length > 0) {
                this._controlPoints = points;
                this.calculateParts();
            }
        },

        /**
         * APIMethod: clone
         * 克隆对象。
         *
         * Returns:
         * {<OpenLayers.Geometry.Collection>} 克隆的几何对象。
         */
        clone: function () {
            var geoState = new OpenLayers.Geometry.GeoLinePlotting();
            var controlPoints = [];
            //赋值控制点
            for (var i = 0, len = this._controlPoints.length; i < len; i++) {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoState._controlPoints = controlPoints;
            return geoState;
        },

        /**
         * APIMethod: toJSON
         * 将标绘扩展对象转换为json数据（只解析控制点）
         *
         * Returns:
         * {String} 返回转换后的 JSON 对象。
         */
        toJSON: function () {
            if (!this._controlPoints) {
                return null;
            }

            var len = this._controlPoints.length;
            var arr = [];
            for (var i = 0; i < len; i++) {
                arr.push(this.controlPointToJSON(this._controlPoints[i]));
            }

            return "{\"controlPoints\":[" + arr.join(",") + "]}";
        },

        /**
         * APIMethod: calculateParts
         * 通过控制点计算标绘扩展符号所有点 。
         * 每次调用此方法都会重置标绘扩展符号要素的geometry 。
         * 此方法需要子类实现
         */
        calculateParts: function () {
        },

        /**
         * Method: calculateMidpoint
         * 计算两个点所连成的线段的的中点
         *
         * Parameters:
         * pointA - {<OpenLayers.Geometry.Point>} 第一个点
         * pointB -  {<OpenLayers.Geometry.Point>} 第二个点
         *
         * Returns:
         * {<OpenLayers.Geometry.Point>} 返回中点
         */
        calculateMidpoint: function (pointA, pointB) {
            var midPoint = new OpenLayers.Geometry.Point((pointA.x + pointB.x) / 2, (pointA.y + pointB.y) / 2);
            return midPoint;

        },

        /**
         * Method: calculateDistance
         * 计算两点间的距离
         *
         * Parameters:
         * pointA - {<OpenLayers.Geometry.Point>} 第一个点
         * pointB -  {<OpenLayers.Geometry.Point>} 第二个点
         *
         * Returns:
         * {<OpenLayers.Geometry.Point>} 返回两点间的距离值
         */
        calculateDistance: function (pointA, pointB) {
            var distance =Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
            return distance;

        },

        /**
         * Method: toVector
         * 计算两点间的向量
         *
         * Parameters:
         * pointA - {<OpenLayers.Geometry.Point>} 起点
         * pointB -  {<OpenLayers.Geometry.Point>} 终点
         *
         * Returns:
         * {<OpenLayers.Geometry.Point>} 返回两点间的向量
         */
        toVector:function(pointA,pointB)
        {
            return new OpenLayers.Geometry.Point(pointA.x-pointB.x,pointA.y-pointB.y);
        },

        /**
         * Method: calculateVector
         * 计算和基准向量v夹角为a、长度为d的目标向量（理论上有两个，一左一右）
         *
         * Parameters:
         * v - {<OpenLayers.Geometry.Point>} 基准向量
         * a - {Number} 目标向量和基准向量的夹角，默认为90度，这里的单位使用弧度
         * d - {Number} 目标向量的长度，即模，默认为1，即单位向量
         *
         * Returns:
         * {Array(<OpenLayers.Geometry.Point>)} 回目标向量数组（就两个向量，一左一右）
         */
        calculateVector: function (v, a, d) {
            if (!a) a = Math.PI / 2;
            if (!d) d = 1;

            //定义目标向量的头部   x 坐标
            var x_1;
            var x_2;
            //定义目标向量的头部   y 坐标
            var y_1;
            var y_2;
            //定义目标向量，一左一右
            var v_l;
            var v_r;

            //计算基准向量v的模
            var d_v = Math.sqrt(v.x * v.x + v.y * v.y);

            //基准向量的斜率为0时，y值不能作为除数，所以需要特别处理
            if (v.y == 0) {
                //计算x,会有两个值
                x_1 = x_2 = d_v * d * Math.cos(a) / v.x;
                //根据v.x的正负判断目标向量的左右之分
                if (v.x > 0) {
                    //计算y
                    y_1 = Math.sqrt(d * d - x_1 * x_1);
                    y_2 = -y_1;
                }
                else if (v.x < 0) {
                    //计算y
                    y_2 = Math.sqrt(d * d - x_1 * x_1);
                    y_1 = -y_2;
                }
                v_l = new OpenLayers.Geometry.Point(x_1, y_1);
                v_r = new OpenLayers.Geometry.Point(x_2, y_2);
            }
            //此为大多数情况
            else {
                //转换为y=nx+m形式
                var n = -v.x / v.y;
                var m = d * d_v * Math.cos(a) / v.y;
                //
                //x*x + y*y = d*d
                //转换为a*x*x + b*x + c = 0
                var a = 1 + n * n;
                var b = 2 * n * m;
                var c = m * m - d * d;
                //计算x,会有两个值
                x_1 = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
                x_2 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
                //计算y
                y_1 = n * x_1 + m;
                y_2 = n * x_2 + m;
                //当向量向上时
                if (v.y >= 0) {
                    v_l = new OpenLayers.Geometry.Point(x_1, y_1);
                    v_r = new OpenLayers.Geometry.Point(x_2, y_2);
                }
                //当向量向下时
                else if (v.y < 0) {
                    v_l = new OpenLayers.Geometry.Point(x_2, y_2);
                    v_r = new OpenLayers.Geometry.Point(x_1, y_1);
                }
            }
            return [v_l, v_r];
        },

        /**
         * Method: calculateIntersection
         * 计算两条直线的交点
         * 通过向量的思想进行计算，需要提供两个向量以及两条直线上各自一个点
         *
         * Parameters:
         * v_1 - {<OpenLayers.Geometry.Point>} 直线1的向量
         * v_2 - {<OpenLayers.Geometry.Point>} 直线2的向量
         * points1 - {<OpenLayers.Geometry.Point>} 直线1上的任意一点
         * points2 - {<OpenLayers.Geometry.Point>} 直线2上的任意一点
         *
         * Returns:
         * {Array(<OpenLayers.Geometry.Point>)} 返回交点
         */
        calculateIntersection: function (v_1, v_2, point1, point2) {
            //定义交点的坐标
            var x;
            var y;
            //如果向量v_1和v_2平行
            if (v_1.y * v_2.x - v_1.x * v_2.y == 0) {
                //平行也有两种情况
                //同向
                if (v_1.x * v_2.x > 0 || v_1.y * v_2.y > 0) {
                    //同向直接取两个点的中点
                    x = (point1.x + point2.x) / 2;
                    y = (point1.y + point2.y) / 2;
                }
                //反向
                else {
                    //如果反向直接返回后面的点位置
                    x = point2.x;
                    y = point2.y;
                }
            }
            else {
                //
                x = (v_1.x * v_2.x * (point2.y - point1.y) + point1.x * v_1.y * v_2.x - point2.x * v_2.y * v_1.x) / (v_1.y * v_2.x - v_1.x * v_2.y);
                if (v_1.x != 0) {
                    y = (x - point1.x) * v_1.y / v_1.x + point1.y;
                }
                //不可能v_1.x和v_2.x同时为0
                else {
                    y = (x - point2.x) * v_2.y / v_2.x + point2.y;
                }
            }
            return new OpenLayers.Geometry.Point(x, y);

        },

        /**
         * Method: calculateAngularBisector
         * 计算两个向量的角平分线向量
         *
         * Parameters:
         * v1 - {<OpenLayers.Geometry.Point>} 向量1
         * v2 - {<OpenLayers.Geometry.Point>} 向量2
         *
         * Returns:
         * {Array(<OpenLayers.Geometry.Point>)} 返回角平分线向量
         */
        calculateAngularBisector: function (v1, v2) {
            //计算角平分线的思想是取两个向量的单位向量，然后相加
            var d1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            var d2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            return new OpenLayers.Geometry.Point(v1.x / d1 + v2.x / d2, v1.y / d1 + v2.y / d2);
        },

        /**
         * Method: calculateIntersectionFromTwoCorner
         * 通过三角形的底边两端点坐标以及底边两夹角，计算第三个点坐标
         *
         * Parameters:
         * pointS - {<OpenLayers.Geometry.Point>} 底边第一个点
         * pointE - {<OpenLayers.Geometry.Point>} 底边第二个点
         * a_S - {Number} 底边和第一个点所在的另一条边的夹角
         * a_E - {Number} 底边和第二个点所在的另一条边的夹角
         *
         * Returns:
         * {Array(<OpenLayers.Geometry.Point>)} 返回顶点（理论上存在两个值）
         */
        calculateIntersectionFromTwoCorner: function (pointS, pointE, a_S, a_E) {
            if (!a_S) a_S = Math.PI / 4;
            if (!a_E) a_E = Math.PI / 4;

            //起始点、结束点、交点加起来三个点，形成一个三角形
            //斜边（起始点到结束点）的向量为
            var v_SE = new OpenLayers.Geometry.Point(pointE.x - pointS.x, pointE.y - pointS.y);
            //计算起始点、交点的单位向量
            var v_SI_lr = this.calculateVector(v_SE, a_S, 1);
            //获取
            var v_SI_l = v_SI_lr[0];
            var v_SI_r = v_SI_lr[1];
            //计算结束点、交点的单位向量
            var v_EI_lr = this.calculateVector(v_SE, Math.PI - a_S, 1);
            //获取
            var v_EI_l = v_EI_lr[0];
            var v_EI_r = v_EI_lr[1];
            //求左边的交点
            var pointI_l = this.calculateIntersection(v_SI_l, v_EI_l, pointS, pointE);
            //计算右边的交点
            var pointI_r = this.calculateIntersection(v_SI_r, v_EI_r, pointS, pointE);
            return [pointI_l, pointI_r];
        },

        /**
         * Method: cloneControlPoints
         * 克隆控制点数组
         *
         */
        cloneControlPoints: function (cp) {
            var controlPoints = [];

            for (var i = 0; i < cp.length; i++) {
                controlPoints.push(cp[i].clone());
            }
            return controlPoints;
        },

        /**
         * Method: controlPointToJSON
         * 将控制点转换为Json
         *
         * Parameters:
         * cp - {<OpenLayers.Geometry.Point>} 要转换为Json的控制点
         */
        controlPointToJSON: function (cp) {
            return "{\"x\":  " + cp.x + ", \"y\": " + cp.y + "}";
        },

        CLASS_NAME: "OpenLayers.Geometry.GeoLinePlotting"
    }
);

/**
 * APIMethod: getControlPointsFromJSON
 * 根据控制点字符串获取控制点数据
 *
 * Parameters:
 * str - {String} 控制点字符串，形如："[{...},{...}...]"
 *
 * Returns:
 * {Array(<OpenLayers.Geometry.Point>)} 控制点数组
 */
OpenLayers.Geometry.GeoLinePlotting.getControlPointsFromJSON = function (str) {
    var cps = [];
    //匹配每一个Point的json格式
    var r = /{.*?}/g;
    var arr = str.match(r);
    for (var i = 0, len = arr.length; i < len; i++) {
        var point = eval('(' + arr[i] + ')');
        cps.push(new OpenLayers.Geometry.Point(point.x, point.y));
    }
    return cps;
};
