import React from 'react';
import {
  Box,
  Button,
  IconButton,
  styled,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  X as XIcon,
} from '@mui/icons-material';

const ContactButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
  alignItems: 'center'
}));

const SocialMediaContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  flexWrap: 'wrap'
}));

const ModalFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    '& > *': {
      justifyContent: 'center'
    }
  }
}));

interface ModalContactSectionProps {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    x?: string;
  };
  onContactClick: (type: string, value: string) => void;
}

const ModalContactSection: React.FC<ModalContactSectionProps> = ({
  phone,
  email,
  website,
  socialMedia,
  onContactClick
}) => {
  const theme = useTheme();

  return (
    <ModalFooter>
      <ContactButtonsContainer>
        {(phone || (!phone && email)) && (
          <Button
            variant="outlined"
            startIcon={<PhoneIcon />}
            onClick={() => onContactClick(phone ? 'phone' : 'email', phone || email || '')}
            sx={{
              borderColor: '#5b9bd5',
              color: '#5b9bd5',
              fontWeight: 600,
              padding: '8px 16px',
              minHeight: '40px',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#4a8bc2',
                bgcolor: alpha('#5b9bd5', 0.08),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha('#5b9bd5', 0.2)}`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {phone || 'No Phone'}
          </Button>
        )}
        {email && (
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => onContactClick('email', email)}
            sx={{
              borderColor: '#5b9bd5',
              color: '#5b9bd5',
              fontWeight: 600,
              padding: '8px 16px',
              minHeight: '40px',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#4a8bc2',
                bgcolor: alpha('#5b9bd5', 0.08),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha('#5b9bd5', 0.2)}`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Email
          </Button>
        )}
        {website && (
          <Button
            variant="outlined"
            startIcon={<WebsiteIcon />}
            onClick={() => onContactClick('website', website)}
            sx={{
              borderColor: '#5b9bd5',
              color: '#5b9bd5',
              fontWeight: 600,
              padding: '8px 16px',
              minHeight: '40px',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#4a8bc2',
                bgcolor: alpha('#5b9bd5', 0.08),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha('#5b9bd5', 0.2)}`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Website
          </Button>
        )}
      </ContactButtonsContainer>

      <SocialMediaContainer>
        {socialMedia && Object.values(socialMedia).some(url => url) && (
          <>
            {socialMedia.youtube && (
              <IconButton
                onClick={() => window.open(socialMedia.youtube, '_blank')}
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#FF0000',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha('#ffffff', 0.1) 
                    : alpha('#FF0000', 0.1),
                  '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.2) 
                      : alpha('#FF0000', 0.2),
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <YouTubeIcon />
              </IconButton>
            )}
            {socialMedia.instagram && (
              <IconButton
                onClick={() => window.open(socialMedia.instagram, '_blank')}
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#E4405F',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha('#ffffff', 0.1) 
                    : alpha('#E4405F', 0.1),
                  '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.2) 
                      : alpha('#E4405F', 0.2),
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <InstagramIcon />
              </IconButton>
            )}
            {socialMedia.facebook && (
              <IconButton
                onClick={() => window.open(socialMedia.facebook, '_blank')}
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1877F2',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha('#ffffff', 0.1) 
                    : alpha('#1877F2', 0.1),
                  '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.2) 
                      : alpha('#1877F2', 0.2),
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <FacebookIcon />
              </IconButton>
            )}
            {socialMedia.x && (
              <IconButton
                onClick={() => window.open(socialMedia.x, '_blank')}
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1DA1F2',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha('#ffffff', 0.1) 
                    : alpha('#1DA1F2', 0.1),
                  '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.2) 
                      : alpha('#1DA1F2', 0.2),
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <XIcon />
              </IconButton>
            )}
          </>
        )}
      </SocialMediaContainer>
    </ModalFooter>
  );
};

export default ModalContactSection;
