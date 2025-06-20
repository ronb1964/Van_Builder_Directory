import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  Button,
  Divider,
  useTheme,
  Rating
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Builder } from '../types';

interface FavoritesDrawerProps {
  open: boolean;
  onClose: () => void;
  favorites: Builder[];
  onRemoveFavorite: (builderId: string | number) => void;
  onViewDetails: (builder: Builder) => void;
}

const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  open,
  onClose,
  favorites,
  onRemoveFavorite,
  onViewDetails
}) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          p: 2,
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 'primary.main',
          fontWeight: 600
        }}>
          <FavoriteIcon sx={{ mr: 1, color: theme.palette.error.main }} /> 
          Your Favorite Builders
        </Typography>
        <IconButton onClick={onClose} aria-label="close favorites">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {favorites.length > 0 ? (
        <List sx={{ width: '100%' }}>
          {favorites.map((builder) => (
            <React.Fragment key={builder.id}>
              <ListItem 
                alignItems="flex-start"
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <StorefrontIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={builder.name}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block' }}
                      >
                        {builder.address}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Rating value={builder.rating} precision={0.5} size="small" readOnly />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({builder.reviewCount} reviews)
                        </Typography>
                      </Box>
                    </React.Fragment>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={() => onRemoveFavorite(builder.id)}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onViewDetails(builder)}
                sx={{ ml: 9, mb: 2 }}
              >
                View Details
              </Button>
              <Divider sx={{ my: 1 }} />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4
        }}>
          <FavoriteIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Favorites Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Start adding builders to your favorites by clicking the heart icon on any builder card.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onClose}
            sx={{ mt: 3 }}
          >
            Browse Builders
          </Button>
        </Box>
      )}
    </Drawer>
  );
};

export default FavoritesDrawer;
