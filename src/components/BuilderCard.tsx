import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Link,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { Builder } from '../types/builder';

interface BuilderCardProps {
  builder: Builder;
  isSelected: boolean;
  onClick: () => void;
}

const BuilderCard: React.FC<BuilderCardProps> = ({
  builder,
  isSelected,
  onClick,
}) => {
  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        border: isSelected ? '2px solid #1976d2' : 'none',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {builder.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {builder.address}
          <br />
          {builder.city}, {builder.state} {builder.zip}
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          {builder.phone && (
            <IconButton
              size="small"
              component={Link}
              href={`tel:${builder.phone}`}
              onClick={(e) => e.stopPropagation()}
            >
              <PhoneIcon />
            </IconButton>
          )}
          {builder.email && (
            <IconButton
              size="small"
              component={Link}
              href={`mailto:${builder.email}`}
              onClick={(e) => e.stopPropagation()}
            >
              <EmailIcon />
            </IconButton>
          )}
          {builder.website && (
            <IconButton
              size="small"
              component={Link}
              href={builder.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <WebsiteIcon />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default BuilderCard;
