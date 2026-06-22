/**
 * 空间分析模块
 * 提供缓冲区分析、叠加分析、时空序列分析等功能
 */

class SpatialAnalysis {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.analysisResults = new Map();
        this.bufferLayers = [];

        // 事件系统
        this.listeners = new Map();
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

    /**
     * 缓冲区分析
     * @param {Array} points - 分析点位 [{lat, lng, name}]
     * @param {number} radius - 缓冲区半径（公里）
     * @param {Object} options - 选项
     */
    bufferAnalysis(points, radius = 100, options = {}) {
        this.clearBuffers();

        const results = [];
        const color = options.color || '#c9a227';

        points.forEach(point => {
            const buffer = this.mapManager.addBuffer(
                [point.lat, point.lng],
                radius * 1000, // 转换为米
                {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5,5'
                }
            );

            // 添加标签
            buffer.bindTooltip(`${point.name} (${radius}km)`, {
                permanent: false,
                direction: 'center'
            });

            this.bufferLayers.push(buffer);

            results.push({
                point,
                radius,
                buffer
            });
        });

        this.analysisResults.set('buffer', results);
        this.emit('analysis:buffer', results);

        return results;
    }

    /**
     * 影响范围分析
     * 分析丝绸之路沿途城市的影响范围
     * @param {Array} cities - 城市数据
     * @param {Object} options - 选项
     */
    influenceAnalysis(cities, options = {}) {
        this.clearBuffers();

        const results = [];
        const baseRadius = options.radius || 200; // 公里

        cities.forEach(city => {
            // 根据城市重要性调整半径
            let radius = baseRadius;
            if (city.type === 'capital') radius *= 2;
            else if (city.type === 'city') radius *= 1.5;

            const buffer = this.mapManager.addBuffer(
                [city.coordinates.lat, city.coordinates.lng],
                radius * 1000,
                {
                    color: city.type === 'capital' ? '#c9a227' : '#3498db',
                    fillColor: city.type === 'capital' ? '#c9a227' : '#3498db',
                    fillOpacity: 0.15,
                    weight: 2
                }
            );

            this.bufferLayers.push(buffer);

            results.push({
                city,
                radius,
                buffer
            });
        });

        this.analysisResults.set('influence', results);
        this.emit('analysis:influence', results);

        return results;
    }

    /**
     * 叠加分析
     * 分析不同势力范围的重叠区域
     * @param {Array}势力数据
     * @param {Object} options - 选项
     */
    overlayAnalysis(factions, options = {}) {
        this.clearBuffers();

        const results = [];
        const bufferPolygons = [];

        factions.forEach(faction => {
            const radius = (faction.radius || 300) * 1000;

            // 创建缓冲区多边形
            const center = L.latLng(faction.center.lat, faction.center.lng);
            const latlngs = this.generateCirclePoints(center, radius, 64);

            const polygon = L.polygon(latlngs, {
                color: faction.color,
                fillColor: faction.color,
                fillOpacity: 0.2,
                weight: 2
            });

            polygon.bindTooltip(faction.name, {
                permanent: false
            });

            this.bufferLayers.push(polygon);
            bufferPolygons.push({ faction, polygon, latlngs });

            results.push({
                faction,
                polygon
            });
        });

        // 计算重叠区域
        const overlaps = this.calculateOverlaps(bufferPolygons);
        results.overlaps = overlaps;

        this.analysisResults.set('overlay', results);
        this.emit('analysis:overlay', results);

        return results;
    }

    /**
     * 计算多边形重叠
     */
    calculateOverlaps(polygons) {
        const overlaps = [];

        for (let i = 0; i < polygons.length; i++) {
            for (let j = i + 1; j < polygons.length; j++) {
                const poly1 = polygons[i];
                const poly2 = polygons[j];

                // 简化检测：检查中心点是否在对方缓冲区内
                const center1 = L.latLng(poly1.faction.center.lat, poly1.faction.center.lng);
                const center2 = L.latLng(poly2.faction.center.lat, poly2.faction.center.lng);

                const distance = center1.distanceTo(center2);
                const combinedRadius = (poly1.faction.radius + poly2.faction.radius) * 1000;

                if (distance < combinedRadius) {
                    overlaps.push({
                        faction1: poly1.faction.name,
                        faction2: poly2.faction.name,
                        distance: Math.round(distance / 1000) + ' km'
                    });
                }
            }
        }

        return overlaps;
    }

    /**
     * 生成圆点
     */
    generateCirclePoints(center, radius, segments) {
        const points = [];
        const earthRadius = 6371000; // 地球半径（米）

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const lat = center.lat + (radius / earthRadius) * (180 / Math.PI) * Math.cos(angle);
            const lng = center.lng + (radius / (earthRadius * Math.cos(center.lat * Math.PI / 180))) * (180 / Math.PI) * Math.sin(angle);
            points.push([lat, lng]);
        }

        return points;
    }

    /**
     * 时空序列分析
     * 分析事件的时间和空间分布
     * @param {Array} events - 事件数据
     */
    spatiotemporalAnalysis(events) {
        const results = {
            timeline: [],
            spatialCluster: [],
            statistics: {}
        };

        // 按时间排序
        const sortedEvents = [...events].sort((a, b) => {
            return (a.time?.sortKey || 0) - (b.time?.sortKey || 0);
        });

        // 时间序列
        results.timeline = sortedEvents.map(event => ({
            time: event.time?.start,
            sortKey: event.time?.sortKey,
            location: event.location,
            type: event.type
        }));

        // 空间聚类
        results.spatialCluster = this.clusterEventsByLocation(events);

        // 统计信息
        results.statistics = {
            totalEvents: events.length,
            timeSpan: this.calculateTimeSpan(sortedEvents),
            locationCount: new Set(events.map(e => e.location?.name)).size,
            averageDistance: this.calculateAverageDistance(events)
        };

        this.analysisResults.set('spatiotemporal', results);
        this.emit('analysis:spatiotemporal', results);

        return results;
    }

    /**
     * 按位置聚类事件
     */
    clusterEventsByLocation(events) {
        const clusters = new Map();

        events.forEach(event => {
            const key = event.location?.name || '未知';
            if (!clusters.has(key)) {
                clusters.set(key, {
                    location: event.location,
                    events: []
                });
            }
            clusters.get(key).events.push(event);
        });

        return Array.from(clusters.values());
    }

    /**
     * 计算时间跨度
     */
    calculateTimeSpan(sortedEvents) {
        if (sortedEvents.length < 2) return '0年';

        const first = sortedEvents[0].time?.sortKey || 0;
        const last = sortedEvents[sortedEvents.length - 1].time?.sortKey || 0;

        const years = Math.abs(last - first);
        return `${years}年`;
    }

    /**
     * 计算平均距离
     */
    calculateAverageDistance(events) {
        if (events.length < 2) return 0;

        let totalDistance = 0;
        let count = 0;

        for (let i = 0; i < events.length - 1; i++) {
            const loc1 = events[i].location;
            const loc2 = events[i + 1].location;

            if (loc1 && loc2) {
                const point1 = L.latLng(loc1.lat, loc1.lng);
                const point2 = L.latLng(loc2.lat, loc2.lng);
                totalDistance += point1.distanceTo(point2);
                count++;
            }
        }

        return count > 0 ? Math.round((totalDistance / count) / 1000) : 0;
    }

    /**
     * 距离分析
     * 计算两点之间的距离
     */
    distanceAnalysis(point1, point2) {
        const p1 = L.latLng(point1.lat, point1.lng);
        const p2 = L.latLng(point2.lat, point2.lng);

        const distance = p1.distanceTo(p2);

        return {
            distance: Math.round(distance / 1000) + ' km',
            distanceMeters: distance,
            bearing: this.calculateBearing(p1, p2)
        };
    }

    /**
     * 计算方位角
     */
    calculateBearing(start, end) {
        const lat1 = start.lat * Math.PI / 180;
        const lat2 = end.lat * Math.PI / 180;
        const dLon = (end.lng - start.lng) * Math.PI / 180;

        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;

        return Math.round(bearing) + '°';
    }

    /**
     * 路径分析
     * 分析路线的特征
     */
    routeAnalysis(routePoints) {
        if (routePoints.length < 2) {
            return { segments: 0, totalDistance: 0 };
        }

        let totalDistance = 0;
        const segments = [];

        for (let i = 0; i < routePoints.length - 1; i++) {
            const point1 = routePoints[i];
            const point2 = routePoints[i + 1];

            const p1 = L.latLng(point1.lat, point1.lng);
            const p2 = L.latLng(point2.lat, point2.lng);

            const distance = p1.distanceTo(p2);
            const bearing = this.calculateBearing(p1, p2);

            segments.push({
                from: point1.name,
                to: point2.name,
                distance: Math.round(distance / 1000) + ' km',
                bearing
            });

            totalDistance += distance;
        }

        return {
            segments,
            totalDistance: Math.round(totalDistance / 1000) + ' km',
            totalDistanceMeters: totalDistance,
            segmentCount: segments.length
        };
    }

    /**
     * 清除所有缓冲区
     */
    clearBuffers() {
        this.bufferLayers.forEach(layer => {
            if (this.mapManager.map) {
                this.mapManager.map.removeLayer(layer);
            }
        });
        this.bufferLayers = [];
    }

    /**
     * 清除所有分析结果
     */
    clearAll() {
        this.clearBuffers();
        this.analysisResults.clear();
        this.emit('analysis:cleared');
    }

    /**
     * 获取分析结果
     */
    getResult(type) {
        return this.analysisResults.get(type);
    }

    /**
     * 导出分析报告
     */
    exportReport() {
        const report = {
            bufferAnalysis: this.analysisResults.get('buffer'),
            influenceAnalysis: this.analysisResults.get('influence'),
            overlayAnalysis: this.analysisResults.get('overlay'),
            spatiotemporalAnalysis: this.analysisResults.get('spatiotemporal'),
            exportedAt: new Date().toISOString()
        };

        return JSON.stringify(report, null, 2);
    }
}

// 创建全局实例
window.spatialAnalysis = null;
