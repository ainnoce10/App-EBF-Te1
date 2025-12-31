
import React from 'react';

interface ScrollingTickerProps {
  messages: string[];
}

const ScrollingTicker: React.FC<ScrollingTickerProps> = ({ messages }) => {
  // Fonction pour déterminer la couleur du message flash
  const getMessageColor = (text: string) => {
    const t = text.toLowerCase();
    
    // POSITIF (Vert)
    if (t.includes('promo') || t.includes('bienvenue') || t.includes('nouveau') || t.includes('arrivage') || t.includes('offert') || t.includes('gratuit') || t.includes('direct') || t.includes('ouvert')) {
      return 'text-green-600';
    }
    // AVERTISSEMENT / INFO (Jaune)
    if (t.includes('attention') || t.includes('avis') || t.includes('maintenance') || t.includes('info') || t.includes('rappel') || t.includes('prudence')) {
      return 'text-yellow-600';
    }
    // NEGATIF / URGENCE (Rouge)
    if (t.includes('urgent') || t.includes('danger') || t.includes('alerte') || t.includes('stop') || t.includes('annulé') || t.includes('fermé') || t.includes('coupure') || t.includes('critique')) {
      return 'text-red-600';
    }
    // NEUTRE (Orange foncé pour rester lisible sur fond orange clair)
    return 'text-orange-900';
  };

  return (
    <div className="w-full bg-orange-100 border-b border-orange-200 h-10 flex items-center overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 bg-orange-500 px-3 flex items-center z-10 text-white font-bold text-xs uppercase tracking-wider shadow-md">
        FLASH INFO
      </div>
      <div className="ticker-wrap">
        <div className="ticker">
          {messages.map((msg, index) => (
            <span key={index} className={`inline-block px-8 font-black uppercase italic ${getMessageColor(msg)}`}>
              {msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollingTicker;
