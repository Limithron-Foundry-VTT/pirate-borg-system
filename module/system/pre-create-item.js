export const preCreateItem = (item) => {
  item.data.update(CONFIG.PB.itemDefaultImage[item.type]);
};
