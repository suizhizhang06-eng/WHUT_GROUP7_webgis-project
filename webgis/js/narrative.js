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
            const eventCount = chapter.events?.length || 0;

            html += `
                <div class="chapter-item ${isActive ? 'active' : ''}" data-id="${chapter.id}" draggable="true">
                    <div class="chapter-header">
                        <span class="chapter-order">${chapter.order}</span>
                        <h4 class="chapter-title">${chapter.title}</h4>
                        <div class="chapter-actions">
                            <button class="btn-icon" title="编辑" data-action="edit" data-id="${chapter.id}">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button class="btn-icon" title="删除" data-action="delete" data-id="${chapter.id}">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <p class="chapter-description">${chapter.description || '暂无描述'}</p>
                    ${eventCount > 0 ? `
                    <div class="chapter-events">
                        <span class="chapter-event-tag">${eventCount} 个事件</span>
                    </div>
                    ` : ''}
                </div>
            `;
        });

        chapterList.innerHTML = html;

        // 绑定事件
        this.bindChapterEvents();
    }

    bindChapterEvents() {
        const chapterList = document.getElementById('chapter-list');
        if (!chapterList) return;

        // 章节点击
        chapterList.querySelectorAll('.chapter-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 忽略按钮点击
                if (e.target.closest('.btn-icon')) return;

                const id = item.dataset.id;
                this.selectChapter(id);
            });
        });

        // 操作按钮
        chapterList.querySelectorAll('[data-action]').forEach(btn => {
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
