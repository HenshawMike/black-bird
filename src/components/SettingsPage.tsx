import React, { useState } from 'react';
import { Button } from './ui/Button';
import { X, ChevronDown, Monitor, Moon, Sun, FolderOpen } from 'lucide-react';
import styles from './SettingsPage.module.css';
import { motion } from 'framer-motion';

interface SettingsPageProps {
    onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
    const [temperature, setTemperature] = useState(0.7);
    const [context, setContext] = useState(4096);
    const [theme, setTheme] = useState('dark');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={styles.modal}
            >
                <div className={styles.header}>
                    <h2>Settings</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>

                <div className={styles.content}>
                    <section className={styles.section}>
                        <h3>Model Configuration</h3>
                        <div className={styles.field}>
                            <label>Default Model</label>
                            <div className={styles.selectWrapper}>
                                <select className={styles.select}>
                                    <option>GEMINI3 1B (Local)</option>
                                    <option>GPT-4o (Omni)</option>
                                    <option>Claude 3.5 Sonnet</option>
                                    <option>Gemini 1.5 Pro</option>
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.labelRow}>
                                <label>Temperature</label>
                                <span>{temperature}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className={styles.slider}
                            />
                            <p className={styles.hint}>Higher values make the output more creative.</p>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.labelRow}>
                                <label>Context Limit</label>
                                <span>{context} tokens</span>
                            </div>
                            <input
                                type="range"
                                min="1024"
                                max="32768"
                                step="1024"
                                value={context}
                                onChange={(e) => setContext(parseInt(e.target.value))}
                                className={styles.slider}
                            />
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h3>Appearance</h3>
                        <div className={styles.themeToggle}>
                            <button
                                className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
                                onClick={() => setTheme('dark')}
                            >
                                <Moon size={16} /> Dark
                            </button>
                            <button
                                className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
                                onClick={() => setTheme('light')}
                            >
                                <Sun size={16} /> Light
                            </button>
                            <button
                                className={`${styles.themeBtn} ${theme === 'system' ? styles.active : ''}`}
                                onClick={() => setTheme('system')}
                            >
                                <Monitor size={16} /> System
                            </button>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h3>Project</h3>
                        <div className={styles.field}>
                            <label>Local Path Configuration</label>
                            <div className={styles.pathInput}>
                                <input type="text" readOnly value="C:\Users\computer\black-bird" />
                                <Button variant="secondary" size="sm">
                                    <FolderOpen size={16} />
                                    Browse
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>

                <div className={styles.footer}>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={onClose}>Save Changes</Button>
                </div>
            </motion.div>
        </motion.div>
    );
};
