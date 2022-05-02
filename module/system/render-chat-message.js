import { rollPartyInitiative } from "../combat.js";

export const renderChatMessage =  async (message, html, data)=> {
  if (message.data.flags.hasButton) {
    const buttons = html.find('.item-button');
    if (buttons.length) {
      const button = $(buttons[0]);
      const isMysticalMishap = button.data('is-mystical-mishap');
      if (isMysticalMishap) {
        button.on('click', async () => {
          const actorId = button.data('actor-id');        
          const actor = game.actors.get(actorId);              
          await actor.rollMysticalMishap();
        });
      }
    }
  }
};
