/**
 * SVG地图符号系统
 * 为地理叙事提供自定义SVG标记
 */

class SVGSymbolSystem {
    constructor() {
        // 符号定义
        this.symbols = {
            // 事件类型符号
            departure: {
                name: '出发',
                color: '#27ae60',
                icon: `<circle cx="12" cy="12" r="10" fill="currentColor"/>
                       <path d="M8 12 L16 12 M12 8 L12 16" stroke="white" stroke-width="2"/>`
            },
            arrival: {
                name: '到达',
                color: '#f39c12',
                icon: `<circle cx="12" cy="12" r="10" fill="currentColor"/>
                       <path d="M8 12 L12 16 L16 12" stroke="white" stroke-width="2" fill="none"/>`
            },
            battle: {
                name: '战役',
                color: '#e74c3c',
                icon: `<circle cx="12" cy="12" r="10" fill="currentColor"/>
                       <path d="M8 8 L16 16 M16 8 L8 16" stroke="white" stroke-width="2"/>`
            },
            diplomacy: {
                name: '外交',
                color: '#3498db',
                icon: `<circle cx="12" cy="12" r="10" fill="currentColor"/>
                       <path d="M8 12 Q12 8 16 12 Q12 16 8 12" stroke="white" stroke-width="2" fill="none"/>`
            },
            captivity: {
                name: '扣押',
                color: '#9b59b6',
                icon: `<circle cx="12" cy="12" r="10" fill="currentColor"/>
                       <path d="M8 8 L16 16 M16 8 L8 16" stroke="white" stroke-width="2"/>
                       <circle cx="12" cy="12" r="4" fill="white"/>`
            },
            other: {
                name: '其他',
                color: '#95a5a6',
                icon: `<circle cx="12" cy="12" r="10" fill="currentColor"/>
                       <circle cx="12" cy="12" r="3" fill="white"/>`
            },

            // 角色类型符号
            person: {
                name: '人物',
                color: '#c9a227',
                icon: `<circle cx="12" cy="12" r="10" fill="currentColor"/>
                       <circle cx="12" cy="9" r="3" fill="white"/>
                       <path d="M7 17 Q12 13 17 17" stroke="white" stroke-width="2" fill="none"/>`
            },
            army: {
                name: '军队',
                color: '#c0392b',
                icon: `<polygon points="12,2 22,22 2,22" fill="currentColor"/>
                       <path d="M12 8 L12 16 M9 12 L15 12" stroke="white" stroke-width="2"/>`
            },
            country: {
                name: '国家',
                color: '#2c3e50',
                icon: `<rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor"/>
                       <path d="M6 10 L10 10 M6 14 L14 14 M6 18 L10 18" stroke="white" stroke-width="1.5"/>`
            },

            // 地点类型符号
            city: {
                name: '城市',
                color: '#34495e',
                icon: `<rect x="3" y="8" width="18" height="14" fill="currentColor"/>
                       <rect x="7" y="4" width="10" height="18" fill="currentColor"/>
                       <rect x="9" y="7" width="2" height="3" fill="white"/>
                       <rect x="13" y="7" width="2" height="3" fill="white"/>
                       <rect x="9" y="12" width="2" height="3" fill="white"/>
                       <rect x="13" y="12" width="2" height="3" fill="white"/>
                       <rect x="10" y="17" width="4" height="5" fill="white"/>`
            },
            battlefield: {
                name: '战场',
                color: '#c0392b',
                icon: `<polygon points="12,2 22,12 12,22 2,12" fill="currentColor"/>
                       <path d="M8 12 L16 12 M12 8 L12 16" stroke="white" stroke-width="2"/>`
            },
            capital: {
                name: '都城',
                color: '#c9a227',
                icon: `<polygon points="12,2 15,10 22,10 16,15 18,22 12,18 6,22 8,15 2,10 9,10" fill="currentColor"/>
                       <circle cx="12" cy="12" r="3" fill="white"/>`
            },
            pass: {
                name: '关隘',
                color: '#7f8c8d',
                icon: `<path d="M2 20 L8 8 L12 12 L16 8 L22 20 Z" fill="currentColor"/>
                       <rect x="9" y="14" width="6" height="6" fill="white"/>`
            },

            // 路线符号
            silkRoad: {
                name: '丝绸之路',
                color: '#c9a227',
                dashArray: '10,5'
            },
            tradeRoute: {
                name: '贸易路线',
                color: '#e67e22',
                dashArray: '5,5'
            },
            militaryRoute: {
                name: '军事路线',
                color: '#c0392b',
                dashArray: '15,5,5,5'
            },
            diplomaticRoute: {
                name: '外交路线',
                color: '#3498db',
                dashArray: '20,10'
            }
        };

        // 圆形标记尺寸
        this.markerSize = {
            small: 24,
            medium: 32,
            large: 48
        };
    }

    /**
     * 创建SVG标记图标
     */
    createMarkerIcon(type, options = {}) {
        const symbol = this.symbols[type] || this.symbols.other;
        const size = options.size || this.markerSize.medium;
        const showLabel = options.showLabel !== false;
        const label = options.label || '';

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
                <g color="${symbol.color}">
                    ${symbol.icon}
                </g>
            </svg>
        `;

        return L.divIcon({
            html: svg,
            className: 'svg-marker',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    }

    /**
     * 创建带标签的标记图标
     */
    createLabeledMarkerIcon(type, label, options = {}) {
        const symbol = this.symbols[type] || this.symbols.other;
        const size = options.size || this.markerSize.large;
        const fontSize = options.fontSize || 10;

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="${size}" height="${size * 1.2}">
                <!-- 标记背景 -->
                <path d="M20 46 C20 46 4 28 4 16 C4 7.16 11.16 0 20 0 C28.84 0 36 7.16 36 16 C36 28 20 46 20 46 Z"
                      fill="${symbol.color}"/>
                <!-- 内部图标 -->
                <g transform="translate(8, 4)" color="white">
                    ${symbol.icon.replace(/viewBox="[^"]*"/, '').replace(/width="[^"]*"/, '').replace(/height="[^"]*"/, '')}
                </g>
                <!-- 标签背景 -->
                ${label ? `
                <rect x="0" y="36" width="40" height="12" rx="2" fill="white" stroke="${symbol.color}" stroke-width="1"/>
                <text x="20" y="44" text-anchor="middle" font-size="${fontSize}" font-family="Microsoft YaHei, sans-serif" fill="${symbol.color}">${label}</text>
                ` : ''}
            </svg>
        `;

        return L.divIcon({
            html: svg,
            className: 'svg-marker-labeled',
            iconSize: [size, size * 1.2],
            iconAnchor: [size / 2, size * 1.2],
            popupAnchor: [0, -size * 1.2]
        });
    }

    /**
     * 创建脉冲动画标记
     */
    createPulseMarkerIcon(type, options = {}) {
        const symbol = this.symbols[type] || this.symbols.other;
        const size = options.size || this.markerSize.large;

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">
                <!-- 脉冲环 -->
                <circle cx="24" cy="24" r="20" fill="none" stroke="${symbol.color}" stroke-width="2" opacity="0.3">
                    <animate attributeName="r" from="12" to="22" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <!-- 主标记 -->
                <g transform="translate(12, 12)" color="${symbol.color}">
                    ${symbol.icon}
                </g>
            </svg>
        `;

        return L.divIcon({
            html: svg,
            className: 'svg-marker-pulse',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    }

    /**
     * 创建路径样式
     */
    createPathStyle(type, options = {}) {
        const symbol = this.symbols[type] || this.symbols.silkRoad;

        return {
            color: options.color || symbol.color,
            weight: options.weight || 4,
            opacity: options.opacity || 0.9,
            dashArray: options.dashArray || symbol.dashArray || null,
            lineCap: 'round',
            lineJoin: 'round'
        };
    }

    /**
     * 创建动画路径 - 使用简单的实线，避免缩放时断裂
     */
    createAnimatedPath(latlngs, type, options = {}) {
        const style = this.createPathStyle(type, options);

        // 移除dashArray，使用实线避免缩放时断裂
        delete style.dashArray;

        const path = L.polyline(latlngs, {
            ...style,
            className: 'route-path'
        });

        return path;
    }

    /**
     * 创建缓冲区样式
     */
    createBufferStyle(options = {}) {
        return {
            color: options.color || '#c9a227',
            fillColor: options.fillColor || '#c9a227',
            fillOpacity: options.fillOpacity || 0.2,
            weight: options.weight || 2,
            opacity: options.opacity || 0.8,
            dashArray: '5,5'
        };
    }

    /**
     * 获取所有事件类型
     */
    getEventTypes() {
        return Object.keys(this.symbols).filter(key =>
            ['departure', 'arrival', 'battle', 'diplomacy', 'captivity', 'other'].includes(key)
        );
    }

    /**
     * 获取所有角色类型
     */
    getRoleTypes() {
        return Object.keys(this.symbols).filter(key =>
            ['person', 'army', 'country'].includes(key)
        );
    }

    /**
     * 获取所有地点类型
     */
    getLocationTypes() {
        return Object.keys(this.symbols).filter(key =>
            ['city', 'battlefield', 'capital', 'pass'].includes(key)
        );
    }

    /**
     * 获取所有路线类型
     */
    getRouteTypes() {
        return Object.keys(this.symbols).filter(key =>
            ['silkRoad', 'tradeRoute', 'militaryRoute', 'diplomaticRoute'].includes(key)
        );
    }

    /**
     * 获取符号信息
     */
    getSymbolInfo(type) {
        return this.symbols[type] || null;
    }

    /**
     * 生成图例数据
     */
    generateLegendData(types) {
        return types.map(type => ({
            type,
            ...this.symbols[type]
        }));
    }
}

// 创建全局实例
window.svgSymbolSystem = new SVGSymbolSystem();
