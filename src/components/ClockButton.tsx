
import './ClockButton.css';

interface ClockButtonProps {
  label: string;
  onPress: () => Promise<void>;
  variant: 'clockIn' | 'clockOut' | 'startBreak' | 'endBreak';
  disabled?: boolean;
}

export function ClockButton({ label, onPress, variant, disabled }: ClockButtonProps) {
  const handleClick = () => {
    // Vibrate haptics simulation on web
    if (navigator.vibrate) {
      if (variant === 'clockIn' || variant === 'clockOut') {
        navigator.vibrate([40, 30, 40]); // Medium impact
      } else {
        navigator.vibrate(20); // Light impact
      }
    }
    onPress();
  };

  return (
    <button 
      className={`clock-button clock-button-${variant} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
    >
      {label}
    </button>
  );
}
