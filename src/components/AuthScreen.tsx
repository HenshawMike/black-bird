import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Github } from 'lucide-react';
import styles from './AuthScreen.module.css';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
    onLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error(`Error logging in with ${provider}:`, error.message);
        } else {
            // In a real app, the page will redirect. 
            // For now, we simulate success for the UI flow.
            onLogin();
        }
    };

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <Card className={styles.authCard} glass>
                    <div className={styles.logoSection}>
                        <div className={styles.logo}>
                            <div className={styles.birdIcon}></div>
                        </div>
                        <h1 className={styles.title}>BLACK BIRD</h1>
                        <p className={styles.subtitle}>Powered by your local models</p>
                    </div>

                    <div className={styles.socialButtons}>
                        <Button variant="secondary" className={styles.socialBtn} onClick={() => handleSocialLogin('google')}>
                            <img src="https://www.google.com/favicon.ico" alt="Google" className={styles.icon} />
                            Continue with Google
                        </Button>
                        <Button variant="secondary" className={styles.socialBtn} onClick={() => handleSocialLogin('github')}>
                            <Github size={18} />
                            Continue with GitHub
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};
