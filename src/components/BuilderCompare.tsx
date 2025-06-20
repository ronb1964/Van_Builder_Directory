import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Rating,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Builder } from '../types';

interface BuilderCompareProps {
  open: boolean;
  onClose: () => void;
  builders: Builder[];
  onRemoveBuilder: (builderId: string | number) => void;
  onViewDetails: (builder: Builder) => void;
}

const BuilderCompare: React.FC<BuilderCompareProps> = ({
  open,
  onClose,
  builders,
  onRemoveBuilder,
  onViewDetails
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // If there are no builders to compare, don't render the dialog
  if (builders.length === 0) {
    return null;
  }

  // Get all unique van types and amenities from the builders
  const allVanTypes = Array.from(
    new Set(builders.flatMap(builder => builder.vanTypes || []))
  );

  const allAmenities = Array.from(
    new Set(builders.flatMap(builder => builder.amenities || []))
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">Compare Builders</Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Features</TableCell>
                {builders.map((builder) => (
                  <TableCell key={builder.id} align="center" sx={{ width: `${80 / builders.length}%` }}>
                    <Box sx={{ position: 'relative', pt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveBuilder(builder.id)}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'error.dark',
                          },
                          width: 24,
                          height: 24
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {builder.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {builder.location.city}, {builder.location.state}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onViewDetails(builder)}
                        sx={{ mb: 1 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Basic Information */}
              <TableRow sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Rating</TableCell>
                {builders.map((builder) => (
                  <TableCell key={`${builder.id}-rating`} align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Rating value={builder.rating} precision={0.5} readOnly />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        ({builder.reviewCount})
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
              
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Price Range</TableCell>
                {builders.map((builder) => (
                  <TableCell key={`${builder.id}-price`} align="center">
                    {builder.priceRange ? (
                      <Chip 
                        label={`$${builder.priceRange.min.toLocaleString()} - $${builder.priceRange.max.toLocaleString()}`}
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not specified</Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
              
              <TableRow sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Years in Business</TableCell>
                {builders.map((builder) => (
                  <TableCell key={`${builder.id}-years`} align="center">
                    {builder.yearsInBusiness || 'N/A'} {builder.yearsInBusiness && builder.yearsInBusiness > 1 ? 'years' : 'year'}
                  </TableCell>
                ))}
              </TableRow>
              
              {/* Van Types */}
              <TableRow sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <TableCell colSpan={builders.length + 1} sx={{ color: 'inherit', fontWeight: 'bold' }}>
                  Van Types
                </TableCell>
              </TableRow>
              
              {allVanTypes.map((vanType) => (
                <TableRow key={vanType} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                  <TableCell component="th" scope="row">{vanType}</TableCell>
                  {builders.map((builder) => (
                    <TableCell key={`${builder.id}-${vanType}`} align="center">
                      {builder.vanTypes && builder.vanTypes.includes(vanType) ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              
              {/* Amenities */}
              <TableRow sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <TableCell colSpan={builders.length + 1} sx={{ color: 'inherit', fontWeight: 'bold' }}>
                  Amenities
                </TableCell>
              </TableRow>
              
              {allAmenities.map((amenity) => (
                <TableRow key={amenity} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                  <TableCell component="th" scope="row">{amenity}</TableCell>
                  {builders.map((builder) => (
                    <TableCell key={`${builder.id}-${amenity}`} align="center">
                      {builder.amenities && builder.amenities.includes(amenity) ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              
              {/* Services */}
              <TableRow sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <TableCell colSpan={builders.length + 1} sx={{ color: 'inherit', fontWeight: 'bold' }}>
                  Services
                </TableCell>
              </TableRow>
              
              {Array.from(
                new Set(builders.flatMap(builder => builder.services || []))
              ).map((service) => (
                <TableRow key={service} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                  <TableCell component="th" scope="row">{service}</TableCell>
                  {builders.map((builder) => (
                    <TableCell key={`${builder.id}-${service}`} align="center">
                      {builder.services && builder.services.includes(service) ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              
              {/* Certifications */}
              <TableRow sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <TableCell colSpan={builders.length + 1} sx={{ color: 'inherit', fontWeight: 'bold' }}>
                  Certifications
                </TableCell>
              </TableRow>
              
              {Array.from(
                new Set(builders.flatMap(builder => builder.certifications || []))
              ).map((certification) => (
                <TableRow key={certification} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                  <TableCell component="th" scope="row">{certification}</TableCell>
                  {builders.map((builder) => (
                    <TableCell key={`${builder.id}-${certification}`} align="center">
                      {builder.certifications && builder.certifications.includes(certification) ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Comparing {builders.length} builder{builders.length !== 1 ? 's' : ''}
        </Typography>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BuilderCompare;
