# Profession Knowledge Points System

## Overview
Each profession has different sources of knowledge points for learning new recipes and improving craft quality.

## Knowledge Point Sources

### 1. Weekly Profession Quest
- **Frequency**: 1 per profession per week
- **Reset**: Wednesday (Europe)
- **Notes**: Every profession has a weekly quest that provides knowledge points

### 2. Harvesting/Gathering Points
- **Frequency**: Weekly capped points per gathering profession
- **Gathering Professions**: Herbalism, Mining, Skinning
- **Notes**: Points gained from practicing the gathering profession
- **Customizable**: Each gathering profession may have different weekly caps

**Weekly Caps per Gathering Profession:**
- Herbalism: _[TO BE DEFINED - ASK USER]_
- Mining: _[TO BE DEFINED - ASK USER]_
- Skinning: _[TO BE DEFINED - ASK USER]_

### 3. Collectible Items
- **Frequency**: 1 per expansion per profession
- **Notes**: Special items found in the world that teach knowledge points
- **Status**: Once collected per expansion, cannot be obtained again

**Current Expansion Collectibles:**
_[TO BE DEFINED - ASK USER FOR CURRENT EXPANSION COLLECTIBLE ITEMS]_

### 4. Buyable Items
- **Frequency**: 1 per expansion per profession
- **Notes**: Items purchased from NPCs that provide knowledge points
- **Status**: Once bought per expansion, cannot be purchased again

**Current Expansion Buyable Items:**
_[TO BE DEFINED - ASK USER FOR CURRENT EXPANSION BUYABLE ITEMS]_

## Implementation Notes

### For Developer (Claude):
- When implementing profession knowledge tracking, ASK USER for:
  1. Weekly harvesting caps for each gathering profession
  2. Current expansion collectible items list
  3. Current expansion buyable items list
  4. Any profession-specific variations

### System Design Requirements:
- Track weekly harvesting progress with customizable caps
- Track one-time collectible/buyable items per expansion
- Reset weekly progress on Wednesday
- Support expansion-specific content that may change
- Flexible system for future profession changes