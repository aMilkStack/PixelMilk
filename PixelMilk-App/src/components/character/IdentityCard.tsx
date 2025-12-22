import React, { useState } from 'react';
import { CharacterIdentity } from '../../types';
import { Panel } from '../shared/Panel';
import { ChevronDown, ChevronUp, Palette, User, Tag } from 'lucide-react';

export interface IdentityCardProps {
  identity: CharacterIdentity | null;
  isLoading?: boolean;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({ identity, isLoading = false }) => {
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Loading skeleton state
  if (isLoading || (!identity && isLoading)) {
    return (
      <Panel title="CHARACTER IDENTITY">
        <div className="space-y-6 animate-pulse">
          {/* Name skeleton */}
          <div className="h-8 bg-[#8bd0ba]/20 w-3/4 rounded" />

          {/* Color palette skeleton */}
          <div>
            <div className="h-4 bg-[#8bd0ba]/20 w-32 mb-3 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 border border-[#8bd0ba]/20">
                  <div className="w-8 h-8 bg-[#8bd0ba]/10 rounded" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-[#8bd0ba]/20 w-16 rounded" />
                    <div className="h-2 bg-[#8bd0ba]/10 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Physical description skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-[#8bd0ba]/20 w-40 mb-2 rounded" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-[#8bd0ba]/10 w-full rounded" />
            ))}
          </div>
        </div>
      </Panel>
    );
  }

  // Empty state
  if (!identity) {
    return (
      <Panel title="CHARACTER IDENTITY">
        <div className="flex flex-col items-center justify-center py-12 text-[#8bd0ba]/40">
          <User className="w-16 h-16 mb-4" />
          <p className="font-mono text-sm uppercase tracking-widest">NO IDENTITY DATA</p>
          <p className="font-mono text-xs mt-2 text-center">
            Generate a character to view identity details
          </p>
        </div>
      </Panel>
    );
  }

  const {
    name,
    colourPalette,
    physicalDescription,
    distinctiveFeatures,
    angleNotes,
  } = identity;

  return (
    <Panel title="CHARACTER IDENTITY">
      <div className="space-y-6 font-mono">
        {/* Character Name */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#8bd0ba] uppercase tracking-wide break-words">
            {name}
          </h2>
        </div>

        {/* Color Palette Swatches */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#d8c8b8] mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Color Palette
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(['primary', 'secondary', 'accent', 'skin', 'hair', 'outline'] as const).map((colorKey) => {
              const colorValue = colourPalette[colorKey];
              if (!colorValue) return null;

              return (
                <div
                  key={colorKey}
                  className="flex items-center gap-2 p-2 border border-[#8bd0ba]/30 bg-[#021a1a]/50 hover:border-[#8bd0ba]/60 transition-colors"
                >
                  <div
                    className="w-8 h-8 border border-[#d8c8b8]/30 flex-shrink-0"
                    style={{ backgroundColor: colorValue }}
                    title={colorValue}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#8bd0ba] uppercase tracking-wide truncate">
                      {colorKey}
                    </p>
                    <p className="text-[10px] text-[#d8c8b8] font-mono truncate">
                      {colorValue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Physical Description Summary */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#d8c8b8] mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Physical Description
          </h3>
          <div className="border border-[#8bd0ba]/30 bg-[#021a1a]/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#8bd0ba]/20">
              <div className="p-3">
                <p className="text-[10px] text-[#8bd0ba]/70 uppercase tracking-wider mb-1">
                  Body Type
                </p>
                <p className="text-sm text-[#d8c8b8]">
                  {physicalDescription.bodyType}
                </p>
              </div>
              <div className="p-3">
                <p className="text-[10px] text-[#8bd0ba]/70 uppercase tracking-wider mb-1">
                  Height Style
                </p>
                <p className="text-sm text-[#d8c8b8]">
                  {physicalDescription.heightStyle}
                </p>
              </div>
              <div className="p-3">
                <p className="text-[10px] text-[#8bd0ba]/70 uppercase tracking-wider mb-1">
                  Silhouette
                </p>
                <p className="text-sm text-[#d8c8b8]">
                  {physicalDescription.silhouette}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Distinctive Features as Tags/Chips */}
        {distinctiveFeatures && distinctiveFeatures.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-widest text-[#d8c8b8] mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Distinctive Features
            </h3>
            <div className="flex flex-wrap gap-2">
              {distinctiveFeatures.map((feature, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1.5 text-xs bg-[#8bd0ba]/10 border border-[#8bd0ba]/40 text-[#8bd0ba] hover:bg-[#8bd0ba]/20 transition-colors"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Angle-Specific Notes */}
        {angleNotes && (
          <div className="border-t border-[#8bd0ba]/20 pt-4">
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="w-full flex items-center justify-between text-xs uppercase tracking-widest text-[#d8c8b8] hover:text-[#8bd0ba] transition-colors mb-3"
            >
              <span className="flex items-center gap-2">
                Angle-Specific Notes
              </span>
              <span className="flex items-center justify-center w-4 h-4">
                {notesExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>

            {notesExpanded && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                {(['S', 'N', 'E', 'W', 'SE', 'SW', 'NE', 'NW'] as const).map((direction) => {
                  const note = angleNotes[direction];
                  if (!note) return null;

                  return (
                    <div
                      key={direction}
                      className="border-l-2 border-[#8bd0ba]/50 pl-3 py-1"
                    >
                      <p className="text-[10px] text-[#8bd0ba] uppercase tracking-wider mb-1">
                        {direction}
                      </p>
                      <p className="text-xs text-[#d8c8b8] leading-relaxed">
                        {note}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
};

export default IdentityCard;
