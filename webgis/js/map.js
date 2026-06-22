/**
 * 地图核心模块
 * 基于Leaflet的地图管理
 */

class MapManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.layers = {
            markers: L.layerGroup(),
            routes: L.layerGroup(),
            buffers: L.layerGroup(),
            animations: L.layerGroup()
        };
        this.markers = new Map();
        this.paths = new Map();
        this.selectedElement = null;

        // 事件系统
        this.listeners = new Map();

        // 当前活动工具
        this.activeTool = 'select';

        // 绘图控制
        this.drawControl = null;
        this.tempDrawLayer = null;

        this.init();
    }

    init() {
        // 检查Leaflet是否加载
        if (typeof L === 'undefined') {
            console.error('Leaflet库未加载，请检查网络连接');
            return;
        }

        // 初始化地图
        this.map = L.map(this.containerId, {
            center: [35, 75], // 丝绸之路中心区域
            zoom: 4,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: false,
            attributionControl: true
        });

        // 添加缩放控件到右下角
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // 添加图层
        Object.values(this.layers).forEach(layer => layer.addTo(this.map));

        // 添加默认底图
        this.addBaseLayer();

        // 绑定事件
        this.bindEvents();
    }

    addBaseLayer() {
        // OpenStreetMap底图
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        });

        // 添加多个底图选择
        this.baseLayers = {
            '标准地图': osmLayer,
            '地形图': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenTopoMap',
                maxZoom: 17
            }),
            '简化地图': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
                maxZoom: 19
            })
        };

        // 默认使用标准地图
        osmLayer.addTo(this.map);

        // 添加底图切换控件
        L.control.layers(this.baseLayers, null, {
            position: 'bottomright'
        }).addTo(this.map);
    }

    bindEvents() {
        // 地图点击事件
        this.map.on('click', (e) => {
            this.emit('map:click', e.latlng);
        });

        // 地图移动事件
        this.map.on('moveend', () => {
            const center = this.map.getCenter();
            const zoom = this.map.getZoom();
            this.emit('map:move', { center, zoom });
        });

        // 地图缩放事件
        this.map.on('zoomend', () => {
            const zoom = this.map.getZoom();
            this.emit('map:zoom', zoom);
        });
    }

    // 事件系统
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    // 标记(Marker)操作
    addMarker(eventData, options = {}) {
        const { id, name, location, type, description } = eventData;
        const { lat, lng } = location;

        // 创建SVG图标
        const icon = svgSymbolSystem.createLabeledMarkerIcon(type, name, {
            size: options.size || 32
        });

        // 创建标记
        const marker = L.marker([lat, lng], { icon })
            .bindPopup(this.createPopupContent(eventData), {
                maxWidth: 300,
                className: 'custom-popup'
            });

        // 添加到图层
        marker.addTo(this.layers.markers);

        // 存储引用
        this.markers.set(id, {
            marker,
            data: eventData
        });

        // 绑定点击事件
        marker.on('click', () => {
            this.selectElement('marker', id);
            this.emit('marker:click', eventData);
        });

        // 绑定悬停事件
        marker.on('mouseover', function () {
            this.openPopup();
        });

        return marker;
    }

    removeMarker(id) {
        const markerData = this.markers.get(id);
        if (markerData) {
            this.layers.markers.removeLayer(markerData.marker);
            this.markers.delete(id);
        }
    }

    updateMarker(id, updates) {
        const markerData = this.markers.get(id);
        if (markerData) {
            const newData = { ...markerData.data, ...updates };
            markerData.data = newData;

            // 更新位置
            if (updates.location) {
                markerData.marker.setLatLng([updates.location.lat, updates.location.lng]);
            }

            // 更新图标
            if (updates.type || updates.name) {
                const icon = svgSymbolSystem.createLabeledMarkerIcon(
                    newData.type,
                    newData.name,
                    { size: 32 }
                );
                markerData.marker.setIcon(icon);
            }

            // 更新弹出窗口
            markerData.marker.setPopupContent(this.createPopupContent(newData));
        }
    }

    clearMarkers() {
        this.layers.markers.clearLayers();
        this.markers.clear();
    }

    // 路线(Path)操作
    addPath(routeData, options = {}) {
        const { id, name, points, type, color, weight, animation } = routeData;

        // 转换坐标点
        const latlngs = points.map(p => [p.lat, p.lng]);

        // 创建路径样式
        const style = svgSymbolSystem.createPathStyle(type || 'silkRoad', {
            color,
            weight
        });

        let path;
        if (animation) {
            path = svgSymbolSystem.createAnimatedPath(latlngs, type || 'silkRoad', {
                color,
                weight,
                duration: options.duration || 5
            });
        } else {
            path = L.polyline(latlngs, style);
        }

        // 添加到图层
        path.addTo(this.layers.routes);

        // 存储引用
        this.paths.set(id, {
            path,
            data: routeData
        });

        // 绑定点击事件
        path.on('click', () => {
            this.selectElement('path', id);
            this.emit('path:click', routeData);
        });

        // 绑定悬停事件
        path.on('mouseover', function () {
            this.setStyle({ weight: (weight || 3) + 2 });
        });

        path.on('mouseout', function () {
            this.setStyle({ weight: weight || 3 });
        });

        return path;
    }

    removePath(id) {
        const pathData = this.paths.get(id);
        if (pathData) {
            this.layers.routes.removeLayer(pathData.path);
            this.paths.delete(id);
        }
    }

    clearPaths() {
        this.layers.routes.clearLayers();
        this.paths.clear();
    }

    // 缓冲区操作
    addBuffer(latlng, radius, options = {}) {
        const style = svgSymbolSystem.createBufferStyle(options);

        const buffer = L.circle(latlng, {
            radius,
            ...style
        }).addTo(this.layers.buffers);

        return buffer;
    }

    addPolygonBuffer(latlngs, options = {}) {
        const style = svgSymbolSystem.createBufferStyle(options);

        const buffer = L.polygon(latlngs, {
            ...style
        }).addTo(this.layers.buffers);

        return buffer;
    }

    clearBuffers() {
        this.layers.buffers.clearLayers();
    }

    // 选择元素
    selectElement(type, id) {
        // 取消之前的选择
        this.clearSelection();

        if (type === 'marker') {
            const markerData = this.markers.get(id);
            if (markerData) {
                this.selectedElement = { type, id, data: markerData.data };
                // 高亮显示
                markerData.marker.setZIndexOffset(1000);
            }
        } else if (type === 'path') {
            const pathData = this.paths.get(id);
            if (pathData) {
                this.selectedElement = { type, id, data: pathData.data };
                // 高亮显示
                pathData.path.setStyle({ weight: 6, opacity: 1 });
            }
        }

        this.emit('element:selected', this.selectedElement);
    }

    clearSelection() {
        if (this.selectedElement) {
            if (this.selectedElement.type === 'path') {
                const pathData = this.paths.get(this.selectedElement.id);
                if (pathData) {
                    pathData.path.setStyle({ weight: 3, opacity: 0.8 });
                }
            }
            this.selectedElement = null;
        }
    }

    // 创建弹出窗口内容
    createPopupContent(data) {
        const typeLabels = {
            departure: '出发',
            arrival: '到达',
            battle: '战役',
            diplomacy: '外交',
            captivity: '扣押',
            other: '其他'
        };

        return `
            <div class="popup-content">
                <h4>${data.name}</h4>
                <p><strong>时间：</strong>${data.time?.start || '未知'}${data.time?.end ? ' - ' + data.time.end : ''}</p>
                <p><strong>地点：</strong>${data.location?.name || '未知'}</p>
                <p><strong>类型：</strong>${typeLabels[data.type] || data.type}</p>
                ${data.description ? `<p><strong>描述：</strong>${data.description}</p>` : ''}
                ${data.roles?.length ? `<p><strong>相关角色：</strong>${data.roles.join(', ')}</p>` : ''}
            </div>
        `;
    }

    // 工具控制
    setActiveTool(tool) {
        this.activeTool = tool;
        this.emit('tool:changed', tool);
    }

    // 视图控制
    setView(center, zoom) {
        this.map.setView(center, zoom);
    }

    fitBounds(bounds) {
        this.map.fitBounds(bounds);
    }

    zoomIn() {
        this.map.zoomIn();
    }

    zoomOut() {
        this.map.zoomOut();
    }

    resetView() {
        this.setView([35, 75], 4);
    }

    // 获取地图状态
    getState() {
        return {
            center: this.map.getCenter(),
            zoom: this.map.getZoom(),
            bounds: this.map.getBounds()
        };
    }

    // 导出地图为图片
    exportMap() {
        // 注意：Leaflet本身不支持直接导出
        // 可以使用 leaflet-image 或 html2canvas 等插件
        console.log('导出地图功能需要额外插件支持');
    }

    // 销毁地图
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

// 创建全局实例
window.mapManager = null;
