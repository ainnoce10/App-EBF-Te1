import React from 'react';

interface ScrollingTickerProps {
  messages: string[];
}

const ScrollingTicker: React.FC<ScrollingTickerProps> = ({ messages }) => {
  return (
    <div className="w-full bg-orange-100 border-b border-orange-200 h-10 flex items-center overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 bg-orange-500 px-3 flex items-center z-10 text-white font-bold text-xs uppercase tracking-wider shadow-md">
        FLASH INFO
      </div>
      <div className="ticker-wrap">
        <div className="ticker">
          {messages.map((msg, index) => (
            <span key={index} className="inline-block px-8 text-orange-800 font-medium">
              {msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollingTicker;