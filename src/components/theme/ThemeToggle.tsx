import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 text-primary transition-colors hover:bg-primary/10 rounded-full"
      aria-label="Toggle theme"
    >
      <div className="relative h-5 w-5">
        <Sun className="absolute h-5 w-5 transition-all duration-300 dark:-rotate-90 dark:opacity-0 rotate-0 opacity-100" />
        <Moon className="absolute h-5 w-5 transition-all duration-300 dark:rotate-0 dark:opacity-100 rotate-90 opacity-0" />
      </div>
    </button>
  );
}
