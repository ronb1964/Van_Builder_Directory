import React from 'react';
import { Box, Skeleton, Card, CardContent, CardActions, Grid } from '@mui/material';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'card' | 'list';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  count = 3, 
  type = 'card' 
}) => {
  const renderCardSkeleton = () => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={200} animation="wave" />
      <CardContent>
        <Skeleton variant="text" height={32} width="70%" animation="wave" />
        <Skeleton variant="text" height={20} animation="wave" />
        <Skeleton variant="text" height={20} animation="wave" />
        <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
          <Skeleton variant="rectangular" width={60} height={24} animation="wave" sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={60} height={24} animation="wave" sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={60} height={24} animation="wave" sx={{ borderRadius: 1 }} />
        </Box>
      </CardContent>
      <CardActions sx={{ mt: 'auto', pt: 0 }}>
        <Skeleton variant="rectangular" width={120} height={36} animation="wave" sx={{ borderRadius: 1 }} />
      </CardActions>
    </Card>
  );

  const renderListSkeleton = () => (
    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
      <Skeleton variant="text" height={32} width="40%" animation="wave" />
      <Skeleton variant="text" height={20} width="60%" animation="wave" />
      <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
        <Skeleton variant="rectangular" width={80} height={24} animation="wave" sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={80} height={24} animation="wave" sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );

  return (
    <>
      {type === 'card' ? (
        <Grid container spacing={3}>
          {Array.from(new Array(count)).map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              {renderCardSkeleton()}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box>
          {Array.from(new Array(count)).map((_, index) => (
            <React.Fragment key={index}>
              {renderListSkeleton()}
            </React.Fragment>
          ))}
        </Box>
      )}
    </>
  );
};

export default SkeletonLoader;
