// Avatar generator utility
const avatarOptions = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
  '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
  '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎',
  '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟',
  '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧',
  '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄',
  '🐎', '🐏', '🐑', '🦙', '🐐', '🦏', '🦛', '🦘', '🐨',
  '🐼', '🐻', '🦊', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'
];

// Generate a random avatar for a user
export const generateAvatar = (userId) => {
  // Use userId as seed for consistent avatar per user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % avatarOptions.length;
  return avatarOptions[index];
};

// Get avatar for a user (with fallback)
export const getUserAvatar = (user) => {
  if (user?.avatar) {
    return user.avatar;
  }
  if (user?.id) {
    return generateAvatar(user.id);
  }
  return '👤'; // Default fallback
};

// Predefined avatar sets for different themes
export const avatarThemes = {
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'
  ],
  nature: [
    '🌱', '🌿', '🍀', '🌾', '🌵', '🌲', '🌳', '🌴', '🌺', '🌸',
    '🌻', '🌼', '🌷', '🌹', '🥀', '🌿', '🍃', '🌾', '🌱', '🌿'
  ],
  food: [
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑',
    '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒'
  ],
  objects: [
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🪀', '🏓',
    '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹'
  ]
};

// Generate avatar from specific theme
export const generateAvatarFromTheme = (userId, theme = 'animals') => {
  const themeAvatars = avatarThemes[theme] || avatarThemes.animals;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % themeAvatars.length;
  return themeAvatars[index];
};
