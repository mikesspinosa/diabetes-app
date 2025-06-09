import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const TildeIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path
      d="M3,12 C3,12 5,7 9,7 C13,7 15,12 15,12 C15,12 17,17 21,17"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export default TildeIcon; 