import React, { useState, useRef, useEffect } from 'react';
import styles from './MainIDE.module.css';
import {
    FileCode,
    Search,
    GitBranch,
    Settings,
    Cpu,
    Sparkles,
    ChevronRight,
    Monitor,
    X,
    MessageSquare,
    ArrowUp,
    Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsPage } from './SettingsPage';
import { aiService } from '../services/ai';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export const MainIDE: React.FC = () => {
    const [activeTab, setActiveTab] = useState('App.tsx');
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAIBarOpen, setIsAIBarOpen] = useState(false);
    const [activeModel, setActiveModel] = useState('');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [ollamaStatus, setOllamaStatus] = useState<'running' | 'offline' | 'loading'>('loading');
    const [isSending, setIsSending] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'How can I help you build BLACK BIRD today?' }
    ]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Load Ollama models + status on mount
    useEffect(() => {
        const loadModels = async () => {
            const [status, models] = await Promise.all([
                aiService.getStatus(),
                aiService.getModels()
            ]);
            setOllamaStatus(status);
            setAvailableModels(models);
            if (models.length > 0) setActiveModel(models[0]);
        };
        loadModels();
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending]);


    const handleSend = async () => {
        if (!chatInput.trim() || isSending) return;

        const userMessage = chatInput.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatInput('');
        setIsSending(true);

        const response = await aiService.chat(userMessage, activeModel);

        if (response) {
            setMessages(prev => [...prev, { role: 'ai', content: response.response }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't reach the backend. Check if your services are running." }]);
        }

        setIsSending(false);
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <header className={styles.topBar}>
                <div className={styles.projectName}>BLACK-BIRD — src/App.tsx</div>
                <div className={styles.topBarActions}>
                    <button
                        className={`${styles.iconBtn} ${isChatOpen ? styles.active : ''}`}
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        title="Toggle AI Chat"
                    >
                        <MessageSquare size={16} />
                    </button>
                    <button
                        className={styles.aiBarTrigger}
                        onClick={() => setIsAIBarOpen(true)}
                    >
                        <Sparkles size={14} />
                        <span>AI Bar</span>
                        <div className={styles.kbd}>⌘ K</div>
                    </button>
                </div>
            </header>

            {/* Sidebar - Icons Only */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <div className={styles.sidebarIcon} title="Explorer">
                        <FileCode size={20} />
                    </div>
                    <div className={styles.sidebarIcon} title="Search">
                        <Search size={20} />
                    </div>
                    <div className={styles.sidebarIcon} title="Source Control">
                        <GitBranch size={20} />
                    </div>
                </div>
                <div className={styles.sidebarBottom}>
                    <div
                        className={styles.sidebarIcon}
                        title="Settings"
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        <Settings size={20} />
                    </div>
                </div>
            </aside>

            {/* File Explorer Panel */}
            <div className={styles.explorer}>
                <div className={styles.panelHeader}>EXPLORER</div>
                <div className={styles.fileList}>
                    <div className={`${styles.fileItem} ${activeTab === 'App.tsx' ? styles.active : ''}`}>
                        <ChevronRight size={14} />
                        <span>src</span>
                    </div>
                    <div className={styles.fileItemIndent} onClick={() => setActiveTab('App.tsx')}>
                        <FileCode size={14} />
                        <span>App.tsx</span>
                    </div>
                    <div className={styles.fileItemIndent} onClick={() => setActiveTab('index.css')}>
                        <FileCode size={14} />
                        <span>index.css</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                {/* Editor Tabs */}
                <div className={styles.tabs}>
                    <div className={`${styles.tab} ${styles.activeTab}`}>
                        App.tsx
                        <X size={12} className={styles.closeTab} />
                    </div>
                    <div className={styles.tab}>
                        index.css
                        <X size={12} className={styles.closeTab} />
                    </div>
                </div>

                {/* Editor Placeholder */}
                <div className={styles.editor}>
                    <div className={styles.editorGutter}>
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className={styles.lineNo}>{i + 1}</div>
                        ))}
                    </div>
                    <div className={styles.codeArea}>
                        <pre>
                            <code>
                                <span className={styles.keyword}>import</span> {'{'} useState {'}'} <span className={styles.keyword}>from</span> <span className={styles.str}>'react'</span>;
                                <span className={styles.keyword}>import</span> {'{'} AuthScreen {'}'} <span className={styles.keyword}>from</span> <span className={styles.str}>'./components/AuthScreen'</span>;

                                <span className={styles.keyword}>function</span> <span className={styles.func}>App</span>() {'{'}
                                <span className={styles.keyword}>const</span> [<span className={styles.var}>isAuthenticated</span>, <span className={styles.func}>setIsAuthenticated</span>] = <span className={styles.func}>useState</span>(<span className={styles.keyword}>false</span>);

                                <span className={styles.keyword}>return</span> (
                                &lt;<span className={styles.keyword}>div</span> <span className={styles.var}>className</span>=<span className={styles.str}>"app-container"</span>&gt;
                                {'{'}!<span className={styles.var}>isAuthenticated</span> ? (
                                &lt;<span className={styles.func}>AuthScreen</span> <span className={styles.var}>onLogin</span>={'{'}() =&gt; <span className={styles.func}>setIsAuthenticated</span>(<span className={styles.keyword}>true</span>){'}'} /&gt;
                                ) : (
                                &lt;<span className={styles.func}>MainIDE</span> /&gt;
                                ){'}'}
                                &lt;/<span className={styles.keyword}>div</span>&gt;
                                );
                                {'}'}
                            </code>
                        </pre>
                        {/* Inline AI Suggestion */}
                        <div className={styles.aiSuggestion}>
                            <Sparkles size={14} />
                            <span>Add error handling for authentication flow?</span>
                            <div className={styles.suggestionActions}>
                                <kbd>Tab</kbd> Accept <kbd>Esc</kbd> Ignore
                            </div>
                        </div>
                    </div>
                </div>

                {/* Console / Terminal Area */}
                <div className={styles.bottomArea}>
                    <div className={styles.terminalHeader}>
                        <div className={styles.terminalTabs}>
                            <div className={`${styles.terminalTab} ${styles.active}`}>TERMINAL</div>
                            <div className={styles.terminalTab}>OUTPUT</div>
                            <div className={styles.terminalTab}>DEBUG CONSOLE</div>
                        </div>
                        <div className={styles.terminalActions}>
                            {/* Add the action buttons that should go in the terminal header */}
                            <button className={styles.terminalActionBtn} title="Clear Terminal"><X size={14} /></button>
                            <button className={styles.terminalActionBtn} title="Maximize Panel"><ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} /></button>
                            <button className={styles.terminalActionBtn} title="Close Panel"><X size={14} /></button>
                        </div>
                    </div>
                    <div className={styles.terminal}>
                        <div className={styles.terminalLine}>
                            <span className={styles.prompt}>$</span> pnpm dev
                        </div>
                        <div className={styles.terminalLine}>
                            VITE v6.0.0  ready in 120 ms
                        </div>
                        <div className={styles.terminalLine}>
                            ➜  Local:   http://localhost:5173/
                        </div>
                    </div>
                </div>
            </main>

            {/* Right AI Chat Panel */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        exit={{ x: 300 }}
                        className={styles.aiChat}
                    >
                        <div className={styles.panelHeader}>
                            AI CHAT
                            {ollamaStatus !== 'loading' && (
                                <span className={ollamaStatus === 'running' ? styles.ollamaOnline : styles.ollamaOffline}>
                                    {ollamaStatus === 'running' ? '● Ollama' : '○ Ollama offline'}
                                </span>
                            )}
                            <button onClick={() => setIsChatOpen(false)}><X size={14} /></button>
                        </div>
                        <div className={styles.chatHistory}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={msg.role === 'user' ? styles.userMessage : styles.chatMessage}>
                                    {msg.role === 'ai' && <div className={styles.aiAvatar}><Sparkles size={12} /></div>}
                                    <div className={styles.messageContent}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isSending && (
                                <div className={styles.typingIndicator}>
                                    <div className={styles.dot}></div>
                                    <div className={styles.dot}></div>
                                    <div className={styles.dot}></div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className={styles.chatInputWrapper}>
                            <textarea
                                placeholder="Ask AI anything..."
                                className={styles.chatInput}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <button
                                className={`${styles.chatSendBtn} ${isSending ? styles.processing : ''}`}
                                onClick={isSending ? () => setIsSending(false) : handleSend}
                                disabled={!chatInput.trim() && !isSending}
                            >
                                {isSending ? <Square size={16} fill="currentColor" /> : <ArrowUp size={18} />}
                            </button>
                            <div className={styles.modelSelectorStrip}>
                                {availableModels.length > 0 ? availableModels.map(model => (
                                    <div
                                        key={model}
                                        className={`${styles.modelBadge} ${activeModel === model ? styles.active : ''}`}
                                        onClick={() => setActiveModel(model)}
                                        title={model}
                                    >
                                        {model.split(':')[0]}
                                    </div>
                                )) : (
                                    <div className={styles.modelBadge} style={{ opacity: 0.5 }}>
                                        {ollamaStatus === 'loading' ? 'Loading...' : 'No models — run: ollama pull gemma3'}
                                    </div>
                                )}
                            </div>
                            <div className={styles.chatInputFooter}>
                                <span>{activeModel}</span>
                                <div className={styles.chatInputActions}>
                                    <div className={styles.kbd}>⌘ L</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Bar */}
            <footer className={styles.statusBar}>
                <div className={styles.statusLeft}>
                    <div className={styles.statusItem}>
                        <div className={`${styles.statusGlow} ${styles.connected}`}></div>
                        <GitBranch size={12} /> main*
                    </div>
                    <div className={styles.statusItem}><Sparkles size={12} /> Model: {activeModel}</div>
                </div>
                <div className={styles.statusRight}>
                    <div className={styles.statusItem}><Monitor size={12} /> UTF-8</div>
                    <div className={styles.statusItem}><Cpu size={12} /> index.css</div>
                    <div className={styles.statusItem}>Ln 12, Col 4</div>
                </div>
            </footer>

            <AnimatePresence>
                {isSettingsOpen && (
                    <SettingsPage onClose={() => setIsSettingsOpen(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAIBarOpen && (
                    <div className={styles.aiBarOverlay} onClick={() => setIsAIBarOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={styles.aiBar}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                autoFocus
                                placeholder="What would you like to do?"
                                className={styles.aiBarInput}
                            />
                            <div className={styles.aiBarFooter}>
                                <span>Press <kbd className={styles.kbd}>Enter</kbd> to submit</span>
                                <span><Sparkles size={12} style={{ marginRight: 4 }} /> Smart Action</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
