# How to use this system

## General

This is an implementation of the PIRATE BORG rules, with limited adaptations to make things work in Foundry VTT. There are compendiums covering all the classes, equipment, and features described in the PIRATE BORG book.

## Creating a character

- Create a new Actor of type _character_. By default, a new character will have the _Landlubber_ class (a fancier name for the default classless character).
- If desired, drag a different Class from the particular class compendium (e.g., "Class - Swashbuckler") folder onto your sheet.
  - Drag out class-specific abilities or attacks (like the Swashbuckler’s Dazzling Acrobatics Ability) from the per-class compendium folder.
- Use the RollTables in the _Character Creation_ RollTable compendium folder. E.g., for the "Starting clothing & armor" starting equipment rolls, or for various class-specific random items.
- Manually roll and update your abilities, hit points, silver, and Devil's Luck.
- If buying equipment, drag items from the various _Equipment_ compendiums onto your character sheet.
- Equip some items on your _Equipment_ tab (using the little shield icon on the right of each item row), and they'll show up for use on your _Combat_ tab.
- Go kill stuff!

## The Tavern

- You can also create randomly-generated characters through the built-in _Tavern_.
- You can trigger random Tavern generation in two ways:
  - GMs and players with "Create Actor" privileges will see a "The Tavern" button at the top of the right sidebar _Actors Directory_ tab. This will create a new character.
  - Every character sheet has a "The Tavern" button with a little skull icon in the top of the sheet. This will throwaway all items and stats from the current character, and replace it with a randomly-generated character. **Warning**: this cannot be undone.
- Either trigger will show a dialog window, allowing you to choose which classes to include as possible random Characters.
- The Tavern will attempt to include any Item compendium with a name that begins "Class - ". E.g., "Class - Swashbuckler".

## Inventory

- All items in your possession show up on your _Equipment_ tab.
- Carrying capacity (encumbrance) is calculated as per the Pirate Borg rules.
- Items have a _Carry Weight_ field for how much they contribute to the total.
  - Most items are 1, with a few exceptions.
  - If you are encumbered (i.e., you are carrying more than your capacity), the rules for encumbrance will change color to alert you. You'll also see the effects on the DR for STR, AGI, and defense tests.
- Container space and usage is also calculated.
  - Items of type _container_ have a capacity field indicating how much they can hold. Your total item capacity is the sum of your containers' capacities.
  - Items have a _Container Space_ field indicating how much space they take up in a container. Most items are 1.
  - Containers do not count towards your container space.
  - Equipped items do not count towards your container space.
- Misc items have a modifiable _quantity_ field. You can more easily increase or decrease this using the "+" and "-" buttons that appear in the item row, in the _Equipment_ tab.
  - You can combine quantity with _Carry Weight_ and _Container Space_ fields set less than zero, to allow "stacking" of items occupying less than 1 unit or occupying less than 1 slot.

## Combat

- Combat rolls are handled from the _Combat_ tab on a Character's sheet.
- Party and Individual initiative can be handled either with or without Foundry's Combat Tracker.
  - With: GameMaster has started a Combat Encounter and added players and enemies to it. Party Initiative will sort combatants ("Players go first", "Enemies go first") based on their token disposition (friendly is a player/ally, neutral or hostile is an enemy), and Individual Initiative will sort combatants within that grouping. There are also buttons on the combat tracker for party initiative (6-sided die icon) and individual initiative (regular 20-sided die icon).
  - If desired, you can repeat "Roll Party Initiative" every round. Depending on the die roll, friendlies/enemies may be reordered to show up on top.
  - Without: initiative buttons will show messages in chat, but it's up to you to track the ordering.
- To use a weapon, armor, or shield, you need to equip it. You can do so on the _Equipment_ tab. Any equippable items have a small shield icon next to their edit and delete buttons. Click the shield icon to make it turn yellow (equipped), and the item will appear on your _Combat_ tab, ready for use. Note: you can only have a single armor and single shield equipped at one time.
- Attacking
  - On the _Combat_ tab of your character sheet, click the _Attack_ button next to your weapon of choice.
  - A popup window will appear, prompting you for the DR of the attack (usually 12), as well as the target's armor damage reduction (e.g., 1d2).
  - The system will resolve your attack, calculating hit or miss, critical or fumble, damage and damage reduction. Everything will appear in a chat message "roll card".
  - Final damage can then be manually applied to the target (i.e., DM reduces the target creature's HPs on the creature sheet).
- Defending
  - On the _Combat_ tab of your character sheet, Click the _Defend_ button.
  - A popup window will appear, prompting you for the DR of the defense (usually 12) and the incoming attack damage die (e.g., 1d6).
  - The system will resolve the defense, calculating dodge or hit, critical or fumble, damage and damage reduction. Everything will appear in a chat message "roll card".
  - It's up to you to manually apply the final damage (i.e., reduce your HPs on your character sheet).
- Armor
  - Armor has both a current and a max tier. The current tier is shown on the _Combat_ tab as a radio button. The current tier radio buttons won't let you choose a current tier higher than the armor's max tier. There is a zero tier shown, in case your armor is damaged.
  - You can drag your armor into the macro bar to have quick access to a defense roll.

## Health, Status, and Resting

- It's up to you to keep track of death, infection and poison.
- There is a _Broken_ button on the character sheet that will roll broken-ness, displaying the full result as a chat message.
- There is a _Rest_ button on the character sheet that will open a dialog window, where you can choose between short or long rest, eat or don't eat or starve, and whether you are infected.
  - Starvation and Infection will only damage you during long rests, but will prevent healing on both short and long rests.

## Relics & Rituals

- Any _Relics_ in your inventory will show up on both your sheet's _Equipment_ and _Relics & Rituals_ tabs.
- On the _Relics & Rituals_ tab, use the _Use Relic_ or _Cast Ritual_ buttons to make a usage attempt roll.
  - The results of your roll vs. DR 12 will be shown as a chat message, along with any crit or fumble roll.
  - Failures on _Relics_ cause you to be Stunned, and cannot use the relic again that day, also shown in the chat message.
  - Failures on _Rituals_ cause you to not be able to cast the ritual again that day and require a roll on the _Mystical Mishaps_ table, also shown in the chat message.
  - It's up to you to manually roll an Arcane Catastrophe when you fumble.
- It's up to you to prohibit using _Rituals_ when  the caster is carrying anything made of cold iron or touching metal.

## Creatures

- Creatures can be dragged out from the _Creatures_ compendium folder.
- Any attacks or defense for a creature is handled on the attacking/defending player's _Combat_ tab. The attack and armor information shown on the creature sheet is "display only", and it's up to you to manually enter that on your _Combat_ tab during a fight.

## Container Actors

- In addition to the usual _container_ Item type (e.g., the backpack), there is a _container_ Actor type. This gives you the option to represent things like the Small Wagon and Donkey as tokens on the map, store items separately inside them, etc.
- Currently drag-and-drop from anything to a container actor will duplicate the dragged/dropped item. Drag and drop to/from contain actors is _destructive_ - a drag-dropped item should get removed from the dragged-from, and added to the dragged-to.

## Settings

- There are user-configurable settings (upper right _Game Settings_ icon button => _Configure Settings_ button => _System Settings_ tab).
- The following settings are available:
  - Allowed classes: edit the classes in the character generator.
  - Apply overcapacity Penalty: +2 STR/AGI DR when carrying more than STR+8 items.
  - Track ammo: Select and auto-decrement ammo for ranged weapons.
