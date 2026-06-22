/**
 * 张骞出使西域案例
 * 加载和管理丝绸之路叙事数据
 */

class ZhangQianCase {
    constructor() {
        this.data = null;
        this.loaded = false;
    }

    /**
     * 加载案例数据
     */
    async loadData() {
        try {
            const response = await fetch('data/zhangqian.json');
            if (!response.ok) {
                throw new Error('加载数据失败');
            }
            this.data = await response.json();
            this.loaded = true;
            return this.data;
        } catch (error) {
            console.error('加载张骞案例数据失败:', error);
            // 使用内联数据作为备份
            this.data = this.getInlineData();
            this.loaded = true;
            return this.data;
        }
    }

    /**
     * 内联数据（备用）
     */
    getInlineData() {
        return {
            narrative: {
                id: "zhangqian-silk-road",
                title: "张骞出使西域",
                subtitle: "丝绸之路的开拓者",
                description: "公元前138年，汉武帝派遣张骞出使西域，意图联合大月氏夹击匈奴。张骞历经13年艰辛，虽未完成最初使命，却开辟了举世闻名的丝绸之路。",
                timeRange: {
                    start: "前138年",
                    end: "前60年"
                }
            },
            roles: [
                { id: "zhangqian", name: "张骞", type: "person", description: "西汉著名外交家、探险家" },
                { id: "han-wudi", name: "汉武帝", type: "person", description: "西汉第七位皇帝" },
                { id: "xiongnu", name: "匈奴", type: "army", description: "北方游牧民族" },
                { id: "dayuezhi", name: "大月氏", type: "country", description: "西域古国" }
            ],
            events: [
                {
                    id: "event-01",
                    name: "受命出使",
                    time: { start: "前138年", sortKey: -138 },
                    location: { lat: 34.2632, lng: 108.9391, name: "长安" },
                    type: "departure",
                    description: "汉武帝为联合大月氏夹击匈奴，张骞应募出使西域。",
                    roles: ["zhangqian", "han-wudi"]
                },
                {
                    id: "event-02",
                    name: "被匈奴扣押",
                    time: { start: "前138年", sortKey: -137 },
                    location: { lat: 40.8421, lng: 94.6619, name: "河西走廊" },
                    type: "captivity",
                    description: "张骞一行被匈奴俘获，扣留十年。",
                    roles: ["zhangqian", "xiongnu"]
                },
                {
                    id: "event-03",
                    name: "到达大月氏",
                    time: { start: "前128年", sortKey: -128 },
                    location: { lat: 37.2241, lng: 67.1894, name: "大月氏" },
                    type: "diplomacy",
                    description: "张骞终于找到大月氏，但大月氏无意东归。",
                    roles: ["zhangqian", "dayuezhi"]
                },
                {
                    id: "event-04",
                    name: "重返长安",
                    time: { start: "前126年", sortKey: -126 },
                    location: { lat: 34.2632, lng: 108.9391, name: "长安" },
                    type: "arrival",
                    description: "张骞历时13年，终于返回长安。",
                    roles: ["zhangqian"]
                }
            ],
            routes: [
                {
                    id: "route-01",
                    name: "丝绸之路",
                    type: "diplomaticRoute",
                    color: "#c9a227",
                    weight: 4,
                    animation: true,
                    points: [
                        { lat: 34.2632, lng: 108.9391, name: "长安" },
                        { lat: 36.0600, lng: 103.8300, name: "兰州" },
                        { lat: 37.9300, lng: 102.6400, name: "武威" },
                        { lat: 39.7300, lng: 98.5100, name: "酒泉" },
                        { lat: 40.1421, lng: 94.6619, name: "敦煌" },
                        { lat: 40.5286, lng: 69.6347, name: "大宛" },
                        { lat: 37.2241, lng: 67.1894, name: "大月氏" }
                    ],
                    events: ["event-01", "event-02", "event-03", "event-04"]
                }
            ],
            chapters: [
                {
                    id: "chapter-01",
                    narrativeId: "zhangqian-silk-road",
                    order: 1,
                    title: "受命出使",
                    description: "汉武帝派遣张骞出使西域。",
                    events: ["event-01"]
                },
                {
                    id: "chapter-02",
                    narrativeId: "zhangqian-silk-road",
                    order: 2,
                    title: "十年匈奴",
                    description: "张骞被匈奴扣押十年。",
                    events: ["event-02"]
                },
                {
                    id: "chapter-03",
                    narrativeId: "zhangqian-silk-road",
                    order: 3,
                    title: "西域历险",
                    description: "张骞到达大月氏。",
                    events: ["event-03"]
                },
                {
                    id: "chapter-04",
                    narrativeId: "zhangqian-silk-road",
                    order: 4,
                    title: "万里归途",
                    description: "张骞重返长安。",
                    events: ["event-04"]
                }
            ],
            locations: [
                { id: "loc-01", name: "长安", coordinates: { lat: 34.2632, lng: 108.9391 }, type: "capital" },
                { id: "loc-02", name: "大月氏", coordinates: { lat: 37.2241, lng: 67.1894 }, type: "city" }
            ]
        };
    }

    /**
     * 加载数据到数据模型
     */
    loadToDataModel(dataModel) {
        if (!this.data) {
            console.error('数据未加载');
            return;
        }

        // 清空现有数据
        dataModel.clear();

        // 加载角色
        this.data.roles.forEach(role => dataModel.addRole(role));

        // 加载事件
        this.data.events.forEach(event => dataModel.addEvent(event));

        // 加载地点
        if (this.data.locations) {
            this.data.locations.forEach(loc => dataModel.addLocation(loc));
        }

        // 加载路线
        this.data.routes.forEach(route => dataModel.addRoute(route));

        // 加载叙事
        dataModel.addNarrative(this.data.narrative);

        // 加载章节
        this.data.chapters.forEach(chapter => dataModel.addChapter(chapter));

        return dataModel;
    }

    /**
     * 加载到地图
     */
    loadToMap(mapManager) {
        if (!this.data) {
            console.error('数据未加载');
            return;
        }

        // 添加事件标记
        this.data.events.forEach(event => {
            mapManager.addMarker(event);
        });

        // 添加路线
        this.data.routes.forEach(route => {
            mapManager.addPath(route);
        });

        // 适应边界
        this.fitBounds(mapManager);
    }

    /**
     * 适应边界
     */
    fitBounds(mapManager) {
        if (!this.data || !this.data.routes || this.data.routes.length === 0) return;

        // 收集所有路线点
        const allPoints = [];
        this.data.routes.forEach(route => {
            route.points.forEach(point => {
                allPoints.push([point.lat, point.lng]);
            });
        });

        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            mapManager.fitBounds(bounds);
        }
    }

    /**
     * 加载到时间线
     */
    loadToTimeline(timelineComponent) {
        if (!this.data) {
            console.error('数据未加载');
            return;
        }

        timelineComponent.setEvents(this.data.events);
    }

    /**
     * 加载到叙事编辑器
     */
    loadToNarrativeEditor(narrativeEditor) {
        if (!this.data) {
            console.error('数据未加载');
            return;
        }

        narrativeEditor.setNarrative(this.data.narrative, this.data.chapters);
    }

    /**
     * 获取图例数据
     */
    getLegendData() {
        if (!this.data) return [];

        const types = new Set();
        this.data.events.forEach(e => types.add(e.type));
        this.data.roles.forEach(r => types.add(r.type));

        return Array.from(types).map(type => {
            const info = svgSymbolSystem.getSymbolInfo(type);
            return info ? { type, ...info } : null;
        }).filter(Boolean);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        if (!this.data) return {};

        return {
            eventsCount: this.data.events.length,
            rolesCount: this.data.roles.length,
            routesCount: this.data.routes.length,
            chaptersCount: this.data.chapters.length,
            timeRange: this.data.narrative.timeRange
        };
    }
}

// 创建全局实例
window.zhangQianCase = new ZhangQianCase();
