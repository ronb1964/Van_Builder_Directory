import React from 'react';
import styled from '@emotion/styled';
import { Container } from '@mui/material';
import SearchBox from './SearchBox';
import WelcomeSection from './WelcomeSection';

interface HomePageProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  onSearch: (searchType: 'state' | 'zip' | 'builder', searchValue: string) => void;
  builderCount: number;
}

const PageContainer = styled.div<{ darkMode: boolean }>`
  min-height: 100vh;
  background-color: ${props => props.darkMode ? '#121212' : '#faf9f7'};
  color: ${props => props.darkMode ? '#ffffff' : '#000000'};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
`;

const HeroSection = styled.section`
  padding: 4rem 2rem;
  text-align: center;
  position: relative;
`;

const HeroContainer = styled.div`
  background: linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%);
  border-radius: 8px;
  padding: 4rem 2rem;
  position: relative;
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const HeroText = styled.div`
  h1 {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: white;
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }
  
  p {
    font-size: 1.3rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    margin-bottom: 2rem;
  }
`;

const HeroImage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
    }
  }
`;

const HomePage: React.FC<HomePageProps> = ({ darkMode, toggleDarkMode, onSearch, builderCount }) => {
  return (
    <PageContainer darkMode={darkMode}>
      <HeroSection>
        <HeroContainer>
          <HeroContent>
            <HeroText>
              <h1>Find Your Perfect Van Builder</h1>
              <p>
                Discover experienced van conversion specialists across the United States. 
                From weekend warriors to full-time nomads, we connect you with builders 
                who can transform your van dreams into reality.
              </p>
            </HeroText>
            <HeroImage>
              <img 
                src="./images/camper-van-original.jpg" 
                alt="Custom Camper Van" 
              />
            </HeroImage>
          </HeroContent>
        </HeroContainer>
      </HeroSection>

      <SearchBox onSearch={onSearch} />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <WelcomeSection builderCount={builderCount} />
      </Container>
    </PageContainer>
  );
};

export default HomePage;
