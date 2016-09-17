/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoDoveTailDiagonalArrow.js
 */

/**
 * Class: OpenLayers.Handler.DoveTailDiagonalArrow
 * 在地图上绘制燕尾尾巴斜箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第四次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.DoveTailDiagonalArrow> 构造函数可以创建一个新的绘制燕尾斜箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.DoveTailDiagonalArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.DoveTailDiagonalArrow
     * 构造函数，创建一个新的绘制燕尾斜箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoDoveTailDiagonalArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoDoveTailDiagonalArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 2) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: down
     * Handle mousedown and touchstart.  Add a new point to the Geometry and
     * render it. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function(evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        if(this.touch) { // no point displayed until up on touch devices
            this.modifyFeature(evt.xy);
            OpenLayers.Event.stop(evt);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.DoveTailDiagonalArrow"
});


