/**
 * @requires OpenLayers.Geometry.Point
 * @requires OpenLayers.Geometry.GeoPlotting
 */

/**
 *
 * Class: OpenLayers.Geometry.GeoPolygonEx
 * 多边形。
 * 使用三个或三个以上控制点直接创建多边形。
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.GeoPlotting>
 */
OpenLayers.Geometry.GeoPolygonEx = OpenLayers.Class(
    OpenLayers.Geometry.GeoPlotting, {
        /**
         * Constructor: OpenLayers.Geometry.GeoPolygonEx
         * 构造函数
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 需要传入的控制点（三个或三个以上），默认为null
         */
        initialize: function(points) {
            OpenLayers.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号多边形对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function(){
            return OpenLayers.Geometry.GeoPlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var GeoPolygonEx =new OpenLayers.Geometry.GeoPolygonEx();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            GeoPolygonEx._controlPoints = controlPoints;
            return GeoPolygonEx;
        },
        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算多边形的所有点
         */
        calculateParts: function(){
            var controlPoints = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有点
            this.components = [];
            //两个控制点时，绘制直线
            if(controlPoints.length==2)
            {
                this.components.push(new OpenLayers.Geometry.LineString(controlPoints));
            }
            //至少需要三个控制点
            if(controlPoints.length>2)
            {

                this.components.push(new OpenLayers.Geometry.LinearRing(controlPoints));
            }
        },

        CLASS_NAME: "OpenLayers.Geometry.GeoPolygonEx"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoPolygonEx 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<OpenLayers.Geometry.GeoPolygonEx>} 返回的 GeoPolygonEx 对象。
 */
OpenLayers.Geometry.GeoPolygonEx.fromJSON = function(str){
    var GeoPolygonEx = new OpenLayers.Geometry.GeoPolygonEx();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = OpenLayers.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    GeoPolygonEx._controlPoints = arr;
    return GeoPolygonEx;
};