/**
 * @requires OpenLayers/Geometry/Collection.js
 * @requires OpenLayers/Geometry/LinearRing.js
 * @requires OpenLayers.Geometry.Point.js
 * @requires OpenLayers.Geometry.Polygon.js
 * @requires OpenLayers.Geometry.GeoPlotting
 */

/**
 *
 * Class: OpenLayers.Geometry.GeoDiagonalArrow
 * 斜箭头
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.GeoPlotting>
 */
OpenLayers.Geometry.GeoDiagonalArrow = OpenLayers.Class(
    OpenLayers.Geometry.GeoPlotting, {
        /**
         * Property: _ratio
         * 箭头长度与宽度的比值，箭头三角形需要占用总长度的1/_ratio
         */
        _ratio: 6,

        /**
         * Constructor: OpenLayers.Geometry.GeoDiagonalArrow
         * 构造函数
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 初始化时传入的控制点（理论上至少两个，默认为null）
         */
        initialize: function(points) {
            OpenLayers.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: getRatio
         * 获取箭头长宽比值，默认为6倍
         */
        getRatio: function() {
            return this._ratio;
        },

        /**
         * APIMethod: setRatio
         * 设置箭头长宽比值，默认为6倍
         *
         * Parameters:
         * value - {Number} 箭头长宽比值
         */
        setRatio: function(value){
            if(value){
                this._ratio = value;
                this.calculateParts();
            }
        },

        /**
         * APIMethod: toJSON
         * 将军标符号斜箭头对象转换为json数据（解析了控制点和长宽比值）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function(){
            if(!this._controlPoints)
            {
                return null;
            }
            var result;
            var len = this._controlPoints.length;
            var arr = [];
            for(var i = 0; i<len; i++)
            {
                arr.push(this.controlPointToJSON(this._controlPoints[i]));
            }
            result = "{\"controlPoints\":["+arr.join(",")+"],\"ratio\":"+this._ratio+"}";
            return result;
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var geoDiagonalArrow =new OpenLayers.Geometry.GeoDiagonalArrow();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoDiagonalArrow._ratio = this._ratio;
            geoDiagonalArrow._controlPoints = controlPoints;
            return geoDiagonalArrow;
        },

        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算箭头的所有绘制点
         */
        calculateParts: function(){
            //判定少于两个点或者为空，则直接返回
            if(this._controlPoints == null || this._controlPoints.length<2)
            {
                return;
            }
            //判断如果为两个点，且两个点重合时也直接返回
            if(this._controlPoints.length == 2 && (this._controlPoints[0]).equals(this._controlPoints[1]))
            {
                return;
            }
            //清空原有的所有点
            this.components = [];
            //计算只有两个点时，即直的斜箭头
            if(this._controlPoints.length == 2)
            {
                this.calculateTwoPoints();
            }
            //计算有三个或三个以上的点时，即弯曲的斜箭头
            else
            {
                this.calculateMorePoints();
            }
        },

        /**
         * Method: calculateTwoPoints
         * 只有两个控制点时
         *
         */
        calculateTwoPoints: function(){
            var controlPois = this.cloneControlPoints(this._controlPoints);

            //取出首尾两个点
            var pointS = controlPois[0];
            var pointE = controlPois[1];
            //计算箭头总长度
            var l = Math.sqrt((pointE.y-pointS.y)*(pointE.y-pointS.y)+(pointE.x-pointS.x)*(pointE.x-pointS.x));
            //计算直箭头的宽
            var w = l/this._ratio;

            //计算三角形的底边中心点坐标
            var x_ = pointS.x + (pointE.x - pointS.x)*(this._ratio-1)/this._ratio;
            var y_ = pointS.y + (pointE.y - pointS.y)*(this._ratio-1)/this._ratio;
            var point_o = new OpenLayers.Geometry.Point(x_,y_);

            //计算
            var v_lr_ = this.calculateVector(new OpenLayers.Geometry.Point(pointE.x-pointS.x,pointE.y-pointS.y),Math.PI/2,w/2);
            //获取左边尾部向量
            var v_l_ = v_lr_[0];
            //获取右边尾部向量
            var v_r_ = v_lr_[1];
            //获取左边尾部点
            var point_l = new OpenLayers.Geometry.Point(v_l_.x+pointS.x,v_l_.y+pointS.y);
            //获取右边尾部点
            var point_r = new OpenLayers.Geometry.Point(v_r_.x+pointS.x,v_r_.y+pointS.y);

            var point_h_l = new OpenLayers.Geometry.Point(v_l_.x/this._ratio+x_,v_l_.y/this._ratio+y_);
            var point_h_r = new OpenLayers.Geometry.Point(v_r_.x/this._ratio+x_,v_r_.y/this._ratio+y_);

            //计算三角形左边点
            var point_a_l = new OpenLayers.Geometry.Point(point_h_l.x*2-point_h_r.x,point_h_l.y*2-point_h_r.y);
            //计算三角形右边点
            var point_a_r = new OpenLayers.Geometry.Point(point_h_r.x*2-point_h_l.x,point_h_r.y*2-point_h_l.y);

            this.components.push(new OpenLayers.Geometry.LinearRing([point_l,point_h_l,point_a_l,pointE,point_a_r,point_h_r,point_r]));
        },

        /**
         * Method: calculateMorePoints
         * 重写了父类的方法
         * 用于通过控制点计算箭头的所有绘制点
         */
        calculateMorePoints: function(){
            var controlPois = this.cloneControlPoints(this._controlPoints);

            //计算箭头总长度
            var l = 0;
            //计算直箭头的宽
            var w = 0;
            for(var i = 0; i < controlPois.length - 1; i++)
            {
                //取出首尾两个点
                var pointS = controlPois[i];
                var pointE = controlPois[i+1];
                l += Math.sqrt((pointE.y-pointS.y)*(pointE.y-pointS.y)+(pointE.x-pointS.x)*(pointE.x-pointS.x));
            }
            w = l/this._ratio;

            var a = Math.atan(w/(2*l));

            //定义左右控制点集合
            var points_C_l = [];
            var points_C_r = [];
            //定义尾部左右的起始点
            var point_t_l = new OpenLayers.Geometry.Point();
            var point_t_r = new OpenLayers.Geometry.Point();


            //计算中间的所有交点
            for(var j = 0; j < controlPois.length-2; j++)
            {
                var pointU_1 = controlPois[j];//第一个用户传入的点
                var pointU_2 = controlPois[j+1];//第二个用户传入的点
                var pointU_3 = controlPois[j+2];//第三个用户传入的点

                //计算向量
                var v_U_1_2 = new OpenLayers.Geometry.Point(pointU_2.x-pointU_1.x,pointU_2.y-pointU_1.y);
                var v_U_2_3 = new OpenLayers.Geometry.Point(pointU_3.x-pointU_2.x,pointU_3.y-pointU_2.y);


                //定义左边第一个控制点
                var point_l_1 = new OpenLayers.Geometry.Point();
                //定义右边第一个控制点
                var point_r_1 = new OpenLayers.Geometry.Point();
                //如果j=0时，左右第一个控制点需要计算
                if(j == 0)
                {
                    var v_lr_ = this.calculateVector(v_U_1_2,Math.PI/2,w/2);
                    //获取左边尾部点
                    var v_l_ = v_lr_[0];
                    //获取右边尾部点
                    var v_r_ = v_lr_[1];
                    //获取左边尾部点
                    point_t_l = point_l_1 = new OpenLayers.Geometry.Point(v_l_.x+pointU_1.x,v_l_.y+pointU_1.y);
                    //获取右边尾部点
                    point_t_r = point_r_1 = new OpenLayers.Geometry.Point(v_r_.x+pointU_1.x,v_r_.y+pointU_1.y);
                }
                //否则获取上一次的记录
                else
                {
                    point_l_1 = points_C_l[points_C_l.length-1];
                    point_r_1 = points_C_r[points_C_r.length-1];
                }
                var v_lr = this.calculateVector(v_U_1_2,a,1);
                //这里的向量需要反过来
                //获取左边向量
                var v_l = v_lr[1];
                //获取右边向量
                var v_r = v_lr[0];
                //定义角平分线向量
                var v_angularBisector = this.calculateAngularBisector(new OpenLayers.Geometry.Point(-v_U_1_2.x,-v_U_1_2.y),v_U_2_3);
                //求交点
                //计算左边第二个控制点
                var point_l_2 = this.calculateIntersection(v_l,v_angularBisector,point_l_1,pointU_2);
                var point_r_2 = this.calculateIntersection(v_r,v_angularBisector,point_r_1,pointU_2);


                //添加后面的拐角控制点
                points_C_l.push(new OpenLayers.Geometry.Point((point_l_1.x+point_l_2.x)/2,(point_l_1.y+point_l_2.y)/2));
                points_C_l.push(point_l_2);
                points_C_r.push(new OpenLayers.Geometry.Point((point_r_1.x+point_r_2.x)/2,(point_r_1.y+point_r_2.y)/2));
                points_C_r.push(point_r_2);
            }

            //进入计算头部
            //计算一下头部的长度
            var pointU_E2 = controlPois[controlPois.length-2];//倒数第二个用户点
            var pointU_E1 = controlPois[controlPois.length-1];//最后一个用户点
            var head_d = Math.sqrt((pointU_E2.x-pointU_E1.x)*(pointU_E2.x-pointU_E1.x) + (pointU_E2.y-pointU_E1.y)*(pointU_E2.y-pointU_E1.y));
            //定义头部的左右两结束点
            var point_h_l = new OpenLayers.Geometry.Point();
            var point_h_r = new OpenLayers.Geometry.Point();
            //三角形左右两点数组
            var point_lr_t = [];
            //定义曲线最后一个控制点，也就是头部结束点和最后一个拐角点的中点
            var point_C_l_e = new OpenLayers.Geometry.Point();
            var point_C_r_e = new OpenLayers.Geometry.Point();
            //定义三角形的左右两个点
            var point_triangle_l = new OpenLayers.Geometry.Point();
            var point_triangle_r = new OpenLayers.Geometry.Point();

            //获取当前的最后的控制点，也就是之前计算的拐角点
            var point_C_l_eq = points_C_l[points_C_l.length-1];
            var point_C_r_eq = points_C_r[points_C_r.length-1];
            //申明三角形的两边向量
            var v_l_t = new OpenLayers.Geometry.Point();
            var v_r_t = new OpenLayers.Geometry.Point();
            //三角的高度都不够
            if(head_d <= w)
            {
                point_lr_t = this.calculateVector(new OpenLayers.Geometry.Point(pointU_E1.x-pointU_E2.x,pointU_E1.y-pointU_E2.y),Math.PI/2,w/2);
                //获取三角形左右两个向量
                v_l_t = point_lr_t[0];
                v_r_t = point_lr_t[1];

                point_h_l = new OpenLayers.Geometry.Point(v_l_t.x/this._ratio+pointU_E2.x,v_l_t.y/this._ratio+pointU_E2.y);
                point_h_r = new OpenLayers.Geometry.Point(v_r_t.x/this._ratio+pointU_E2.x,v_r_t.y/this._ratio+pointU_E2.y);
                //计算三角形的左右两点
                point_triangle_l = new OpenLayers.Geometry.Point(point_h_l.x*2-point_h_r.x,point_h_l.y*2-point_h_r.y);
                point_triangle_r = new OpenLayers.Geometry.Point(point_h_r.x*2-point_h_l.x,point_h_r.y*2-point_h_l.y);


                //计算最后的控制点
                point_C_l_e = new OpenLayers.Geometry.Point((point_C_l_eq.x+point_h_l.x)/2,(point_C_l_eq.y+point_h_l.y)/2);
                point_C_r_e = new OpenLayers.Geometry.Point((point_C_r_eq.x+point_h_r.x)/2,(point_C_r_eq.y+point_h_r.y)/2);

                //添加最后的控制点（中心点）
                points_C_l.push(point_C_l_e);
                points_C_r.push(point_C_r_e);



            }
            //足够三角的高度
            else
            {
                //由于够了三角的高度，所以首先去掉三角的高度

                //计算向量
                var v_E2_E1 = new OpenLayers.Geometry.Point(pointU_E1.x-pointU_E2.x,pointU_E1.y-pointU_E2.y);
                //取模
                var v_E2_E1_d = Math.sqrt(v_E2_E1.x*v_E2_E1.x+v_E2_E1.y*v_E2_E1.y);
                //首先需要计算三角形的底部中心点
                var point_c = new OpenLayers.Geometry.Point(pointU_E1.x-v_E2_E1.x*w/v_E2_E1_d,pointU_E1.y-v_E2_E1.y*w/v_E2_E1_d);

                //计算出在三角形上底边上头部结束点
                point_lr_t = this.calculateVector(new OpenLayers.Geometry.Point(pointU_E1.x-point_c.x,pointU_E1.y-point_c.y),Math.PI/2,w/2);
                //获取三角形左右两个向量
                v_l_t = point_lr_t[0];
                v_r_t = point_lr_t[1];

                point_h_l = new OpenLayers.Geometry.Point(v_l_t.x/this._ratio+point_c.x,v_l_t.y/this._ratio+point_c.y);
                point_h_r = new OpenLayers.Geometry.Point(v_r_t.x/this._ratio+point_c.x,v_r_t.y/this._ratio+point_c.y);
                //计算三角形的左右两点
                point_triangle_l = new OpenLayers.Geometry.Point(point_h_l.x*2-point_h_r.x,point_h_l.y*2-point_h_r.y);
                point_triangle_r = new OpenLayers.Geometry.Point(point_h_r.x*2-point_h_l.x,point_h_r.y*2-point_h_l.y);

                //计算最后的控制点
                point_C_l_e = new OpenLayers.Geometry.Point((point_C_l_eq.x+point_h_l.x)/2,(point_C_l_eq.y+point_h_l.y)/2);
                point_C_r_e = new OpenLayers.Geometry.Point((point_C_r_eq.x+point_h_r.x)/2,(point_C_r_eq.y+point_h_r.y)/2);

                //添加最后的控制点（中心点）
                points_C_l.push(point_C_l_e);
                points_C_r.push(point_C_r_e);
            }
            //使用控制点计算差值
            //计算贝塞尔的控制点
            var points_BC_l = OpenLayers.Geometry.LineString.createBezier2(points_C_l).components;
            var points_BC_r = OpenLayers.Geometry.LineString.createBezier2(points_C_r).components;
            //组合左右点集和三角形三个点
            var pointsR = [point_t_l];
            //首先连接左边的差值曲线
            pointsR = pointsR.concat(points_BC_l);
            //添加左边头部结束点
            pointsR.push(point_h_l);
            //添加三角形左边点
            pointsR.push(point_triangle_l);
            //添加三角形顶点
            pointsR.push(pointU_E1);
            //添加三角形右边点
            pointsR.push(point_triangle_r);
            //添加右边头部结束点
            pointsR.push(point_h_r);
            //合并右边的所有点
            for(var k = points_BC_r.length-1; k>=0; k--)
            {
                pointsR.push(points_BC_r[k]);
            }
            //添加右边尾部起始点
            pointsR.push(point_t_r);

            this.components.push(new OpenLayers.Geometry.LinearRing(pointsR));
        },

        CLASS_NAME: "OpenLayers.Geometry.GeoDiagonalArrow"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoDiagonalArrow 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<OpenLayers.Geometry.GeoDiagonalArrow>} 返回的 GeoDiagonalArrow 对象。
 */
OpenLayers.Geometry.GeoDiagonalArrow.fromJSON = function(str){
    var geoDiagonalArrow = new OpenLayers.Geometry.GeoDiagonalArrow();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    //匹配长宽比例
    var r = str.match(/"ratio":([0-9]+)/)[1];
    geoDiagonalArrow._ratio = parseInt(r);

    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = OpenLayers.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geoDiagonalArrow._controlPoints = arr;
    return geoDiagonalArrow;
};

