import React, { useState } from 'react';
import styled from '@emotion/styled';
import { 
  IconButton, 
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
  Button 
} from '@mui/material';
import { 
  DarkMode, 
  LightMode, 
  LocationOn, 
  Public, 
  MyLocation, 
  Business 
} from '@mui/icons-material';

interface HomePageProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const PageContainer = styled.div<{ darkMode: boolean }>`
  min-height: 100vh;
  background-color: ${props => props.darkMode ? '#121212' : '#f5f5f5'};
  color: ${props => props.darkMode ? '#ffffff' : '#000000'};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
`;

const Header = styled.header<{ darkMode: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: ${props => props.darkMode ? '#2a2a2a' : '#f8f9fa'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const VanImage = styled.img`
  height: 35px;
  width: auto;
  border-radius: 8px;
`;

const SiteTitle = styled.h1<{ darkMode: boolean }>`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.darkMode ? '#ffffff' : '#333333'};
`;

const DarkModeToggle = styled(IconButton)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, #4a5de8 0%, #6b73ff 100%);
  padding: 4rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
  max-width: 95%;
  margin: 0 auto;
  border-radius: 16px;
  margin-top: 2rem;
  margin-bottom: 2rem;
`;

const HeroContent = styled.div`
  flex: 1;
  max-width: 1000px;
  padding-left: 2rem;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin: 0 0 1rem 0;
  line-height: 1.1;
  white-space: nowrap;
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.5;
  white-space: nowrap;
`;

const HeroImageContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 0.5rem;
  flex-shrink: 0;
  margin-right: 1rem;
`;

const CamperVanImage = styled.img`
  width: 450px;
  height: auto;
  display: block;
`;

const WelcomeSection = styled.section<{ darkMode: boolean }>`
  background: linear-gradient(135deg, #4a5de8 0%, #6b73ff 100%);
  padding: 4rem 2rem;
  text-align: center;
  max-width: 95%;
  margin: 2rem auto;
  border-radius: 16px;
`;

const WelcomeTitle = styled.h3<{ darkMode: boolean }>`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: white;
`;

const WelcomeText = styled.p<{ darkMode: boolean }>`
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto 2rem auto;
  color: rgba(255, 255, 255, 0.9);
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
  margin-top: 2rem;
`;

// US States list
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const HomePage: React.FC<HomePageProps> = ({ darkMode, toggleDarkMode }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [stateValue, setStateValue] = useState('');
  const [zipValue, setZipValue] = useState('');
  const [builderValue, setBuilderValue] = useState('');

  const handleSearch = () => {
    if (activeTab === 0 && stateValue) {
      console.log('Searching by state:', stateValue);
    } else if (activeTab === 1 && zipValue) {
      console.log('Searching by zip:', zipValue);
    } else if (activeTab === 2 && builderValue) {
      console.log('Searching by builder:', builderValue);
    }
  };

  return (
    <PageContainer darkMode={darkMode}>
      <DarkModeToggle onClick={toggleDarkMode} color="inherit">
        {darkMode ? <LightMode /> : <DarkMode />}
      </DarkModeToggle>

      <Header darkMode={darkMode}>
        <Logo>
          <VanImage src="/camper-van-original.jpg" alt="Camper Van Illustration" />
          <SiteTitle darkMode={darkMode}>Camper Van Builders</SiteTitle>
        </Logo>
      </Header>

      <HeroSection>
        <HeroContent>
          <HeroTitle>
            Find Your Perfect Camper Van Builder
          </HeroTitle>
          <HeroSubtitle>
            Discover top-rated van conversion specialists across the United States
          </HeroSubtitle>
        </HeroContent>
        <HeroImageContainer>
          <CamperVanImage src="/camper-van-original.jpg" alt="Camper Van Illustration" />
        </HeroImageContainer>
      </HeroSection>

      <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mb: 4, mt: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center',
              color: '#5b9bd5',
              fontWeight: 600,
              justifyContent: 'center'
            }}
          >
            <Public sx={{ mr: 1, color: '#5b9bd5' }} /> Find Camper Van Builders
          </Typography>
          
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 1,
                color: darkMode ? '#ffffff' : '#ffffff',
                '&.Mui-selected': {
                  color: '#5b9bd5',
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                backgroundColor: '#5b9bd5',
              }
            }}
          >
            <Tab 
              label="By State" 
              icon={<Public />} 
              iconPosition="start"
            />
            <Tab 
              label="By Zip Code" 
              icon={<MyLocation />} 
              iconPosition="start"
            />
            <Tab 
              label="By Builder Name" 
              icon={<Business />} 
              iconPosition="start"
            />
          </Tabs>
          
          {activeTab === 0 && (
            <FormControl fullWidth variant="outlined" sx={{
              '& .MuiInputLabel-root': {
                color: darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.6)',
                '&.Mui-focused': {
                  color: darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.6)',
                },
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: '#5b9bd5',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5b9bd5',
                },
              },
            }}>
              <InputLabel id="state-select-label">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 20, color: '#5b9bd5' }} />
                  Select a State
                </Box>
              </InputLabel>
              <Select
                labelId="state-select-label"
                id="state-select"
                value={stateValue}
                label="Select a State"
                onChange={(e) => setStateValue(e.target.value)}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#5b9bd5',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#5b9bd5',
                    },
                  }
                }}
              >
                <MenuItem value="">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ fontSize: 20, color: '#5b9bd5' }} />
                    Select a State
                  </Box>
                </MenuItem>
                {US_STATES.map(state => (
                  <MenuItem key={state} value={state}>{state}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {activeTab === 1 && (
            <TextField
              fullWidth
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MyLocation sx={{ fontSize: 20, color: '#5b9bd5' }} />
                  Enter 5-digit zip code
                </Box>
              }
              variant="outlined"
              value={zipValue}
              onChange={(e) => setZipValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              inputProps={{ maxLength: 5 }}
              sx={{
                '& .MuiInputLabel-root': {
                  color: darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.6)',
                  },
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5b9bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5b9bd5',
                  },
                }
              }}
            />
          )}
          
          {activeTab === 2 && (
            <TextField
              fullWidth
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business sx={{ fontSize: 20, color: '#5b9bd5' }} />
                  Enter builder name
                </Box>
              }
              variant="outlined"
              value={builderValue}
              onChange={(e) => setBuilderValue(e.target.value)}
              sx={{
                '& .MuiInputLabel-root': {
                  color: darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.6)',
                  },
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5b9bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5b9bd5',
                  },
                }
              }}
            />
          )}
        </Paper>
      </Box>

      <WelcomeSection darkMode={darkMode}>
        <WelcomeTitle darkMode={darkMode}>Welcome to the Camper Van Builders Directory</WelcomeTitle>
        <WelcomeText darkMode={darkMode}>
          We're here to help you find the perfect partner for your van conversion journey. Whether you're 
          dreaming of weekend adventures or full-time van life, our directory connects you with 
          experienced builders who can bring your vision to life.
        </WelcomeText>
        
        <StatsContainer>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
              14
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Builders Listed
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
              50
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              States Covered
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
              100%
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Free to Use
            </Typography>
          </Box>
        </StatsContainer>
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 4,
            color: 'rgba(255, 255, 255, 0.8)',
            fontStyle: 'italic'
          }}
        >
          🚐 Start your journey today - Select a state, zip code, or builder name above to explore builders in your area
        </Typography>
      </WelcomeSection>
    </PageContainer>
  );
};

export default HomePage;
