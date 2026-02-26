import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glass = false }) => {
    return (
        <div className={`${styles.card} ${glass ? styles.glass : ''} ${className}`}>
            {children}
        </div>
    );
};
