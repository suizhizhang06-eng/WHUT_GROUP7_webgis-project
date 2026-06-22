/**
 * 地理叙事数据模型
 * 事件-角色-地点-时间 多层数据结构
 */

class NarrativeDataModel {
    constructor() {
        this.events = new Map();
        this.roles = new Map();
        this.locations = new Map();
        this.narratives = new Map();
        this.chapters = new Map();
        this.routes = new Map();

        // 事件监听器
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

    // 事件(Event)操作
    addEvent(event) {
        const id = event.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newEvent = {
            id,
            name: event.name || '未命名事件',
            description: event.description || '',
            time: {
                start: event.time?.start || '',
                end: event.time?.end || '',
                sortKey: this._parseTimeToSortKey(event.time?.start)
            },
            location: {
                lat: event.location?.lat || 0,
                lng: event.location?.lng || 0,
                name: event.location?.name || ''
            },
            type: event.type || 'other',
            roles: event.roles || [],
            relatedEvents: event.relatedEvents || [],
            routeId: event.routeId || null,
            order: event.order || 0,
            metadata: event.metadata || {}
        };

        this.events.set(id, newEvent);
        this.emit('event:added', newEvent);
        return newEvent;
    }

    updateEvent(id, updates) {
        const event = this.events.get(id);
        if (!event) return null;

        const updatedEvent = {
            ...event,
            ...updates,
            time: { ...event.time, ...updates.time },
            location: { ...event.location, ...updates.location }
        };

        if (updates.time?.start) {
            updatedEvent.time.sortKey = this._parseTimeToSortKey(updates.time.start);
        }

        this.events.set(id, updatedEvent);
        this.emit('event:updated', updatedEvent);
        return updatedEvent;
    }

    deleteEvent(id) {
        const event = this.events.get(id);
        if (event) {
            this.events.delete(id);
            this.emit('event:deleted', event);
        }
        return event;
    }

    getEvent(id) {
        return this.events.get(id);
    }

    getAllEvents() {
        return Array.from(this.events.values()).sort((a, b) =>
            (a.time.sortKey || 0) - (b.time.sortKey || 0)
        );
    }

    // 角色(Role)操作
    addRole(role) {
        const id = role.id || `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRole = {
            id,
            name: role.name || '未命名角色',
            type: role.type || 'person',
            description: role.description || '',
            attributes: role.attributes || {},
            events: role.events || [],
            relationships: role.relationships || []
        };

        this.roles.set(id, newRole);
        this.emit('role:added', newRole);
        return newRole;
    }

    updateRole(id, updates) {
        const role = this.roles.get(id);
        if (!role) return null;

        const updatedRole = { ...role, ...updates };
        this.roles.set(id, updatedRole);
        this.emit('role:updated', updatedRole);
        return updatedRole;
    }

    deleteRole(id) {
        const role = this.roles.get(id);
        if (role) {
            this.roles.delete(id);
            this.emit('role:deleted', role);
        }
        return role;
    }

    getRole(id) {
        return this.roles.get(id);
    }

    getAllRoles() {
        return Array.from(this.roles.values());
    }

    // 地点(Location)操作
    addLocation(location) {
        const id = location.id || `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newLocation = {
            id,
            name: location.name || '未命名地点',
            coordinates: {
                lat: location.coordinates?.lat || 0,
                lng: location.coordinates?.lng || 0
            },
            type: location.type || 'city',
            historicalName: location.historicalName || '',
            description: location.description || '',
            events: location.events || [],
            relatedLocations: location.relatedLocations || []
        };

        this.locations.set(id, newLocation);
        this.emit('location:added', newLocation);
        return newLocation;
    }

    updateLocation(id, updates) {
        const location = this.locations.get(id);
        if (!location) return null;

        const updatedLocation = {
            ...location,
            ...updates,
            coordinates: { ...location.coordinates, ...updates.coordinates }
        };

        this.locations.set(id, updatedLocation);
        this.emit('location:updated', updatedLocation);
        return updatedLocation;
    }

    deleteLocation(id) {
        const location = this.locations.get(id);
        if (location) {
            this.locations.delete(id);
            this.emit('location:deleted', location);
        }
        return location;
    }

    getLocation(id) {
        return this.locations.get(id);
    }

    getAllLocations() {
        return Array.from(this.locations.values());
    }

    // 叙事(Narrative)操作
    addNarrative(narrative) {
        const id = narrative.id || `narrative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNarrative = {
            id,
            title: narrative.title || '未命名叙事',
            subtitle: narrative.subtitle || '',
            description: narrative.description || '',
            timeRange: narrative.timeRange || { start: '', end: '' },
            chapters: narrative.chapters || [],
            metadata: narrative.metadata || {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.narratives.set(id, newNarrative);
        this.emit('narrative:added', newNarrative);
        return newNarrative;
    }

    updateNarrative(id, updates) {
        const narrative = this.narratives.get(id);
        if (!narrative) return null;

        const updatedNarrative = {
            ...narrative,
            ...updates,
            updatedAt: Date.now()
        };

        this.narratives.set(id, updatedNarrative);
        this.emit('narrative:updated', updatedNarrative);
        return updatedNarrative;
    }

    deleteNarrative(id) {
        const narrative = this.narratives.get(id);
        if (narrative) {
            this.narratives.delete(id);
            this.emit('narrative:deleted', narrative);
        }
        return narrative;
    }

    getNarrative(id) {
        return this.narratives.get(id);
    }

    getAllNarratives() {
        return Array.from(this.narratives.values());
    }

    // 章节(Chapter)操作
    addChapter(chapter) {
        const id = chapter.id || `chapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newChapter = {
            id,
            narrativeId: chapter.narrativeId,
            order: chapter.order || 0,
            title: chapter.title || '未命名章节',
            description: chapter.description || '',
            events: chapter.events || [],
            roles: chapter.roles || [],
            locations: chapter.locations || [],
            content: chapter.content || ''
        };

        this.chapters.set(id, newChapter);

        // 关联到叙事
        if (chapter.narrativeId) {
            const narrative = this.narratives.get(chapter.narrativeId);
            if (narrative && !narrative.chapters.includes(id)) {
                narrative.chapters.push(id);
            }
        }

        this.emit('chapter:added', newChapter);
        return newChapter;
    }

    updateChapter(id, updates) {
        const chapter = this.chapters.get(id);
        if (!chapter) return null;

        const updatedChapter = { ...chapter, ...updates };
        this.chapters.set(id, updatedChapter);
        this.emit('chapter:updated', updatedChapter);
        return updatedChapter;
    }

    deleteChapter(id) {
        const chapter = this.chapters.get(id);
        if (chapter) {
            // 从叙事中移除引用
            if (chapter.narrativeId) {
                const narrative = this.narratives.get(chapter.narrativeId);
                if (narrative) {
                    narrative.chapters = narrative.chapters.filter(cid => cid !== id);
                }
            }

            this.chapters.delete(id);
            this.emit('chapter:deleted', chapter);
        }
        return chapter;
    }

    getChapter(id) {
        return this.chapters.get(id);
    }

    getNarrativeChapters(narrativeId) {
        return Array.from(this.chapters.values())
            .filter(ch => ch.narrativeId === narrativeId)
            .sort((a, b) => a.order - b.order);
    }

    // 路线(Route)操作
    addRoute(route) {
        const id = route.id || `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRoute = {
            id,
            name: route.name || '未命名路线',
            points: route.points || [],
            type: route.type || 'path',
            color: route.color || '#c9a227',
            weight: route.weight || 3,
            animation: route.animation || false,
            events: route.events || []
        };

        this.routes.set(id, newRoute);
        this.emit('route:added', newRoute);
        return newRoute;
    }

    updateRoute(id, updates) {
        const route = this.routes.get(id);
        if (!route) return null;

        const updatedRoute = { ...route, ...updates };
        this.routes.set(id, updatedRoute);
        this.emit('route:updated', updatedRoute);
        return updatedRoute;
    }

    deleteRoute(id) {
        const route = this.routes.get(id);
        if (route) {
            this.routes.delete(id);
            this.emit('route:deleted', route);
        }
        return route;
    }

    getRoute(id) {
        return this.routes.get(id);
    }

    getAllRoutes() {
        return Array.from(this.routes.values());
    }

    // 查询功能
    queryByKeyword(keyword) {
        const results = {
            events: [],
            roles: [],
            locations: []
        };

        const lowerKeyword = keyword.toLowerCase();

        // 搜索事件
        this.events.forEach(event => {
            if (event.name.toLowerCase().includes(lowerKeyword) ||
                event.description.toLowerCase().includes(lowerKeyword)) {
                results.events.push(event);
            }
        });

        // 搜索角色
        this.roles.forEach(role => {
            if (role.name.toLowerCase().includes(lowerKeyword) ||
                role.description.toLowerCase().includes(lowerKeyword)) {
                results.roles.push(role);
            }
        });

        // 搜索地点
        this.locations.forEach(location => {
            if (location.name.toLowerCase().includes(lowerKeyword) ||
                location.historicalName.toLowerCase().includes(lowerKeyword) ||
                location.description.toLowerCase().includes(lowerKeyword)) {
                results.locations.push(location);
            }
        });

        return results;
    }

    queryByTimeRange(startYear, endYear) {
        const results = {
            events: [],
            routes: []
        };

        const start = this._parseTimeToSortKey(startYear);
        const end = this._parseTimeToSortKey(endYear);

        this.events.forEach(event => {
            if (event.time.sortKey >= start && event.time.sortKey <= end) {
                results.events.push(event);
            }
        });

        return results;
    }

    queryByType(type, value) {
        const results = [];

        switch (type) {
            case 'eventType':
                this.events.forEach(event => {
                    if (event.type === value) results.push(event);
                });
                break;
            case 'roleType':
                this.roles.forEach(role => {
                    if (role.type === value) results.push(role);
                });
                break;
            case 'locationType':
                this.locations.forEach(location => {
                    if (location.type === value) results.push(location);
                });
                break;
        }

        return results;
    }

    // 辅助方法：解析时间为排序键
    _parseTimeToSortKey(timeStr) {
        if (!timeStr) return 0;

        // 处理 "前XXX年" 格式
        const bcMatch = timeStr.match(/前(\d+)年/);
        if (bcMatch) {
            return -parseInt(bcMatch[1]);
        }

        // 处理 "XXX年" 格式
        const adMatch = timeStr.match(/(\d+)年/);
        if (adMatch) {
            return parseInt(adMatch[1]);
        }

        return 0;
    }

    // 导出数据
    exportData() {
        return {
            events: Array.from(this.events.values()),
            roles: Array.from(this.roles.values()),
            locations: Array.from(this.locations.values()),
            narratives: Array.from(this.narratives.values()),
            chapters: Array.from(this.chapters.values()),
            routes: Array.from(this.routes.values()),
            exportedAt: Date.now()
        };
    }

    // 导入数据
    importData(data) {
        if (data.events) {
            data.events.forEach(event => this.addEvent(event));
        }
        if (data.roles) {
            data.roles.forEach(role => this.addRole(role));
        }
        if (data.locations) {
            data.locations.forEach(location => this.addLocation(location));
        }
        if (data.narratives) {
            data.narratives.forEach(narrative => this.addNarrative(narrative));
        }
        if (data.chapters) {
            data.chapters.forEach(chapter => this.addChapter(chapter));
        }
        if (data.routes) {
            data.routes.forEach(route => this.addRoute(route));
        }

        this.emit('data:imported', data);
    }

    // 清空所有数据
    clear() {
        this.events.clear();
        this.roles.clear();
        this.locations.clear();
        this.narratives.clear();
        this.chapters.clear();
        this.routes.clear();
        this.emit('data:cleared');
    }

    // 获取统计信息
    getStats() {
        return {
            eventsCount: this.events.size,
            rolesCount: this.roles.size,
            locationsCount: this.locations.size,
            narrativesCount: this.narratives.size,
            chaptersCount: this.chapters.size,
            routesCount: this.routes.size
        };
    }
}

// 创建全局实例
window.narrativeDataModel = new NarrativeDataModel();
