
import React from 'react';
import { TickerMessage } from '../types';

interface ScrollingTickerProps {
  messages: TickerMessage[];
}

const ScrollingTicker: React.FC<ScrollingTickerProps> = ({ messages }) => {
  // Mapping manuel des couleurs basé sur la propriété de l'objet
  const getMessageColorClass = (color: string) => {
    switch(color) {
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-orange-900'; // Neutre pour fond orange clair
    }
  };

  return (
    <div className="w-full bg-orange-100 border-b border-orange-200 h-10 flex items-center overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 bg-orange-500 px-3 flex items-center z-10 text-white font-bold text-xs uppercase tracking-wider shadow-md">
        FLASH INFO
      </div>
      <div className="ticker-wrap">
        <div className="ticker">
          {messages.map((msg, index) => (
            <span key={index} className={`inline-block px-8 font-black uppercase italic ${getMessageColorClass(msg.color)}`}>
              {msg.content}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollingTicker;
