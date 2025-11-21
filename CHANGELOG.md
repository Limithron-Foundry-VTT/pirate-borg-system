# v1.1.7

- Fixed some typos that would be visible when firing ship broadsides.
  - Thank you Stew-rt for the contribution.
- Improve tavern generator speed.
  - Your inevitable replacement characters will roll up much faster now.
- Rolling a new character via the tavern now correctly updates the token name and image.
  - Apparently no one noticed that "Pascual" hung around for just a little too long...
- Heading fonts should no longer be half cut off on Linux.
    - A long-standing issue - a massive thanks to Stew-rt for the diagnosis assistance.
- Improved support for Foundry VTT running on non-standard paths.
    - Switched to relative image URLs to support games running within subfolder paths.

# v1.1.6

- Added support for calling RollTables and Macros by UUID in invocable actions.
  - Thank you r2DoesInc for the contribution [#61](https://github.com/Limithron-Foundry-VTT/pirate-borg-system/pull/61)
- Fixed "Thing of Importance" 65 (tattoo) again...
- Added information on how to create custom classes to the [How to Use This System](https://github.com/Limithron-Foundry-VTT/pirate-borg-system/blob/main/how-to-use-this-system.md#custom-classes) document.

# v1.1.5

- Fixed CSS making playlist controls nearly invisible in v13.
  - Thank you Ray for the report.

# v1.1.4

- Added Carrying Capacity Effect Key.
  - This allows an Active Effect to be applied to a character to adjust their carrying capacity.
  - `system.attributes.carryingModifier.value`
  - The default value is `8`. The character's strength value is _always_ added to this value.
    - Thank you r2DoesInc for the contribution [#58](https://github.com/Limithron-Foundry-VTT/pirate-borg-system/pull/58).
    - Thank you Alexia for the suggestion on Discord.
- Added Module organization to the tavern.
  - Groups character classes by their module in the tavern (character generator) for easier identification.
  - Thank you r2DoesInc for the contribution.
  - See [#57](https://github.com/Limithron-Foundry-VTT/pirate-borg-system/pull/57) for examples.
- Added basic [devcontainer](https://containers.dev/) support.
  - Thank you r2DoesInc for the contribution.

# v1.1.3

- Fixed "Thing of Importance" 65 (tattoo).
  - Thank you r2DoesInc for the contribution [#56](https://github.com/Limithron-Foundry-VTT/pirate-borg-system/pull/56).
- Added French translation.
  - Thank you Glorim-0derg for the contribution [#54](https://github.com/Limithron-Foundry-VTT/pirate-borg-system/pull/54).

# v1.1.2

- Fixed issue where you could only drag and drop Character Items onto the Hotbar.
  - v1.1.0 incorrectly prevented any other form of drag and drop from working.
  - Thank you thought-after for the report.

# v1.1.1

- Fixed the FilePicker dialog not showing the Forge tabs when using a French locale.
  - Thank you GoldSbouby for the report [#50](https://github.com/Limithron-Foundry-VTT/pirate-borg-system/issues/50).

# v1.1.0

- Added support for Foundry VTT v13.
  - There will continue to be some warnings in the console about deprecated methods due to maintaining support for earlier versions.
  - Please report any issues you encounter.
- Removed support for Foundry VTT v11.
- Added visual distinction between Public, Private, Blind, and GM rolls.
  - Thank you thought-after for the report.
- Added more folder categorization for the compendium packs.
- Added support for the built-in Foundry VTT Token Ruler.
- Removed "drag-ruler" from the recommended modules list for v13 since it is now part of the core platform.
- Fixed Frigate missing the Mystic Shanties section on the vehicle sheet.
- Fixed dragging and dropping an Item onto the Hotbar creating the wrong sort of macro.
- Fixed issue where you could not scroll the list of modules in the game settings.
  - Thank you neilbenson for the report.
- Removed "Easy Target" as a recommended module.
  - It is no longer needed as the functionality is part of the core platform (by hovering over the target and pressing "T").
- Added Polish support.
  - Thank you rklos for the contribution.

# v1.0.8

- Release was removed from listing due to the following change being incorrect.
  - ~~Fixed the "Tall Tale" class to have 1d4 Devil's Luck instead of the incorrect 1d2.~~

# v1.0.7

- Fixed buttons on chat cards (such as attack rolls) not working.

# v1.0.6

- Fixed playlists not being visible in the sidebar when Monk's Sound Enhancements module is used.
  - No longer will they be a deep purple and impossible to see.
- Started initial v13 compatibility work.

# v1.0.5

- Remove deprecation warnings from item and armor sheets.
- Fixed several inconsistencies with the Thing of Importance items.

# v1.0.4

- It turns out pirates don't use ammo for melee weapons.
  - Melee weapons will no longer complain about invalid ammo.

# v1.0.3

- Prompt the player when they try to reload a weapon that has run out of ammo.
- Fumbling Gunpowder weapons now correctly rolls on the Gunpowder Fumble table.
- Increased the width of the Ammo select dropdown on character sheets.
- Added the ability to change the speed of characters.
  - Speed is measured in grid units (5' grid scale for characters and 50' grid scale for ships).
  - Player characters can change this value at the bottom of their Features tab.
  - Non-player characters can change this value on their Details tab.

# v1.0.2

- Fix Thing of Importance "animal skull" incorrectly being 5, it's now correctly 55.
- Made it clearer that you can start without a hat (on a roll of 1-4).

# v1.0.1

- Allow actors to Long Rest without requiring their token to be on the canvas.
- Fix display of ship type on the ship edit sheet.
- Fix ammo not being consumed when using v11.
  - Bug was introduced as part of v12 compatibility.

# v1.0.0

- Foundry VTT v12 compatibility.
  - Tavern generator now works correctly.
  - Removed the majority of deprecation warnings.
- Added basic Active Effects support.
  - Huge thanks to [adracea](https://github.com/adracea) for their contributions to this release.
- Updated styling:
  - Grouped system compendiums together.
  - Adjusted the pause icon.
  - Border and shadow highlights are now more red.
  - Fixed icon references for Ancient Relics and Arcane Rituals compendiums.
- Removed support for Foundry VTT v10.

# v0.6.15

- Exposed the "outcomes" of rolls performed via the Pirate Borg API to allow for better integration with other modules and/or macros.

# v0.6.14

- Updated Rapscallion class. Changes made to:
  - Back Stabber feature.
  - Sneaky Bastard feature.
- Removed empty "creatures" compendium that should not have been included in the system.
- Removed deprecated "Combat Carousel" module from recommended modules list.

# v0.6.13

- Fixed dragging an item onto the macro hotbar creating the wrong macro syntax.
- Fixed Machete not having the correct damage formula (thanks VinceFox).
  - It's now 1d6 damage.

# v0.6.12

- Fix classes that don't have any extra resources from failing to generate in the Tavern.
  - Bug was introduced in v0.6.11
- Naval NPCs now correctly show their movement speed in the drag ruler (thanks 525600Mimics).

# v0.6.11

- Fix Zealot's rolled from The Tavern incorrectly having `1d4 + spirit` prayers, instead of the correct `1d2 + spirit` (thanks 525600Mimics).

# v0.6.10

- Fix ships incorrectly ignoring armor when attacking other ships.
  - They now list the target ship's armor in the attack dialog without you needing to re-target the ship.

# v0.6.9

- System chat message cards should now display in the selected chat message mode (public, private etc.).

# v0.6.8

- Fix Zealot Prayers roll table formula (thanks Félix).

# v0.6.7

- Fix CSS interactions with Monk's Enhanced Journals.
- Updated link to premium module.

# v0.6.6

- Fix [DragRuler](https://foundryvtt.com/packages/drag-ruler) distance calculations for Ships.

# v0.6.5

- Text updates to Buccaneer, Rapscallion, Swashbuckler and Zealot classes.

# v0.6.4

- Official V11 release.

# v0.6.3

- Official V10 release.
- Fix the sidebar styles when popout.
- Fix the combat tracker style.
- Update the README to includes instruction of how to install the system for Foundry v9 and v10.
- Add `createCharacter` and `updateCharacter` hooks when creating and updating a character. A module could listen to those events to further customize a character.

# v0.6.0

- Fix actor duplication
- Amount of rituals, prayers and sorceries per day should not go under 0
- Update Attack, Defend and Ship attack dialogs for Blackpowder weapons ignoring armor
- Changed the label "Armor" to "Damage" in Defend chat message

# v0.5.5

- The sound controls for playlist are now darker
- Fix weapons animations not working in v10
- Fix formulas not working in html fields

# v0.5.4

- Update wording of the Ship Repair action
- Equipped weapons should not take an inventory space
- System should respect the default token configuration of the world

# v0.5.3

- Fix ship repair action

# v0.5.2

- Fix armor calculation

# v0.5.0

- Foundry V10 compatibility.
- Fix silver gain when gaining experience.
- Fix some character creation and getting better macros.
- Fix chat buttons not working with an active token.
- Fix bug when Sequencer module is not installed.
- Fix sample ships attacks.
- Dice roll sound from chat message without any rolls were removed.
- Prayers and Sorceries test removed.
- "Whom dost thou serve?" class items were moved to the Zealot compendium.
- Broken table updated.
- Gaining experience updated.
- Starting table updated.
- Add tooltip to each abilities.
- All texts and rules update for final book.
- Fix extra critical hit applying to all hits.
- Add a new weapon type for thrown weapons using agility.

# v0.4.3

- Fix Sequencer error when it's not activated.
- Fix time of the latest commit

# v0.4.2

- Floating text for roll outcomes (Dodge, miss, success, etc.), damages and heals. Sequencer modules required
- Advanced animation for attack, defense, ship actions, relics, rituals and spells. Sequencer and JB2A Free or JB2A Patreon modules required
- Targeting support. Required for advanced animation, roll outcome animation, and automatic damage and heal.
- Attack and Defense dialog values are pre-filled from the target.
- Animation configuration added to the weapon sheet.
- Default animations added to most weapons.
- Fix compatibility for popular modules such as Drag Ruler, Easy Target, Dice So Nice!, Dice Tray, Always HP, Tidy UI, etc.
- List of recommended modules added to the Help Dialog
- Macro in the toolbar can be created from most actor items types.
- Getting better chat message improved.
- Rest chat messages improved.
- First startup chat messages improved.
- Target and ammo used added to the attack chat message.
- Update actor attributes to follow D&D 5E standard for better compatibility with modules.
- Dinghy added as item.
- Sea Chest and Dinghy fixed in the d6 Container table.
- Improved combat tracker ordering.
- Huge refactoring of actors, items, and sheets.
- System setting: Enforce target selection when in combat. (default: false)
- System setting: Automatic damage and heal. (default: true)
- System setting: Outcome animation. (default: true)
- System setting: Damages & Heals animation. (default: true)
- System setting: Advanced animation. (default: true)

# v0.4.1

- Ritual per day has now a minimum of zero at character creation
- Add default vision range for character and ships actor

# v0.4.0

- Ships and NPC Ships support added
  - Dinghy & Brigantine added (PC Ships)
  - Man of War added (NPC Ship)
  - Button added to the sheet header to toggle between the edit and view sheets
  - PC, NPC and Crew actions buttons added
  - New Item type for Cargo and Shanties added
  - Character and Creature can be dragged and dropped to the ship sheet
  - Toggle for captain
  - Items cab be dragged and dropped to the ship storage
- Ranged weapons reload added
- Damage roll button added to chat
- Default tokens added to character
- Example creatures added (Lookout)
- Foundry UI Updated
- Initiative button added to monster sheet
- Initiative rolls are always outputted to the chat
- Warning added when a creature doesn't have morale
- Updates from latest Beta PDF
- Sheets are now smaller
- Prevent Character to be generated with zero HP
- Chat Card message has been standardized
- Zealot origins have been fixed
- WYSIWYG Editor improvements

# v0.3.4

- Relics & Rituals chat card improvements
- Chat card styling improvements
- Fix a bug when an actor was updating too often
- The options for Devil's Luck is outputted into the chat when clicking the Devil's Luck label in the character sheet
- Hide Mystical Mishaps for players
- Add dice sound to chat card roll buttons

# v0.3.3

- Pirate Name Generator
- Improve attack and defend dialog

# v0.3.2

- The Tavern should not generate character with an ability lower than -3
- Improve attack dialog

# v0.3.1

- Improved ammo display
- Character sheet was not updated after some specific conditions

# v0.3.0

- Add PIRATE BORG Help Dialog

# v0.2.9

- Add Tall Tale class
- Armors, clothing, weapons and hats are automatically equipped on character creation
- Add bonus roll items on starting features
- Bug fixes

# v0.2.8

- Add Haunted Soul class
- Better integration with Dice So Nice and Dice Tray module
- Add more Background items
- Bug fixes

# v0.2.7

- Add Background items
- Add Gunpowder weapon fumble
- Add support for extra crit damage on weapons
- Add support for weapon using ammo damage
- Add isGunpowderWeapon property on weapon item
- Add requireBaseClass and skipCharacterGenerator properties on class item in preparation of the 2 bonus classes
- Add baseClass property on character actor

# v0.2.5

- Update Reaction, Morale, Rest, Broken and Get Better
- Add bonus items on starting features
- Add Buccaneer, Rapscallion, Sorcerer, Swashbuckler & Zealot classes
- Bug fixes

# v0.2.3

- Foundry UI
- Compendium Panels
- System Settings
- Bug fixes

# v0.2.2

- Add Brute class
- Add Features and Relics & Rituals Tabs
- Armor should give penalty when broken
- Update hat and clothing/armors not applying to total weight/carrying capacity
- Update Hats to reduce damage
- Add support for Class Creation Macro
- Add support for Class Getting Better Macro
- Add a Generic Item Macro to output an item to the chat
- Add an example of a specific item macro (Brute Liar's Dice)
- Roll the nunber of rituals and extra resources at character creation
- Chat card and button for Mystical Mishaps

# V0.2.1

- General Theme & Styling
- Hats in combat
- Bug fixes

# v0.1.0

- Intial Fork of the MÖRK BORG System.
