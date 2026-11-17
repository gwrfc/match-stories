// Shared parsing and validation for the lineup editor and exported story.
const lineupTools = {
  parse(value) {
    return String(value || '').split(/[\r\n,]+/).map(name => name.trim()
      .replace(/^\d{1,2}(?:[.)\-:]\s*|\s+)/, '')
      .replace(/\s*\(c\)\s*$/i, '').trim()).filter(Boolean);
  },
  valid(players) { return players.length >= 15 && players.length <= 23; },
  name(players, index, captain) {
    return players[index] + (Number(captain) === index + 1 ? ' (c)' : '');
  }
};
if (typeof module !== 'undefined') module.exports = lineupTools;
