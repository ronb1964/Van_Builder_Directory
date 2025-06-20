import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  SelectChangeEvent, 
  Typography,
  Divider,
  ListSubheader,
  Paper,
  InputBase,
  styled,
  alpha,
  Chip,
  TextField,
  Button,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import BusinessIcon from '@mui/icons-material/Business';

interface StateSelectorProps {
  onSelectState: (state: string) => void;
  onSelectZipCode?: (zipCode: string) => void;
  onSelectBuilderName?: (builderName: string) => void;
  selectedState?: string;
  selectedBuilderName?: string;
  selectedZipCode?: string;
}

interface StateInfo {
  name: string;
  abbreviation: string;
  region: string;
}

// Group states by region for better organization
const US_STATES: StateInfo[] = [
  // Northeast
  { name: 'Connecticut', abbreviation: 'CT', region: 'Northeast' },
  { name: 'Maine', abbreviation: 'ME', region: 'Northeast' },
  { name: 'Massachusetts', abbreviation: 'MA', region: 'Northeast' },
  { name: 'New Hampshire', abbreviation: 'NH', region: 'Northeast' },
  { name: 'New Jersey', abbreviation: 'NJ', region: 'Northeast' },
  { name: 'New York', abbreviation: 'NY', region: 'Northeast' },
  { name: 'Pennsylvania', abbreviation: 'PA', region: 'Northeast' },
  { name: 'Rhode Island', abbreviation: 'RI', region: 'Northeast' },
  { name: 'Vermont', abbreviation: 'VT', region: 'Northeast' },
  
  // Midwest
  { name: 'Illinois', abbreviation: 'IL', region: 'Midwest' },
  { name: 'Indiana', abbreviation: 'IN', region: 'Midwest' },
  { name: 'Iowa', abbreviation: 'IA', region: 'Midwest' },
  { name: 'Kansas', abbreviation: 'KS', region: 'Midwest' },
  { name: 'Michigan', abbreviation: 'MI', region: 'Midwest' },
  { name: 'Minnesota', abbreviation: 'MN', region: 'Midwest' },
  { name: 'Missouri', abbreviation: 'MO', region: 'Midwest' },
  { name: 'Nebraska', abbreviation: 'NE', region: 'Midwest' },
  { name: 'North Dakota', abbreviation: 'ND', region: 'Midwest' },
  { name: 'Ohio', abbreviation: 'OH', region: 'Midwest' },
  { name: 'South Dakota', abbreviation: 'SD', region: 'Midwest' },
  { name: 'Wisconsin', abbreviation: 'WI', region: 'Midwest' },
  
  // South
  { name: 'Alabama', abbreviation: 'AL', region: 'South' },
  { name: 'Arkansas', abbreviation: 'AR', region: 'South' },
  { name: 'Delaware', abbreviation: 'DE', region: 'South' },
  { name: 'Florida', abbreviation: 'FL', region: 'South' },
  { name: 'Georgia', abbreviation: 'GA', region: 'South' },
  { name: 'Kentucky', abbreviation: 'KY', region: 'South' },
  { name: 'Louisiana', abbreviation: 'LA', region: 'South' },
  { name: 'Maryland', abbreviation: 'MD', region: 'South' },
  { name: 'Mississippi', abbreviation: 'MS', region: 'South' },
  { name: 'North Carolina', abbreviation: 'NC', region: 'South' },
  { name: 'Oklahoma', abbreviation: 'OK', region: 'South' },
  { name: 'South Carolina', abbreviation: 'SC', region: 'South' },
  { name: 'Tennessee', abbreviation: 'TN', region: 'South' },
  { name: 'Texas', abbreviation: 'TX', region: 'South' },
  { name: 'Virginia', abbreviation: 'VA', region: 'South' },
  { name: 'West Virginia', abbreviation: 'WV', region: 'South' },
  
  // West
  { name: 'Alaska', abbreviation: 'AK', region: 'West' },
  { name: 'Arizona', abbreviation: 'AZ', region: 'West' },
  { name: 'California', abbreviation: 'CA', region: 'West' },
  { name: 'Colorado', abbreviation: 'CO', region: 'West' },
  { name: 'Hawaii', abbreviation: 'HI', region: 'West' },
  { name: 'Idaho', abbreviation: 'ID', region: 'West' },
  { name: 'Montana', abbreviation: 'MT', region: 'West' },
  { name: 'Nevada', abbreviation: 'NV', region: 'West' },
  { name: 'New Mexico', abbreviation: 'NM', region: 'West' },
  { name: 'Oregon', abbreviation: 'OR', region: 'West' },
  { name: 'Utah', abbreviation: 'UT', region: 'West' },
  { name: 'Washington', abbreviation: 'WA', region: 'West' },
  { name: 'Wyoming', abbreviation: 'WY', region: 'West' },
];

// Sort states alphabetically
const sortedStates = [...US_STATES].sort((a, b) => a.name.localeCompare(b.name));

// Custom styled components
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.3s ease',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    },
    '&.Mui-focused': {
      boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  '& .MuiSelect-select': {
    padding: '14px 16px',
  },
}));

const StateFlag = styled('div')(({ theme }) => ({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1.5),
  color: theme.palette.primary.main,
  fontSize: '0.75rem',
  fontWeight: 'bold',
}));

const RegionHeader = styled(ListSubheader)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  color: theme.palette.primary.main,
  fontWeight: 600,
  lineHeight: '36px',
  display: 'flex',
  alignItems: 'center',
  borderRadius: 8,
  margin: '4px 0',
}));

const StateMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: '10px 16px',
  borderRadius: 8,
  margin: '2px 0',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.16),
    },
  },
}));

const StateSelector: React.FC<StateSelectorProps> = ({ onSelectState, onSelectZipCode, onSelectBuilderName, selectedState, selectedBuilderName, selectedZipCode }) => {
  const [state, setState] = useState(selectedState || '');
  const [zipCode, setZipCode] = useState(selectedZipCode || '');
  const [searchMethod, setSearchMethod] = useState(0); // 0 = state, 1 = zip code, 2 = builder name
  const [builderName, setBuilderName] = useState(selectedBuilderName || '');
  const zipCodeInputRef = React.useRef<HTMLInputElement>(null);
  const builderNameInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleZipCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input up to 5 digits
    const value = event.target.value.replace(/[^0-9]/g, '').slice(0, 5);
    setZipCode(value);
  };
  
  const handleZipCodeSearch = () => {
    if (zipCode.length === 5 && onSelectZipCode) {
      onSelectZipCode(zipCode);
    }
  };
  
  const handleZipCodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && zipCode.length === 5 && onSelectZipCode) {
      event.preventDefault();
      onSelectZipCode(zipCode);
    }
  };
  
  const handleBuilderNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBuilderName(event.target.value);
  };
  
  const handleBuilderNameSearch = () => {
    if (builderName && onSelectBuilderName) {
      onSelectBuilderName(builderName);
    }
  };
  
  const handleBuilderNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && builderName && onSelectBuilderName) {
      event.preventDefault();
      onSelectBuilderName(builderName);
    }
  };
  
  const handleSearchMethodChange = (event: React.SyntheticEvent, newValue: number) => {
    setSearchMethod(newValue);
    
    // Clear previous selections when switching methods
    if (newValue === 0) {
      setZipCode('');
      setBuilderName('');
      if (onSelectZipCode) {
        onSelectZipCode('');
      }
      if (onSelectBuilderName) {
        onSelectBuilderName('');
      }
    } else if (newValue === 1) {
      setState('');
      onSelectState('');
      setBuilderName('');
      if (onSelectBuilderName) {
        onSelectBuilderName('');
      }
    } else {
      setState('');
      onSelectState('');
      setZipCode('');
      if (onSelectZipCode) {
        onSelectZipCode('');
      }
    }
    
    // Focus the input field when switching to zip code or builder name tab
    setTimeout(() => {
      if (newValue === 1 && zipCodeInputRef.current) {
        zipCodeInputRef.current.focus();
      } else if (newValue === 2 && builderNameInputRef.current) {
        builderNameInputRef.current.focus();
      }
    }, 100);
  };

  const handleChange = (event: SelectChangeEvent) => {
    const selectedState = event.target.value as string;
    setState(selectedState);
    onSelectState(selectedState);
  };

  // Sync internal state with props when they change
  useEffect(() => {
    setState(selectedState || '');
  }, [selectedState]);

  useEffect(() => {
    setBuilderName(selectedBuilderName || '');
  }, [selectedBuilderName]);

  useEffect(() => {
    setZipCode(selectedZipCode || '');
  }, [selectedZipCode]);

  return (
    <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', mb: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 3, 
          backgroundColor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)'
          },
        }}
      >
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: 'primary.main',
            fontWeight: 600
          }}
        >
          <PublicIcon sx={{ mr: 1 }} /> Find Camper Van Builders
        </Typography>
        
        <Tabs 
          value={searchMethod} 
          onChange={handleSearchMethodChange}
          variant="fullWidth"
          sx={{ 
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          <Tab 
            label="By State" 
            icon={<PublicIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="By Zip Code" 
            icon={<MyLocationIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="By Builder Name" 
            icon={<BusinessIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        {searchMethod === 0 ? (
          <>
            <StyledFormControl fullWidth variant="outlined">
              <InputLabel id="state-select-label">Select a State</InputLabel>
              <Select
                labelId="state-select-label"
                id="state-select"
                value={state}
                label="Select a State"
                onChange={handleChange}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 450,
                      borderRadius: 12,
                      padding: '8px',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                    },
                  },
                }}
                startAdornment={state ? (
                  <LocationOnIcon color="primary" sx={{ mr: 1, opacity: 0.7 }} />
                ) : (
                  <LocationOnIcon color="primary" sx={{ mr: 1, opacity: 0.7 }} />
                )}
                renderValue={(selected) => {
                  const selectedState = US_STATES.find(s => s.name === selected);
                  if (!selectedState) return null;
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <StateFlag>{selectedState.abbreviation}</StateFlag>
                      <Typography variant="body1">{selectedState.name}</Typography>
                    </Box>
                  );
                }}
              >
                {sortedStates.map((state) => (
                  <StateMenuItem key={state.name} value={state.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <StateFlag>{state.abbreviation}</StateFlag>
                      <Typography variant="body1">{state.name}</Typography>
                    </Box>
                  </StateMenuItem>
                ))}
              </Select>
            </StyledFormControl>
            
            {state && (
              <Chip 
                label={`Selected: ${state}`}
                color="primary"
                variant="outlined"
                onDelete={() => {
                  setState('');
                  onSelectState('');
                }}
                sx={{ mt: 2, borderRadius: 8, py: 0.5 }}
              />
            )}
          </>
        ) : searchMethod === 1 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Enter Zip Code"
              variant="outlined"
              value={zipCode}
              onChange={handleZipCodeChange}
              onKeyDown={handleZipCodeKeyDown}
              placeholder="e.g. 90210"
              inputRef={zipCodeInputRef}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MyLocationIcon color="primary" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  },
                }
              }}
              helperText={zipCode.length > 0 && zipCode.length < 5 ? "Please enter a 5-digit zip code" : "Press Enter or click Search"}
              error={zipCode.length > 0 && zipCode.length < 5}
            />
            
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={handleZipCodeSearch}
              disabled={!zipCode}
              sx={{ 
                py: 1.5, 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              Search by Zip Code
            </Button>
            
            {zipCode && onSelectZipCode && (
              <Chip 
                label={`Searching: ${zipCode}`}
                color="primary"
                variant="outlined"
                onDelete={() => {
                  setZipCode('');
                  if (onSelectZipCode) {
                    onSelectZipCode('');
                  }
                }}
                sx={{ mt: 1, borderRadius: 8, py: 0.5, alignSelf: 'flex-start' }}
              />
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Enter Builder Name"
              variant="outlined"
              value={builderName}
              onChange={handleBuilderNameChange}
              onKeyDown={handleBuilderNameKeyDown}
              placeholder="e.g. Builder Name"
              inputRef={builderNameInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="primary" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  },
                }
              }}
              helperText="Press Enter or click Search"
            />
            
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={handleBuilderNameSearch}
              disabled={!builderName}
              sx={{ 
                py: 1.5, 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              Search by Builder Name
            </Button>
            
            {builderName && onSelectBuilderName && (
              <Chip 
                label={`Searching: ${builderName}`}
                color="primary"
                variant="outlined"
                onDelete={() => {
                  setBuilderName('');
                  if (onSelectBuilderName) {
                    onSelectBuilderName('');
                  }
                }}
                sx={{ mt: 1, borderRadius: 8, py: 0.5, alignSelf: 'flex-start' }}
              />
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default StateSelector;
