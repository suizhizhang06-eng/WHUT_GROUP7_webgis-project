/**
 * 叙事编辑器
 * 管理叙事章节和内容
 */

class NarrativeEditor {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.chapters = [];
        this.currentChapter = null;
        this.narrative = null;

        // 事件系统
        this.listeners = new Map();

        this.init();
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`容器 ${this.containerId} 不存在`);
            return;
        }

        // 不需要渲染，HTML中已有chapter-list容器
    }

    render() {
        // 空实现，因为我们直接渲染到chapter-list
    }

    bindEvents() {
        // 不需要绑定事件，因为使用HTML中的容器
    }

    // 设置叙事数据
    setNarrative(narrative, chapters) {
        this.narrative = narrative;
        this.chapters = chapters.sort((a, b) => a.order - b.order);
        this.renderChapterList();
        this.updateStats();
    }

    // 渲染章节列表
    renderChapterList() {
        const chapterList = document.getElementById('chapter-list');
        if (!chapterList) return;

        if (this.chapters.length === 0) {
            chapterList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    <h4>暂无章节</h4>
                    <p>点击"添加章节"开始创建叙事</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.chapters.forEach((chapter, index) => {
            const isActive = this.currentChapter?.id === chapter.id;
            const isExpanded = this.expandedChapters?.has(chapter.id);
            const eventCount = chapter.events?.length || 0;

            // 获取章节关联的事件详情
            const chapterEvents = this.getChapterEvents(chapter);

            html += `
                <div class="chapter-item ${isActive ? 'active' : ''}" data-id="${chapter.id}">
                    <div class="chapter-header" data-action="toggle" data-id="${chapter.id}">
                        <span class="chapter-order">${chapter.order}</span>
                        <h4 class="chapter-title">${chapter.title}</h4>
                        <svg class="expand-icon ${isExpanded ? 'expanded' : ''}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                    <p class="chapter-description">${chapter.description || '暂无描述'}</p>
                    <div class="chapter-events-list ${isExpanded ? 'expanded' : ''}">
                        ${chapterEvents.map(event => `
                            <div class="chapter-event-item" data-event-id="${event.id}">
                                <span class="event-dot ${event.type}"></span>
                                <span class="event-name">${event.name}</span>
                                <span class="event-time">${event.time?.start || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        chapterList.innerHTML = html;

        // 绑定事件
        this.bindChapterEvents();
    }

    // 获取章节关联的事件详情
    getChapterEvents(chapter) {
        if (!chapter.events || chapter.events.length === 0) return [];

        const events = [];
        chapter.events.forEach(eventId => {
            const event = window.narrativeDataModel?.getEvent(eventId);
            if (event) {
                events.push(event);
            }
        });

        return events;
    }

    bindChapterEvents() {
        const chapterList = document.getElementById('chapter-list');
        if (!chapterList) return;

        // 初始化展开状态集合
        if (!this.expandedChapters) {
            this.expandedChapters = new Set();
        }

        // 章节头部点击 - 展开/收起
        chapterList.querySelectorAll('.chapter-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const id = header.dataset.id;
                this.toggleChapter(id);
            });
        });

        // 事件点击 - 跳转到地图上的事件
        chapterList.querySelectorAll('.chapter-event-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = item.dataset.eventId;
                this.navigateToEvent(eventId);
            });
        });

        // 操作按钮
        chapterList.querySelectorAll('[data-action="edit"], [data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (action === 'edit') {
                    this.editChapter(id);
                } else if (action === 'delete') {
                    this.deleteChapter(id);
                }
            });
        });

        // 拖拽排序
        this.setupDragAndDrop();
    }

    // 展开/收起章节
    toggleChapter(chapterId) {
        if (!this.expandedChapters) {
            this.expandedChapters = new Set();
        }

        if (this.expandedChapters.has(chapterId)) {
            this.expandedChapters.delete(chapterId);
        } else {
            this.expandedChapters.add(chapterId);
        }

        // 更新UI
        this.renderChapterList();
    }

    // 跳转到事件
    navigateToEvent(eventId) {
        const event = window.narrativeDataModel?.getEvent(eventId);
        if (event && event.location) {
            // 发送事件通知地图跳转
            this.emit('event:navigate', {
                eventId,
                lat: event.location.lat,
                lng: event.location.lng
            });
        }
    }

    // 选中章节
    selectChapter(chapterId) {
        const chapter = this.chapters.find(c => c.id === chapterId);
        if (chapter) {
            this.currentChapter = chapter;
            this.renderChapterList();
            this.emit('chapter:selected', chapter);
        }
    }

    setupDragAndDrop() {
        const chapterList = document.getElementById('chapter-list');
        if (!chapterList) return;

        let draggedItem = null;

        chapterList.querySelectorAll('.chapter-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                chapterList.querySelectorAll('.chapter-item').forEach(i => {
                    i.classList.remove('drag-over');
                });
                draggedItem = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedItem && draggedItem !== item) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedItem && draggedItem !== item) {
                    const fromId = draggedItem.dataset.id;
                    const toId = item.dataset.id;
                    this.reorderChapters(fromId, toId);
                }
            });
        });
    }

    // 章节操作
    selectChapter(id) {
        const chapter = this.chapters.find(c => c.id === id);
        if (chapter) {
            this.currentChapter = chapter;
            this.renderChapterList();
            this.emit('chapter:selected', chapter);
        }
    }

    addChapter() {
        const newChapter = {
            id: `chapter-${Date.now()}`,
            narrativeId: this.narrative?.id,
            order: this.chapters.length + 1,
            title: `第${this.chapters.length + 1}章`,
            description: '',
            events: [],
            roles: [],
            locations: []
        };

        this.chapters.push(newChapter);
        this.renderChapterList();
        this.updateStats();
        this.emit('chapter:added', newChapter);
    }

    editChapter(id) {
        const chapter = this.chapters.find(c => c.id === id);
        if (chapter) {
            // 这里可以打开编辑模态框
            const newTitle = prompt('章节标题:', chapter.title);
            if (newTitle !== null) {
                chapter.title = newTitle;
                this.renderChapterList();
                this.emit('chapter:updated', chapter);
            }
        }
    }

    deleteChapter(id) {
        if (!confirm('确定要删除这个章节吗？')) return;

        const index = this.chapters.findIndex(c => c.id === id);
        if (index !== -1) {
            const chapter = this.chapters.splice(index, 1)[0];
            this.renderChapterList();
            this.updateStats();
            this.emit('chapter:deleted', chapter);
        }
    }

    reorderChapters(fromId, toId) {
        const fromIndex = this.chapters.findIndex(c => c.id === fromId);
        const toIndex = this.chapters.findIndex(c => c.id === toId);

        if (fromIndex !== -1 && toIndex !== -1) {
            const [movedChapter] = this.chapters.splice(fromIndex, 1);
            this.chapters.splice(toIndex, 0, movedChapter);

            // 更新序号
            this.chapters.forEach((ch, i) => {
                ch.order = i + 1;
            });

            this.renderChapterList();
            this.emit('chapters:reordered', this.chapters);
        }
    }

    collapseAll() {
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.add('collapsed');
        });
    }

    expandAll() {
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('collapsed');
        });
    }

    // 更新统计
    updateStats() {
        const chaptersEl = document.getElementById('stat-chapters');
        const eventsEl = document.getElementById('stat-events');
        const rolesEl = document.getElementById('stat-roles');

        if (chaptersEl) chaptersEl.textContent = this.chapters.length;

        const totalEvents = this.chapters.reduce((sum, ch) => sum + (ch.events?.length || 0), 0);
        if (eventsEl) eventsEl.textContent = totalEvents;

        const totalRoles = this.chapters.reduce((sum, ch) => sum + (ch.roles?.length || 0), 0);
        if (rolesEl) rolesEl.textContent = totalRoles;
    }

    // 添加事件到章节
    addEventToChapter(chapterId, eventId) {
        const chapter = this.chapters.find(c => c.id === chapterId);
        if (chapter && !chapter.events.includes(eventId)) {
            chapter.events.push(eventId);
            this.renderChapterList();
            this.updateStats();
            this.emit('chapter:eventAdded', { chapterId, eventId });
        }
    }

    removeEventFromChapter(chapterId, eventId) {
        const chapter = this.chapters.find(c => c.id === chapterId);
        if (chapter) {
            chapter.events = chapter.events.filter(e => e !== eventId);
            this.renderChapterList();
            this.updateStats();
            this.emit('chapter:eventRemoved', { chapterId, eventId });
        }
    }

    // 获取当前章节
    getCurrentChapter() {
        return this.currentChapter;
    }

    // 获取所有章节
    getAllChapters() {
        return this.chapters;
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
        this.container.innerHTML = '';
    }
}

// 创建全局实例
window.narrativeEditor = null;
