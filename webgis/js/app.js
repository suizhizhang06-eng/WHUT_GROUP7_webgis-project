/**
 * 主应用入口
 * 协调所有模块的工作
 */

class App {
    constructor() {
        // 组件实例
        this.dataModel = window.narrativeDataModel;
        this.mapManager = null;
        this.timeline = null;
        this.narrativeEditor = null;
        this.spatialAnalysis = null;

        // 当前视图
        this.currentView = 'map';

        // 初始化
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('地理叙事驱动GIS系统启动中...');

        // 初始化地图
        this.initMap();

        // 初始化时间线
        this.initTimeline();

        // 初始化叙事编辑器
        this.initNarrativeEditor();

        // 初始化空间分析
        this.initSpatialAnalysis();

        // 绑定UI事件
        this.bindUIEvents();

        // 绑定导航事件
        this.bindNavigation();

        // 自动加载默认案例
        this.loadDefaultCase();

        console.log('系统初始化完成');
    }

    initMap() {
        this.mapManager = new MapManager('map');
        window.mapManager = this.mapManager;

        // 绑定地图事件
        this.mapManager.on('map:click', (latlng) => {
            this.handleMapClick(latlng);
        });

        this.mapManager.on('element:selected', (element) => {
            this.showElementDetails(element);
        });

        // 初始化时间滑块
        this.initTimeSlider();

        // 路线绘制状态
        this.drawingLine = false;
        this.linePoints = [];
        this.tempLine = null;
    }

    initTimeline() {
        // 时间线组件不再需要DOM容器，只用于数据管理
        this.timeline = new TimelineComponent(null);
        window.timelineComponent = this.timeline;

        // 绑定时间线事件
        this.timeline.on('timeline:navigate', (data) => {
            if (this.mapManager) {
                this.mapManager.setView(data.center, 6);
                this.mapManager.selectElement('marker', data.event.id);
            }
        });
    }

    initNarrativeEditor() {
        // 使用chapter-list作为容器
        this.narrativeEditor = new NarrativeEditor('chapter-list');
        window.narrativeEditor = this.narrativeEditor;
    }

    initSpatialAnalysis() {
        this.spatialAnalysis = new SpatialAnalysis(this.mapManager);
        window.spatialAnalysis = this.spatialAnalysis;
    }

    initTimeSlider() {
        const slider = document.getElementById('time-slider');
        const timeLabel = document.getElementById('time-current');
        const playBtn = document.getElementById('btn-play');
        const pauseBtn = document.getElementById('btn-pause');
        const resetBtn = document.getElementById('btn-reset');

        if (slider) {
            slider.addEventListener('input', (e) => {
                const progress = parseInt(e.target.value);
                const events = this.dataModel.getAllEvents();

                if (events.length > 0) {
                    const index = Math.round((progress / 100) * (events.length - 1));
                    const event = events[index];

                    if (timeLabel && event) {
                        timeLabel.textContent = event.time?.start || '';
                    }

                    // 更新滑块背景
                    slider.style.background = `linear-gradient(to right, #c9a227 ${progress}%, #ecf0f1 ${progress}%)`;

                    // 跳转到对应位置
                    if (this.timeline) {
                        this.timeline.goToPosition(index);
                    }
                }
            });
        }

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.timeline?.play();
                playBtn.style.display = 'none';
                pauseBtn.style.display = 'block';
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.timeline?.pause();
                pauseBtn.style.display = 'none';
                playBtn.style.display = 'block';
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.timeline?.reset();
                pauseBtn.style.display = 'none';
                playBtn.style.display = 'block';
                if (slider) {
                    slider.value = 0;
                    slider.style.background = `linear-gradient(to right, #c9a227 0%, #ecf0f1 0%)`;
                }
                if (timeLabel) {
                    timeLabel.textContent = '';
                }
            });
        }

        // 监听时间线播放事件，更新滑块
        if (this.timeline) {
            this.timeline.on('timeline:navigate', (data) => {
                const events = this.dataModel.getAllEvents();
                const index = events.findIndex(e => e.id === data.event.id);
                if (index !== -1 && slider) {
                    const progress = Math.round((index / (events.length - 1)) * 100);
                    slider.value = progress;
                    slider.style.background = `linear-gradient(to right, #c9a227 ${progress}%, #ecf0f1 ${progress}%)`;
                    if (timeLabel) {
                        timeLabel.textContent = data.event.time?.start || '';
                    }
                }
            });
        }
    }

    bindUIEvents() {
        // 案例选择按钮
        const btnLoadCase = document.getElementById('btn-load-case');
        if (btnLoadCase) {
            btnLoadCase.addEventListener('click', () => {
                this.showCaseModal();
            });
        }

        // 导出按钮
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.exportData();
            });
        }

        // 案例选择模态框
        const caseCards = document.querySelectorAll('.case-card');
        caseCards.forEach(card => {
            card.addEventListener('click', () => {
                const caseType = card.dataset.case;
                this.loadCase(caseType);
                this.hideCaseModal();
            });
        });

        // 模态框关闭按钮
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
            });
        });

        // 模态框遮罩层关闭
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                overlay.closest('.modal').style.display = 'none';
            });
        });

        // 工具栏按钮
        const toolBtns = document.querySelectorAll('.btn-tool');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tool = btn.dataset.tool;
                this.mapManager?.setActiveTool(tool);
                this.updateToolStatus(tool);
            });
        });

        // 清除缓冲区按钮
        const btnClearBuffers = document.getElementById('btn-clear-buffers');
        if (btnClearBuffers) {
            btnClearBuffers.addEventListener('click', () => {
                this.clearAllBuffers();
            });
        }

        // 查询功能
        const btnQuery = document.getElementById('btn-query');
        if (btnQuery) {
            btnQuery.addEventListener('click', () => {
                this.executeQuery();
            });
        }

        // 查询回车触发
        const queryKeyword = document.getElementById('query-keyword');
        if (queryKeyword) {
            queryKeyword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.executeQuery();
                }
            });
        }

        // 空间分析按钮
        const btnSpatiotemporal = document.getElementById('btn-spatiotemporal');
        if (btnSpatiotemporal) {
            btnSpatiotemporal.addEventListener('click', () => {
                this.runSpatiotemporalAnalysis();
            });
        }

        const btnInfluence = document.getElementById('btn-influence');
        if (btnInfluence) {
            btnInfluence.addEventListener('click', () => {
                this.runInfluenceAnalysis();
            });
        }

        const btnOverlay = document.getElementById('btn-overlay');
        if (btnOverlay) {
            btnOverlay.addEventListener('click', () => {
                this.runOverlayAnalysis();
            });
        }
    }

    bindNavigation() {
        // 导航标签
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const view = tab.dataset.view;
                this.switchView(view);
            });
        });
    }

    switchView(view) {
        this.currentView = view;

        // 隐藏所有面板
        const sidebarLeft = document.getElementById('sidebar-left');
        const detailPanel = document.getElementById('detail-panel');
        const queryPanel = document.getElementById('query-panel');

        // 根据视图显示对应面板
        switch (view) {
            case 'map':
                if (sidebarLeft) sidebarLeft.style.display = 'block';
                if (detailPanel) detailPanel.style.display = 'block';
                if (queryPanel) queryPanel.style.display = 'none';
                break;
            case 'timeline':
                if (sidebarLeft) sidebarLeft.style.display = 'none';
                if (detailPanel) detailPanel.style.display = 'none';
                if (queryPanel) queryPanel.style.display = 'none';
                break;
            case 'narrative':
                if (sidebarLeft) sidebarLeft.style.display = 'block';
                if (detailPanel) detailPanel.style.display = 'none';
                if (queryPanel) queryPanel.style.display = 'none';
                this.narrativeEditor?.renderChapterList();
                break;
            case 'analysis':
                if (sidebarLeft) sidebarLeft.style.display = 'none';
                if (detailPanel) detailPanel.style.display = 'none';
                if (queryPanel) queryPanel.style.display = 'block';
                break;
        }
    }

    showCaseModal() {
        const modal = document.getElementById('modal-case');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideCaseModal() {
        const modal = document.getElementById('modal-case');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async loadDefaultCase() {
        await this.loadCase('zhangqian');
    }

    async loadCase(caseType) {
        console.log('加载案例:', caseType);

        switch (caseType) {
            case 'zhangqian':
                await this.loadZhangQianCase();
                break;
            case 'battle':
                // 案例：街亭之战
                alert('街亭之战案例开发中...');
                break;
            case 'poets':
                // 案例：诗人轨迹
                alert('诗人轨迹案例开发中...');
                break;
        }
    }

    async loadZhangQianCase() {
        try {
            // 加载数据
            await zhangQianCase.loadData();

            // 加载到数据模型
            zhangQianCase.loadToDataModel(this.dataModel);

            // 加载到地图
            zhangQianCase.loadToMap(this.mapManager);

            // 加载到时间线
            if (this.timeline) {
                this.timeline.setEvents(this.dataModel.getAllEvents());
            }

            // 加载到叙事编辑器
            if (this.narrativeEditor) {
                const narrative = this.dataModel.getNarrative('zhangqian-silk-road');
                const chapters = this.dataModel.getNarrativeChapters('zhangqian-silk-road');
                this.narrativeEditor.setNarrative(narrative, chapters);
            }

            // 更新图例
            this.updateLegend();

            // 显示统计信息
            this.showStats();

            console.log('张骞案例加载完成');
        } catch (error) {
            console.error('加载案例失败:', error);
            alert('加载案例失败，请刷新页面重试');
        }
    }

    updateLegend() {
        const legendContent = document.getElementById('legend-content');
        if (!legendContent) return;

        const legendData = zhangQianCase.getLegendData();

        let html = '';
        legendData.forEach(item => {
            const icon = svgSymbolSystem.createMarkerIcon(item.type, { size: 24 });
            html += `
                <div class="legend-item">
                    ${icon}
                    <span>${item.name}</span>
                </div>
            `;
        });

        legendContent.innerHTML = html;
    }

    showStats() {
        const stats = zhangQianCase.getStats();
        console.log('案例统计:', stats);
    }

    handleMapClick(latlng) {
        const tool = this.mapManager.activeTool;

        if (tool === 'point') {
            // 添加新事件点
            this.showEventModal({
                location: {
                    lat: latlng.lat,
                    lng: latlng.lng
                }
            });
        } else if (tool === 'line') {
            // 绘制路线
            this.drawLinePoint(latlng);
        } else if (tool === 'buffer') {
            // 缓冲区分析
            this.addBufferAnalysis(latlng);
        }
    }

    drawLinePoint(latlng) {
        this.linePoints.push([latlng.lat, latlng.lng]);

        // 移除临时线
        if (this.tempLine) {
            this.mapManager.map.removeLayer(this.tempLine);
        }

        // 绘制临时线
        if (this.linePoints.length > 1) {
            this.tempLine = L.polyline(this.linePoints, {
                color: '#c9a227',
                weight: 3,
                dashArray: '10,5'
            }).addTo(this.mapManager.map);
        }

        // 添加临时标记
        const marker = L.circleMarker(latlng, {
            radius: 5,
            color: '#c9a227',
            fillColor: '#fff',
            fillOpacity: 1
        }).addTo(this.mapManager.map);

        // 存储标记以便清除
        if (!this.tempMarkers) this.tempMarkers = [];
        this.tempMarkers.push(marker);

        this.showNotification(`已添加点 ${this.linePoints.length}，双击完成绘制`);

        // 双击完成绘制
        this.mapManager.map.once('dblclick', () => {
            this.finishLineDrawing();
        });
    }

    finishLineDrawing() {
        if (this.linePoints.length < 2) {
            this.showNotification('至少需要2个点来创建路线');
            this.cancelLineDrawing();
            return;
        }

        // 创建正式路线
        const routeName = prompt('请输入路线名称:', `路线${this.dataModel.getAllRoutes().length + 1}`);
        if (routeName) {
            const points = this.linePoints.map((p, i) => ({
                lat: p[0],
                lng: p[1],
                name: `点${i + 1}`
            }));

            const route = {
                name: routeName,
                type: 'tradeRoute',
                color: '#c9a227',
                weight: 4,
                animation: false,
                points: points
            };

            this.dataModel.addRoute(route);
            this.mapManager.addPath(route);
            this.showNotification(`路线"${routeName}"已创建`);
        }

        this.cancelLineDrawing();
    }

    cancelLineDrawing() {
        // 清除临时线
        if (this.tempLine) {
            this.mapManager.map.removeLayer(this.tempLine);
            this.tempLine = null;
        }

        // 清除临时标记
        if (this.tempMarkers) {
            this.tempMarkers.forEach(m => this.mapManager.map.removeLayer(m));
            this.tempMarkers = [];
        }

        this.linePoints = [];
        this.drawingLine = false;
    }

    updateToolStatus(tool) {
        const toolNames = {
            select: '选择',
            point: '添加事件点',
            line: '绘制路线',
            buffer: '缓冲区分析'
        };
        console.log('当前工具:', toolNames[tool] || tool);

        // 显示提示信息
        if (tool === 'point') {
            this.showNotification('点击地图添加事件点');
        } else if (tool === 'line') {
            this.showNotification('点击地图绘制路线（双击结束）');
        } else if (tool === 'buffer') {
            this.showNotification('点击地图进行缓冲区分析');
        } else if (tool === 'select') {
            this.showNotification('点击选择地图元素');
        }
    }

    showNotification(message) {
        // 创建通知元素
        let notification = document.getElementById('tool-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'tool-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 2000;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.style.opacity = '1';

        // 3秒后隐藏
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            notification.style.opacity = '0';
        }, 3000);
    }

    addBufferAnalysis(latlng) {
        // 添加缓冲区
        const radius = prompt('请输入缓冲区半径（公里）:', '100');
        if (radius) {
            const radiusKm = parseInt(radius);
            if (!isNaN(radiusKm) && radiusKm > 0) {
                // 获取最近的事件点名称
                const events = this.dataModel.getAllEvents();
                let nearestEvent = null;
                let minDist = Infinity;

                events.forEach(event => {
                    if (event.location) {
                        const dist = Math.sqrt(
                            Math.pow(event.location.lat - latlng.lat, 2) +
                            Math.pow(event.location.lng - latlng.lng, 2)
                        );
                        if (dist < minDist) {
                            minDist = dist;
                            nearestEvent = event;
                        }
                    }
                });

                const name = nearestEvent?.location?.name || '分析点';

                // 创建缓冲区
                this.spatialAnalysis.bufferAnalysis(
                    [{ lat: latlng.lat, lng: latlng.lng, name }],
                    radiusKm
                );

                this.showNotification(`已添加 ${name} 的 ${radiusKm}km 缓冲区`);
            }
        }
    }

    clearAllBuffers() {
        if (this.spatialAnalysis) {
            this.spatialAnalysis.clearAll();
            this.showNotification('已清除所有缓冲区');
        }
    }

    runSpatiotemporalAnalysis() {
        const events = this.dataModel.getAllEvents();
        if (events.length === 0) {
            alert('请先加载案例数据');
            return;
        }

        const results = this.spatialAnalysis.spatiotemporalAnalysis(events);
        this.displayAnalysisResults('时空序列分析', results);
        this.showNotification('时空序列分析完成');
    }

    runInfluenceAnalysis() {
        const locations = this.dataModel.getAllLocations();
        if (locations.length === 0) {
            // 使用事件位置
            const events = this.dataModel.getAllEvents();
            const cities = events.map(e => ({
                name: e.location?.name || '未知',
                coordinates: { lat: e.location?.lat, lng: e.location?.lng },
                type: 'city'
            }));
            this.spatialAnalysis.influenceAnalysis(cities);
        } else {
            this.spatialAnalysis.influenceAnalysis(locations);
        }
        this.showNotification('影响范围分析完成');
    }

    runOverlayAnalysis() {
        const roles = this.dataModel.getAllRoles();
        if (roles.length === 0) {
            alert('请先加载案例数据');
            return;
        }

        // 创建势力数据
        const factions = roles.filter(r => r.type === 'army' || r.type === 'country').map(r => {
            const events = this.dataModel.getAllEvents().filter(e => e.roles?.includes(r.id));
            const avgLat = events.reduce((sum, e) => sum + (e.location?.lat || 0), 0) / (events.length || 1);
            const avgLng = events.reduce((sum, e) => sum + (e.location?.lng || 0), 0) / (events.length || 1);

            return {
                name: r.name,
                center: { lat: avgLat, lng: avgLng },
                radius: 300,
                color: r.type === 'army' ? '#e74c3c' : '#3498db'
            };
        });

        if (factions.length > 0) {
            this.spatialAnalysis.overlayAnalysis(factions);
            this.showNotification('叠加分析完成');
        }
    }

    displayAnalysisResults(title, results) {
        const resultsContainer = document.getElementById('query-results');
        if (!resultsContainer) return;

        let html = `<div class="analysis-result"><h4>${title}</h4>`;

        if (results.statistics) {
            html += `
                <div class="stats">
                    <p><strong>事件总数：</strong>${results.statistics.totalEvents}</p>
                    <p><strong>时间跨度：</strong>${results.statistics.timeSpan}</p>
                    <p><strong>地点数量：</strong>${results.statistics.locationCount}</p>
                    <p><strong>平均距离：</strong>${results.statistics.averageDistance} km</p>
                </div>
            `;
        }

        html += '</div>';
        resultsContainer.innerHTML = html;
    }

    showEventModal(eventData = {}) {
        const modal = document.getElementById('modal-event');
        if (!modal) return;

        // 填充表单
        document.getElementById('event-id').value = eventData.id || '';
        document.getElementById('event-name').value = eventData.name || '';
        document.getElementById('event-time-start').value = eventData.time?.start || '';
        document.getElementById('event-time-end').value = eventData.time?.end || '';
        document.getElementById('event-location-name').value = eventData.location?.name || '';
        document.getElementById('event-lat').value = eventData.location?.lat || '';
        document.getElementById('event-lng').value = eventData.location?.lng || '';
        document.getElementById('event-type').value = eventData.type || 'other';
        document.getElementById('event-description').value = eventData.description || '';

        // 显示模态框
        modal.style.display = 'flex';

        // 绑定表单提交
        const form = document.getElementById('event-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveEvent();
        };
    }

    saveEvent() {
        const id = document.getElementById('event-id').value;
        const eventData = {
            name: document.getElementById('event-name').value,
            time: {
                start: document.getElementById('event-time-start').value,
                end: document.getElementById('event-time-end').value
            },
            location: {
                name: document.getElementById('event-location-name').value,
                lat: parseFloat(document.getElementById('event-lat').value) || 0,
                lng: parseFloat(document.getElementById('event-lng').value) || 0
            },
            type: document.getElementById('event-type').value,
            description: document.getElementById('event-description').value
        };

        if (id) {
            // 更新现有事件
            this.dataModel.updateEvent(id, eventData);
            this.mapManager.updateMarker(id, eventData);
        } else {
            // 添加新事件
            const newEvent = this.dataModel.addEvent(eventData);
            this.mapManager.addMarker(newEvent);
        }

        // 关闭模态框
        document.getElementById('modal-event').style.display = 'none';

        // 刷新时间线
        this.timeline.setEvents(this.dataModel.getAllEvents());
    }

    showElementDetails(element) {
        const detailPanel = document.getElementById('detail-panel');
        const detailTitle = document.getElementById('detail-title');
        const detailContent = document.getElementById('detail-content');

        if (!detailPanel || !detailContent) return;

        detailPanel.style.display = 'block';

        if (element.type === 'marker') {
            const event = element.data;
            detailTitle.textContent = event.name;

            detailContent.innerHTML = `
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <p><strong>时间：</strong>${event.time?.start || '未知'}${event.time?.end ? ' - ' + event.time.end : ''}</p>
                    <p><strong>地点：</strong>${event.location?.name || '未知'}</p>
                    <p><strong>类型：</strong>${event.type}</p>
                </div>
                ${event.description ? `
                <div class="detail-section">
                    <h4>描述</h4>
                    <p>${event.description}</p>
                </div>
                ` : ''}
                ${event.roles?.length ? `
                <div class="detail-section">
                    <h4>相关角色</h4>
                    <ul>
                        ${event.roles.map(roleId => {
                            const role = this.dataModel.getRole(roleId);
                            return role ? `<li>${role.name}</li>` : '';
                        }).join('')}
                    </ul>
                </div>
                ` : ''}
            `;
        } else if (element.type === 'path') {
            const route = element.data;
            detailTitle.textContent = route.name;

            detailContent.innerHTML = `
                <div class="detail-section">
                    <h4>路线信息</h4>
                    <p><strong>类型：</strong>${route.type}</p>
                    <p><strong>经过地点：</strong>${route.points.length} 个</p>
                </div>
                <div class="detail-section">
                    <h4>经过地点</h4>
                    <ul>
                        ${route.points.map(p => `<li>${p.name}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    executeQuery() {
        const queryType = document.getElementById('query-type').value;
        const keyword = document.getElementById('query-keyword').value.trim();
        const resultsContainer = document.getElementById('query-results');

        if (!keyword) {
            alert('请输入查询关键词');
            return;
        }

        let results;
        switch (queryType) {
            case 'event':
                results = this.dataModel.queryByKeyword(keyword);
                break;
            case 'role':
                results = this.dataModel.queryByKeyword(keyword);
                break;
            case 'time':
                results = this.dataModel.queryByTimeRange(keyword, keyword);
                break;
            case 'location':
                results = this.dataModel.queryByKeyword(keyword);
                break;
        }

        this.displayQueryResults(results, resultsContainer);
    }

    displayQueryResults(results, container) {
        if (!container) return;

        let html = '';

        // 事件结果
        if (results.events?.length) {
            html += '<div class="result-section"><h4>事件</h4>';
            results.events.forEach(event => {
                html += `
                    <div class="query-result-item" data-type="event" data-id="${event.id}">
                        <h4>${event.name}</h4>
                        <p>${event.time?.start || ''} | ${event.location?.name || ''}</p>
                    </div>
                `;
            });
            html += '</div>';
        }

        // 角色结果
        if (results.roles?.length) {
            html += '<div class="result-section"><h4>角色</h4>';
            results.roles.forEach(role => {
                html += `
                    <div class="query-result-item" data-type="role" data-id="${role.id}">
                        <h4>${role.name}</h4>
                        <p>${role.description || ''}</p>
                    </div>
                `;
            });
            html += '</div>';
        }

        // 地点结果
        if (results.locations?.length) {
            html += '<div class="result-section"><h4>地点</h4>';
            results.locations.forEach(loc => {
                html += `
                    <div class="query-result-item" data-type="location" data-id="${loc.id}">
                        <h4>${loc.name}</h4>
                        <p>${loc.description || ''}</p>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (!html) {
            html = '<div class="empty-state"><p>未找到相关结果</p></div>';
        }

        container.innerHTML = html;

        // 绑定点击事件
        container.querySelectorAll('.query-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                this.navigateToResult(type, id);
            });
        });
    }

    navigateToResult(type, id) {
        switch (type) {
            case 'event':
                const event = this.dataModel.getEvent(id);
                if (event) {
                    this.mapManager.setView([event.location.lat, event.location.lng], 8);
                    this.mapManager.selectElement('marker', id);
                    this.timeline.goToEvent(id);
                }
                break;
            case 'role':
                const role = this.dataModel.getRole(id);
                if (role) {
                    // 显示角色相关事件
                    const events = this.dataModel.getAllEvents().filter(e =>
                        e.roles?.includes(id)
                    );
                    if (events.length > 0) {
                        this.mapManager.setView([events[0].location.lat, events[0].location.lng], 6);
                    }
                }
                break;
            case 'location':
                const location = this.dataModel.getLocation(id);
                if (location) {
                    this.mapManager.setView([location.coordinates.lat, location.coordinates.lng], 8);
                }
                break;
        }
    }

    exportData() {
        const data = this.dataModel.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'narrative-data.json';
        a.click();

        URL.revokeObjectURL(url);
    }
}

// 启动应用
const app = new App();
