/**
 * @requires OpenLayers.Geometry.Point
 * @requires OpenLayers.Geometry.GeoLinePlotting
 */

/**
 *
 * Class: OpenLayers.Geometry.GeoCardinalCurve
 * Cardinal曲线。
 * 使用三个或三个以上控制点直接创建Cardinal曲线。
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.GeoLinePlotting>
 */
OpenLayers.Geometry.GeoCardinalCurve = OpenLayers.Class(
    OpenLayers.Geometry.GeoLinePlotting, {
        /**
         * APIProperty: part
         * {Number} 平滑度。取值越大，曲线越平滑。取值为大于1的整数。默认为Cardinal插值点个数的十倍。
         */
        part: null,
        /**
         * Constructor: OpenLayers.Geometry.GeoCardinalCurve
         * 构造函数
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 需要传入的控制点（三个或三个以上），默认为null
         */
        initialize: function (points) {
            OpenLayers.Geometry.GeoLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号Cardinal曲线对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function () {
            return OpenLayers.Geometry.GeoLinePlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function () {
            var geometry = new OpenLayers.Geometry.GeoCardinalCurve();
            var controlPoints = [];
            //这里只需要赋值控制点
            for (var i = 0, len = this._controlPoints.length; i < len; i++) {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geometry._controlPoints = controlPoints;
            return geometry;
        },
        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算Cardinal曲线的所有点
         */
        calculateParts: function () {
            var controlPoints = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有点
            this.components = [];
            //两个控制点时，绘制直线
            if (controlPoints.length < 3) {
                this.components = controlPoints;
            }
            else if (controlPoints.length > 2) {
                var cardinalPoints = OpenLayers.Geometry.LineString.calculateCardinalPoints(controlPoints);
                if(!this.part) this.part= cardinalPoints.length*10;
                var bezierPts = OpenLayers.Geometry.LineString.calculatePointsFBZ3(cardinalPoints,this.part);
                this.components = bezierPts;
            }
        },

        CLASS_NAME: "OpenLayers.Geometry.GeoCardinalCurve"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoCardinalCurve 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<OpenLayers.Geometry.GeoCardinalCurve>} 返回的 GeoCardinalCurve 对象。
 */
OpenLayers.Geometry.GeoCardinalCurve.fromJSON = function (str) {
    var geometry = new OpenLayers.Geometry.GeoCardinalCurve();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = OpenLayers.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geometry._controlPoints = arr;
    return geometry;
};