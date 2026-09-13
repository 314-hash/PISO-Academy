/**
 * BuilderProfile.tsx
 * 2D Workbench mode Player Profile view.
 * Embeds the full RPG Player Progression & Builder Profile into the 2D developer workbench.
 */

import React from 'react';
import { PlayerProfileModal } from './game/PlayerProfileModal';

export const BuilderProfile: React.FC = () => {
  return (
    <div className="min-h-[85vh] bg-[#0B0F17] py-6 px-4">
      <PlayerProfileModal
        isInline={true}
        initialTab="overview"
      />
    </div>
  );
};
