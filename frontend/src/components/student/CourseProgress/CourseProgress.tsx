// frontend/src/components/student/CourseProgress/CourseProgress.tsx
import React from 'react';
import styles from './CourseProgress.module.scss';

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  showText = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.progressCircle} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className={styles.progressBackground}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={styles.progressBar}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showText && (
        <div className={styles.progressText}>
          <span className={styles.percentage}>{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressCircle; // Đổi tên export