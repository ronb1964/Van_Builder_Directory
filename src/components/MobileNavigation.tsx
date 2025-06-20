import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Map as MapIcon,
  List as ListIcon,
  Favorite as FavoriteIcon,
  Compare as CompareIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  DirectionsCar as VanIcon
} from '@mui/icons-material';

interface MobileNavigationProps {
  currentTab: number;
  onTabChange: (tab: number) => void;
  favoriteCount: number;
  compareCount: number;
  selectedState: string;
  onOpenFilters: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onTabChange,
  favoriteCount,
  compareCount,
  selectedState,
  onOpenFilters
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  const menuItems = [
    {
      text: 'Map View',
      icon: <MapIcon />,
      tab: 0,
      badge: null
    },
    {
      text: 'List View',
      icon: <ListIcon />,
      tab: 1,
      badge: null
    },
    {
      text: 'Favorites',
      icon: <FavoriteIcon />,
      tab: 2,
      badge: favoriteCount > 0 ? favoriteCount : null
    },
    {
      text: 'Compare',
      icon: <CompareIcon />,
      tab: 3,
      badge: compareCount > 0 ? compareCount : null
    }
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuItemClick = (tab: number) => {
    onTabChange(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{
          display: { xs: 'block', md: 'none' },
          minWidth: 44,
          minHeight: 44,
          mr: 2
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Mobile Navigation Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
              : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            background: theme.palette.primary.main,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VanIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap>
              Van Builders
            </Typography>
          </Box>
          <IconButton
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Current Location */}
        {selectedState && (
          <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Current Location
              </Typography>
            </Box>
            <Chip
              label={selectedState}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        <Divider />

        {/* Navigation Items */}
        <List sx={{ flexGrow: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={currentTab === item.tab}
                onClick={() => handleMenuItemClick(item.tab)}
                sx={{
                  minHeight: 56,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main + '20',
                    borderRight: `3px solid ${theme.palette.primary.main}`,
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main,
                    },
                    '& .MuiListItemText-primary': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    fontWeight: currentTab === item.tab ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Quick Actions */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Quick Actions
          </Typography>
          <ListItemButton
            onClick={() => {
              onOpenFilters();
              setDrawerOpen(false);
            }}
            sx={{
              borderRadius: 2,
              minHeight: 48,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon>
              <FilterIcon />
            </ListItemIcon>
            <ListItemText primary="Search & Filter" />
          </ListItemButton>
        </Box>
      </Drawer>
    </>
  );
};

export default MobileNavigation;
