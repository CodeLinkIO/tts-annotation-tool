export const removeVietNameseAccents = (str: string) => {
  /**
   * @regex {\p{Diacritic}} /Accents characters https://en.wikipedia.org/wiki/Combining_Diacritical_Marks
   * @regex {\u0111} /đ character
   */
  let value = str.replace(/\u0111/g, 'd');
  value = value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return value;
};

export const replaceSpaceWithDash = (str: string) => {
  return str.replace(/\s/g, '-');
};

// Remove all special characters expect '-' and '_'
export const removeSpecialCharacters = (str: string) => {
  return str.replace(/[^a-zA-Z0-9-_]/g, '');
};

/** Normalize audio title to prevent human
 * We will remove all vietnamese characters and special characters and replace space with dash
 * eg: "Người đàn ông nhận thấy những gì đó" => "nguoi-dan-ong-nhan-thay-nhung-gi-do"
 * @param {string} str - audio title
 * @returns {string} normalized audio title
 */
export const normalizeAudioTitle = (str: string) => {
  let title = str.toLocaleLowerCase().trim();
  title = replaceSpaceWithDash(title);
  title = removeVietNameseAccents(title);
  title = removeSpecialCharacters(title);
  return title;
};
