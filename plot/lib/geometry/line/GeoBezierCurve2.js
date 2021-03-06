/**
 * @requires OpenLayers.Geometry.Point
 * @requires OpenLayers.Geometry.GeoLinePlotting
 */

/**
 *
 * Class: OpenLayers.Geometry.GeoBezierCurve2
 * 二次贝塞尔曲线。
 * 使用三个控制点直接创建二次贝塞尔曲线。
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.GeoLinePlotting>
 */
OpenLayers.Geometry.GeoBezierCurve2 = OpenLayers.Class(
    OpenLayers.Geometry.GeoLinePlotting, {
        /**
         * APIProperty: part
         * {Number} 平滑度。取值越大，曲线越平滑。取值为大于1的整数。
         */
        part: 50,
        /**
         * Constructor: OpenLayers.Geometry.GeoBezierCurve2
         * 构造函数
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 需要传入的控制点数组(三个)，默认为null
         */
        initialize: function (points) {
            OpenLayers.Geometry.GeoLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号二次贝塞尔曲线对象转换为json数据（只解析了控制点）
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
            var geometry = new OpenLayers.Geometry.GeoBezierCurve2();
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
         * 用于通过控制点计算二次贝塞尔曲线的所有点
         */
        calculateParts: function () {
            var controlPoints = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有点
            this.components = [];
            //两个控制点时，绘制直线
            if (controlPoints.length == 2) {
                this.components = controlPoints;
            }
            else if (controlPoints.length > 2) {

                this.components = OpenLayers.Geometry.LineString.calculatePointsFBZ2(controlPoints,this.part);
            }
        },

        CLASS_NAME: "OpenLayers.Geometry.GeoBezierCurve2"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoBezierCurve2 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<OpenLayers.Geometry.GeoBezierCurve2>} 返回的 GeoBezierCurve2 对象。
 */
OpenLayers.Geometry.GeoBezierCurve2.fromJSON = function (str) {
    var geometry = new OpenLayers.Geometry.GeoBezierCurve2();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = OpenLayers.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geometry._controlPoints = arr;
    return geometry;
};