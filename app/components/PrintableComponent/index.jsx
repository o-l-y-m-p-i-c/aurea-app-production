import React, { forwardRef } from 'react';

const PrintableComponent = forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      {/* Your content to be printed goes here */}
    </div>
  );
});

export default PrintableComponent;