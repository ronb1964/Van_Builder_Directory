import React from 'react';
import { Box, Typography } from '@mui/material';
import BuilderCard from './BuilderCard';
import { Builder } from '../types/builder';

interface BuilderListProps {
  builders: Builder[];
  selectedBuilder: Builder | null;
  onBuilderSelect: (builder: Builder) => void;
}

const BuilderList: React.FC<BuilderListProps> = ({
  builders,
  selectedBuilder,
  onBuilderSelect,
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Van Builders
      </Typography>
      {builders.map((builder) => (
        <BuilderCard
          key={builder.id}
          builder={builder}
          isSelected={selectedBuilder?.id === builder.id}
          onClick={() => onBuilderSelect(builder)}
        />
      ))}
      {builders.length === 0 && (
        <Typography>No builders available.</Typography>
      )}
    </Box>
  );
};

export default BuilderList;
