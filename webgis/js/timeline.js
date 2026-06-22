/**
 * 时间线组件
 * 展示叙事的时间轴和事件序列
 */

class TimelineComponent {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.events = [];
        this.currentPosition = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.playSpeed = 1000; // 毫秒

        // 事件系统
        this.listeners = new Map();

        // 时间范围
        this.timeRange = {
            start: null,
            end: null
        };

        this.init();
    }

    init() {
        // 时间线组件不再需要DOM容器，只用于数据管理和事件
        this.container = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="timeline-container">
                <div class="timeline-filters">
                    <button class="filter-btn active" data-filter="all">全部</button>
                    <button class="filter-btn" data-filter="departure">出发</button>
                    <button class="filter-btn" data-filter="arrival">到达</button>
                    <button class="filter-btn" data-filter="diplomacy">外交</button>
                    <button class="filter-btn" data-filter="captivity">扣押</button>
                </div>
                <div class="timeline" id="timeline-events">
                    <!-- 时间线事件将动态生成 -->
                </div>
            </div>
        `;
    }

    bindEvents() {
        // 不需要绑定事件，因为没有DOM容器
    }

    // 设置时间线数据
    setEvents(events) {
        this.events = events.sort((a, b) => {
            return (a.time?.sortKey || 0) - (b.time?.sortKey || 0);
        });

        // 计算时间范围
        if (this.events.length > 0) {
            this.timeRange.start = this.events[0].time?.sortKey || 0;
            this.timeRange.end = this.events[this.events.length - 1].time?.sortKey || 0;
        }

        this.renderTimeline();
    }

    // 渲染时间线（现在不需要DOM操作）
    renderTimeline(filter = 'all') {
        // 时间线不再需要渲染到DOM
        return;

        const filteredEvents = filter === 'all'
            ? this.events
            : this.events.filter(e => e.type === filter);

        if (filteredEvents.length === 0) {
            timelineContent.innerHTML = `
                <div class="empty-state">
                    <p>暂无事件</p>
                </div>
            `;
            return;
        }

        let html = '';
        filteredEvents.forEach((event, index) => {
            const isActive = index === this.currentPosition;

            html += `
                <div class="timeline-item ${isActive ? 'active' : ''}" data-index="${index}" data-id="${event.id}">
                    <div class="timeline-date">${event.time?.start || '未知时间'}</div>
                    <div class="timeline-title">${event.name}</div>
                    <div class="timeline-location">${event.location?.name || ''}</div>
                </div>
            `;
        });

        timelineContent.innerHTML = html;

        // 绑定点击事件
        timelineContent.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.goToPosition(index);
            });
        });
    }

    // 筛选事件
    filterEvents(filter) {
        // 不需要渲染，只触发事件
        this.emit('filter:changed', filter);
    }

    // 导航控制
    goToPosition(index) {
        if (index < 0 || index >= this.events.length) return;

        this.currentPosition = index;
        this.renderTimeline();

        // 通知地图移动到对应位置
        const event = this.events[index];
        if (event?.location) {
            this.emit('timeline:navigate', {
                position: index,
                event,
                center: [event.location.lat, event.location.lng]
            });
        }
    }

    goToEvent(eventId) {
        const index = this.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            this.goToPosition(index);
        }
    }

    next() {
        if (this.currentPosition < this.events.length - 1) {
            this.goToPosition(this.currentPosition + 1);
        } else {
            this.pause();
        }
    }

    prev() {
        if (this.currentPosition > 0) {
            this.goToPosition(this.currentPosition - 1);
        }
    }

    // 播放控制
    play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.emit('timeline:play');

        this.playInterval = setInterval(() => {
            this.next();
        }, this.playSpeed);
    }

    pause() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        clearInterval(this.playInterval);
        this.emit('timeline:pause');
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    reset() {
        this.pause();
        this.goToPosition(0);
        this.emit('timeline:reset');
    }

    setPlaySpeed(speed) {
        this.playSpeed = speed;
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
    }

    // 获取当前状态
    getCurrentEvent() {
        return this.events[this.currentPosition] || null;
    }

    getProgress() {
        if (this.events.length === 0) return 0;
        return (this.currentPosition / (this.events.length - 1)) * 100;
    }

    // 更新进度条
    updateProgress(progress) {
        const slider = document.getElementById('time-slider');
        if (slider) {
            slider.value = progress;
        }

        // 更新时间标签
        const timeLabel = document.getElementById('time-current');
        if (timeLabel && this.events.length > 0) {
            const index = Math.round((progress / 100) * (this.events.length - 1));
            const event = this.events[index];
            timeLabel.textContent = event?.time?.start || '';
        }
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

    // 销毁组件
    destroy() {
        this.pause();
        this.container.innerHTML = '';
    }
}

// 创建全局实例
window.timelineComponent = null;
