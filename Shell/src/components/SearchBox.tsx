import React, { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { 
  Box, 
  Tabs, 
  Tab, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Paper, 
  Typography, 
  Button,
  ThemeProvider,
  createTheme,
  InputAdornment,
} from '@mui/material';
import { 
  Public, 
  MyLocation, 
  Business,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { statesByRegion } from '../constants/states';

interface SearchBoxProps {
  onSearch: (searchType: 'state' | 'zip' | 'builder', searchValue: string) => void;
}

const SearchSection = styled.section`
  padding: 0 2rem 2rem 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const SearchContainer = styled(Paper)`
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  background: #2a2a2a !important;
  color: white !important;
`;

const SearchTitle = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: white !important;
  font-size: 2rem;
`;

const TabContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const SearchFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const StateFlag = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(91, 155, 213, 0.2);
  color: #5b9bd5;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
`;

const StateMenuItem = styled(MenuItem)`
  background-color: #2a2a2a !important;
  color: white !important;
  &:hover {
    background-color: rgba(91, 155, 213, 0.1) !important;
  }
`;

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [stateValue, setStateValue] = useState('');
  const [zipValue, setZipValue] = useState('');
  const [builderValue, setBuilderValue] = useState('');
  
  const zipInputRef = useRef<HTMLInputElement>(null);
  const builderInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Auto-focus the zip input when "By Zip Code" tab is selected
    if (newValue === 1) {
      setTimeout(() => {
        zipInputRef.current?.focus();
      }, 100); // Small delay to ensure the input is rendered
    }
    
    // Auto-focus the builder input when "By Builder Name" tab is selected
    if (newValue === 2) {
      setTimeout(() => {
        builderInputRef.current?.focus();
      }, 100); // Small delay to ensure the input is rendered
    }
  };

  const handleStateChange = (event: any) => {
    const selectedState = event.target.value;
    setStateValue(selectedState);
    // Automatically trigger search when state is selected (like original site)
    if (selectedState) {
      onSearch('state', selectedState);
    }
  };

  const handleZipSearch = () => {
    if (zipValue && zipValue.length === 5) {
      onSearch('zip', zipValue);
    }
  };

  const handleZipKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleZipSearch();
    }
  };

  const handleBuilderSearch = () => {
    if (builderValue.trim()) {
      onSearch('builder', builderValue.trim());
    }
  };

  const handleBuilderKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleBuilderSearch();
    }
  };

  return (
    <SearchSection>
      <SearchContainer>
        <SearchTitle>Search Van Builders</SearchTitle>
        
        <TabContainer>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7) !important',
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#5b9bd5 !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#5b9bd5 !important',
              },
            }}
          >
            <Tab 
              icon={<Public sx={{ color: 'inherit' }} />} 
              label="By State" 
              iconPosition="start"
            />
            <Tab 
              icon={<MyLocation sx={{ color: 'inherit' }} />} 
              label="By Zip Code" 
              iconPosition="start"
            />
            <Tab 
              icon={<Business sx={{ color: 'inherit' }} />} 
              label="By Builder Name" 
              iconPosition="start"
            />
          </Tabs>
        </TabContainer>

        <SearchFormContainer>
          {activeTab === 0 && (
            <ThemeProvider theme={createTheme({
              palette: {
                primary: {
                  main: '#5b9bd5',
                },
                text: {
                  primary: 'rgba(255,255,255,0.7)',
                  secondary: 'rgba(255,255,255,0.7)',
                },
              },
              components: {
                MuiOutlinedInput: {
                  styleOverrides: {
                    root: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.7)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#5b9bd5',
                        borderWidth: '2px',
                      },
                    },
                  },
                },
                MuiSelect: {
                  styleOverrides: {
                    icon: {
                      color: 'rgba(255,255,255,0.7)',
                    },
                  },
                },
              },
            })}>
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  color: 'rgba(255,255,255,0.7) !important',
                  '&.Mui-focused': {
                    color: '#5b9bd5 !important'
                  }
                }}>Select a State</InputLabel>
                <Select
                  value={stateValue}
                  label="Select a State"
                  onChange={handleStateChange}
                  startAdornment={<LocationOnIcon sx={{ color: '#5b9bd5', mr: 1, opacity: 0.7 }} />}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 450, // Scrollable height like original
                        borderRadius: 12,
                        padding: '8px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                        backgroundColor: '#2a2a2a',
                      },
                    },
                  }}
                  renderValue={(selected) => {
                    const selectedState = Object.values(statesByRegion).flat().find(s => s.name === selected);
                    if (!selectedState) return selected;
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <StateFlag>{selectedState.abbreviation}</StateFlag>
                        <Typography variant="body1" sx={{ color: 'white' }}>{selectedState.name}</Typography>
                      </Box>
                    );
                  }}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#2a2a2a !important',
                    color: 'white !important',
                  }}
                >
                  {Object.values(statesByRegion)
                    .flat()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((state) => (
                      <StateMenuItem key={state.name} value={state.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <StateFlag>{state.abbreviation}</StateFlag>
                          <Typography variant="body1" sx={{ color: 'white' }}>{state.name}</Typography>
                        </Box>
                      </StateMenuItem>
                    ))}
                </Select>
              </FormControl>
            </ThemeProvider>
          )}

          {activeTab === 1 && (
            <ThemeProvider theme={createTheme({
              palette: {
                primary: {
                  main: '#5b9bd5',
                },
                text: {
                  primary: 'rgba(255,255,255,0.87)',
                  secondary: 'rgba(255,255,255,0.6)',
                },
              },
              components: {
                MuiOutlinedInput: {
                  styleOverrides: {
                    root: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.7)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#5b9bd5',
                        borderWidth: '2px',
                      },
                    },
                  },
                },
              },
            })}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Enter Zip Code"
                  variant="outlined"
                  value={zipValue}
                  onChange={(e) => setZipValue(e.target.value)}
                  onKeyDown={handleZipKeyDown}
                  inputRef={zipInputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon sx={{ color: 'rgba(91, 155, 213, 0.7)' }} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    maxLength: 5,
                    pattern: '[0-9]*',
                    inputMode: 'numeric'
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#2a2a2a !important',
                      color: 'white !important',
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7) !important',
                      '&.Mui-focused': {
                        color: '#5b9bd5 !important'
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'rgba(255,255,255,0.6) !important',
                    },
                  }}
                  helperText="Enter a 5-digit zip code"
                />
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleZipSearch}
                  disabled={!zipValue || zipValue.length !== 5}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: '#5b9bd5',
                    borderColor: '#5b9bd5',
                    backgroundColor: 'rgba(91, 155, 213, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(91, 155, 213, 0.1)',
                      borderColor: '#4a8bc2',
                      color: '#4a8bc2',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(91, 155, 213, 0.3)',
                    },
                    '&:disabled': {
                      color: 'rgba(255,255,255,0.3)',
                      borderColor: 'rgba(255,255,255,0.2)',
                      backgroundColor: 'transparent',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Search by Zip Code
                </Button>
              </Box>
            </ThemeProvider>
          )}

          {activeTab === 2 && (
            <ThemeProvider theme={createTheme({
              palette: {
                primary: {
                  main: '#5b9bd5',
                },
                text: {
                  primary: 'rgba(255,255,255,0.87)',
                  secondary: 'rgba(255,255,255,0.6)',
                },
              },
              components: {
                MuiOutlinedInput: {
                  styleOverrides: {
                    root: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.7)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#5b9bd5',
                        borderWidth: '2px',
                      },
                    },
                  },
                },
              },
            })}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Enter Builder Name"
                  variant="outlined"
                  value={builderValue}
                  onChange={(e) => setBuilderValue(e.target.value)}
                  onKeyDown={handleBuilderKeyDown}
                  inputRef={builderInputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon sx={{ color: 'rgba(91, 155, 213, 0.7)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#2a2a2a !important',
                      color: 'white !important',
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7) !important',
                      '&.Mui-focused': {
                        color: '#5b9bd5 !important'
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'rgba(255,255,255,0.6) !important',
                    },
                  }}
                  helperText="Enter the name of a van builder"
                />
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleBuilderSearch}
                  disabled={!builderValue.trim()}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: '#5b9bd5',
                    borderColor: '#5b9bd5',
                    backgroundColor: 'rgba(91, 155, 213, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(91, 155, 213, 0.1)',
                      borderColor: '#4a8bc2',
                      color: '#4a8bc2',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(91, 155, 213, 0.3)',
                    },
                    '&:disabled': {
                      color: 'rgba(255,255,255,0.3)',
                      borderColor: 'rgba(255,255,255,0.2)',
                      backgroundColor: 'transparent',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Search by Builder Name
                </Button>
              </Box>
            </ThemeProvider>
          )}
        </SearchFormContainer>
      </SearchContainer>
    </SearchSection>
  );
};

export default SearchBox;
