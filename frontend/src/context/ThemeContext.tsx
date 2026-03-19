import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '@mui/material';
import { createTheme, ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';

type Mode = 'light' | 'dark';

interface ThemeContextType {
  mode: Mode;
  toggleMode: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('dark');

  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        ...(mode === 'light'
          ? {
              // Glassmorphism/Modern Light
              primary: { main: '#1A82E3' },
              background: {
                default: '#F5F7FA',
                paper: '#FFFFFF',
              },
              text: {
                primary: '#1A1C1E',
                secondary: '#6E7681',
              },
              divider: 'rgba(0, 0, 0, 0.08)',
            }
          : {
              // Deep Modern Dark
              primary: { main: '#3D9DF5' },
              background: {
                default: '#000000', // Pitch Black
                paper: '#111111', // Elevated Black
              },
              text: {
                primary: '#F0F2F5',
                secondary: '#8C8C91',
              },
              divider: 'rgba(255, 255, 255, 0.08)',
            }),
      },
      typography: {
        fontFamily: '"Fustat", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        button: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
      shape: {
        borderRadius: 6,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              transition: 'background-color 0.3s ease, color 0.3s ease',
              backgroundImage: mode === 'light' 
                ? 'radial-gradient(at 0% 0%, hsla(210,100%,95%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(250,50%,95%,1) 0, transparent 50%)' 
                : 'radial-gradient(at 0% 0%, hsla(210,100%,15%,.1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(250,50%,15%,.1) 0, transparent 50%)',
              backgroundAttachment: 'fixed',
            },
            '*::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '*::-webkit-scrollbar-thumb': {
              backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
              borderRadius: '4px',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(20px)',
              backgroundImage: 'none',
              boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.2)',
              borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'light' ? '#FFFFFF' : '#111111',
              backgroundImage: 'none',
              borderLeft: mode === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px ' + (mode === 'light' ? 'rgba(26, 130, 227, 0.2)' : 'rgba(61, 157, 245, 0.2)'),
              },
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundImage: 'none',
              backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 15, 15, 0.85)',
              backdropFilter: 'blur(24px)',
              boxShadow: mode === 'light' ? '0 24px 48px rgba(0,0,0,0.1)' : '0 24px 48px rgba(0,0,0,0.4)',
              border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
            }
          }
        }
      },
    });
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, theme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}
