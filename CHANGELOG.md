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
