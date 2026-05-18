import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, ADMIN_EMAIL } from './supabase.js';
import { loadSharedScriptures, shareScripture, deleteSharedScripture, listApprovedUsers, approveUser, revokeUser } from './db.js';


// --- Constants ---
const DEFAULT_LANGUAGES = ["English","Russian","Spanish","Ukrainian","French","Hebrew","Chinese","Hindi"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Encouraging failure messages for Hold to the Rod game
const ENCOURAGING_MESSAGES = [
  "Almost there! Every attempt builds memory.",
  "You're learning! That's what matters.",
  "Great effort! Try again when ready.",
  "Progress isn't always linear. Keep going!",
  "Each try strengthens your recall.",
  "Don't give up! You've got this.",
  "So close! The words will come.",
  "Learning takes time. You're doing great!",
  "That was a tough one! Keep practicing.",
  "Your brain is building new pathways!",
  "Every master was once a beginner.",
  "Persistence is the path to perfection.",
  "You'll get it next time!",
  "Keep pressing forward!",
  "Hold to the rod—you're getting closer!",
  "The iron rod leads to the tree of life.",
  "Faith precedes the miracle. Try again!",
  "Line upon line, precept upon precept.",
  "Small and simple things bring great results.",
  "Your diligence will be rewarded.",
  "Remember, charity never faileth—neither will you!",
  "Be of good cheer! You're improving.",
  "This scripture is worth knowing. Keep at it!",
  "The Lord sees your effort. Press on!",
  "By small means, great things come to pass.",
  "You're building a foundation of faith.",
  "Each attempt plants seeds of knowledge.",
  "Trust the process. Growth is happening!",
  "Look forward with faith!",
  "Your dedication inspires. Don't stop!",
  "The journey of 1000 verses begins here.",
  "Rest if you must, but don't quit.",
  "You're closer than you think!",
  "One word at a time leads to mastery.",
  "Keep knocking—it will be opened!",
  "Seek and ye shall find. Try again!",
  "Mountains are moved one stone at a time.",
  "Your effort today builds tomorrow's strength.",
  "Patience and practice make perfect.",
  "The Lord qualifies those He calls. Keep going!",
  "Stumbling is part of learning to walk.",
  "Every verse memorized is a victory!",
  "You're storing treasures in your heart.",
  "Scriptures soften hearts—including yours!",
  "This is sacred work. Keep at it!",
  "Remember Nephi: 'I will go and do!'",
  "Be strong and of good courage!",
  "The best is yet to come. Try again!",
  "With God, all things are possible.",
  "Fear not, for I am with thee.",
  "Stand in holy places—like right here!",
  "Onward and upward! You've got this.",
  "Let your heart take courage!",
  "The Spirit is teaching you. Be patient.",
  "What wonderful persistence you have!",
  "This verse will be yours soon!",
  "Glory comes after the trial of faith.",
  "You're planting seeds that will bear fruit.",
  "Keep the faith! It's working.",
  "Thy faith hath made thee whole—keep going!",
  "Beautiful effort! Don't be discouraged.",
  "You're writing these words on your heart.",
  "Alma would be proud of your effort!",
  "Remember, even prophets had to learn!",
  "Grace helps us after all we can do.",
  "Your sincere effort is noticed.",
  "Joy comes in the morning. Try again!",
  "Cast not away your confidence!",
  "Be still and know you're improving.",
  "These words of life are worth the struggle.",
  "Hold fast to what you've learned!",
  "You're building an unshakeable foundation.",
  "Light grows brighter line by line.",
  "Treasure these words—they're becoming yours!",
  "Feast upon the words—one bite at a time!",
  "You're doing exactly what you should be.",
  "This is how scriptorians are made!",
  "Your future self will thank you.",
  "Keep pressing toward the mark!",
  "The word is powerful. You're gaining power!",
  "Truth is being engraved in your mind.",
  "What a beautiful attempt! Go again!",
  "You're honoring sacred words with your effort.",
  "Endure to the end—of this verse!",
  "The Lord loves a cheerful trier!",
  "You're arming yourself with the word.",
  "This is the good fight of faith!",
  "Stand firm! The words will come.",
  "Every rep builds spiritual muscle.",
  "You're hiding God's word in your heart.",
  "Wherefore, be of good cheer!",
  "He who began this work will complete it.",
  "These eternal words are becoming yours.",
  "What dedication! Keep it up!",
  "You're laying up treasures in heaven.",
  "Perfect love casts out fear of failure.",
  "Be patient with yourself. God is!",
  "You're filling your lamp with oil.",
  "The scriptures testify of Christ—so does your effort!",
  "Wonderful try! Onward!",
  "Keep your eye single to this goal!",
];

// Daily completion celebration messages (personalized with {name})
const COMPLETION_MESSAGES = [
  { emoji: "🏆", message: "Champion! {name}, you've completed all your practice for today!" },
  { emoji: "⭐", message: "Star student, {name}! See you tomorrow for more scripture power!" },
  { emoji: "🌟", message: "{name}, you're shining bright! Come back tomorrow refreshed!" },
  { emoji: "🎯", message: "Bullseye, {name}! You hit every target today!" },
  { emoji: "🔥", message: "{name} is on fire! Keep that streak going tomorrow!" },
  { emoji: "💪", message: "Strong work, {name}! Your dedication is inspiring!" },
  { emoji: "🎉", message: "Party time, {name}! You crushed it today!" },
  { emoji: "🌈", message: "{name}, you've made today beautiful! Rest well!" },
  { emoji: "🚀", message: "{name} is rocketing to scripture mastery! See you tomorrow!" },
  { emoji: "👑", message: "Royalty alert! {name} has conquered today's practice!" },
  { emoji: "💎", message: "{name}, you're a gem! Your efforts are precious!" },
  { emoji: "🏅", message: "Gold medal performance, {name}! Well done!" },
  { emoji: "🌻", message: "{name}, you're growing beautifully! Keep blooming tomorrow!" },
  { emoji: "⚡", message: "Electric work, {name}! You're powered up!" },
  { emoji: "🎊", message: "Celebration time! {name} finished all practice!" },
  { emoji: "🦅", message: "{name}, you're soaring! Those who wait upon the Lord..." },
  { emoji: "🌅", message: "Another day, another victory for {name}! See you at sunrise!" },
  { emoji: "🎁", message: "{name}, your dedication is a gift! Unwrap more tomorrow!" },
  { emoji: "🌿", message: "{name}, you're planting seeds of faith. Watch them grow!" },
  { emoji: "💫", message: "Magical work, {name}! You make scripture study sparkle!" },
  { emoji: "🏰", message: "{name} is building a fortress of faith! Brick by brick!" },
  { emoji: "🌊", message: "Making waves, {name}! Your progress is refreshing!" },
  { emoji: "🎸", message: "{name} rocks! You're in perfect harmony with the scriptures!" },
  { emoji: "🦋", message: "{name}, you're transforming! Beautiful progress today!" },
  { emoji: "🍯", message: "Sweet success, {name}! The scriptures are sweeter than honey!" },
  { emoji: "🧭", message: "{name}, you're right on course! The iron rod leads home!" },
  { emoji: "🌙", message: "Rest well, {name}! You've earned a peaceful night!" },
  { emoji: "☀️", message: "{name} brings sunshine! Your light is growing brighter!" },
  { emoji: "🎪", message: "Amazing show, {name}! You're the star of scripture study!" },
  { emoji: "🧗", message: "{name} is climbing to new heights! Keep ascending!" },
  { emoji: "🎨", message: "{name}, you're painting a masterpiece of faith!" },
  { emoji: "🔔", message: "Ring the bell, {name}! Victory is yours today!" },
  { emoji: "🌺", message: "Blooming beautifully, {name}! Your garden of knowledge grows!" },
  { emoji: "⛵", message: "Smooth sailing, {name}! You navigated today perfectly!" },
  { emoji: "🎭", message: "Standing ovation for {name}! What a performance!" },
  { emoji: "🌠", message: "Shooting star, {name}! Make a wish and come back tomorrow!" },
  { emoji: "🏋️", message: "{name} is spiritually strong! Those faith muscles are growing!" },
  { emoji: "🎹", message: "{name}, your practice is music to heaven's ears!" },
  { emoji: "🌍", message: "{name}, you're making the world better one verse at a time!" },
  { emoji: "🦁", message: "Brave like a lion, {name}! Fear not, for He is with you!" },
  { emoji: "🍀", message: "{name}, you make your own luck through dedication!" },
  { emoji: "🎤", message: "Mic drop, {name}! You owned today's practice!" },
  { emoji: "🌴", message: "{name}, you're firmly planted! Your roots grow deep!" },
  { emoji: "💐", message: "Beautiful bouquet of verses, {name}! You're flourishing!" },
  { emoji: "🏄", message: "{name} is riding the wave of success! Hang ten tomorrow!" },
  { emoji: "🎈", message: "Spirits are high, {name}! You're floating on accomplishment!" },
  { emoji: "🦉", message: "Wise choice, {name}! Knowledge is your treasure!" },
  { emoji: "🌾", message: "{name}, you're harvesting blessings! More to reap tomorrow!" },
  { emoji: "🎯", message: "Perfect aim, {name}! You never miss your scripture time!" },
  { emoji: "🌟", message: "Stellar work, {name}! The heavens applaud you!" },
];

// Avatar color palette (20 colors matching app theme)
const AVATAR_COLORS = [
  "#d4a854", // gold (app primary)
  "#c4943e", // deep gold
  "#e8c88a", // pale gold
  "#6a9e5a", // sage green
  "#5a8e4a", // forest green
  "#7ec8a3", // mint
  "#4ecdc4", // teal
  "#a8e6cf", // pale teal
  "#5b9bd5", // sky blue
  "#7ba3d8", // soft blue
  "#9b8ec4", // lavender
  "#c49ec4", // mauve
  "#e8a4a4", // rose
  "#d4726a", // coral
  "#f5a962", // peach
  "#f7d794", // cream gold
  "#a89878", // warm gray
  "#8b7355", // brown
  "#5a4e3a", // dark brown
  "#2c2416", // near black
];

// Emoji picker options
const AVATAR_EMOJIS = [
  "📖", "✝️", "🕊️", "⭐", "🌟", "💫", "🙏", "❤️", "💜", "💙",
  "🦋", "🌸", "🌺", "🌻", "🌿", "🍃", "🌈", "☀️", "🌙", "✨",
  "🦄", "🐝", "🦉", "🐬", "🦁", "🐻", "🚴", "⚽", "🎨", "🎵",
  "📚", "🎓", "🏠", "🌍", "🗻", "🏖️", "🎄", "🎁", "🎂", "🍎",
];

// Color manipulation helpers
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = n => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function darkenColor(hex, amount = 0.6) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(s * 1.1, 100), l * amount);
}

function lightenColor(hex, amount = 0.2) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s * 0.8, Math.min(l + (100 - l) * amount, 95));
}

// Process text to hide words based on visibility percentage
function processTextVisibility(text, visibilityPercent, hideMode = "firstLetter") {
  if (visibilityPercent >= 100) return text;
  
  // Split text while preserving whitespace (including newlines), punctuation, and verse numbers
  const tokens = text.split(/(\s+|[.,;:!?'"()[\]{}—–-]|\d+)/);
  const words = [];
  const wordIndices = [];
  
  tokens.forEach((token, idx) => {
    // Check if it's a word (not whitespace, not punctuation, not a number)
    if (token && !/^\s*$/.test(token) && !/^[.,;:!?'"()[\]{}—–-]$/.test(token) && !/^\d+$/.test(token)) {
      words.push(token);
      wordIndices.push(idx);
    }
  });
  
  // Calculate how many words to show
  const wordsToShow = Math.ceil((visibilityPercent / 100) * words.length);
  
  // Create selection of which words to show
  const showIndices = new Set();
  if (wordsToShow > 0 && wordsToShow < words.length) {
    // Evenly distribute shown words
    const step = words.length / wordsToShow;
    for (let i = 0; i < wordsToShow; i++) {
      showIndices.add(Math.floor(i * step));
    }
  } else if (wordsToShow >= words.length) {
    // Show all words
    for (let i = 0; i < words.length; i++) {
      showIndices.add(i);
    }
  }
  
  // Process tokens
  let wordCounter = 0;
  return tokens.map((token, idx) => {
    if (wordIndices.includes(idx)) {
      const shouldShow = showIndices.has(wordCounter);
      wordCounter++;
      if (shouldShow) return token;
      
      // Hide the word - replace each character with underscore
      if (hideMode === "firstLetter" && token.length > 0) {
        return token[0] + "_".repeat(token.length - 1);
      } else {
        return "_".repeat(token.length);
      }
    }
    // Preserve spaces, newlines, punctuation, and numbers exactly as they are
    return token;
  }).join("");
}

// Version that supports randomization seed for shuffled word hiding
function processTextVisibilityRandom(text, visibilityPercent, hideMode = "firstLetter", seed = 0) {
  if (visibilityPercent >= 100) return text;
  
  const tokens = text.split(/(\s+|[.,;:!?'"()[\]{}—–-]|\d+)/);
  const words = [];
  const wordIndices = [];
  
  tokens.forEach((token, idx) => {
    if (token && !/^\s*$/.test(token) && !/^[.,;:!?'"()[\]{}—–-]$/.test(token) && !/^\d+$/.test(token)) {
      words.push(token);
      wordIndices.push(idx);
    }
  });
  
  const wordsToShow = Math.ceil((visibilityPercent / 100) * words.length);
  
  // Create randomized selection using seed
  const showIndices = new Set();
  if (wordsToShow > 0 && wordsToShow < words.length) {
    // Simple seeded shuffle
    const indices = words.map((_, i) => i);
    let s = seed || Date.now();
    for (let i = indices.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Take first wordsToShow indices
    for (let i = 0; i < wordsToShow; i++) {
      showIndices.add(indices[i]);
    }
  } else if (wordsToShow >= words.length) {
    for (let i = 0; i < words.length; i++) showIndices.add(i);
  }
  
  let wordCounter = 0;
  return tokens.map((token, idx) => {
    if (wordIndices.includes(idx)) {
      const shouldShow = showIndices.has(wordCounter);
      wordCounter++;
      if (shouldShow) return token;
      if (hideMode === "firstLetter" && token.length > 0) {
        return token[0] + "_".repeat(token.length - 1);
      }
      return "_".repeat(token.length);
    }
    return token;
  }).join("");
}

// Tappable scripture text - tap hidden words to reveal them temporarily
function TappableScriptureText({ text, visibilityPercent, hideMode = "firstLetter", seed = 0, revealedWords = {}, onWordTap, themeColor = "#d4a854" }) {
  if (visibilityPercent >= 100) return <span>{text}</span>;
  
  const tokens = text.split(/(\s+|[.,;:!?'"()[\]{}—–-]|\d+)/);
  const words = [];
  const wordIndices = [];
  
  tokens.forEach((token, idx) => {
    if (token && !/^\s*$/.test(token) && !/^[.,;:!?'"()[\]{}—–-]$/.test(token) && !/^\d+$/.test(token)) {
      words.push(token);
      wordIndices.push(idx);
    }
  });
  
  const wordsToShow = Math.ceil((visibilityPercent / 100) * words.length);
  
  // Create randomized selection using seed
  const showIndices = new Set();
  if (wordsToShow > 0 && wordsToShow < words.length) {
    const indices = words.map((_, i) => i);
    let s = seed || Date.now();
    for (let i = indices.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    for (let i = 0; i < wordsToShow; i++) {
      showIndices.add(indices[i]);
    }
  } else if (wordsToShow >= words.length) {
    for (let i = 0; i < words.length; i++) showIndices.add(i);
  }
  
  let wordCounter = 0;
  return (
    <span>
      {tokens.map((token, idx) => {
        if (wordIndices.includes(idx)) {
          const currentWordIdx = wordCounter;
          const shouldShow = showIndices.has(wordCounter);
          const isRevealed = revealedWords[currentWordIdx];
          wordCounter++;
          
          if (shouldShow) return <span key={idx}>{token}</span>;
          
          // Hidden word - make it tappable
          const hiddenText = hideMode === "firstLetter" && token.length > 0 
            ? token[0] + "_".repeat(token.length - 1)
            : "_".repeat(token.length);
          
          if (isRevealed) {
            // Show revealed word with accent background
            return (
              <span 
                key={idx}
                style={{
                  background: `${themeColor}30`,
                  padding: "1px 3px",
                  borderRadius: 4,
                  transition: "background 0.3s",
                }}
              >
                {token}
              </span>
            );
          }
          
          return (
            <span 
              key={idx}
              onClick={() => onWordTap && onWordTap(currentWordIdx)}
              style={{ cursor: "pointer" }}
            >
              {hiddenText}
            </span>
          );
        }
        return <span key={idx}>{token}</span>;
      })}
    </span>
  );
}

const DEFAULT_SCRIPTURES = [
  { type: "scripture", reference: "Articles of Faith 1:1", text: "We believe in God, the Eternal Father, and in His Son, Jesus Christ, and in the Holy Ghost.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:2", text: "We believe that men will be punished for their own sins, and not for Adam's transgression.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:3", text: "We believe that through the Atonement of Christ, all mankind may be saved, by obedience to the laws and ordinances of the Gospel.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:4", text: "We believe that the first principles and ordinances of the Gospel are: first, Faith in the Lord Jesus Christ; second, Repentance; third, Baptism by immersion for the remission of sins; fourth, Laying on of hands for the gift of the Holy Ghost.", language: "English" },
  { type: "scripture", reference: "2 Nephi 2:25", text: "Adam fell that men might be; and men are, that they might have joy.", language: "English" },
  { type: "scripture", reference: "D&C 123:17", text: "А потому, возлюбленные братья, будем же с бодростью делать всё, что в наших силах; и будем же стоять тогда спокойно с полной уверенностью, дабы увидеть спасение Божье и явление руки Его.", language: "Russian", context: "Из послания Джозефа Смита из тюрьмы Либерти, март 1839 г." },
  { type: "scripture", reference: "D&C 123:12", text: "For there are many yet on the earth among all sects, parties, and denominations, who are blinded by the subtle craftiness of men, whereby they lie in wait to deceive, and who are only kept from the truth because they know not where to find it—", language: "English", context: "From Joseph Smith's letter from Liberty Jail, March 1839." },
];

// All Articles of Faith for suggested queue
const ALL_ARTICLES_OF_FAITH = [
  { type: "scripture", reference: "Articles of Faith 1:1", text: "We believe in God, the Eternal Father, and in His Son, Jesus Christ, and in the Holy Ghost.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:2", text: "We believe that men will be punished for their own sins, and not for Adam's transgression.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:3", text: "We believe that through the Atonement of Christ, all mankind may be saved, by obedience to the laws and ordinances of the Gospel.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:4", text: "We believe that the first principles and ordinances of the Gospel are: first, Faith in the Lord Jesus Christ; second, Repentance; third, Baptism by immersion for the remission of sins; fourth, Laying on of hands for the gift of the Holy Ghost.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:5", text: "We believe that a man must be called of God, by prophecy, and by the laying on of hands by those who are in authority, to preach the Gospel and administer in the ordinances thereof.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:6", text: "We believe in the same organization that existed in the Primitive Church, namely, apostles, prophets, pastors, teachers, evangelists, and so forth.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:7", text: "We believe in the gift of tongues, prophecy, revelation, visions, healing, interpretation of tongues, and so forth.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:8", text: "We believe the Bible to be the word of God as far as it is translated correctly; we also believe the Book of Mormon to be the word of God.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:9", text: "We believe all that God has revealed, all that He does now reveal, and we believe that He will yet reveal many great and important things pertaining to the Kingdom of God.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:10", text: "We believe in the literal gathering of Israel and in the restoration of the Ten Tribes; that Zion (the New Jerusalem) will be built upon the American continent; that Christ will reign personally upon the earth; and, that the earth will be renewed and receive its paradisiacal glory.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:11", text: "We claim the privilege of worshiping Almighty God according to the dictates of our own conscience, and allow all men the same privilege, let them worship how, where, or what they may.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:12", text: "We believe in being subject to kings, presidents, rulers, and magistrates, in obeying, honoring, and sustaining the law.", language: "English" },
  { type: "scripture", reference: "Articles of Faith 1:13", text: "We believe in being honest, true, chaste, benevolent, virtuous, and in doing good to all men; indeed, we may say that we follow the admonition of Paul—We believe all things, we hope all things, we have endured many things, and hope to be able to endure all things. If there is anything virtuous, lovely, or of good report or praiseworthy, we seek after these things.", language: "English" },
];

// Random filler words by language for games
const RANDOM_WORDS_BY_LANGUAGE = {
  English: ["the", "and", "unto", "that", "shall", "Lord", "which", "with", "they", "have", "from", "were", "this", "upon", "said", "behold", "came", "word", "people", "things", "again", "therefore", "even", "through", "also", "made", "before", "over", "great", "after"],
  Russian: ["и", "в", "на", "что", "он", "с", "как", "но", "его", "не", "это", "по", "быть", "который", "они", "от", "она", "так", "же", "для", "мы", "все", "был", "есть", "когда", "уже", "или", "если", "только", "него"],
  Spanish: ["el", "la", "de", "que", "en", "los", "del", "se", "las", "por", "un", "para", "con", "no", "una", "su", "al", "es", "lo", "como", "más", "pero", "sus", "le", "ya", "fue", "este", "ha", "sí", "porque"],
  Portuguese: ["o", "de", "que", "e", "do", "da", "em", "um", "para", "é", "com", "não", "uma", "os", "no", "se", "na", "por", "mais", "as", "dos", "como", "mas", "foi", "ao", "ele", "das", "tem", "à", "seu"],
  French: ["le", "de", "un", "être", "et", "à", "il", "avoir", "ne", "je", "son", "que", "se", "qui", "ce", "dans", "en", "du", "elle", "au", "pour", "pas", "que", "vous", "par", "sur", "faire", "plus", "dire", "me"],
  German: ["der", "die", "und", "in", "den", "von", "zu", "das", "mit", "sich", "des", "auf", "für", "ist", "im", "dem", "nicht", "ein", "eine", "als", "auch", "es", "an", "er", "hat", "aus", "bei", "sie", "nach", "wird"],
  Italian: ["di", "che", "è", "e", "la", "il", "un", "a", "per", "in", "una", "mi", "sono", "ho", "ma", "lo", "ha", "cosa", "le", "con", "ti", "se", "no", "da", "non", "ci", "io", "questo", "bene", "sei"],
  Japanese: ["の", "に", "は", "を", "た", "が", "で", "て", "と", "し", "れ", "さ", "ある", "い", "も", "な", "こと", "から", "ない", "する", "よう", "その", "この", "など", "また", "これ", "いる", "もの", "ため", "それ"],
  Chinese: ["的", "一", "是", "不", "了", "在", "人", "有", "我", "他", "这", "个", "们", "中", "来", "上", "大", "为", "和", "国", "地", "到", "以", "说", "时", "要", "就", "出", "会", "可"],
  Korean: ["이", "는", "을", "의", "에", "가", "를", "하", "로", "다", "고", "에서", "으로", "은", "도", "와", "한", "들", "그", "수", "있", "것", "지", "않", "나", "대", "등", "보", "같", "더"],
};

// --- Utilities ---
function getWeekNumber(date) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d - startOfYear;
  return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
}

function getWeekKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`;
}

function getWeekStart(weekKey) {
  const [year, wk] = weekKey.split('-W').map(Number);
  const firstMonday = new Date(year, 0, 1 + (1 - new Date(year, 0, 1).getDay() + 7) % 7);
  if (new Date(year, 0, 1).getDay() <= 1) firstMonday.setDate(firstMonday.getDate() - 7);
  const weekStart = new Date(firstMonday);
  weekStart.setDate(weekStart.getDate() + (wk - 1) * 7);
  return weekStart;
}

function weeksAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return getWeekKey(d);
}

function formatWeekLabel(weekKey) {
  const current = getWeekKey(new Date());
  if (weekKey === current) return "This Week";
  const currentStart = getWeekStart(current);
  const targetStart = getWeekStart(weekKey);
  const diffWeeks = Math.round((currentStart - targetStart) / WEEK_MS);
  if (diffWeeks === 1) return "Last Week";
  if (diffWeeks > 0) return `${diffWeeks} Weeks Ago`;
  if (diffWeeks === -1) return "Next Week";
  return `In ${Math.abs(diffWeeks)} Weeks`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Practice day resets at 10pm — if before 10pm, it's "today"; if after 10pm, it's "tomorrow"
function practiceDayKey() {
  const now = new Date();
  // If it's 10pm or later, the practice day has rolled over to "tomorrow"
  if (now.getHours() >= 22) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
  }
  return todayKey();
}

// Build a churchofjesuschrist.org scripture URL from a reference string
function getGospelLibraryUrl(item) {
  if (item.url) return item.url; // user-provided URL wins
  if (item.type !== "scripture") return null;
  const ref = (item.reference || "").trim();
  if (!ref) return null;

  // Map book names → URL slugs
  const bookToSlug = {
    "1 nephi": ["bofm", "1-ne"], "2 nephi": ["bofm", "2-ne"], "jacob": ["bofm", "jacob"],
    "enos": ["bofm", "enos"], "jarom": ["bofm", "jarom"], "omni": ["bofm", "omni"],
    "words of mormon": ["bofm", "w-of-m"], "mosiah": ["bofm", "mosiah"], "alma": ["bofm", "alma"],
    "helaman": ["bofm", "hel"], "3 nephi": ["bofm", "3-ne"], "4 nephi": ["bofm", "4-ne"],
    "mormon": ["bofm", "morm"], "ether": ["bofm", "ether"], "moroni": ["bofm", "moro"],
    "d&c": ["dc-testament", "dc"], "doctrine and covenants": ["dc-testament", "dc"],
    "moses": ["pgp", "moses"], "abraham": ["pgp", "abr"], "js—matthew": ["pgp", "js-m"],
    "js—history": ["pgp", "js-h"], "articles of faith": ["pgp", "a-of-f"],
    "genesis": ["ot", "gen"], "exodus": ["ot", "ex"], "leviticus": ["ot", "lev"],
    "numbers": ["ot", "num"], "deuteronomy": ["ot", "deut"], "joshua": ["ot", "josh"],
    "judges": ["ot", "judg"], "ruth": ["ot", "ruth"], "1 samuel": ["ot", "1-sam"],
    "2 samuel": ["ot", "2-sam"], "1 kings": ["ot", "1-kgs"], "2 kings": ["ot", "2-kgs"],
    "1 chronicles": ["ot", "1-chr"], "2 chronicles": ["ot", "2-chr"], "ezra": ["ot", "ezra"],
    "nehemiah": ["ot", "neh"], "esther": ["ot", "esth"], "job": ["ot", "job"],
    "psalms": ["ot", "ps"], "psalm": ["ot", "ps"], "proverbs": ["ot", "prov"],
    "ecclesiastes": ["ot", "eccl"], "song of solomon": ["ot", "song"], "isaiah": ["ot", "isa"],
    "jeremiah": ["ot", "jer"], "lamentations": ["ot", "lam"], "ezekiel": ["ot", "ezek"],
    "daniel": ["ot", "dan"], "hosea": ["ot", "hosea"], "joel": ["ot", "joel"],
    "amos": ["ot", "amos"], "obadiah": ["ot", "obad"], "jonah": ["ot", "jonah"],
    "micah": ["ot", "micah"], "nahum": ["ot", "nahum"], "habakkuk": ["ot", "hab"],
    "zephaniah": ["ot", "zeph"], "haggai": ["ot", "hag"], "zechariah": ["ot", "zech"],
    "malachi": ["ot", "mal"], "matthew": ["nt", "matt"], "mark": ["nt", "mark"],
    "luke": ["nt", "luke"], "john": ["nt", "john"], "acts": ["nt", "acts"],
    "romans": ["nt", "rom"], "1 corinthians": ["nt", "1-cor"], "2 corinthians": ["nt", "2-cor"],
    "galatians": ["nt", "gal"], "ephesians": ["nt", "eph"], "philippians": ["nt", "philip"],
    "colossians": ["nt", "col"], "1 thessalonians": ["nt", "1-thes"], "2 thessalonians": ["nt", "2-thes"],
    "1 timothy": ["nt", "1-tim"], "2 timothy": ["nt", "2-tim"], "titus": ["nt", "titus"],
    "philemon": ["nt", "philem"], "hebrews": ["nt", "heb"], "james": ["nt", "james"],
    "1 peter": ["nt", "1-pet"], "2 peter": ["nt", "2-pet"], "1 john": ["nt", "1-jn"],
    "2 john": ["nt", "2-jn"], "3 john": ["nt", "3-jn"], "jude": ["nt", "jude"],
    "revelation": ["nt", "rev"], "revelations": ["nt", "rev"],
  };

  // Parse "Book Chapter:Verse" or "Book Chapter:Start-End"
  // Handle "Articles of Faith 1:1", "D&C 123:17", "1 Nephi 3:7", etc.
  const m = ref.match(/^(.+?)\s+(\d+)(?::(\d+(?:-\d+)?))?$/i);
  if (!m) return null;
  const bookName = m[1].trim().toLowerCase();
  const chapter = m[2];
  const verse = m[3];
  const slug = bookToSlug[bookName];
  if (!slug) return null;

  let url = `https://www.churchofjesuschrist.org/study/scriptures/${slug[0]}/${slug[1]}/${chapter}`;
  if (verse) url += `.${verse}`;
  url += `?lang=${item.language === "Russian" ? "rus" : "eng"}`;
  return url;
}

// Generate the next 52 weeks as week keys
function getNext52Weeks() {
  const weeks = [];
  for (let i = 0; i <= 52; i++) {
    weeks.push(weeksAgo(-i));
  }
  return weeks;
}

// Generate week options for dropdown: 16 weeks before earliest item through 52 weeks future
function getWeekOptionsForUser(userItems) {
  const currentWeek = getWeekKey(new Date());
  
  // Find earliest week among items
  let earliestWeek = currentWeek;
  userItems.forEach(it => {
    if (it.weekKey && it.weekKey < earliestWeek) {
      earliestWeek = it.weekKey;
    }
  });
  
  // Go 16 weeks before the earliest
  const earliestStart = getWeekStart(earliestWeek);
  const extendedStart = new Date(earliestStart);
  extendedStart.setDate(extendedStart.getDate() - 16 * 7);
  const startWeek = getWeekKey(extendedStart);
  
  // Go 52 weeks into the future
  const futureWeeks = getNext52Weeks();
  const endWeek = futureWeeks[futureWeeks.length - 1];
  
  // Count items per week
  const itemCounts = {};
  userItems.forEach(it => {
    itemCounts[it.weekKey] = (itemCounts[it.weekKey] || 0) + 1;
  });
  
  // Generate all weeks from start to end
  const options = [];
  let w = startWeek;
  while (w <= endWeek) {
    const count = itemCounts[w] || 0;
    const isPast = w < currentWeek;
    options.push({
      key: w,
      label: formatWeekLabel(w),
      count: count,
      empty: isPast && count === 0,
    });
    // Advance to next week
    const ws = getWeekStart(w);
    ws.setDate(ws.getDate() + 7);
    w = getWeekKey(ws);
  }
  
  return options;
}

// --- Storage (with backup redundancy) ---
const STORAGE_KEY = "scripture_memorizer_data";

/*
 * +==========================================================================+
 * |                    📦 EMBEDDED USER DATA SNAPSHOT 📦                     |
 * +==========================================================================+
 * | This JSON snapshot preserves Matt's scripture data across code updates.  |
 * | It serves as a fallback if localStorage is empty or corrupted.           |
 * | Update this snapshot whenever significant user data changes occur.       |
 * | Last updated: 2026-02-08                                                 |
 * +==========================================================================+
 */
const EMBEDDED_USER_DATA = {
  "activeUserId": "matt_primary",
  "defaultUserId": "matt_primary",
  "users": [
    {
      "id": "matt_primary",
      "name": "Matt",
      "birthdate": "",
      "avatarColor": "#d4a854",
      "avatarEmoji": "📖",
      "customLanguages": [],
      "archive": [],
      "items": [
        {
          "id": "item_dc123_17_eng",
          "type": "scripture",
          "reference": "D&C 123:17",
          "author": "",
          "title": "",
          "year": "",
          "source": "",
          "context": "From Joseph Smith's letter from Liberty Jail, March 1839. An exhortation to the Saints to cheerfully do all in their power and then trust in God.",
          "url": "",
          "text": "Therefore, dearly beloved brethren, let us cheerfully do all things that lie in our power; and then may we stand still, with the utmost assurance, to see the salvation of God, and for his arm to be revealed.",
          "language": "English",
          "weekKey": "2026-W06",
          "createdAt": "2026-02-01T00:00:00.000Z",
          "practices": {},
          "gotIts": {},
          "lifetimePractices": 0,
          "lifetimeGotIts": 0,
          "comments": []
        },
        {
          "id": "item_mosiah_4_9",
          "type": "scripture",
          "reference": "Mosiah 4:9",
          "author": "",
          "title": "",
          "year": "",
          "source": "",
          "context": "King Benjamin's address to his people.",
          "url": "",
          "text": "Believe in God; believe that he is, and that he created all things, both in heaven and in earth; believe that he has all wisdom, and all power, both in heaven and in earth; believe that man doth not comprehend all the things which the Lord can comprehend.",
          "language": "English",
          "weekKey": "2026-W05",
          "createdAt": "2026-01-25T00:00:00.000Z",
          "practices": {},
          "gotIts": {},
          "lifetimePractices": 0,
          "lifetimeGotIts": 0,
          "comments": []
        },
        {
          "id": "item_mortality_poem",
          "type": "poem/lyrics",
          "reference": "",
          "author": "William Knox",
          "title": "Mortality",
          "year": "1824",
          "source": "",
          "context": "Purportedly one of Abraham Lincoln's favorite poems. Lincoln was known to recite it from memory and was so moved by it that many assumed he had written it himself.",
          "url": "",
          "text": "Oh why should the spirit of mortal be proud?\nLike a swift-fleeting meteor, a fast-flying cloud,\nA flash of the lightning, a break of the wave,\nHe passeth from life to his rest in the grave.",
          "language": "English",
          "weekKey": "2026-W04",
          "createdAt": "2026-01-18T00:00:00.000Z",
          "practices": {},
          "gotIts": {},
          "lifetimePractices": 0,
          "lifetimeGotIts": 0,
          "comments": []
        },
        {
          "id": "item_1ne_3_7",
          "type": "scripture",
          "reference": "1 Nephi 3:7",
          "author": "",
          "title": "",
          "year": "",
          "source": "",
          "context": "Nephi's response to his father Lehi when asked to return to Jerusalem for the brass plates.",
          "url": "",
          "text": "And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.",
          "language": "English",
          "weekKey": "2026-W03",
          "createdAt": "2026-01-11T00:00:00.000Z",
          "practices": {},
          "gotIts": {},
          "lifetimePractices": 0,
          "lifetimeGotIts": 0,
          "comments": []
        },
        {
          "id": "item_2ne_2_25",
          "type": "scripture",
          "reference": "2 Nephi 2:25",
          "author": "",
          "title": "",
          "year": "",
          "source": "",
          "context": "Lehi's teaching to his son Jacob about the necessity of the Fall of Adam.",
          "url": "",
          "text": "Adam fell that men might be; and men are, that they might have joy.",
          "language": "English",
          "weekKey": "2026-W02",
          "createdAt": "2026-01-04T00:00:00.000Z",
          "practices": {},
          "gotIts": {},
          "lifetimePractices": 0,
          "lifetimeGotIts": 0,
          "comments": []
        },
        {
          "id": "item_alma_37_37",
          "type": "scripture",
          "reference": "Alma 37:37",
          "author": "",
          "title": "",
          "year": "",
          "source": "",
          "context": "Alma's counsel to his son Helaman.",
          "url": "",
          "text": "Counsel with the Lord in all thy doings, and he will direct thee for good; yea, when thou liest down at night lie down unto the Lord, that he may watch over you in your sleep; and when thou risest in the morning let thy heart be full of thanks unto God; and if ye do these things, ye shall be lifted up at the last day.",
          "language": "English",
          "weekKey": "2026-W01",
          "createdAt": "2025-12-28T00:00:00.000Z",
          "practices": {},
          "gotIts": {},
          "lifetimePractices": 0,
          "lifetimeGotIts": 0,
          "comments": []
        }
      ],
      "suggestedQueue": [
        {
          "id": "sug_aof_1",
          "type": "scripture",
          "reference": "Articles of Faith 1:1",
          "text": "We believe in God, the Eternal Father, and in His Son, Jesus Christ, and in the Holy Ghost.",
          "language": "English",
          "context": ""
        },
        {
          "id": "sug_aof_2",
          "type": "scripture",
          "reference": "Articles of Faith 1:2",
          "text": "We believe that men will be punished for their own sins, and not for Adam's transgression.",
          "language": "English",
          "context": ""
        },
        {
          "id": "sug_aof_3",
          "type": "scripture",
          "reference": "Articles of Faith 1:3",
          "text": "We believe that through the Atonement of Christ, all mankind may be saved, by obedience to the laws and ordinances of the Gospel.",
          "language": "English",
          "context": ""
        },
        {
          "id": "sug_aof_4",
          "type": "scripture",
          "reference": "Articles of Faith 1:4",
          "text": "We believe that the first principles and ordinances of the Gospel are: first, Faith in the Lord Jesus Christ; second, Repentance; third, Baptism by immersion for the remission of sins; fourth, Laying on of hands for the gift of the Holy Ghost.",
          "language": "English",
          "context": ""
        },
        {
          "id": "sug_2ne_2_25",
          "type": "scripture",
          "reference": "2 Nephi 2:25",
          "text": "Adam fell that men might be; and men are, that they might have joy.",
          "language": "English",
          "context": ""
        },
        {
          "id": "sug_dc123_17_rus",
          "type": "scripture",
          "reference": "D&C 123:17",
          "text": "А потому, возлюбленные братья, будем же с бодростью делать всё, что в наших силах; и будем же стоять тогда спокойно с полной уверенностью, дабы увидеть спасение Божье и явление руки Его.",
          "language": "Russian",
          "context": "Из послания Джозефа Смита из тюрьмы Либерти, март 1839 г."
        },
        {
          "id": "sug_dc123_12_eng",
          "type": "scripture",
          "reference": "D&C 123:12",
          "text": "For there are many yet on the earth among all sects, parties, and denominations, who are blinded by the subtle craftiness of men, whereby they lie in wait to deceive, and who are only kept from the truth because they know not where to find it—",
          "language": "English",
          "context": "From Joseph Smith's letter from Liberty Jail, March 1839."
        }
      ]
    },
    {
      "id": "abi_user",
      "name": "Abi",
      "birthdate": "",
      "avatarColor": "#a8e6cf",
      "avatarEmoji": "🦄",
      "customLanguages": [],
      "archive": [],
      "items": [],
      "suggestedQueue": [
        {
          "id": "abi_sug_2ne",
          "type": "scripture",
          "reference": "2 Nephi 2:25",
          "text": "Adam fell that men might be; and men are, that they might have joy.",
          "language": "English",
          "context": ""
        }
      ]
    },
    {
      "id": "matty_user",
      "name": "Matty",
      "birthdate": "",
      "avatarColor": "#6a9e5a",
      "avatarEmoji": "🚴",
      "customLanguages": [],
      "archive": [],
      "items": [],
      "suggestedQueue": [
        {
          "id": "matty_sug_2ne",
          "type": "scripture",
          "reference": "2 Nephi 2:25",
          "text": "Adam fell that men might be; and men are, that they might have joy.",
          "language": "English",
          "context": ""
        }
      ]
    }
  ]
};

function loadData() {
  // 1. Try localStorage first
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.users && parsed.users.length > 0) return parsed;
    }
  } catch(e) {}
  // 2. Try window backup
  if (window.__SCRIPTURE_BACKUP) {
    try { return JSON.parse(JSON.stringify(window.__SCRIPTURE_BACKUP)); } catch(e) {}
  }
  // 3. Fall back to embedded snapshot (preserves Matt's data across code updates)
  if (EMBEDDED_USER_DATA && EMBEDDED_USER_DATA.users && EMBEDDED_USER_DATA.users.length > 0) {
    console.log("📖 Scripture Memorizer: Restoring from embedded snapshot");
    return JSON.parse(JSON.stringify(EMBEDDED_USER_DATA));
  }
  return null;
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.__SCRIPTURE_BACKUP = JSON.parse(JSON.stringify(data));
  } catch(e) {
    console.error("Failed to save scripture data:", e);
  }
}

function createDefaultUser(name, birthdate) {
  const now = new Date();
  const items = [];
  const preloaded = [
    { type: "scripture", reference: "2 Nephi 2:25", text: "Adam fell that men might be; and men are, that they might have joy.", context: "Lehi's teaching to his son Jacob about the necessity of the Fall of Adam.", weekOffset: 0 },
  ];

  preloaded.forEach((p, i) => {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - p.weekOffset * 7);
    items.push({
      id: generateId() + i,
      type: p.type,
      reference: p.reference || "",
      author: p.author || "",
      title: p.title || "",
      year: p.year || "",
      source: p.source || "",
      context: p.context || "",
      url: "",
      text: p.text,
      language: "English",
      weekKey: getWeekKey(weekDate),
      createdAt: weekDate.toISOString(),
      practices: {},
      gotIts: {},
      lifetimePractices: 0,
      lifetimeGotIts: 0,
      comments: [],
    });
  });

  // Create suggested queue from all Articles of Faith (avoiding duplicates with items)
  const itemRefs = new Set(items.map(i => i.reference));
  const suggestedQueue = ALL_ARTICLES_OF_FAITH.filter(a => !itemRefs.has(a.reference)).map((s, i) => ({ ...s, id: generateId() + 's' + i }));

  return {
    id: generateId(),
    name: name,
    birthdate: birthdate || "",
    items: items,
    archive: [],
    suggestedQueue: suggestedQueue,
    customLanguages: [],
    // Word visibility settings
    defaultVisibility: 70, // 0-100, percentage of words shown by default
    hideMode: "full", // "firstLetter" or "full" (underscore only)
    // Guidance tracking - each key tracks if user has seen that tip
    guidanceSeen: {},
    // Game stats
    flashAttackCompletions: 0,
    matchingGameCompletions: 0,
    dragDropCompletions: 0,
    holdToRodCompletions: 0,
    fillBlanksCompletions: 0,
    cardPickupCompletions: 0,
    whackAMoleCompletions: 0,
  };
}

// Creates a fresh app state for a brand-new user (used in web app instead of EMBEDDED_USER_DATA)
function createFreshUserData() {
  const user = createDefaultUser("Me");
  user.id = generateId();
  return {
    activeUserId: user.id,
    defaultUserId: user.id,
    users: [user],
  };
}

function initData() {
  let data = loadData();
  if (data && data.users && data.users.length > 0) {
    // Migrate: ensure all items have `context` field, all users have `archive`
    data.users = data.users.map(u => {
      const migrated = {
        ...u,
        items: (u.items || []).map(it => ({ context: "", ...it })),
        archive: (u.archive || []).map(it => ({ context: "", ...it })),
        suggestedQueue: (u.suggestedQueue || []).map(s => ({ context: "", ...s })),
        customLanguages: u.customLanguages || [],
      };
      // Migrate: add all Articles of Faith that aren't already in queue or items
      const allExistingRefs = new Set([
        ...migrated.items.map(it => `${it.reference}|${it.language || "English"}`),
        ...migrated.suggestedQueue.map(s => `${s.reference}|${s.language || "English"}`),
        ...migrated.archive.map(it => `${it.reference}|${it.language || "English"}`),
      ]);
      ALL_ARTICLES_OF_FAITH.forEach(ds => {
        const key = `${ds.reference}|${ds.language || "English"}`;
        if (!allExistingRefs.has(key)) {
          migrated.suggestedQueue.push({ ...ds, context: ds.context || "", id: generateId() + 'sm' });
        }
      });
      return migrated;
    });
    // On app load, if there's a defaultUserId set, switch to that user
    // If no default is set, start from user switcher
    if (data.defaultUserId && data.users.some(u => u.id === data.defaultUserId)) {
      data.activeUserId = data.defaultUserId;
    }
    saveData(data);
    return data;
  }
  const defaultUser = createDefaultUser("Matt", "");
  data = { users: [defaultUser], activeUserId: defaultUser.id, defaultUserId: defaultUser.id };
  saveData(data);
  return data;
}

// --- Notification helper ---
function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function scheduleDailyNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  const target = new Date(now);
  target.setHours(7, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const ms = target - now;
  setTimeout(() => {
    if (document.hidden) {
      new Notification("📖 Scripture Memorizer", {
        body: "Time for your daily practice! Open the app to review your scriptures.",
        icon: "📖",
      });
    }
    scheduleDailyNotification();
  }, ms);
}

// --- Stochastic animation particles ---
function spawnParticles(buttonEl, type) {
  if (!buttonEl) return;
  const rect = buttonEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const count = type === "practice" ? 6 + Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 6);
  const colors = type === "practice"
    ? ["#d4a854", "#e8c878", "#f5e0a0", "#c49438", "#fff3d0"]
    : ["#FFD700", "#FFA500", "#FF6347", "#32CD32", "#00BFFF", "#FF69B4"];

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const size = type === "practice" ? 4 + Math.random() * 6 : 6 + Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;
    const velocity = type === "practice" ? 40 + Math.random() * 60 : 50 + Math.random() * 90;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - (type === "gotit" ? 30 : 0);
    const rotation = Math.random() * 720 - 360;
    const dur = 500 + Math.random() * 400;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const isCircle = Math.random() > 0.4;

    Object.assign(el.style, {
      position: "fixed", left: cx + "px", top: cy + "px",
      width: size + "px", height: size + "px", background: color,
      borderRadius: isCircle ? "50%" : (Math.random() > 0.5 ? "2px" : "0"),
      pointerEvents: "none", zIndex: "99999",
      transform: "translate(-50%, -50%)",
      transition: `all ${dur}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      opacity: "1",
      boxShadow: type === "practice" ? `0 0 ${4 + Math.random() * 8}px ${color}` : `0 0 ${6 + Math.random() * 12}px ${color}`,
    });

    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotation}deg) scale(0.2)`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), dur + 50);
  }
}

function spawnGlowRing(buttonEl) {
  if (!buttonEl) return;
  const rect = buttonEl.getBoundingClientRect();
  const el = document.createElement("div");
  const hueShift = Math.random() * 20 - 10;
  Object.assign(el.style, {
    position: "fixed", left: (rect.left - 8) + "px", top: (rect.top - 8) + "px",
    width: (rect.width + 16) + "px", height: (rect.height + 16) + "px",
    borderRadius: "16px",
    border: `2px solid rgba(212, ${168 + hueShift}, 84, 0.8)`,
    boxShadow: `0 0 ${15 + Math.random() * 15}px rgba(212, 168, 84, ${0.4 + Math.random() * 0.3}), inset 0 0 ${10 + Math.random() * 10}px rgba(212, 168, 84, 0.1)`,
    pointerEvents: "none", zIndex: "99998",
    transition: "all 600ms ease-out", opacity: "1",
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = `scale(${1.3 + Math.random() * 0.4})`;
    el.style.opacity = "0";
  });
  setTimeout(() => el.remove(), 650);
}

// --- Progress celebration tiers ---
const CELEBRATION_TIERS = [
  { threshold: 0.2, emoji: "👏", message: "Good start!", bg: "#f0e8d8" },
  { threshold: 0.4, emoji: "🔥", message: "On a roll!", bg: "#f5e0a0" },
  { threshold: 0.6, emoji: "⚡", message: "Over halfway!", bg: "#ffd700" },
  { threshold: 0.8, emoji: "🌟", message: "Almost there!", bg: "#ffb347" },
  { threshold: 1.0, emoji: "🏆", message: "ALL DONE!", bg: "#ff6347" },
];

function getProgressTier(progress) {
  for (let i = CELEBRATION_TIERS.length - 1; i >= 0; i--) {
    if (progress >= CELEBRATION_TIERS[i].threshold) return CELEBRATION_TIERS[i];
  }
  return null;
}

// --- Icons ---
function IconMenu({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function IconX({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconPlus({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconCheck({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconDownload({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconChevron({ size = 16, direction = "right" }) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[direction];
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rot}deg)`, transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>;
}
function IconDots({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
}
function IconPlay({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
}
function IconStop({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>;
}
function IconUser({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IconGrip({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>;
}
function IconMessage({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
}
function IconExpand({ size = 18, expanded }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {expanded ? (<><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></>) : (<><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>)}
  </svg>;
}
function IconBell({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function IconArchive({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
}
// Menu icons (Lucide-style)
function IconBook({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
}
function IconLibrary({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>;
}
function IconCalendar({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconStar({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function IconShootingStar({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L15 22l-3-9-9-3L22 2z"/></svg>;
}
function IconPencil({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
}
function IconUsers({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function IconSettings({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}
function IconRestore({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.27-10.77L1 10"/></svg>;
}
function IconTrash({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
}
function IconHelp({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function IconGamepad({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>;
}
function IconZap({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function IconGrid({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconShuffle({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
}
function IconTarget({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}

// --- Footer spacer (mobile-friendly bottom padding) ---
function PageFooter() {
  return <div style={{ height: "50vh", pointerEvents: "none" }} aria-hidden="true" />;
}

// --- Modal Dialog ---
function Modal({ open, onClose, title, children, width }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div onClick={onClose} style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(44,36,22,0.6)", animation: "fadeIn 0.2s ease",
      }} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 18,
        padding: "20px", width: width || "min(400px, 90vw)", maxHeight: "85vh",
        overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        animation: "popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        {title && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0e8d8",
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Instrument Sans', sans-serif", color: "#2c2416" }}>{title}</div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#a89878", cursor: "pointer", padding: 4 }}><IconX size={20} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// --- Scripture Selector (Dropdown with search/filter) ---
function ScriptureSelector({ 
  items, 
  selected, 
  onSelect, 
  multiSelect = false,
  placeholder = "Select scripture...",
  themeColor = "#d4a854" 
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Sort by least practiced (lifetimeGotIts + lifetimePractices)
  const sortedItems = [...items].sort((a, b) => {
    const aScore = (a.lifetimeGotIts || 0) + (a.lifetimePractices || 0);
    const bScore = (b.lifetimeGotIts || 0) + (b.lifetimePractices || 0);
    return aScore - bScore;
  });
  
  // Filter by search
  const filteredItems = sortedItems.filter(item => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    const ref = (item.reference || item.title || item.author || "").toLowerCase();
    const text = (item.text || "").toLowerCase();
    return ref.includes(searchLower) || text.includes(searchLower);
  });
  
  const getLabel = (item) => {
    const ref = item.type === "scripture" ? item.reference : (item.title ? `"${item.title}"` : item.author);
    const lang = item.language && item.language !== "English" ? ` [${item.language}]` : "";
    return ref + lang;
  };
  
  const selectedItem = multiSelect ? null : items.find(i => i.id === selected);
  const selectedItems = multiSelect ? items.filter(i => (selected || []).includes(i.id)) : [];
  
  const handleSelect = (item) => {
    if (multiSelect) {
      const currentSelected = selected || [];
      if (currentSelected.includes(item.id)) {
        onSelect(currentSelected.filter(id => id !== item.id));
      } else {
        onSelect([...currentSelected, item.id]);
      }
    } else {
      onSelect(item.id);
      setOpen(false);
      setSearch("");
    }
  };
  
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: `1px solid ${open ? themeColor : "#d4cbb8"}`,
        background: "#fff", textAlign: "left",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", fontSize: 13, color: "#3d3222",
        fontFamily: "'Instrument Sans', sans-serif",
      }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {multiSelect 
            ? (selectedItems.length > 0 ? `${selectedItems.length} selected` : placeholder)
            : (selectedItem ? getLabel(selectedItem) : placeholder)
          }
        </span>
        <IconChevron size={16} direction={open ? "up" : "down"} style={{ flexShrink: 0, marginLeft: 8, color: "#8a7a62" }} />
      </button>
      
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
          background: "#fff", borderRadius: 12, border: "1px solid #d4cbb8",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 100,
          maxHeight: 280, display: "flex", flexDirection: "column",
        }}>
          {/* Search input */}
          <div style={{ padding: "8px", borderBottom: "1px solid #e8e0d4" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              autoFocus
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 8,
                border: "1px solid #e0d8cc", background: "#faf8f4",
                fontSize: 13, outline: "none",
              }}
            />
          </div>
          
          {/* Items list */}
          <div style={{ overflow: "auto", flex: 1 }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "#a89878", fontSize: 13 }}>
                No scriptures found
              </div>
            ) : filteredItems.map(item => {
              const isSelected = multiSelect 
                ? (selected || []).includes(item.id)
                : selected === item.id;
              const practiceCount = (item.lifetimeGotIts || 0) + (item.lifetimePractices || 0);
              return (
                <button key={item.id} onClick={() => handleSelect(item)} style={{
                  width: "100%", padding: "10px 12px", border: "none",
                  background: isSelected ? `${themeColor}15` : "transparent",
                  textAlign: "left", cursor: "pointer",
                  borderBottom: "1px solid #f0ebe4",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {multiSelect && (
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: isSelected ? "none" : "2px solid #d4cbb8",
                      background: isSelected ? themeColor : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 12,
                    }}>
                      {isSelected && "✓"}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: 13, fontWeight: 500, color: "#3d3222",
                      fontFamily: "'Instrument Sans', sans-serif",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {getLabel(item)}
                    </div>
                    <div style={{ 
                      fontSize: 11, color: "#a89878", marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {item.text.slice(0, 50)}...
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: "#c0b0a0", flexShrink: 0 }}>
                    {practiceCount}×
                  </span>
                </button>
              );
            })}
          </div>
          
          {multiSelect && (
            <div style={{ padding: "8px", borderTop: "1px solid #e8e0d4" }}>
              <button onClick={() => setOpen(false)} style={{
                width: "100%", padding: "8px", borderRadius: 8, border: "none",
                background: themeColor, color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
              }}>Done</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Guidance Tip (one-time friendly tips for new users) ---
function GuidanceTip({ tipKey, user, updateUser, children, style = {} }) {
  const seen = user?.guidanceSeen?.[tipKey];
  const [dismissed, setDismissed] = useState(false);
  
  if (seen || dismissed) return null;
  
  const handleDismiss = () => {
    setDismissed(true);
    if (updateUser && user) {
      updateUser({
        ...user,
        guidanceSeen: { ...(user.guidanceSeen || {}), [tipKey]: true },
      });
    }
  };
  
  return (
    <div style={{
      margin: "12px 16px", padding: "14px 16px",
      background: "linear-gradient(135deg, #e8f4fd, #f0f8ff)",
      borderRadius: 12, border: "1px solid #b8d4e8",
      position: "relative", ...(style || {}),
    }}>
      <button onClick={handleDismiss} style={{
        position: "absolute", top: 8, right: 8,
        background: "none", border: "none", color: "#8ab4d4",
        cursor: "pointer", padding: 4, lineHeight: 1,
      }}>
        <IconX size={16} />
      </button>
      <div style={{ 
        fontSize: 13, color: "#4a7a9a", lineHeight: 1.5, paddingRight: 20,
        fontFamily: "'Instrument Sans', sans-serif",
      }}>
        💡 {children}
      </div>
    </div>
  );
}

// --- Floating Action Button (FAB) for adding scriptures ---
function FloatingAddButton({ onClick }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div style={{ position: "fixed", bottom: 24, right: 20, zIndex: 50 }}>
      {expanded && (
        <div style={{
          position: "absolute", bottom: 60, right: 0,
          background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          overflow: "hidden", minWidth: 160, animation: "popIn 0.2s ease",
        }}>
          <button onClick={() => { onClick("scripture"); setExpanded(false); }} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "14px 16px", border: "none", background: "none",
            cursor: "pointer", fontSize: 14, fontFamily: "'Instrument Sans', sans-serif",
            color: "#2c2416", borderBottom: "1px solid #f0e8d8",
          }}>
            📖 Scripture
          </button>
          <button onClick={() => { onClick("poem/lyrics"); setExpanded(false); }} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "14px 16px", border: "none", background: "none",
            cursor: "pointer", fontSize: 14, fontFamily: "'Instrument Sans', sans-serif",
            color: "#2c2416",
          }}>
            📝 Poem / Lyrics
          </button>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #d4a854, #c4943e)",
          border: "none", boxShadow: "0 4px 16px rgba(212,168,84,0.4)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", transition: "transform 0.2s",
          transform: expanded ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        <IconPlus size={24} />
      </button>
    </div>
  );
}

// --- Main App ---

export default function ScriptureApp({ session, initialData, dataLoading, persist }) {
  // Use initialData from Supabase, fall back to embedded snapshot for first-time users
  const [data, setData] = useState(() => {
    if (initialData && initialData.users && initialData.users.length > 0) return initialData;
    // First time user — create a fresh single-user setup with their Google name/email
    return createFreshUserData();
  });
  const [page, setPage] = useState(() => {
    const d = initialData && initialData.users ? initialData : null;
    return d && d.defaultUserId ? "practice" : "users";
  });
  const [previousPage, setPreviousPage] = useState("practice");
  const [menuOpen, setMenuOpen] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [progressToast, setProgressToast] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [addingType, setAddingType] = useState(null);

  // Sync when initialData loads from Supabase (async)
  useEffect(() => {
    if (initialData && initialData.users && initialData.users.length > 0) {
      setData(initialData);
      setPage(initialData.defaultUserId ? "practice" : "users");
    }
  }, [initialData]);

  useEffect(() => {
    requestNotificationPermission();
    scheduleDailyNotification();
  }, []);

  const activeUser = data.users.find(u => u.id === data.activeUserId) || data.users[0];
  const themeColor = activeUser.avatarColor || "#d4a854";
  const headerColor = darkenColor(themeColor, 0.25);
  const lightColor = lightenColor(themeColor, 0.85);

  const persistData = useCallback((newData) => {
    setData(newData);
    persist(newData); // saves to Supabase via App.jsx
  }, [persist]);

  const navigateTo = useCallback((newPage) => {
    if (newPage !== "users") setPreviousPage(page === "users" ? previousPage : page);
    setPage(newPage);
  }, [page, previousPage]);

  const toggleUsersPage = useCallback(() => {
    if (page === "users") {
      setPage(previousPage);
    } else {
      setPreviousPage(page);
      setPage("users");
    }
  }, [page, previousPage]);

  const updateUser = useCallback((updatedUser) => {
    const newData = {
      ...data,
      users: data.users.map(u => u.id === updatedUser.id ? updatedUser : u),
    };
    persistData(newData);
  }, [data, persistData]);

  const updateUserById = useCallback((userId, updater) => {
    const newData = {
      ...data,
      users: data.users.map(u => u.id === userId ? updater(u) : u),
    };
    persistData(newData);
  }, [data, persistData]);

  const triggerCelebration = useCallback(() => {
    setCelebration(true);
    setTimeout(() => setCelebration(false), 3000);
  }, []);

  const showProgressToast = useCallback((progress, total) => {
    const tier = getProgressTier(progress);
    if (tier) {
      setProgressToast({ ...tier, progress, total });
      setTimeout(() => setProgressToast(null), 1800);
    }
  }, []);

  const allLanguages = [...DEFAULT_LANGUAGES, ...(activeUser.customLanguages || [])];

  // Generate theme-based background colors
  const bgLight = lightenColor(themeColor, 0.92);
  const bgMid = lightenColor(themeColor, 0.85);
  const bgDark = lightenColor(themeColor, 0.78);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(168deg, ${bgLight} 0%, ${bgMid} 40%, ${bgDark} 100%)`,
      fontFamily: "'Crimson Pro', 'Georgia', serif",
      color: "#2c2416",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Celebration Overlay */}
      {celebration && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(44,36,22,0.75)", zIndex: 9999, animation: "fadeIn 0.3s ease",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #d4a854, #c4943e)",
            color: "#fff", padding: "40px 56px", borderRadius: 24,
            textAlign: "center", animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: "0 20px 80px rgba(212,168,84,0.5), 0 0 120px rgba(212,168,84,0.3)",
          }}>
            <div style={{ fontSize: 56, marginBottom: 8, animation: "spin 1s ease-in-out" }}>🏆</div>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "'Instrument Sans', sans-serif" }}>Done practicing!</div>
            <div style={{ fontSize: 18, opacity: 0.9, marginTop: 6 }}>Great job today!</div>
          </div>
        </div>
      )}

      {/* Progress toast */}
      {progressToast && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          zIndex: 9998, animation: "toastIn 0.3s ease, toastOut 0.3s ease 1.4s forwards",
          background: "#fff", borderRadius: 16, padding: "12px 24px",
          boxShadow: "0 8px 32px rgba(44,36,22,0.2)",
          display: "flex", alignItems: "center", gap: 12, border: "2px solid #d4a854",
        }}>
          <span style={{ fontSize: 28 }}>{progressToast.emoji}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Instrument Sans', sans-serif", color: "#2c2416" }}>{progressToast.message}</div>
            <div style={{ fontSize: 12, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif" }}>{Math.round(progressToast.progress * 100)}% complete</div>
          </div>
          <div style={{ width: 60, height: 6, background: "#f0e8d8", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${progressToast.progress * 100}%`, height: "100%", background: "linear-gradient(90deg, #d4a854, #c4943e)", borderRadius: 3, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: `linear-gradient(135deg, ${headerColor} 0%, ${darkenColor(themeColor, 0.35)} 100%)`,
        color: "#f5f0e8", padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", color: lightenColor(themeColor, 0.6), cursor: "pointer", padding: 4, display: "flex" }}><IconMenu /></button>
        <div onClick={() => navigateTo("practice")} style={{ textAlign: "center", flex: 1, cursor: "pointer" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: lightenColor(themeColor, 0.6), fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, marginBottom: 2 }}>Scripture</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Memorizer</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button 
            onClick={() => {
              // Reset guidance for current page to show help again
              const tipKey = page === "practice" ? "practice_intro" : 
                            page === "library" ? "library_intro" :
                            page === "games" ? "games_intro" :
                            page === "users" ? "users_intro" : "general_intro";
              updateUser({ ...activeUser, guidanceSeen: { ...(activeUser.guidanceSeen || {}), [tipKey]: false } });
            }}
            style={{ background: "none", border: "none", color: lightenColor(themeColor, 0.5), cursor: "pointer", padding: 4, display: "flex" }}
          >
            <IconHelp size={20} />
          </button>
          <div onClick={toggleUsersPage} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: themeColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}>
              {activeUser.avatarEmoji || "📖"}
            </div>
            <div style={{ fontSize: 11, color: lightenColor(themeColor, 0.4), fontFamily: "'Instrument Sans', sans-serif", textAlign: "right" }}>
              <div style={{ fontWeight: 600, color: lightenColor(themeColor, 0.6) }}>{activeUser.name}</div>
              <div>{getWeekKey(new Date())}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Menu */}
      {menuOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease" }} />
          <nav style={{
            position: "absolute", top: 0, left: 0, bottom: 0, width: "min(300px, 80vw)",
            background: `linear-gradient(180deg, ${headerColor}, ${darkenColor(themeColor, 0.3)})`,
            color: "#f5f0e8", padding: "20px 0",
            animation: "slideIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            boxShadow: "4px 0 30px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", overflow: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 20px" }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Menu</div>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: lightenColor(themeColor, 0.5), cursor: "pointer" }}><IconX /></button>
            </div>
            
            {/* Main menu items */}
            {[
              { id: "practice", label: "Practice + Ponder Feed", Icon: IconBook },
              { id: "library", label: "My Scriptures", Icon: IconLibrary },
              { id: "add", label: "Add New", Icon: IconPencil },
              { id: "suggested", label: "Suggested Scriptures", Icon: IconStar },
              { id: "users", label: "Users & Data", Icon: IconUsers },
            ].map(item => (
              <button key={item.id} onClick={() => { navigateTo(item.id); setMenuOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 24px", border: "none", cursor: "pointer",
                background: page === item.id ? `${lightenColor(themeColor, 0.5)}25` : "transparent",
                color: page === item.id ? lightenColor(themeColor, 0.6) : lightenColor(themeColor, 0.3),
                fontFamily: "'Instrument Sans', sans-serif", fontSize: 15,
                fontWeight: page === item.id ? 600 : 400, textAlign: "left",
                borderLeft: page === item.id ? `3px solid ${lightenColor(themeColor, 0.5)}` : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <item.Icon size={20} />
                {item.label}
              </button>
            ))}

            {/* Games Section Header */}
            <div style={{ 
              padding: "16px 24px 8px", 
              fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
              color: lightenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif",
              borderTop: `1px solid ${lightenColor(themeColor, 0.2)}20`, marginTop: 8,
            }}>
              Games
            </div>
            
            {/* Games list */}
            {[
              { id: "flashAttack", label: "⚡ Flash Attack", minItems: 4 },
              { id: "matching", label: "🎯 Matching Game", minItems: 4 },
              { id: "dragDrop", label: "🔗 Drag & Match", minItems: 5 },
              { id: "holdToRod", label: "🌳 Hold to the Rod", minItems: 1 },
              { id: "fillBlanks", label: "📝 Fill in the Blanks", minItems: 1 },
              { id: "cardPickup", label: "🃏 52 Card Pickup", minItems: 2 },
              { id: "whackAMole", label: "🔨 Whack-a-Mole", minItems: 3 },
            ].map(game => {
              const hasEnough = activeUser.items.length >= game.minItems;
              return (
                <button 
                  key={game.id}
                  onClick={() => { if (hasEnough) { setActiveGame(game.id); setMenuOpen(false); } }}
                  disabled={!hasEnough}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "12px 24px", border: "none", cursor: hasEnough ? "pointer" : "not-allowed",
                    background: "transparent",
                    color: hasEnough ? lightenColor(themeColor, 0.4) : lightenColor(themeColor, 0.2),
                    fontFamily: "'Instrument Sans', sans-serif", fontSize: 14,
                    textAlign: "left", opacity: hasEnough ? 1 : 0.5,
                    borderLeft: "3px solid transparent",
                  }}
                >
                  {game.label}
                  {!hasEnough && <span style={{ fontSize: 10, marginLeft: "auto" }}>({game.minItems}+ needed)</span>}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Pages */}
      <main>
        {page === "practice" && <PracticePage user={activeUser} updateUser={updateUser} allUsers={data.users} updateUserById={updateUserById} triggerCelebration={triggerCelebration} showProgressToast={showProgressToast} themeColor={themeColor} setPage={navigateTo} setActiveGame={setActiveGame} />}
        {page === "library" && <LibraryPage user={activeUser} updateUser={updateUser} allUsers={data.users} updateUserById={updateUserById} persist={persistData} data={data} themeColor={themeColor} setPage={navigateTo} setAddingType={setAddingType} />}
        {page === "suggested" && <SuggestedPage user={activeUser} updateUser={updateUser} languages={allLanguages} themeColor={themeColor} allUsers={data.users} persist={persistData} data={data} />}
        {page === "add" && <AddPage user={activeUser} updateUser={updateUser} languages={allLanguages} setPage={navigateTo} themeColor={themeColor} defaultType={addingType} />}
        {page === "users" && <UsersPage data={data} persist={persistData} setPage={navigateTo} onClose={() => setPage(previousPage)} themeColor={themeColor} session={session} />}
      </main>

      {/* Game overlays */}
      {activeGame === "matching" && (
        <MatchingGame 
          items={activeUser.items} 
          themeColor={themeColor} 
          onComplete={() => updateUser({ ...activeUser, matchingGameCompletions: (activeUser.matchingGameCompletions || 0) + 1 })}
          onClose={() => setActiveGame(null)} 
        />
      )}
      {activeGame === "dragDrop" && (
        <DragDropGame 
          items={activeUser.items} 
          themeColor={themeColor} 
          onComplete={() => updateUser({ ...activeUser, dragDropCompletions: (activeUser.dragDropCompletions || 0) + 1 })}
          onClose={() => setActiveGame(null)} 
        />
      )}
      {activeGame === "holdToRod" && (
        <HoldToRodGame 
          items={activeUser.items} 
          themeColor={themeColor} 
          onComplete={() => updateUser({ ...activeUser, holdToRodCompletions: (activeUser.holdToRodCompletions || 0) + 1 })}
          onClose={() => setActiveGame(null)} 
        />
      )}
      {activeGame === "fillBlanks" && (
        <FillBlanksGame 
          items={activeUser.items} 
          themeColor={themeColor} 
          onComplete={() => updateUser({ ...activeUser, fillBlanksCompletions: (activeUser.fillBlanksCompletions || 0) + 1 })}
          onClose={() => setActiveGame(null)} 
        />
      )}
      {activeGame === "cardPickup" && (
        <CardPickupGame 
          items={activeUser.items} 
          themeColor={themeColor} 
          onComplete={() => updateUser({ ...activeUser, cardPickupCompletions: (activeUser.cardPickupCompletions || 0) + 1 })}
          onClose={() => setActiveGame(null)} 
        />
      )}
      {activeGame === "flashAttack" && (
        <FlashAttackGame 
          items={activeUser.items} 
          themeColor={themeColor} 
          onComplete={() => updateUser({ ...activeUser, flashAttackCompletions: (activeUser.flashAttackCompletions || 0) + 1 })}
          onClose={() => setActiveGame(null)} 
        />
      )}
      {activeGame === "whackAMole" && (
        <WhackAMoleGame 
          items={activeUser.items} 
          themeColor={themeColor} 
          onComplete={() => updateUser({ ...activeUser, whackAMoleCompletions: (activeUser.whackAMoleCompletions || 0) + 1 })}
          onClose={() => setActiveGame(null)} 
        />
      )}

      {/* FAB for adding scriptures */}
      {(page === "practice" || page === "library") && (
        <FloatingAddButton onClick={(type) => { setAddingType(type); navigateTo("add"); }} />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }
        @keyframes popIn { from { transform: scale(0.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes spin { 0% { transform: rotateY(0) } 100% { transform: rotateY(360deg) } }
        @keyframes toastIn { from { transform: translateX(-50%) translateY(-20px); opacity: 0 } to { transform: translateX(-50%) translateY(0); opacity: 1 } }
        @keyframes toastOut { from { opacity: 1 } to { opacity: 0; transform: translateX(-50%) translateY(-10px) } }
        @keyframes btnPulse { 0% { box-shadow: 0 0 0 0 rgba(212,168,84,0.4) } 70% { box-shadow: 0 0 0 12px rgba(212,168,84,0) } 100% { box-shadow: 0 0 0 0 rgba(212,168,84,0) } }
        @keyframes drumHit { 0% { transform: scale(1) } 15% { transform: scale(0.92) } 35% { transform: scale(1.08) } 60% { transform: scale(0.98) } 100% { transform: scale(1) } }
        @keyframes gotItBounce { 0% { transform: scale(1) } 20% { transform: scale(0.88) } 50% { transform: scale(1.15) } 80% { transform: scale(0.96) } 100% { transform: scale(1) } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; }
        input, select, textarea, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #c4b89a; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// --- Section Header ---
function SectionHeader({ children, sub, right, style = {} }) {
  return (
    <div style={{ padding: "20px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", ...style }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: 2.5, textTransform: "uppercase", color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700 }}>{children}</div>
        {sub && <div style={{ fontSize: 13, color: "#a89878", marginTop: 2, fontFamily: "'Instrument Sans', sans-serif" }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// --- Scripture Card ---
function ScriptureCard({ item, onPractice, onGotIt, onGoodEnough, onPonder, onComment, onArchive, onSuggest, onWeekChange, weekOptions, done, showActions = true, showArchive = false, showManagement = false, forceExpanded, userSettings, onUpdateUserSettings, themeColor = "#d4a854", allUsers, updateUserById }) {
  const [localOverride, setLocalOverride] = useState(null); // null = follow global, true/false = individual override
  const [showDots, setShowDots] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);
  const [visibility, setVisibility] = useState(userSettings?.defaultVisibility ?? 70);
  const [randomSeed, setRandomSeed] = useState(Date.now()); // For randomizing word visibility
  const [revealedWords, setRevealedWords] = useState({}); // Track temporarily revealed words
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPondering, setIsPondering] = useState(false);
  const [ponderColorIndex, setPonderColorIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const practiceRef = useRef(null);
  const gotItRef = useRef(null);
  const prevForceRef = useRef(forceExpanded);
  const lastVisibilityRef = useRef(visibility);

  // Sync local visibility with user's default setting when it changes
  useEffect(() => {
    if (userSettings?.defaultVisibility !== undefined) {
      setVisibility(userSettings.defaultVisibility);
      lastVisibilityRef.current = userSettings.defaultVisibility;
    }
  }, [userSettings?.defaultVisibility]);

  // Randomize words when slider hits 0 or 100
  const handleVisibilityChange = (newValue) => {
    const wasAtExtreme = lastVisibilityRef.current === 0 || lastVisibilityRef.current === 100;
    const isAtExtreme = newValue === 0 || newValue === 100;
    
    // Randomize when moving away from 0 or 100
    if ((lastVisibilityRef.current === 0 && newValue > 0) || 
        (lastVisibilityRef.current === 100 && newValue < 100)) {
      setRandomSeed(Date.now());
    }
    
    setVisibility(newValue);
    lastVisibilityRef.current = newValue;
  };

  // Handle tapping a hidden word to reveal it temporarily
  const handleWordTap = (wordIndex) => {
    setRevealedWords(prev => ({ ...prev, [wordIndex]: true }));
    setTimeout(() => {
      setRevealedWords(prev => {
        const next = { ...prev };
        delete next[wordIndex];
        return next;
      });
    }, 5000);
  };

  // Text-to-speech handler - simplified for reliability
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }
    
    // If already speaking, stop
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Cancel any pending speech
    window.speechSynthesis.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Set up event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    // Start speaking after a tiny delay (helps with some browsers)
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  // Stop speaking when component unmounts or card collapses
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  // Ponder mode color palette - soft, contemplative colors
  const ponderColors = useMemo(() => [
    { from: "#2c3e50", to: "#34495e" }, // deep blue-gray
    { from: "#1a3a4a", to: "#2c5364" }, // ocean deep
    { from: "#232526", to: "#414345" }, // subtle gray
    { from: "#2c2416", to: "#3d3222" }, // warm dark
    { from: "#1e3c72", to: "#2a5298" }, // night sky
    { from: "#2b5876", to: "#4e4376" }, // twilight
    { from: "#373B44", to: "#4286f4" }, // deep to blue
    { from: "#0f2027", to: "#203a43" }, // midnight
  ], []);

  // Slowly cycle ponder colors
  useEffect(() => {
    if (!isPondering) return;
    const interval = setInterval(() => {
      setPonderColorIndex(i => (i + 1) % ponderColors.length);
    }, 12000); // Change every 12 seconds
    return () => clearInterval(interval);
  }, [isPondering, ponderColors.length]);

  // Derived colors from theme
  const darkTheme = darkenColor(themeColor, 0.7);
  const lightTheme = lightenColor(themeColor, 0.85);

  // When global toggle changes, clear local override so cards follow it
  useEffect(() => {
    if (prevForceRef.current !== forceExpanded) {
      setLocalOverride(null);
      prevForceRef.current = forceExpanded;
    }
  }, [forceExpanded]);

  // Local override wins if set, otherwise follow global, otherwise use false
  const expanded = localOverride !== null ? localOverride : (forceExpanded !== undefined ? forceExpanded : false);
  const toggleExpanded = () => setLocalOverride(expanded ? false : true);

  const today = todayKey();
  const todayPractices = (item.practices && item.practices[today]) || 0;
  const todayGotIts = (item.gotIts && item.gotIts[today]) || 0;
  const todayPonders = (item.ponders && item.ponders[today]) || 0;

  const label = item.type === "scripture" ? item.reference
    : (item.type === "quote" || item.type === "poem/lyrics" || item.type === "saying")
      ? `${item.author || "Unknown"}${item.title ? ` — "${item.title}"` : ""}`
      : item.title || item.author || "Untitled";

  const sublabel = item.type === "scripture" ? null
    : item.source ? item.source : item.year ? item.year : null;

  const handlePracticeClick = () => {
    const btn = practiceRef.current;
    if (btn) {
      btn.style.animation = "none";
      void btn.offsetHeight;
      btn.style.animation = "drumHit 0.35s ease";
      spawnParticles(btn, "practice");
      spawnGlowRing(btn);
    }
    onPractice && onPractice(item.id);
  };

  const handleGotItClick = () => {
    const btn = gotItRef.current;
    if (btn) {
      btn.style.animation = "none";
      void btn.offsetHeight;
      btn.style.animation = "gotItBounce 0.45s ease";
      spawnParticles(btn, "gotit");
      spawnGlowRing(btn);
    }
    onGotIt && onGotIt(item.id);
  };

  return (
    <div style={{
      margin: "8px 16px", borderRadius: 16,
      background: done ? "rgba(255,255,255,0.4)" : "#fff",
      boxShadow: done ? "none" : "0 2px 12px rgba(44,36,22,0.08)",
      overflow: "hidden", opacity: done ? 0.65 : 1, transition: "all 0.3s",
      animation: "slideUp 0.3s ease",
      border: done ? "1px solid rgba(212,168,84,0.3)" : "1px solid rgba(0,0,0,0.04)",
    }}>
      {/* Card header */}
      <div onClick={toggleExpanded} style={{
        padding: "14px 16px 10px", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#2c2416", fontFamily: "'Instrument Sans', sans-serif" }}>{label}</div>
          {sublabel && <div style={{ fontSize: 12, color: "#8a7a62", marginTop: 2, fontFamily: "'Instrument Sans', sans-serif" }}>{sublabel}</div>}
          {item.language && item.language !== "English" && (
            <span style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", background: "#f0e8d8", borderRadius: 8, fontSize: 10, fontFamily: "'Instrument Sans', sans-serif", color: "#8a7a62", fontWeight: 600 }}>{item.language}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#a89878", flexShrink: 0 }}>
          {item.comments && item.comments.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: "#a89878" }}>
              <IconMessage size={12} /> {item.comments.length}
            </span>
          )}
          <IconChevron size={14} direction={expanded ? "down" : "up"} />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 16px 12px" }}>
          {/* Scripture text with visibility processing and play button */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "8px 0", borderTop: "1px solid #f0e8d8",
          }}>
            <div style={{
              flex: 1, fontSize: 17, lineHeight: 1.65, color: "#3d3222",
              fontStyle: "italic", fontWeight: 300, whiteSpace: "pre-line",
            }}>
              <TappableScriptureText 
                text={item.text} 
                visibilityPercent={visibility} 
                hideMode={userSettings?.hideMode || "firstLetter"} 
                seed={randomSeed}
                revealedWords={revealedWords}
                onWordTap={handleWordTap}
                themeColor={themeColor}
              />
            </div>
            <button
              onClick={handleSpeak}
              style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
                background: isSpeaking ? `linear-gradient(135deg, ${themeColor}, ${darkTheme})` : "#faf8f4",
                border: isSpeaking ? "none" : "1px solid #d4cbb8",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: isSpeaking ? "#fff" : "#8a7a62",
                transition: "all 0.2s",
              }}
              title={isSpeaking ? "Stop reading" : "Read aloud"}
            >
              {isSpeaking ? <IconStop size={14} /> : <IconPlay size={14} />}
            </button>
          </div>

          {/* Visibility slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "8px 0", borderBottom: "1px solid #f0e8d8" }}>
            <span style={{ fontSize: 11, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", minWidth: 45 }}>{visibility}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={visibility}
              onChange={(e) => handleVisibilityChange(parseInt(e.target.value))}
              style={{ flex: 1, height: 4, cursor: "pointer" }}
            />
            <button
              onClick={() => setShowVisibilitySettings(!showVisibilitySettings)}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: "transparent", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#a89878", opacity: 0.7,
              }}
            >
              <IconSettings size={14} />
            </button>
          </div>

          {/* Visibility settings modal */}
          {showVisibilitySettings && onUpdateUserSettings && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 500,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.4)",
            }} onClick={() => setShowVisibilitySettings(false)}>
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff", borderRadius: 16, padding: "20px",
                  width: "min(320px, 90vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#2c2416", fontFamily: "'Instrument Sans', sans-serif" }}>
                    Visibility Settings
                  </div>
                  <button onClick={() => setShowVisibilitySettings(false)} style={{
                    background: "none", border: "none", color: "#8a7a62", cursor: "pointer", padding: 4,
                  }}>
                    <IconX size={20} />
                  </button>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 8 }}>
                    Default visibility for new scriptures:
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={userSettings?.defaultVisibility ?? 100}
                      onChange={(e) => onUpdateUserSettings("defaultVisibility", parseInt(e.target.value))}
                      style={{ flex: 1, height: 4, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 14, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif", minWidth: 45 }}>
                      {userSettings?.defaultVisibility ?? 100}%
                    </span>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif" }}>Show first letter when hidden:</span>
                  <button
                    onClick={() => onUpdateUserSettings("hideMode", userSettings?.hideMode === "firstLetter" ? "full" : "firstLetter")}
                    style={{
                      width: 48, height: 26, borderRadius: 13, border: "none",
                      background: (userSettings?.hideMode || "firstLetter") === "firstLetter" ? "linear-gradient(135deg, #6a9e5a, #5a8e4a)" : "#e0d8cc",
                      cursor: "pointer", position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3, left: (userSettings?.hideMode || "firstLetter") === "firstLetter" ? 24 : 3,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Context */}
          {(item.context || "").trim() && (
            <div style={{
              margin: "6px 0 4px", padding: "8px 12px",
              background: "linear-gradient(135deg, #faf5ec, #f5eed8)",
              borderRadius: 10, borderLeft: "3px solid #d4a854",
              fontSize: 13, lineHeight: 1.55, color: "#5a4e3a", fontStyle: "normal",
            }}>
              <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#a89878", fontFamily: "'Instrument Sans', sans-serif" }}>Context</span>
              <div style={{ marginTop: 3 }}>{item.context}</div>
            </div>
          )}

          {item.url && (
            <a href={item.url} target="_blank" rel="noopener" style={{ fontSize: 12, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", wordBreak: "break-all" }}>{item.url}</a>
          )}

          {/* Auto-generated Gospel Library link for scriptures */}
          {(() => {
            const autoUrl = getGospelLibraryUrl(item);
            if (autoUrl && autoUrl !== item.url) return (
              <a href={autoUrl} target="_blank" rel="noopener" style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 12, color: "#6a8e5a", fontFamily: "'Instrument Sans', sans-serif",
                marginTop: item.url ? 4 : 0, textDecoration: "none",
              }}>
                📖 Open in Gospel Library
              </a>
            );
            return null;
          })()}

          {/* Comments */}
          {item.comments && item.comments.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {item.comments.map((c, i) => (
                <div key={i} style={{ padding: "6px 0", borderTop: i > 0 ? "1px solid #f5f0e8" : "none", fontSize: 13, color: "#5a4e3a" }}>
                  <span style={{ fontSize: 10, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif" }}>{c.date} </span>
                  {c.text}
                </div>
              ))}
            </div>
          )}
          {commenting ? (
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
                style={{ flex: 1, padding: "8px 12px", border: "1px solid #d4cbb8", borderRadius: 10, fontSize: 14, background: "#faf8f4", outline: "none" }}
              />
              <button onClick={() => {
                if (commentText.trim()) { onComment && onComment(item.id, commentText.trim()); setCommentText(""); setCommenting(false); }
              }} style={{ padding: "8px 14px", background: darkTheme, color: themeColor, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", fontSize: 13 }}>Add</button>
              <button onClick={() => { setCommenting(false); setCommentText(""); }} style={{ 
                padding: "8px 10px", background: "#faf8f4", color: "#a89878", border: "1px solid #d4cbb8", 
                borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center" 
              }}>
                <IconX size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <button onClick={() => setCommenting(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 4, padding: "4px 0",
              }}>
                <IconMessage size={12} /> Add comment
              </button>
              {onSuggest && (
                <button onClick={() => onSuggest(item)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 0",
                }}>
                  <IconShootingStar size={12} /> Suggest
                </button>
              )}
            </div>
          )}

          {/* Archive button */}
          {showArchive && onArchive && (
            <button onClick={() => onArchive(item.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: "100%", marginTop: 12, padding: "10px", borderRadius: 10,
              border: "1px solid #e8dcd0", background: "#faf8f4",
              color: "#a89878", fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
            }}>
              <IconArchive size={14} /> Archive this item
            </button>
          )}

          {/* Management section - only shown in Library view */}
          {showManagement && onWeekChange && weekOptions && (
            <div style={{ 
              marginTop: 12, padding: "12px", borderRadius: 10,
              background: "#f5f2ed", position: "relative",
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 8 }}>
                Management
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 4 }}>
                Assigned Week
              </div>
              <button 
                onClick={() => setShowWeekDropdown(!showWeekDropdown)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", borderRadius: 10,
                  border: "1px solid #d4cbb8", background: "#fff",
                  color: "#5a4e3a", fontSize: 13, cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif", fontWeight: 500,
                  width: "100%", textAlign: "left", justifyContent: "space-between",
                }}
              >
                <span>{item.weekKey} — {formatWeekLabel(item.weekKey)}</span>
                <span style={{ fontSize: 10, color: "#a89878" }}>{showWeekDropdown ? "▲" : "▼"}</span>
              </button>
              {showWeekDropdown && (
                <div style={{
                  position: "absolute", left: 12, right: 12, top: "100%", marginTop: 4,
                  background: "#fff", borderRadius: 12, border: "1px solid #d4cbb8",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 20,
                  maxHeight: 200, overflowY: "auto",
                }}>
                  {weekOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        onWeekChange(item.id, opt.key);
                        setShowWeekDropdown(false);
                      }}
                      style={{
                        display: "block", width: "100%", padding: "10px 14px",
                        border: "none", borderBottom: "1px solid #f0e8d8",
                        background: opt.key === item.weekKey ? "rgba(212,168,84,0.12)" : "none",
                        cursor: "pointer", textAlign: "left",
                        fontSize: 13, fontFamily: "'Instrument Sans', sans-serif",
                        color: opt.empty ? "#c0b0a0" : "#5a4e3a",
                        fontStyle: opt.empty ? "italic" : "normal",
                      }}
                    >
                      {opt.key} — {opt.label}{opt.empty ? " (empty)" : opt.count > 0 ? ` (${opt.count})` : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div style={{ padding: "8px 16px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            {/* Expand button */}
            <button onClick={() => setIsFullscreen(true)} style={{
              padding: "8px", borderRadius: 10, border: `1px solid ${lightTheme}`,
              background: "#fff", color: "#8a7a62", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconExpand size={16} expanded={false} />
            </button>
            
            <div style={{ display: "flex", gap: 6 }}>
              <button ref={practiceRef} onClick={handlePracticeClick} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "8px 12px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${lightTheme}, ${lightenColor(themeColor, 0.7)})`,
                color: darkTheme, fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                boxShadow: "0 2px 8px rgba(44,36,22,0.08)", transition: "box-shadow 0.2s",
              }}>
                📖 Practiced!{todayPractices > 0 && ` (${todayPractices})`}
              </button>
              <button onClick={() => { setIsPondering(true); onPonder && onPonder(item.id); }} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "8px 12px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #4a5568, #2d3748)",
                color: "#e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}>
                🕊️ Ponder{todayPonders > 0 && ` (${todayPonders})`}
              </button>
              <div style={{ position: "relative", display: "flex", gap: 0 }}>
                <button ref={gotItRef} onClick={handleGotItClick} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "8px 12px", borderRadius: "10px 0 0 10px", border: "none",
                  background: `linear-gradient(135deg, ${themeColor}, ${darkTheme})`,
                  color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif",
                  boxShadow: `0 2px 8px ${themeColor}50`,
                }}>
                  <IconCheck size={14} /> Passed off!
                </button>
                <button onClick={() => setShowDots(!showDots)} style={{
                  padding: "8px 6px", borderRadius: "0 10px 10px 0", border: "none",
                  background: `linear-gradient(135deg, ${darkTheme}, ${darkenColor(themeColor, 0.5)})`,
                  color: "#fff", cursor: "pointer", borderLeft: "1px solid rgba(255,255,255,0.2)",
                }}>
                  <IconDots size={14} />
                </button>
                {showDots && (
                  <div style={{
                    position: "absolute", right: 0, bottom: "100%", marginBottom: 4,
                    background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    zIndex: 100, overflow: "hidden", minWidth: 140,
                  }}>
                    <button onClick={() => { onGoodEnough && onGoodEnough(item.id); setShowDots(false); }} style={{
                      display: "block", width: "100%", padding: "12px 16px", border: "none",
                      background: "none", cursor: "pointer", textAlign: "left",
                      fontSize: 13, fontFamily: "'Instrument Sans', sans-serif", color: "#5a4e3a",
                    }}>✅ Good enough</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Stats - only show when expanded */}
          {expanded && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10,
              fontSize: 11, fontFamily: "'Instrument Sans', sans-serif", color: "#a89878",
              borderTop: "1px solid #f0e8d8",
            }}>
              <div style={{ display: "flex", gap: 20 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📖 {todayPractices}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>🕊️ {todayPonders}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>✓ {todayGotIts}</span>
              </div>
              <div style={{ fontSize: 10, color: "#c4b89a" }}>Today</div>
              <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📖 {item.lifetimePractices || 0}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>🕊️ {item.lifetimePonders || 0}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>✓ {item.lifetimeGotIts || 0}</span>
              </div>
              <div style={{ fontSize: 10, color: "#c4b89a" }}>Lifetime</div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen mode */}
      {isFullscreen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          background: `linear-gradient(180deg, ${darkenColor(themeColor, 0.2)} 0%, ${darkenColor(themeColor, 0.3)} 100%)`,
          display: "flex", flexDirection: "column",
        }}>
          {/* Header with reference and close */}
          <div style={{
            padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", fontFamily: "'Instrument Sans', sans-serif" }}>{label}</div>
              {sublabel && <div style={{ fontSize: 14, color: lightenColor(themeColor, 0.5), marginTop: 4 }}>{sublabel}</div>}
            </div>
            <button onClick={() => setIsFullscreen(false)} style={{
              padding: "8px", borderRadius: 10, border: "none",
              background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconExpand size={20} expanded={true} />
            </button>
          </div>

          {/* Scripture text */}
          <div style={{
            flex: 1, padding: "20px 24px", overflowY: "auto",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontSize: 24, lineHeight: 1.7, color: "#fff",
              fontStyle: "italic", fontWeight: 300, textAlign: "center",
              maxWidth: 600, whiteSpace: "pre-line",
            }}>
              {processTextVisibility(item.text, visibility, userSettings?.hideMode || "firstLetter")}
            </div>
          </div>

          {/* Bottom controls */}
          <div style={{ padding: "16px 20px 32px", background: "rgba(0,0,0,0.2)" }}>
            {/* Action buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
              <button onClick={handlePracticeClick} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 24px", borderRadius: 14, border: "none",
                background: "rgba(255,255,255,0.2)", color: "#fff",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
              }}>
                📖 Practiced!{todayPractices > 0 && ` (${todayPractices})`}
              </button>
              <button onClick={handleGotItClick} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 24px", borderRadius: 14, border: "none",
                background: themeColor, color: "#fff",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
              }}>
                <IconCheck size={16} /> Passed off!
              </button>
            </div>

            {/* Visibility slider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "'Instrument Sans', sans-serif", minWidth: 45 }}>{visibility}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={visibility}
                onChange={(e) => setVisibility(parseInt(e.target.value))}
                style={{ flex: 1, height: 6, cursor: "pointer" }}
              />
              <button
                onClick={() => setShowVisibilitySettings(!showVisibilitySettings)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: showVisibilitySettings ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff",
                }}
              >
                <IconSettings size={16} />
              </button>
            </div>

            {/* Settings panel in fullscreen */}
            {showVisibilitySettings && onUpdateUserSettings && (
              <div style={{
                marginTop: 12, padding: "12px 16px",
                background: "rgba(255,255,255,0.1)", borderRadius: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Instrument Sans', sans-serif", flex: 1 }}>Default visibility:</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", minWidth: 35 }}>{userSettings?.defaultVisibility ?? 100}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={userSettings?.defaultVisibility ?? 100}
                    onChange={(e) => onUpdateUserSettings("defaultVisibility", parseInt(e.target.value))}
                    style={{ width: 80, height: 4, cursor: "pointer" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Instrument Sans', sans-serif" }}>Show first letter:</span>
                  <button
                    onClick={() => onUpdateUserSettings("hideMode", userSettings?.hideMode === "firstLetter" ? "full" : "firstLetter")}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: "none",
                      background: (userSettings?.hideMode || "firstLetter") === "firstLetter" ? themeColor : "rgba(255,255,255,0.3)",
                      cursor: "pointer", position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 2, left: (userSettings?.hideMode || "firstLetter") === "firstLetter" ? 22 : 2,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ponder mode - contemplative fullscreen */}
      {isPondering && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          overflow: "hidden",
        }}>
          {/* Animated gradient background layers */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: `linear-gradient(180deg, 
              ${ponderColors[ponderColorIndex].from} 0%, 
              ${ponderColors[ponderColorIndex].to} 100%)`,
            transition: "background 15s ease-in-out",
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: `linear-gradient(180deg, 
              ${ponderColors[(ponderColorIndex + 1) % ponderColors.length].from} 0%, 
              ${ponderColors[(ponderColorIndex + 1) % ponderColors.length].to} 100%)`,
            opacity: 0,
            animation: "ponderFadeIn 15s ease-in-out infinite",
          }} />
          
          {/* Close button */}
          <div style={{
            position: "absolute", top: 20, right: 20, zIndex: 10,
          }}>
            <button onClick={() => setIsPondering(false)} style={{
              padding: "12px", borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", 
              cursor: "pointer", backdropFilter: "blur(4px)",
            }}>
              <IconX size={24} />
            </button>
          </div>

          {/* Centered content */}
          <div style={{
            position: "relative", zIndex: 5,
            height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "60px 32px",
          }}>
            {/* Reference - subtle at top */}
            <div style={{
              fontSize: 14, color: "rgba(255,255,255,0.5)",
              fontFamily: "'Instrument Sans', sans-serif",
              marginBottom: 32, letterSpacing: 2, textTransform: "uppercase",
            }}>
              {label}
            </div>

            {/* Scripture text - large and centered */}
            <div style={{
              fontSize: 26, lineHeight: 1.8, color: "rgba(255,255,255,0.95)",
              fontStyle: "italic", fontWeight: 300, textAlign: "center",
              maxWidth: 600, whiteSpace: "pre-line",
            }}>
              {item.text}
            </div>

            {/* Dove icon for meditation */}
            <div style={{
              marginTop: 48, fontSize: 32, opacity: 0.3,
            }}>
              🕊️
            </div>
          </div>
          
          <style>{`
            @keyframes ponderFadeIn {
              0%, 10% { opacity: 0; }
              50%, 60% { opacity: 1; }
              90%, 100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

// --- Flashcard Quiz Carousel ---
function FlashcardQuiz({ items, themeColor = "#d4a854", onComplete, lifetimeCompletions = 0 }) {
  const [cards, setCards] = useState(() => {
    if (items.length < 2) return [];
    return items.map(item => ({
      ...item,
      status: "pending", // pending, complete, failed
      failCount: 0,
      showCheck: false,
    })).sort(() => Math.random() - 0.5);
  });
  const [completionCounted, setCompletionCounted] = useState(false);
  const scrollRef = useRef(null);

  const pendingCards = cards.filter(c => c.status === "pending");
  const completeCards = cards.filter(c => c.status === "complete");
  const failedCards = cards.filter(c => c.status === "failed");
  const currentCard = pendingCards[0];

  const getOptions = (correctItem) => {
    if (!correctItem) return [];
    const otherItems = items.filter(i => i.id !== correctItem.id);
    const shuffled = [...otherItems].sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongOptions = shuffled.map(i => ({
      id: i.id,
      label: i.type === "scripture" ? i.reference : (i.title ? `"${i.title}"` : i.author),
      correct: false,
    }));
    const correctOption = {
      id: correctItem.id,
      label: correctItem.type === "scripture" ? correctItem.reference : (correctItem.title ? `"${correctItem.title}"` : correctItem.author),
      correct: true,
    };
    return [...wrongOptions, correctOption].sort(() => Math.random() - 0.5);
  };

  const [options, setOptions] = useState(() => getOptions(currentCard));
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (currentCard) {
      setOptions(getOptions(currentCard));
      setSelected(null);
      setShowResult(false);
    }
  }, [currentCard?.id]);

  const handleSelect = (option) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);

    setTimeout(() => {
      setCards(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(c => c.id === currentCard.id);
        if (idx === -1) return prev;
        
        if (option.correct) {
          updated[idx] = { ...updated[idx], status: "complete", showCheck: true };
        } else {
          const newFailCount = updated[idx].failCount + 1;
          if (newFailCount >= 3) {
            updated[idx] = { ...updated[idx], status: "failed", failCount: newFailCount, showCheck: false };
          } else {
            // Move to end of pending
            const [card] = updated.splice(idx, 1);
            const lastPendingIdx = updated.findLastIndex(c => c.status === "pending");
            updated.splice(lastPendingIdx + 1, 0, { ...card, failCount: newFailCount });
          }
        }
        return updated;
      });
      
      // Scroll back to start
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      }
    }, 800);
  };

  // Check if complete
  useEffect(() => {
    if (pendingCards.length === 0 && cards.length > 0 && !completionCounted) {
      setCompletionCounted(true);
      if (onComplete) onComplete();
    }
  }, [pendingCards.length, cards.length, completionCounted, onComplete]);

  if (items.length < 4) return null;

  const allDone = pendingCards.length === 0;
  const correctCount = completeCards.length;
  const darkTheme = darkenColor(themeColor, 0.5);

  if (allDone) {
    return (
      <div style={{ margin: "16px" }}>
        <div style={{
          background: `linear-gradient(135deg, ${lightenColor(themeColor, 0.85)}, ${lightenColor(themeColor, 0.75)})`,
          borderRadius: 16, padding: "20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: darkTheme, fontFamily: "'Instrument Sans', sans-serif" }}>
            Flash Attack Complete!
          </div>
          <div style={{ fontSize: 13, color: "#8a7a62", marginTop: 4 }}>
            {correctCount} of {cards.length} correct
          </div>
          <button onClick={() => {
            setCompletionCounted(false);
            setCards(items.map(item => ({
              ...item, status: "pending", failCount: 0, showCheck: false,
            })).sort(() => Math.random() - 0.5));
          }} style={{
            marginTop: 12, padding: "8px 16px", background: "none", border: "none",
            color: themeColor, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Play again? ⚡</button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div style={{ margin: "16px 0" }}>
      <div style={{ 
        fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", 
        color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", padding: "0 20px 8px",
      }}>
        ⚡ Flash Attack · {pendingCards.length} remaining
      </div>
      
      <div ref={scrollRef} style={{ 
        display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 16px",
        scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
      }}>
        {/* Current card */}
        <div style={{
          minWidth: "85%", maxWidth: "85%", scrollSnapAlign: "start",
          background: "#fff", borderRadius: 16, padding: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: `2px solid ${themeColor}`,
        }}>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: "#3d3222", fontStyle: "italic", marginBottom: 12, minHeight: 60 }}>
            {currentCard.text.length > 180 ? currentCard.text.slice(0, 180) + "..." : currentCard.text}
          </div>
          
          {currentCard.failCount > 0 && (
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {[...Array(currentCard.failCount)].map((_, i) => (
                <span key={i} style={{ fontSize: 12, color: "#d4726a" }}>✗</span>
              ))}
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {options.map((opt, i) => {
              let bg = "#f5f0e8";
              let border = "1px solid #e0d8cc";
              let color = "#3d3222";
              if (showResult && opt.correct) {
                bg = "#e8f5e8"; border = "2px solid #6a9e5a"; color = "#5a8e4a";
              } else if (showResult && selected?.id === opt.id && !opt.correct) {
                bg = "#ffeaea"; border = "2px solid #d4726a"; color = "#c45a52";
              }
              return (
                <button key={i} onClick={() => handleSelect(opt)} disabled={showResult} style={{
                  padding: "10px 8px", borderRadius: 10, border, background: bg,
                  color, fontSize: 11, fontWeight: 600, cursor: showResult ? "default" : "pointer",
                  fontFamily: "'Instrument Sans', sans-serif", textAlign: "center",
                }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Completed cards */}
        {completeCards.map(card => (
          <div key={card.id} style={{
            minWidth: 100, scrollSnapAlign: "start",
            background: "#e8f5e8", borderRadius: 12, padding: "12px",
            border: "2px solid #6a9e5a", opacity: 0.8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#5a8e4a", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 4 }}>
              {card.type === "scripture" ? card.reference : (card.title ? `"${card.title}"` : card.author)}
            </div>
            <div style={{ fontSize: 16, textAlign: "center", color: "#5a8e4a" }}>✓</div>
          </div>
        ))}

        {/* Failed cards (3 strikes) */}
        {failedCards.map(card => (
          <div key={card.id} style={{
            minWidth: 100, scrollSnapAlign: "start",
            background: "#faf8f4", borderRadius: 12, padding: "12px",
            border: "1px solid #e0d8cc", opacity: 0.6,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 4 }}>
              {card.type === "scripture" ? card.reference : (card.title ? `"${card.title}"` : card.author)}
            </div>
            <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <span style={{ fontSize: 12, color: "#d4726a" }}>✗✗✗</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// --- Matching Game (Memory Grid) ---
function MatchingGame({ items, themeColor = "#d4a854", onComplete, onClose }) {
  const [pairCount, setPairCount] = useState(null); // null = selecting, number = playing
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [complete, setComplete] = useState(false);

  const maxPairs = Math.min(18, Math.max(2, items.length));
  
  // Normalize content for matching (handle duplicates)
  const normalizeContent = (s) => s.toLowerCase().trim();

  const startGame = (pairs) => {
    setPairCount(pairs);
    // If we don't have enough items, repeat some
    const shuffledItems = [...items].sort(() => Math.random() - 0.5);
    const selectedItems = [];
    for (let i = 0; i < pairs; i++) {
      selectedItems.push(shuffledItems[i % shuffledItems.length]);
    }
    
    const cardPairs = selectedItems.flatMap((item, idx) => [
      { id: `${idx}-ref`, pairId: idx, type: "reference", 
        content: item.type === "scripture" ? item.reference : (item.title ? `"${item.title}"` : item.author),
        normalizedContent: normalizeContent(item.type === "scripture" ? item.reference : (item.title || item.author || "")) },
      { id: `${idx}-text`, pairId: idx, type: "text", content: item.text,
        normalizedContent: normalizeContent(item.text.slice(0, 50)) },
    ]);
    
    // Shuffle
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }
    setCards(cardPairs.map(p => ({ ...p, flipped: false, matched: false })));
  };

  const handleFlip = (cardId) => {
    if (selected.length >= 2) return;
    const card = cards.find(c => c.id === cardId);
    if (card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newSelected = [...selected, card];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      if (newSelected[0].pairId === newSelected[1].pairId) {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === newSelected[0].pairId ? { ...c, matched: true } : c));
          setSelected([]);
          const remaining = newCards.filter(c => !c.matched && c.pairId !== newSelected[0].pairId).length;
          if (remaining === 0) {
            setTimeout(() => { setComplete(true); if (onComplete) onComplete(); }, 500);
          }
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === newSelected[0].id || c.id === newSelected[1].id) ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 1000);
      }
    }
  };

  if (items.length < 2) return <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a62" }}>Need at least 2 scriptures<button onClick={onClose} style={{ marginLeft: 16, padding: "8px 16px", background: themeColor, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Back</button></div>;

  if (pairCount === null) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>🎯 Matching Game</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ fontSize: 16, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif" }}>How many pairs?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 300 }}>
            {[2, 4, 6, 8, 10, 12, 15, 18].filter(n => n <= maxPairs || n <= 18).map(n => (
              <button key={n} onClick={() => startGame(n)} style={{
                width: 60, height: 60, borderRadius: 12, border: "none",
                background: n === 8 ? `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})` : "#fff",
                color: n === 8 ? "#fff" : "#3d3222", fontSize: 18, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>{n}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#a89878" }}>Default: 8 pairs ({items.length} scriptures available)</div>
        </div>
      </div>
    );
  }

  const matchedCount = cards.filter(c => c.matched).length / 2;
  const cols = pairCount <= 4 ? 4 : pairCount <= 8 ? 4 : pairCount <= 12 ? 6 : 6;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, overflow: "auto", padding: "20px", background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>🎯 Matching</div>
          <div style={{ fontSize: 12, color: "#8a7a62" }}>Moves: {moves} · {matchedCount}/{pairCount}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
      </div>

      {complete ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: darkenColor(themeColor, 0.3) }}>Well Done!</div>
          <div style={{ fontSize: 14, color: "#8a7a62", marginTop: 8 }}>Completed in {moves} moves</div>
          <button onClick={onClose} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
          {cards.map(card => (
            <button key={card.id} onClick={() => handleFlip(card.id)} disabled={card.matched}
              style={{
                aspectRatio: "1", borderRadius: 10, border: "none", padding: 6,
                background: card.matched ? "#e8f5e8" : card.flipped ? "#fff" : `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`,
                color: card.flipped || card.matched ? "#3d3222" : "#fff",
                fontSize: card.type === "reference" ? 10 : 8, cursor: card.matched ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                overflow: "hidden", lineHeight: 1.2, opacity: card.matched ? 0.6 : 1,
                boxShadow: card.flipped ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.1)",
                transition: "all 0.2s",
              }}>
              {(card.flipped || card.matched) ? (card.content.length > 40 ? card.content.slice(0, 40) + "..." : card.content) : "?"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Drag & Match Game ---
function DragDropGame({ items, themeColor = "#d4a854", onComplete, onClose }) {
  const [gameItems] = useState(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  });
  const [leftItems] = useState(() => [...gameItems].sort(() => Math.random() - 0.5));
  const [rightItems] = useState(() => [...gameItems].sort(() => Math.random() - 0.5));
  const [matches, setMatches] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDragStart = (e, item, side) => {
    if (matches[item.id]) return;
    setDragging({ item, side });
    // For touch devices
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.id);
    }
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const handleDragOver = (e, item, side) => {
    e.preventDefault();
    if (dragging && dragging.side !== side && !matches[item.id]) {
      setDragOver({ item, side });
    }
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e, targetItem, targetSide) => {
    e.preventDefault();
    if (!dragging || dragging.side === targetSide || matches[targetItem.id]) {
      handleDragEnd();
      return;
    }
    
    if (dragging.item.id === targetItem.id) {
      setMatches(prev => ({ ...prev, [dragging.item.id]: true }));
      if (Object.keys(matches).length + 1 >= gameItems.length && onComplete) {
        setTimeout(onComplete, 500);
      }
    }
    handleDragEnd();
  };

  // Touch handling for mobile - immediate response, no delay
  const touchRefs = useRef({});
  const handleTouchStart = (e, item, side) => {
    if (matches[item.id]) return;
    e.preventDefault(); // Prevent scroll and touch delay
    const touch = e.touches[0];
    touchRefs.current = { item, side, startX: touch.clientX, startY: touch.clientY };
    setDragging({ item, side });
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const dropTarget = elements.find(el => el.dataset?.itemId && el.dataset?.side !== dragging.side);
    if (dropTarget) {
      const targetId = dropTarget.dataset.itemId;
      const targetSide = dropTarget.dataset.side;
      const targetItem = (targetSide === "left" ? leftItems : rightItems).find(i => i.id === targetId);
      if (targetItem && !matches[targetItem.id]) {
        setDragOver({ item: targetItem, side: targetSide });
      }
    } else {
      setDragOver(null);
    }
  };

  const handleTouchEnd = (e) => {
    if (!dragging || !dragOver) {
      handleDragEnd();
      return;
    }
    if (dragging.item.id === dragOver.item.id) {
      setMatches(prev => ({ ...prev, [dragging.item.id]: true }));
      if (Object.keys(matches).length + 1 >= gameItems.length && onComplete) {
        setTimeout(onComplete, 500);
      }
    }
    handleDragEnd();
  };

  if (items.length < 5) return <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a62" }}>Need at least 5 scriptures to play<button onClick={onClose} style={{ marginLeft: 16, padding: "8px 16px", background: themeColor, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Back</button></div>;

  const matchedCount = Object.keys(matches).length;
  const complete = matchedCount >= gameItems.length;

  return (
    <div 
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, overflow: "auto", padding: "20px", background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)` }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>
            🔗 Drag & Match
          </div>
          <div style={{ fontSize: 12, color: "#8a7a62" }}>Drag references to match texts • {matchedCount}/5</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
      </div>

      {complete ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: darkenColor(themeColor, 0.3) }}>Perfect Match!</div>
          <button onClick={onClose} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {leftItems.map(item => {
              const isMatched = matches[item.id];
              const isDragging = dragging?.item.id === item.id && dragging?.side === "left";
              const isDragOver = dragOver?.item.id === item.id && dragOver?.side === "left";
              return (
                <div
                  key={item.id + "-left"}
                  data-item-id={item.id}
                  data-side="left"
                  draggable={!isMatched}
                  onDragStart={(e) => handleDragStart(e, item, "left")}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, item, "left")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item, "left")}
                  onTouchStart={(e) => handleTouchStart(e, item, "left")}
                  style={{
                    padding: "10px 12px", borderRadius: 10, userSelect: "none",
                    background: isMatched ? "#e8f5e8" : isDragOver ? `${themeColor}30` : isDragging ? `${themeColor}20` : "#fff",
                    border: isMatched ? "2px solid #6a9e5a" : isDragOver ? `2px dashed ${themeColor}` : "1px solid #e0d8cc",
                    opacity: isMatched ? 0.6 : isDragging ? 0.7 : 1,
                    cursor: isMatched ? "default" : "grab",
                    transform: isDragging ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.15s",
                    touchAction: "none",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {!isMatched && <span style={{ color: "#c4b89a", flexShrink: 0 }}><IconGrip /></span>}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#3d3222" }}>
                    {item.type === "scripture" ? item.reference : (item.title ? `"${item.title}"` : item.author)}{isMatched && " ✓"}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {rightItems.map(item => {
              const isMatched = matches[item.id];
              const isDragging = dragging?.item.id === item.id && dragging?.side === "right";
              const isDragOver = dragOver?.item.id === item.id && dragOver?.side === "right";
              return (
                <div
                  key={item.id + "-right"}
                  data-item-id={item.id}
                  data-side="right"
                  draggable={!isMatched}
                  onDragStart={(e) => handleDragStart(e, item, "right")}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, item, "right")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item, "right")}
                  onTouchStart={(e) => handleTouchStart(e, item, "right")}
                  style={{
                    padding: "10px 12px", borderRadius: 10, userSelect: "none",
                    background: isMatched ? "#e8f5e8" : isDragOver ? `${themeColor}30` : isDragging ? `${themeColor}20` : "#fff",
                    border: isMatched ? "2px solid #6a9e5a" : isDragOver ? `2px dashed ${themeColor}` : "1px solid #e0d8cc",
                    opacity: isMatched ? 0.6 : isDragging ? 0.7 : 1,
                    cursor: isMatched ? "default" : "grab",
                    transform: isDragging ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.15s",
                    touchAction: "none",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {!isMatched && <span style={{ color: "#c4b89a", flexShrink: 0 }}><IconGrip /></span>}
                  <span style={{ fontSize: 11, fontStyle: "italic", color: "#3d3222", lineHeight: 1.4 }}>
                    {item.text.length > 55 ? item.text.slice(0, 55) + "..." : item.text}{isMatched && " ✓"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// --- Hold to the Rod Game ---
function HoldToRodGame({ items, themeColor = "#d4a854", onComplete, onClose }) {
  const [currentItem] = useState(() => items[Math.floor(Math.random() * items.length)]);
  const [words] = useState(() => currentItem.text.split(/\s+/).filter(w => w.length > 0));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topIsCorrect, setTopIsCorrect] = useState(Math.random() > 0.5);
  const [failed, setFailed] = useState(false);
  const [failedWord, setFailedWord] = useState(null);
  const [complete, setComplete] = useState(false);

  const getWrongWord = () => {
    const otherWords = words.filter((w, i) => i !== currentIndex && w !== words[currentIndex]);
    if (otherWords.length === 0) return "...";
    return otherWords[Math.floor(Math.random() * otherWords.length)];
  };

  const correctWord = words[currentIndex];
  const wrongWord = getWrongWord();

  const handleChoice = (isTop) => {
    const choseCorrect = (isTop === topIsCorrect);
    
    if (choseCorrect) {
      if (currentIndex + 1 >= words.length) {
        setComplete(true);
        if (onComplete) onComplete();
      } else {
        setCurrentIndex(i => i + 1);
        setTopIsCorrect(Math.random() > 0.5);
      }
    } else {
      setFailed(true);
      setFailedWord(correctWord);
    }
  };

  const reference = currentItem.type === "scripture" ? currentItem.reference : (currentItem.title ? `"${currentItem.title}"` : currentItem.author);
  const encouragement = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      background: complete ? "linear-gradient(180deg, #e8f5e8 0%, #d4ecd4 100%)" 
                 : failed ? "linear-gradient(180deg, #fff5f5 0%, #ffe8e8 100%)"
                 : `linear-gradient(180deg, ${darkenColor(themeColor, 0.2)} 0%, ${darkenColor(themeColor, 0.3)} 100%)`,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "20px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ color: complete || failed ? "#3d3222" : "#fff" }}>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif" }}>{reference}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>Word {currentIndex + 1} of {words.length}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: complete || failed ? "#8a7a62" : "rgba(255,255,255,0.7)", cursor: "pointer" }}>
          <IconX size={24} />
        </button>
      </div>

      {complete ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#5a8e4a", marginBottom: 24 }}>You held to the rod!</div>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20, maxWidth: 400,
            border: "3px solid #6a9e5a", textAlign: "center",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: themeColor, marginBottom: 12 }}>{reference}</div>
            <div style={{ fontSize: 16, fontStyle: "italic", color: "#3d3222", lineHeight: 1.6 }}>{currentItem.text}</div>
          </div>
          <button onClick={onClose} style={{
            marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #6a9e5a, #5a8e4a)",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Done</button>
        </div>
      ) : failed ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💪</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#8a7a62", marginBottom: 8, textAlign: "center" }}>{encouragement}</div>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20, maxWidth: 400, marginTop: 16,
            border: "2px solid #e0d8cc",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: themeColor, marginBottom: 12, textAlign: "center" }}>{reference}</div>
            <div style={{ fontSize: 14, color: "#3d3222", lineHeight: 1.8 }}>
              {words.map((word, i) => (
                <span key={i} style={{
                  color: i < currentIndex ? "#5a8e4a" : i === currentIndex ? "#d4726a" : "#c0b0a0",
                  textDecoration: i === currentIndex ? "none" : i > currentIndex ? "line-through" : "none",
                  fontWeight: i === currentIndex ? 700 : 400,
                }}>{word} </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`,
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Try Again Later</button>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Top choice */}
          <button
            onClick={() => handleChoice(true)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 600, color: "#fff", textAlign: "center", padding: 20 }}>
              {topIsCorrect ? correctWord : wrongWord}
            </span>
          </button>

          {/* Progress indicator */}
          <div style={{ padding: "12px 20px", background: "rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {words.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i < currentIndex ? "#6a9e5a" : i === currentIndex ? "#fff" : "rgba(255,255,255,0.3)",
                }} />
              ))}
            </div>
          </div>

          {/* Bottom choice */}
          <button
            onClick={() => handleChoice(false)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 600, color: "#fff", textAlign: "center", padding: 20 }}>
              {topIsCorrect ? wrongWord : correctWord}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// --- Fill in the Blanks Game ---
function FillBlanksGame({ items, themeColor = "#d4a854", onComplete, onClose }) {
  const [currentItem] = useState(() => items[Math.floor(Math.random() * items.length)]);
  const [difficulty, setDifficulty] = useState(null); // 1, 2, or 3
  const [words] = useState(() => currentItem.text.split(/\s+/).filter(w => w.length > 0));
  const [blanks, setBlanks] = useState([]);
  const [filledBlanks, setFilledBlanks] = useState({});
  const [options, setOptions] = useState([]);
  const [selectedBlank, setSelectedBlank] = useState(null);
  const [complete, setComplete] = useState(false);
  const [wrong, setWrong] = useState(null);

  const startGame = (level) => {
    setDifficulty(level);
    // Level 1: 20%, Level 2: 40%, Level 3: 60% of words blanked
    const blankPercent = level === 1 ? 0.2 : level === 2 ? 0.4 : 0.6;
    const numBlanks = Math.max(1, Math.floor(words.length * blankPercent));
    
    // Pick random word indices to blank (skip short words like "a", "the")
    const candidates = words.map((w, i) => ({ w, i })).filter(x => x.w.replace(/[^a-zA-Z]/g, '').length >= 3);
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const blankIndices = shuffled.slice(0, numBlanks).map(x => x.i).sort((a, b) => a - b);
    
    setBlanks(blankIndices);
    setSelectedBlank(blankIndices[0]);
  };

  const getOptionsForBlank = (blankIndex) => {
    const correctWord = words[blankIndex];
    // Get 3 wrong words from other positions
    const otherWords = words.filter((w, i) => i !== blankIndex && w.replace(/[^a-zA-Z]/g, '').length >= 3);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [correctWord, ...shuffledOthers].sort(() => Math.random() - 0.5);
    return allOptions;
  };

  useEffect(() => {
    if (selectedBlank !== null) {
      setOptions(getOptionsForBlank(selectedBlank));
    }
  }, [selectedBlank]);

  const handleOption = (word) => {
    const correctWord = words[selectedBlank];
    if (word === correctWord) {
      const newFilled = { ...filledBlanks, [selectedBlank]: word };
      setFilledBlanks(newFilled);
      
      // Find next unfilled blank
      const nextBlank = blanks.find(b => !newFilled[b]);
      if (nextBlank !== undefined) {
        setSelectedBlank(nextBlank);
      } else {
        setComplete(true);
        if (onComplete) onComplete();
      }
    } else {
      setWrong(word);
      setTimeout(() => setWrong(null), 500);
    }
  };

  const reference = currentItem.type === "scripture" ? currentItem.reference : (currentItem.title ? `"${currentItem.title}"` : currentItem.author);

  if (!difficulty) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>📝 Fill in the Blanks</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 16, color: "#5a4e3a", textAlign: "center", fontFamily: "'Instrument Sans', sans-serif" }}>{reference}</div>
          <div style={{ fontSize: 14, color: "#8a7a62", textAlign: "center", marginBottom: 20 }}>Choose difficulty:</div>
          {[{ level: 1, label: "Easy", desc: "20% blanks" }, { level: 2, label: "Medium", desc: "40% blanks" }, { level: 3, label: "Hard", desc: "60% blanks" }].map(d => (
            <button key={d.level} onClick={() => startGame(d.level)} style={{ width: "80%", padding: "16px 24px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>
              {d.label} <span style={{ opacity: 0.7, fontSize: 13 }}>({d.desc})</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>📝 Fill in the Blanks</div>
          <div style={{ fontSize: 12, color: "#8a7a62" }}>{reference} • {Object.keys(filledBlanks).length}/{blanks.length}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
      </div>

      {complete ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: darkenColor(themeColor, 0.3) }}>Complete!</div>
          <button onClick={onClose} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflow: "auto", background: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, lineHeight: 2 }}>
            {words.map((word, i) => {
              const isBlank = blanks.includes(i);
              const isFilled = filledBlanks[i];
              const isSelected = selectedBlank === i;
              
              if (!isBlank) return <span key={i}>{word} </span>;
              if (isFilled) return <span key={i} style={{ background: "#e8f5e8", padding: "2px 6px", borderRadius: 4, color: "#2a5a2a", fontWeight: 600 }}>{isFilled} </span>;
              return (
                <button key={i} onClick={() => setSelectedBlank(i)} style={{ padding: "2px 12px", borderRadius: 4, border: isSelected ? `2px solid ${themeColor}` : "2px dashed #d4cbb8", background: isSelected ? `${themeColor}20` : "#faf8f4", color: "#8a7a62", cursor: "pointer", margin: "0 2px" }}>
                  {"_".repeat(Math.min(word.length, 8))}
                </button>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleOption(opt)} style={{ padding: "14px 12px", borderRadius: 12, border: "none", background: wrong === opt ? "#ffcccc" : "#fff", color: "#3d3222", fontSize: 15, fontWeight: 500, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "background 0.2s" }}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


function CardPickupGame({ items, themeColor = "#d4a854", onComplete, onClose }) {
  const [selectedItemId, setSelectedItemId] = useState(() => items[Math.floor(Math.random() * items.length)].id);
  const [difficulty, setDifficulty] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [pickedWords, setPickedWords] = useState([]);
  const [wrongPick, setWrongPick] = useState(null);
  const [hintCard, setHintCard] = useState(null);
  const [complete, setComplete] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastPickTime, setLastPickTime] = useState(null);

  const currentItem = items.find(i => i.id === selectedItemId) || items[0];
  const words = currentItem.text.split(/\s+/).filter(w => w.length > 0);
  const itemLanguage = currentItem.language || "English";

  // Normalize word for comparison
  const normalizeWord = (w) => w.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF\u3000-\u9FFF\uAC00-\uD7AF]/gi, '');

  const getRandomWordsForLanguage = (lang, count) => {
    // First try to get words from other items in same language
    const sameLanguageItems = items.filter(i => (i.language || "English") === lang && i.id !== currentItem.id);
    const wordsFromItems = sameLanguageItems
      .flatMap(i => i.text.split(/\s+/).filter(w => w.replace(/[^\w\u0400-\u04FF\u3000-\u9FFF\uAC00-\uD7AF]/g, '').length >= 2))
      .sort(() => Math.random() - 0.5);
    
    if (wordsFromItems.length >= count) {
      return wordsFromItems.slice(0, count);
    }
    
    // Backfill with predefined random words
    const langWords = RANDOM_WORDS_BY_LANGUAGE[lang] || RANDOM_WORDS_BY_LANGUAGE["English"];
    const backfill = [...langWords].sort(() => Math.random() - 0.5);
    return [...wordsFromItems, ...backfill].slice(0, count);
  };

  const startGame = (level) => {
    setDifficulty(level);
    const extraCount = level === 1 ? 10 : level === 2 ? 25 : 50;
    
    const randomWords = getRandomWordsForLanguage(itemLanguage, extraCount);
    
    const allWordsWithSource = [
      ...words.map((w, i) => ({ word: w, isCorrect: true, index: i, id: `correct-${i}` })),
      ...randomWords.map((w, i) => ({ word: w, isCorrect: false, index: -1, id: `wrong-${i}` })),
    ].sort(() => Math.random() - 0.5);
    
    setAllCards(allWordsWithSource);
    setPickedWords([]);
    setStartTime(Date.now());
    setLastPickTime(Date.now());
  };

  // Timer and hint system
  useEffect(() => {
    if (!startTime || complete) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      
      if (lastPickTime && Date.now() - lastPickTime > 7000 && !hintCard) {
        const nextWord = words[pickedWords.length];
        if (nextWord) {
          const nextNormalized = normalizeWord(nextWord);
          const matchingCard = allCards.find(c => c.isCorrect && normalizeWord(c.word) === nextNormalized);
          if (matchingCard) {
            setHintCard(matchingCard.id);
            setTimeout(() => setHintCard(null), 1500);
          }
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, complete, lastPickTime, hintCard, allCards, words, pickedWords.length]);

  const handlePick = (card, cardIndex) => {
    const nextWordIndex = pickedWords.length;
    const nextWord = words[nextWordIndex];
    if (!nextWord) return;
    
    const nextNormalized = normalizeWord(nextWord);
    const pickedNormalized = normalizeWord(card.word);
    
    if (pickedNormalized === nextNormalized) {
      const newPicked = [...pickedWords, nextWord];
      setPickedWords(newPicked);
      setAllCards(allCards.filter((_, i) => i !== cardIndex));
      setLastPickTime(Date.now());
      setHintCard(null);
      
      if (newPicked.length >= words.length) {
        setComplete(true);
        if (onComplete) onComplete();
      }
    } else {
      setWrongPick(cardIndex);
      setTimeout(() => setWrongPick(null), 400);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const reference = currentItem.type === "scripture" ? currentItem.reference : (currentItem.title ? `"${currentItem.title}"` : currentItem.author);
  const showLanguageTag = itemLanguage && itemLanguage !== "English";

  if (!difficulty) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>🃏 52 Card Pickup</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          {/* Scripture selector */}
          <div style={{ width: "90%", maxWidth: 320 }}>
            <div style={{ fontSize: 12, color: "#8a7a62", marginBottom: 6, fontFamily: "'Instrument Sans', sans-serif" }}>Choose scripture:</div>
            <ScriptureSelector
              items={items}
              selected={selectedItemId}
              onSelect={setSelectedItemId}
              themeColor={themeColor}
            />
          </div>
          
          {/* Preview */}
          <div style={{ 
            width: "90%", maxWidth: 320, padding: "12px", borderRadius: 12,
            background: "#fff", border: "1px solid #e0d8cc",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#3d3222", fontFamily: "'Instrument Sans', sans-serif" }}>{reference}</span>
              {showLanguageTag && (
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${themeColor}20`, color: darkenColor(themeColor, 0.3) }}>{itemLanguage}</span>
              )}
            </div>
            <div style={{ fontSize: 13, fontStyle: "italic", color: "#5a4e3a", lineHeight: 1.5 }}>
              {currentItem.text.slice(0, 100)}...
            </div>
          </div>
          
          <div style={{ fontSize: 14, color: "#8a7a62", textAlign: "center" }}>Pick words in order. Hint appears after 7 sec.</div>
          {[{ level: 1, label: "Easy", desc: "+10 extra words" }, { level: 2, label: "Medium", desc: "+25 extra words" }, { level: 3, label: "Hard", desc: "+50 extra words" }].map(d => (
            <button key={d.level} onClick={() => startGame(d.level)} style={{ width: "80%", padding: "16px 24px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>
              {d.label} <span style={{ opacity: 0.7, fontSize: 13 }}>({d.desc})</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>🃏 52 Card Pickup</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#8a7a62" }}>{reference}</span>
            {showLanguageTag && <span style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, background: `${themeColor}20`, color: darkenColor(themeColor, 0.3) }}>{itemLanguage}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>⏱️ {formatTime(elapsedTime)}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, minHeight: 60 }}>
        <div style={{ fontSize: 11, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 4 }}>{pickedWords.length}/{words.length} words</div>
        <div style={{ fontSize: 14, fontStyle: "italic", color: "#3d3222", lineHeight: 1.5 }}>
          {pickedWords.join(" ")}{pickedWords.length < words.length && <span style={{ color: themeColor }}> ▸</span>}
        </div>
      </div>

      {complete ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: darkenColor(themeColor, 0.3) }}>Complete!</div>
          <div style={{ fontSize: 16, color: "#8a7a62", marginTop: 8 }}>Time: {formatTime(elapsedTime)}</div>
          <button onClick={onClose} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {allCards.map((card, i) => (
              <button key={card.id} onClick={() => handlePick(card, i)} style={{
                padding: "10px 14px", borderRadius: 10, border: "none",
                background: hintCard === card.id ? themeColor : wrongPick === i ? "#ffcccc" : "#fff",
                color: hintCard === card.id ? "#fff" : "#3d3222",
                fontSize: 14, fontWeight: hintCard === card.id ? 700 : 500, cursor: "pointer",
                boxShadow: hintCard === card.id ? `0 4px 16px ${themeColor}60` : "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.15s",
                transform: wrongPick === i ? "scale(0.95)" : hintCard === card.id ? "scale(1.1)" : "scale(1)",
              }}>
                {card.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Flash Attack Game (Fullscreen) ---
function FlashAttackGame({ items, themeColor = "#d4a854", onComplete, onClose }) {
  const [verseCount, setVerseCount] = useState(null);
  const [gameItems, setGameItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [complete, setComplete] = useState(false);

  const maxVerses = Math.min(20, items.length);
  const defaultVerses = Math.min(5, items.length);

  const startGame = (count) => {
    setVerseCount(count);
    const shuffled = [...items].sort(() => Math.random() - 0.5).slice(0, count);
    setGameItems(shuffled);
  };

  const currentItem = gameItems[currentIndex];

  useEffect(() => {
    if (!currentItem || !gameItems.length) return;
    const otherItems = items.filter(i => i.id !== currentItem.id);
    const shuffled = [...otherItems].sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongOptions = shuffled.map(i => ({
      label: i.type === "scripture" ? i.reference : (i.title ? `"${i.title}"` : i.author),
      correct: false,
    }));
    const correctOption = {
      label: currentItem.type === "scripture" ? currentItem.reference : (currentItem.title ? `"${currentItem.title}"` : currentItem.author),
      correct: true,
    };
    setOptions([...wrongOptions, correctOption].sort(() => Math.random() - 0.5));
    setSelected(null);
    setShowResult(false);
  }, [currentIndex, currentItem, items, gameItems.length]);

  const handleSelect = (option) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    if (option.correct) setCorrect(c => c + 1);

    setTimeout(() => {
      if (currentIndex + 1 >= gameItems.length) {
        setComplete(true);
        if (onComplete) onComplete();
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1000);
  };

  if (items.length < 2) return <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a62" }}>Need at least 2 scriptures<button onClick={onClose} style={{ marginLeft: 16, padding: "8px 16px", background: themeColor, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Back</button></div>;

  if (verseCount === null) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>⚡ Flash Attack</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ fontSize: 16, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif" }}>How many verses?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 280 }}>
            {[3, 5, 7, 10, 15, 20].filter(n => n <= maxVerses).map(n => (
              <button key={n} onClick={() => startGame(n)} style={{
                width: 60, height: 60, borderRadius: 12, border: "none",
                background: n === defaultVerses ? `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})` : "#fff",
                color: n === defaultVerses ? "#fff" : "#3d3222", fontSize: 18, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>{n}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#a89878" }}>Default: {defaultVerses} verses</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>⚡ Flash Attack</div>
          <div style={{ fontSize: 12, color: "#8a7a62" }}>{currentIndex + 1}/{verseCount} · {correct} correct</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
      </div>

      {complete ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: darkenColor(themeColor, 0.3) }}>Complete!</div>
          <div style={{ fontSize: 16, color: "#8a7a62", marginTop: 8 }}>{correct}/{verseCount} correct</div>
          <button onClick={onClose} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
        </div>
      ) : currentItem && (
        <>
          <div style={{ flex: 1, overflow: "auto", background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontStyle: "italic", color: "#3d3222", lineHeight: 1.6 }}>{currentItem.text}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleSelect(opt)} style={{
                padding: "14px 16px", borderRadius: 12, border: "none", textAlign: "left",
                background: showResult ? (opt.correct ? "#e8f5e8" : selected === opt ? "#ffcccc" : "#fff") : "#fff",
                color: "#3d3222", fontSize: 14, fontWeight: 500, cursor: showResult ? "default" : "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
                {opt.label} {showResult && opt.correct && "✓"}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Whack-a-Mole Game ---
function WhackAMoleGame({ items, themeColor = "#d4a854", onComplete, onClose }) {
  const [rounds, setRounds] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [moles, setMoles] = useState(Array(9).fill(null)); // 3x3 grid
  const [roundNumber, setRoundNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const difficultySettings = {
    easy: { minInterval: 400, maxInterval: 1200, minDuration: 1500, maxDuration: 3000 },
    medium: { minInterval: 350, maxInterval: 1000, minDuration: 1200, maxDuration: 2500 },
    hard: { minInterval: 300, maxInterval: 800, minDuration: 900, maxDuration: 2000 },
  };

  const startGame = (r, d) => {
    const item = items[Math.floor(Math.random() * items.length)];
    setRounds(r);
    setDifficulty(d);
    setCurrentItem(item);
    setRoundNumber(0);
    setScore(0);
    setMoles(Array(9).fill(null));
    setRoundComplete(false);
    setComplete(false);
    setGameStarted(true);
  };

  const nextRound = (roundNum, totalRounds) => {
    if (roundNum >= totalRounds) {
      setComplete(true);
      setGameStarted(false);
      if (onComplete) onComplete();
      return;
    }
    const item = items[Math.floor(Math.random() * items.length)];
    setRoundNumber(roundNum);
    setRoundComplete(false);
    setCurrentItem(item);
    setMoles(Array(9).fill(null));
  };

  // Mole spawner - uses interval instead of recursive setTimeout
  useEffect(() => {
    if (!gameStarted || !difficulty || !currentItem || roundComplete || complete) return;
    
    const settings = difficultySettings[difficulty];
    let timeoutId = null;
    
    const spawnMole = () => {
      const emptySpots = [];
      for (let i = 0; i < 9; i++) {
        // Check current moles state via ref pattern
        setMoles(prev => {
          if (prev[i] === null) emptySpots.push(i);
          return prev;
        });
      }
      
      setMoles(prev => {
        const available = prev.map((m, i) => m === null ? i : -1).filter(i => i >= 0);
        if (available.length === 0) return prev;
        
        const spot = available[Math.floor(Math.random() * available.length)];
        const isCorrectRef = Math.random() < 0.35; // 35% chance correct
        const ref = isCorrectRef ? currentItem : items[Math.floor(Math.random() * items.length)];
        const label = ref.type === "scripture" ? ref.reference : (ref.title ? `"${ref.title}"` : ref.author);
        const moleId = Date.now() + Math.random();
        
        const next = [...prev];
        next[spot] = { label, isCorrect: ref.id === currentItem.id, id: moleId };
        
        // Schedule removal after duration
        const duration = settings.minDuration + Math.random() * (settings.maxDuration - settings.minDuration);
        setTimeout(() => {
          setMoles(current => {
            const updated = [...current];
            if (updated[spot]?.id === moleId) updated[spot] = null;
            return updated;
          });
        }, duration);
        
        return next;
      });
      
      // Schedule next spawn
      const nextInterval = settings.minInterval + Math.random() * (settings.maxInterval - settings.minInterval);
      timeoutId = setTimeout(spawnMole, nextInterval);
    };

    // Initial spawn after short delay
    timeoutId = setTimeout(spawnMole, 300);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [gameStarted, difficulty, currentItem, roundComplete, complete, items]);

  const handleWhack = (index) => {
    const mole = moles[index];
    if (!mole) return;
    
    if (mole.isCorrect) {
      setScore(s => s + 1);
      setRoundComplete(true);
      setTimeout(() => nextRound(roundNumber + 1, rounds), 1000);
    }
    setMoles(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  if (items.length < 3) return <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a62" }}>Need at least 3 scriptures<button onClick={onClose} style={{ marginLeft: 16, padding: "8px 16px", background: themeColor, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Back</button></div>;

  if (!gameStarted) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>🔨 Whack-a-Mole</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 12 }}>How many rounds? (5-20)</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[5, 10, 15, 20].map(n => (
                <button key={n} onClick={() => !difficulty && setRounds(n)} style={{
                  width: 50, height: 50, borderRadius: 10, border: "none",
                  background: rounds === n ? themeColor : "#fff", color: rounds === n ? "#fff" : "#3d3222",
                  fontSize: 16, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}>{n}</button>
              ))}
            </div>
          </div>
          {rounds && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 12 }}>Difficulty</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {["easy", "medium", "hard"].map(d => (
                  <button key={d} onClick={() => startGame(rounds, d)} style={{
                    padding: "12px 24px", borderRadius: 12, border: "none",
                    background: d === "medium" ? `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})` : "#fff",
                    color: d === "medium" ? "#fff" : "#3d3222",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}>{d}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const reference = currentItem?.type === "scripture" ? currentItem?.reference : (currentItem?.title ? `"${currentItem?.title}"` : currentItem?.author);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: `linear-gradient(180deg, ${lightenColor(themeColor, 0.9)} 0%, ${lightenColor(themeColor, 0.8)} 100%)`, display: "flex", flexDirection: "column", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: darkenColor(themeColor, 0.3), fontFamily: "'Instrument Sans', sans-serif" }}>🔨 Whack-a-Mole</div>
          <div style={{ fontSize: 12, color: "#8a7a62" }}>Round {roundNumber + 1}/{rounds} · Score: {score}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7a62", cursor: "pointer" }}><IconX size={24} /></button>
      </div>

      {complete ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: darkenColor(themeColor, 0.3) }}>Complete!</div>
          <div style={{ fontSize: 16, color: "#8a7a62", marginTop: 8 }}>Score: {score}/{rounds}</div>
          <button onClick={onClose} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
        </div>
      ) : (
        <>
          <div style={{ background: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, maxHeight: 100, overflow: "auto" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: themeColor, marginBottom: 4 }}>Find: {reference}</div>
            <div style={{ fontSize: 13, fontStyle: "italic", color: "#3d3222", lineHeight: 1.4 }}>{currentItem?.text.slice(0, 100)}...</div>
          </div>
          {roundComplete && <div style={{ textAlign: "center", fontSize: 24, color: "#5a8e4a", marginBottom: 8 }}>✓ Correct!</div>}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {moles.map((mole, i) => (
              <button key={i} onClick={() => handleWhack(i)} style={{
                borderRadius: 12, border: "none",
                background: mole ? "#fff" : "#e8e0d4",
                color: "#3d3222", fontSize: 11, fontWeight: 500, cursor: mole ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                padding: 8, lineHeight: 1.2,
                boxShadow: mole ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                transform: mole ? "scale(1)" : "scale(0.9)",
                transition: "all 0.15s",
              }}>
                {mole?.label || ""}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Practice Page ---
function PracticePage({ user, updateUser, allUsers, updateUserById, triggerCelebration, showProgressToast, themeColor = "#d4a854", setPage, setActiveGame }) {
  // Persistent done state: keyed by practice day (resets at 10pm)
  const currentPracticeDay = practiceDayKey();
  const savedDoneKey = `scripture_done_${user.id}`;

  // Load saved state including lastTier to prevent duplicate toasts
  const savedState = useMemo(() => {
    try {
      const raw = localStorage.getItem(savedDoneKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.day === currentPracticeDay) {
          return { ids: parsed.ids || [], lastTier: parsed.lastTier ?? -1, celebrationShown: parsed.celebrationShown || false };
        }
      }
    } catch(e) {}
    return { ids: [], lastTier: -1, celebrationShown: false };
  }, [savedDoneKey, currentPracticeDay]);

  const [doneIds, setDoneIds] = useState(() => new Set(savedState.ids));
  const [allDoneTriggered, setAllDoneTriggered] = useState(savedState.celebrationShown);
  const [expandAll, setExpandAll] = useState(true);
  const [sneakPeekOpen, setSneakPeekOpen] = useState(false);
  const [lastTier, setLastTier] = useState(savedState.lastTier);

  // Persist doneIds and lastTier to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(savedDoneKey, JSON.stringify({
        day: currentPracticeDay,
        ids: [...doneIds],
        lastTier: lastTier,
        celebrationShown: allDoneTriggered,
      }));
    } catch(e) {}
  }, [doneIds, currentPracticeDay, savedDoneKey, lastTier, allDoneTriggered]);

  // Check every 30 seconds if practice day rolled over (past 10pm)
  useEffect(() => {
    const interval = setInterval(() => {
      const newDay = practiceDayKey();
      if (newDay !== currentPracticeDay) {
        // Day rolled over — clear done state
        setDoneIds(new Set());
        setAllDoneTriggered(false);
        setLastTier(-1);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentPracticeDay]);

  const targetWeeks = [
    { key: weeksAgo(0), label: "This Week" },
    { key: weeksAgo(1), label: "1 Week Ago" },
    { key: weeksAgo(2), label: "2 Weeks Ago" },
    { key: weeksAgo(3), label: "3 Weeks Ago" },
    { key: weeksAgo(4), label: "4 Weeks Ago" },
    { key: weeksAgo(8), label: "8 Weeks Ago" },
    { key: weeksAgo(12), label: "12 Weeks Ago" },
    { key: weeksAgo(24), label: "24 Weeks Ago" },
    { key: weeksAgo(52), label: "1 Year Ago" },
  ];

  const practiceItems = [];
  const seenIds = new Set();
  targetWeeks.forEach(tw => {
    user.items.filter(i => i.weekKey === tw.key).forEach(item => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        practiceItems.push({ ...item, _weekLabel: tw.label });
      }
    });
  });

  // Add one random item from outside the target weeks
  const targetWeekKeys = new Set(targetWeeks.map(tw => tw.key));
  const otherItems = user.items.filter(i => !targetWeekKeys.has(i.weekKey) && !seenIds.has(i.id));
  if (otherItems.length > 0) {
    // Use a daily-stable seed so the random pick doesn't change on re-render
    const daySeed = currentPracticeDay.split("-").join("");
    const idx = parseInt(daySeed, 10) % otherItems.length;
    const randomItem = otherItems[idx];
    seenIds.add(randomItem.id);
    practiceItems.push({ ...randomItem, _weekLabel: "Random Review" });
  }

  const activeItems = practiceItems.filter(i => !doneIds.has(i.id));
  const doneItems = practiceItems.filter(i => doneIds.has(i.id));
  const totalCount = practiceItems.length;
  const doneCount = doneItems.length;
  const progress = totalCount > 0 ? doneCount / totalCount : 0;

  useEffect(() => {
    if (activeItems.length === 0 && practiceItems.length > 0 && !allDoneTriggered) {
      setAllDoneTriggered(true);
      triggerCelebration();
    }
  }, [activeItems.length, practiceItems.length, allDoneTriggered, triggerCelebration]);

  useEffect(() => {
    if (totalCount === 0) return;
    const currentTierIdx = CELEBRATION_TIERS.findIndex(t => progress >= t.threshold && progress < (CELEBRATION_TIERS[CELEBRATION_TIERS.indexOf(t) + 1]?.threshold || 2));
    const exactTierIdx = CELEBRATION_TIERS.findIndex(t => Math.abs(progress - t.threshold) < 0.001);
    const tierIdx = exactTierIdx >= 0 ? exactTierIdx : currentTierIdx;
    if (tierIdx > lastTier && doneCount > 0 && progress < 1) {
      setLastTier(tierIdx);
      showProgressToast(progress, totalCount);
    }
  }, [progress, totalCount, doneCount, lastTier, showProgressToast]);

  const handleAction = (itemId, field) => {
    const today = todayKey();
    const updatedItems = user.items.map(i => {
      if (i.id === itemId) {
        const counts = { ...(i[field] || {}) };
        counts[today] = (counts[today] || 0) + 1;
        const lifetimeKey = field === "practices" ? "lifetimePractices" : 
                           field === "ponders" ? "lifetimePonders" : "lifetimeGotIts";
        return { ...i, [field]: counts, [lifetimeKey]: (i[lifetimeKey] || 0) + 1 };
      }
      return i;
    });
    updateUser({ ...user, items: updatedItems });
  };

  const handleDone = (itemId) => {
    handleAction(itemId, "gotIts");
    setDoneIds(prev => new Set([...prev, itemId]));
  };

  const handleComment = (itemId, text) => {
    const updatedItems = user.items.map(i => {
      if (i.id === itemId) return { ...i, comments: [...(i.comments || []), { date: todayKey(), text }] };
      return i;
    });
    updateUser({ ...user, items: updatedItems });
  };

  const [shareToast, setShareToast] = useState(null);
  const [suggestItem, setSuggestItem] = useState(null);

  const handleSuggest = (item) => {
    setSuggestItem(item);
  };

  const handleUpdateUserSettings = (field, value) => {
    updateUser({ ...user, [field]: value });
  };

  const userSettings = {
    defaultVisibility: user.defaultVisibility ?? 100,
    hideMode: user.hideMode || "firstLetter",
  };

  const weekOptions = getWeekOptionsForUser(user.items);

  // Check if it's user's birthday
  const isBirthday = useMemo(() => {
    if (!user.birthdate) return false;
    const today = new Date();
    const birthParts = user.birthdate.toLowerCase().replace(/,/g, '').split(' ');
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    let birthMonth = -1, birthDay = -1;
    for (const part of birthParts) {
      const monthIdx = months.indexOf(part);
      if (monthIdx >= 0) birthMonth = monthIdx;
      const num = parseInt(part);
      if (num >= 1 && num <= 31) birthDay = num;
    }
    return birthMonth === today.getMonth() && birthDay === today.getDate();
  }, [user.birthdate]);

  // Get consistent random celebration message for the day
  const celebrationMessage = useMemo(() => {
    const dayNum = parseInt(todayKey().replace(/-/g, ''));
    const idx = dayNum % COMPLETION_MESSAGES.length;
    const msg = COMPLETION_MESSAGES[idx];
    return {
      emoji: msg.emoji,
      message: msg.message.replace(/{name}/g, user.name || 'friend'),
    };
  }, [user.name]);

  // Check if user has scriptures for next two weeks
  const nextWeek1 = weeksAgo(-1);
  const nextWeek2 = weeksAgo(-2);
  const hasNextWeekItems = user.items.some(i => i.weekKey === nextWeek1 || i.weekKey === nextWeek2);
  
  // Suggestion card state
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [suggestionCount, setSuggestionCount] = useState(0);
  const [currentSuggestion, setCurrentSuggestion] = useState(() => {
    if (hasNextWeekItems || user.suggestedQueue.length === 0) return null;
    return user.suggestedQueue[Math.floor(Math.random() * user.suggestedQueue.length)];
  });

  const handleAddSuggestion = () => {
    if (!currentSuggestion) return;
    const newItem = {
      id: generateId(), type: currentSuggestion.type || "scripture",
      reference: currentSuggestion.reference || "", author: currentSuggestion.author || "",
      title: currentSuggestion.title || "", year: currentSuggestion.year || "",
      source: currentSuggestion.source || "", context: currentSuggestion.context || "",
      url: currentSuggestion.url || "", text: currentSuggestion.text, language: currentSuggestion.language || "English",
      weekKey: nextWeek1, createdAt: new Date().toISOString(),
      practices: {}, gotIts: {}, ponders: {}, lifetimePractices: 0, lifetimeGotIts: 0, lifetimePonders: 0, comments: [],
    };
    updateUser({ 
      ...user, 
      items: [...user.items, newItem], 
      suggestedQueue: user.suggestedQueue.filter(s => s.id !== currentSuggestion.id) 
    });
    setSuggestionDismissed(true);
  };

  const handleNotNow = () => {
    const newCount = suggestionCount + 1;
    setSuggestionCount(newCount);
    if (newCount >= 3) {
      setSuggestionDismissed(true);
    } else {
      // Pick a different suggestion
      const remaining = user.suggestedQueue.filter(s => s.id !== currentSuggestion?.id);
      if (remaining.length > 0) {
        setCurrentSuggestion(remaining[Math.floor(Math.random() * remaining.length)]);
      } else {
        setSuggestionDismissed(true);
      }
    }
  };

  const handleNeverSuggest = () => {
    if (!currentSuggestion) return;
    // Remove from suggested queue
    updateUser({ ...user, suggestedQueue: user.suggestedQueue.filter(s => s.id !== currentSuggestion.id) });
    handleNotNow();
  };

  let lastWeekLabel = null;

  return (
    <div>
      {/* Birthday wish */}
      {isBirthday && (
        <div style={{
          margin: "16px", padding: "20px", borderRadius: 16,
          background: "linear-gradient(135deg, #ffd700, #ffb347)",
          textAlign: "center", boxShadow: "0 4px 20px rgba(255,179,71,0.3)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎂🎉🎈</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#5a3a00", fontFamily: "'Instrument Sans', sans-serif" }}>
            Happy Birthday, {user.name}!
          </div>
          <div style={{ fontSize: 14, color: "#7a5a10", marginTop: 8, fontFamily: "'Instrument Sans', sans-serif" }}>
            May your special day be filled with joy and blessings!
          </div>
        </div>
      )}

      {/* Suggestion card if no scriptures for next 2 weeks */}
      {!hasNextWeekItems && currentSuggestion && !suggestionDismissed && (
        <div style={{
          margin: "12px 16px", padding: "16px", borderRadius: 14,
          background: `linear-gradient(135deg, ${lightenColor(themeColor, 0.9)}, ${lightenColor(themeColor, 0.8)})`,
          border: `1px solid ${themeColor}40`, position: "relative",
        }}>
          <button onClick={() => setSuggestionDismissed(true)} style={{
            position: "absolute", top: 8, right: 8, background: "none", border: "none",
            color: "#a89878", cursor: "pointer", padding: 4,
          }}><IconX size={16} /></button>
          <div style={{ fontSize: 12, fontWeight: 600, color: themeColor, fontFamily: "'Instrument Sans', sans-serif", marginBottom: 8 }}>
            📅 Nothing scheduled for next week!
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#3d3222", fontFamily: "'Instrument Sans', sans-serif" }}>
            {currentSuggestion.reference || currentSuggestion.title || currentSuggestion.author}
          </div>
          <div style={{ fontSize: 13, fontStyle: "italic", color: "#5a4e3a", marginTop: 4, lineHeight: 1.5 }}>
            {currentSuggestion.text.length > 100 ? currentSuggestion.text.slice(0, 100) + "..." : currentSuggestion.text}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={handleAddSuggestion} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
            }}>Add</button>
            <button onClick={handleNotNow} style={{
              padding: "10px 16px", borderRadius: 10, border: "1px solid #d4cbb8",
              background: "#fff", color: "#8a7a62", fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
            }}>Not now</button>
            <button onClick={handleNeverSuggest} style={{
              padding: "10px 16px", borderRadius: 10, border: "none",
              background: "#f5f0e8", color: "#a89878", fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
            }}>Never</button>
          </div>
        </div>
      )}

      <SectionHeader
        sub={`${activeItems.length} item${activeItems.length !== 1 ? 's' : ''} to review`}
        right={
          <button onClick={() => setExpandAll(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10,
            border: "1px solid #d4cbb8", background: expandAll ? "rgba(212,168,84,0.12)" : "#fff",
            color: "#8a7a62", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>
            <IconExpand size={14} expanded={expandAll} />
            {expandAll ? "Collapse" : "Expand All"}
          </button>
        }
      >Practice + Ponder</SectionHeader>

      {totalCount > 0 && (
        <div style={{ padding: "0 20px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, fontFamily: "'Instrument Sans', sans-serif", color: "#a89878" }}>
            <span>{doneCount} of {totalCount} completed</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div style={{ width: "100%", height: 6, background: "#e8e0d4", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${progress * 100}%`, height: "100%",
              background: progress >= 1 ? "linear-gradient(90deg, #6a9e5a, #5a8e4a)" : `linear-gradient(90deg, ${themeColor}, ${themeColor}dd)`,
              borderRadius: 3, transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }} />
          </div>
        </div>
      )}

      {activeItems.length === 0 && practiceItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 32px", color: "#a89878" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
          <div style={{ fontSize: 16, fontFamily: "'Instrument Sans', sans-serif" }}>No scriptures assigned yet</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Add some from the menu to get started!</div>
        </div>
      )}

      {/* Guidance tip for new users */}
      <GuidanceTip tipKey="practice_intro" user={user} updateUser={updateUser}>
        Welcome! This is your daily practice feed. Expand a scripture, use the slider to hide words, then tap "Passed off!" when memorized.
      </GuidanceTip>

      {/* Quick Game Cards - shown above scriptures */}
      {user.items.length >= 1 && setActiveGame && (
        <div style={{ padding: "12px 16px 4px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 8 }}>
            Practice Games
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {[
              { id: "flashAttack", icon: "⚡", name: "Flash Attack", minItems: 4 },
              { id: "holdToRod", icon: "🌳", name: "Hold to Rod", minItems: 1 },
              { id: "fillBlanks", icon: "📝", name: "Fill Blanks", minItems: 1 },
              { id: "cardPickup", icon: "🃏", name: "52 Pickup", minItems: 2 },
              { id: "whackAMole", icon: "🔨", name: "Whack-a-Mole", minItems: 3 },
              { id: "matching", icon: "🎯", name: "Match", minItems: 4 },
              { id: "dragDrop", icon: "🔗", name: "Drag Match", minItems: 5 },
            ].filter(game => user.items.length >= game.minItems).slice(0, 4).map(game => (
              <button
                key={game.id}
                onClick={() => setActiveGame(game.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", borderRadius: 12, border: "none",
                  background: `linear-gradient(135deg, ${lightenColor(themeColor, 0.85)}, ${lightenColor(themeColor, 0.75)})`,
                  color: darkenColor(themeColor, 0.4), fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
                  whiteSpace: "nowrap", flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <span style={{ fontSize: 16 }}>{game.icon}</span>
                {game.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeItems.map(item => {
        const showLabel = item._weekLabel !== lastWeekLabel;
        lastWeekLabel = item._weekLabel;
        return (
          <div key={item.id}>
            {showLabel && (
              <div style={{ padding: "12px 20px 4px", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#a89878", fontFamily: "'Instrument Sans', sans-serif" }}>{item._weekLabel} · {item.weekKey}</div>
            )}
            <ScriptureCard
              item={item}
              forceExpanded={expandAll}
              onPractice={(id) => handleAction(id, "practices")}
              onPonder={(id) => handleAction(id, "ponders")}
              onGotIt={handleDone}
              onGoodEnough={handleDone}
              onComment={handleComment}
              
              onSuggest={handleSuggest}
              userSettings={userSettings}
              onUpdateUserSettings={handleUpdateUserSettings}
              themeColor={themeColor}
            />
          </div>
        );
      })}

      {/* All done celebration OR done items list */}
      {activeItems.length === 0 && doneItems.length > 0 && (
        <>
          <div style={{
            margin: "24px 16px", padding: "32px 24px", borderRadius: 20,
            background: `linear-gradient(135deg, ${lightenColor(themeColor, 0.9)}, ${lightenColor(themeColor, 0.8)})`,
            textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{celebrationMessage.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: darkenColor(themeColor, 0.5), fontFamily: "'Instrument Sans', sans-serif", lineHeight: 1.4 }}>
              {celebrationMessage.message}
            </div>
            <div style={{ fontSize: 14, color: "#8a7a62", marginTop: 16, fontFamily: "'Instrument Sans', sans-serif" }}>
              You completed {doneItems.length} scripture{doneItems.length !== 1 ? 's' : ''} today!
            </div>
          </div>

          {/* Sneak peek for next week */}
          {(() => {
            const nextWeek = weeksAgo(-1);
            const nextWeekItems = user.items.filter(i => i.weekKey === nextWeek && !doneIds.has(i.id));
            if (nextWeekItems.length === 0) return null;
            
            return !sneakPeekOpen ? (
              <button
                onClick={() => setSneakPeekOpen(true)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  margin: "0 16px 16px", padding: "16px", width: "calc(100% - 32px)",
                  borderRadius: 14, border: `2px dashed ${themeColor}50`,
                  background: `${themeColor}08`, color: darkenColor(themeColor, 0.5),
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif",
                }}
              >
                👀 Get a sneak peek? <span style={{ fontSize: 12 }}>({nextWeekItems.length} scripture{nextWeekItems.length !== 1 ? 's' : ''} coming next week)</span>
              </button>
            ) : (
              <div>
                <SectionHeader style={{ marginTop: 8 }}>Sneak Peek — Next Week 👀</SectionHeader>
                {nextWeekItems.map(item => (
                  <ScriptureCard 
                    key={item.id} 
                    item={item}
                    forceExpanded={true}
                    onPractice={(id) => handleAction(id, "practices")}
                    onPonder={(id) => handleAction(id, "ponders")}
                    onGotIt={handleDone}
                    onGoodEnough={handleDone}
                    onComment={handleComment}
                    
                    onSuggest={handleSuggest}
                    userSettings={userSettings}
                    onUpdateUserSettings={handleUpdateUserSettings}
                    themeColor={themeColor}
                  />
                ))}
              </div>
            );
          })()}
        </>
      )}

      {/* Flashcard Quiz Carousel - between active and done items */}
      {user.items.length >= 4 && activeItems.length > 0 && (
        <FlashcardQuiz 
          items={user.items} 
          themeColor={themeColor}
          lifetimeCompletions={user.flashAttackCompletions || 0}
          onComplete={() => updateUser({ ...user, flashAttackCompletions: (user.flashAttackCompletions || 0) + 1 })}
        />
      )}

      {doneItems.length > 0 && activeItems.length > 0 && (
        <>
          <SectionHeader style={{ marginTop: 16 }}>Practice done today 👍</SectionHeader>
          {doneItems.map(item => (
            <ScriptureCard 
              key={item.id} 
              item={item} 
              done 
              showActions={true}
              forceExpanded={false} 
              onPractice={(id) => handleAction(id, "practices")}
              onPonder={(id) => handleAction(id, "ponders")}
              onGotIt={(id) => handleAction(id, "gotIts")}
              onGoodEnough={(id) => handleAction(id, "gotIts")}
              onComment={handleComment}
              
              onSuggest={handleSuggest}
              userSettings={userSettings}
              onUpdateUserSettings={handleUpdateUserSettings}
              themeColor={themeColor}
            />
          ))}
        </>
      )}

      {/* Suggest modal */}
      <Modal open={!!suggestItem} onClose={() => setSuggestItem(null)} title="Suggest to users">
        <div style={{ fontSize: 13, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 12 }}>
          Add this scripture to suggested scriptures:
        </div>
        
        {/* Suggest to all users */}
        {allUsers && allUsers.filter(u => u.id !== user.id).length > 0 && (
          <button onClick={() => {
            if (!suggestItem) return;
            const suggestion = {
              id: generateId(),
              type: suggestItem.type || "scripture",
              reference: suggestItem.reference || "",
              author: suggestItem.author || "",
              title: suggestItem.title || "",
              year: suggestItem.year || "",
              source: suggestItem.source || "",
              context: suggestItem.context || "",
              url: suggestItem.url || "",
              text: suggestItem.text,
              language: suggestItem.language || "English",
              sharedBy: user.name,
              sharedAt: new Date().toISOString(),
            };
            allUsers.filter(u => u.id !== user.id).forEach(u => {
              updateUserById(u.id, (targetUser) => ({
                ...targetUser,
                suggestedQueue: [...(targetUser.suggestedQueue || []), { ...suggestion, id: generateId() }],
              }));
            });
            setShareToast(`Suggested to all ${allUsers.length - 1} users!`);
            setTimeout(() => setShareToast(null), 2500);
            setSuggestItem(null);
          }} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "14px 16px", borderRadius: 12, border: `2px solid ${themeColor}`,
            background: `${themeColor}10`, color: "#2c2416", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
            marginBottom: 16, textAlign: "left",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff",
            }}>✨</div>
            Suggest to all users ({allUsers.length - 1})
          </button>
        )}
        
        {allUsers && allUsers.filter(u => u.id !== user.id).map(u => (
          <button key={u.id} onClick={() => {
            if (!suggestItem) return;
            const suggestion = {
              id: generateId(),
              type: suggestItem.type || "scripture",
              reference: suggestItem.reference || "",
              author: suggestItem.author || "",
              title: suggestItem.title || "",
              year: suggestItem.year || "",
              source: suggestItem.source || "",
              context: suggestItem.context || "",
              url: suggestItem.url || "",
              text: suggestItem.text,
              language: suggestItem.language || "English",
              sharedBy: user.name,
              sharedAt: new Date().toISOString(),
            };
            updateUserById(u.id, (targetUser) => ({
              ...targetUser,
              suggestedQueue: [...(targetUser.suggestedQueue || []), suggestion],
            }));
            setShareToast(`Suggested to ${u.name}!`);
            setTimeout(() => setShareToast(null), 2500);
            setSuggestItem(null);
          }} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "12px 14px", borderRadius: 12, border: "1px solid #e0d8cc",
            background: "#faf8f4", color: "#2c2416", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
            marginBottom: 8, textAlign: "left",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: u.avatarColor || "#e0d8cc",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>{u.avatarEmoji || "📖"}</div>
            {u.name}
          </button>
        ))}
        {allUsers && allUsers.filter(u => u.id !== user.id).length === 0 && (
          <div style={{ fontSize: 13, color: "#a89878", fontStyle: "italic", fontFamily: "'Instrument Sans', sans-serif" }}>No other users yet!</div>
        )}
      </Modal>

      {/* Share toast */}
      {shareToast && (
        <div style={{
          position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "#2c2416", color: themeColor,
          padding: "12px 24px", borderRadius: 14, fontSize: 14, fontWeight: 600,
          fontFamily: "'Instrument Sans', sans-serif",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", animation: "toastIn 0.3s ease",
        }}>
          {shareToast}
        </div>
      )}

      <PageFooter />
    </div>
  );
}

// --- Library Page (with archive instead of delete, plus share) ---
function LibraryPage({ user, updateUser, allUsers, updateUserById, persist, data, themeColor = "#d4a854", setPage, setAddingType }) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list", "week", "archive"
  const [archiveConfirm, setArchiveConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [shareNewName, setShareNewName] = useState("");
  const [showNewUser, setShowNewUser] = useState(false);
  const [shareToast, setShareToast] = useState(null);
  const [showPassedOffOnly, setShowPassedOffOnly] = useState(false);
  
  // Week view state
  const [dragItem, setDragItem] = useState(null);
  const [dragOverWeek, setDragOverWeek] = useState(null);
  const [addToWeek, setAddToWeek] = useState(null);
  const [selectedQueueItem, setSelectedQueueItem] = useState("");

  // Check if an item is "passed off" (gotIts >= 3)
  const isPassedOff = (item) => (item.lifetimeGotIts || 0) >= 3;

  const filtered = user.items.filter(i => {
    const s = search.toLowerCase();
    const matchesSearch = !s || [i.reference, i.text, i.title, i.author, i.context].some(f => (f || "").toLowerCase().includes(s));
    const matchesFilter = !showPassedOffOnly || isPassedOff(i);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const passedOffCount = user.items.filter(isPassedOff).length;
  const archive = user.archive || [];

  // Week view data
  const currentWeek = getWeekKey(new Date());
  const futureWeeks = getNext52Weeks();
  const pastWeeksWithItems = [...new Set(user.items.map(i => i.weekKey))].filter(w => w < currentWeek);
  const allWeeks = [...new Set([...pastWeeksWithItems, ...futureWeeks])].sort();

  const handleArchive = (id) => setArchiveConfirm(id);

  const confirmArchive = () => {
    const item = user.items.find(i => i.id === archiveConfirm);
    if (!item) return;
    const archivedItem = { ...item, archivedAt: new Date().toISOString() };
    updateUser({
      ...user,
      items: user.items.filter(i => i.id !== archiveConfirm),
      archive: [...(user.archive || []), archivedItem],
    });
    setArchiveConfirm(null);
  };

  const handleRestore = (id) => {
    const item = archive.find(i => i.id === id);
    if (!item) return;
    const { archivedAt, ...restored } = item;
    updateUser({
      ...user,
      items: [...user.items, restored],
      archive: archive.filter(i => i.id !== id),
    });
  };

  const handleDelete = (id) => setDeleteConfirm(id);

  const confirmDelete = () => {
    updateUser({
      ...user,
      archive: archive.filter(i => i.id !== deleteConfirm),
    });
    setDeleteConfirm(null);
  };

  const handleComment = (itemId, text) => {
    const updatedItems = user.items.map(i => {
      if (i.id === itemId) return { ...i, comments: [...(i.comments || []), { date: todayKey(), text }] };
      return i;
    });
    updateUser({ ...user, items: updatedItems });
  };

  const handleWeekChange = (itemId, newWeekKey) => {
    const updatedItems = user.items.map(i => i.id === itemId ? { ...i, weekKey: newWeekKey } : i);
    updateUser({ ...user, items: updatedItems });
  };

  const handleMoveItem = (itemId, newWeekKey) => {
    const updatedItems = user.items.map(i => i.id === itemId ? { ...i, weekKey: newWeekKey } : i);
    updateUser({ ...user, items: updatedItems });
    setDragItem(null);
    setDragOverWeek(null);
  };

  const handleAddFromQueue = () => {
    if (!selectedQueueItem || !addToWeek) return;
    const s = user.suggestedQueue.find(x => x.id === selectedQueueItem);
    if (!s) return;
    const newItem = {
      id: generateId(), type: s.type || "scripture", reference: s.reference || "",
      author: s.author || "", title: s.title || "", year: s.year || "",
      source: s.source || "", context: s.context || "", url: s.url || "",
      text: s.text, language: s.language || "English",
      weekKey: addToWeek, createdAt: new Date().toISOString(),
      practices: {}, gotIts: {}, ponders: {}, lifetimePractices: 0, lifetimeGotIts: 0, lifetimePonders: 0, comments: [],
    };
    updateUser({
      ...user,
      items: [...user.items, newItem],
      suggestedQueue: user.suggestedQueue.filter(x => x.id !== selectedQueueItem),
    });
    setAddToWeek(null);
    setSelectedQueueItem("");
  };

  const weekOptions = getWeekOptionsForUser(user.items);

  const handleSuggest = (item) => {
    setShareItem(item);
    setShowNewUser(false);
    setShareNewName("");
  };

  const shareToUser = (targetUserId) => {
    if (!shareItem) return;
    const suggestion = {
      id: generateId(),
      type: shareItem.type || "scripture",
      reference: shareItem.reference || "",
      author: shareItem.author || "",
      title: shareItem.title || "",
      year: shareItem.year || "",
      source: shareItem.source || "",
      context: shareItem.context || "",
      url: shareItem.url || "",
      text: shareItem.text,
      language: shareItem.language || "English",
      sharedBy: user.name,
      sharedAt: new Date().toISOString(),
    };
    updateUserById(targetUserId, (u) => ({
      ...u,
      suggestedQueue: [...(u.suggestedQueue || []), suggestion],
    }));
    const targetUser = allUsers.find(u => u.id === targetUserId);
    setShareToast(`Shared to ${targetUser?.name || "user"}'s suggestions!`);
    setTimeout(() => setShareToast(null), 2000);
    setShareItem(null);
  };

  const createAndShare = () => {
    if (!shareNewName.trim() || !shareItem) return;
    const newUser = createDefaultUser(shareNewName.trim(), "");
    const suggestion = {
      id: generateId(),
      type: shareItem.type || "scripture",
      reference: shareItem.reference || "",
      author: shareItem.author || "",
      title: shareItem.title || "",
      year: shareItem.year || "",
      source: shareItem.source || "",
      context: shareItem.context || "",
      url: shareItem.url || "",
      text: shareItem.text,
      language: shareItem.language || "English",
      sharedBy: user.name,
      sharedAt: new Date().toISOString(),
    };
    newUser.suggestedQueue = [...(newUser.suggestedQueue || []), suggestion];
    persistData({ ...data, users: [...data.users, newUser] });
    setShareToast(`Created ${shareNewName} & shared!`);
    setTimeout(() => setShareToast(null), 2000);
    setShareItem(null);
    setShowNewUser(false);
    setShareNewName("");
  };

  const darkTheme = darkenColor(themeColor, 0.5);

  return (
    <div>
      <SectionHeader sub={`${user.items.length} scriptures · ${archive.length} archived`}>My Scriptures</SectionHeader>
      
      {/* View mode tabs */}
      <div style={{ display: "flex", gap: 0, margin: "0 16px 12px", background: "#f5f0e8", borderRadius: 12, padding: 4 }}>
        {[
          { id: "list", label: "List" },
          { id: "week", label: "Week View" },
          { id: "archive", label: `Archive${archive.length > 0 ? ` (${archive.length})` : ""}` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 10, border: "none",
              background: viewMode === tab.id ? "#fff" : "transparent",
              color: viewMode === tab.id ? darkTheme : "#8a7a62",
              fontSize: 13, fontWeight: viewMode === tab.id ? 600 : 500,
              cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
              boxShadow: viewMode === tab.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <GuidanceTip tipKey="library_intro" user={user} updateUser={updateUser}>
        Manage all your scriptures here! Use List view to search, Week view to organize your schedule, and Archive for items you've completed.
      </GuidanceTip>

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <>
          <div style={{ padding: "0 16px 8px" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search scriptures..."
              style={{ width: "100%", padding: "12px 16px", border: "1px solid #d4cbb8", borderRadius: 12, fontSize: 15, background: "#fff", outline: "none", marginBottom: 8 }}
            />
            {/* Passed off filter toggle */}
            <div style={{ 
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px", background: "#faf8f4", borderRadius: 10, border: "1px solid #e8e0d4",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif" }}>
                  Passed off only
                </span>
                <span style={{ fontSize: 11, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif" }}>
                  ({passedOffCount} of {user.items.length})
                </span>
              </div>
              <button
                onClick={() => setShowPassedOffOnly(!showPassedOffOnly)}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: "none",
                  background: showPassedOffOnly ? `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})` : "#e0d8cc",
                  cursor: "pointer", position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: showPassedOffOnly ? 24 : 3,
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          </div>
          {filtered.map(item => (
            <div key={item.id} style={{ position: "relative" }}>
              <ScriptureCard item={item} showActions={false} showArchive showManagement onComment={handleComment} onArchive={handleArchive}  onSuggest={handleSuggest} onWeekChange={handleWeekChange} weekOptions={weekOptions} themeColor={themeColor} />
              <div style={{ position: "absolute", top: 12, right: 16, display: "flex", gap: 6 }}>
                {isPassedOff(item) && (
                  <span style={{ 
                    fontSize: 10, padding: "3px 8px", 
                    background: "linear-gradient(135deg, #5a8e4a, #4a7e3a)", 
                    borderRadius: 6, fontFamily: "'Instrument Sans', sans-serif", 
                    color: "#fff", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 3,
                  }}>
                    ✓ Passed
                  </span>
                )}
                <span style={{ fontSize: 10, padding: "3px 8px", background: "#f0e8d8", borderRadius: 6, fontFamily: "'Instrument Sans', sans-serif", color: "#8a7a62", fontWeight: 600 }}>{item.weekKey}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 32px", color: "#a89878" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{showPassedOffOnly ? "✅" : "📖"}</div>
              <div style={{ fontSize: 16, fontFamily: "'Instrument Sans', sans-serif" }}>
                {showPassedOffOnly ? "No passed-off scriptures yet" : "No scriptures yet"}
              </div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                {showPassedOffOnly ? "Keep practicing to pass off scriptures!" : "Add some to get started!"}
              </div>
            </div>
          )}
        </>
      )}

      {/* WEEK VIEW */}
      {viewMode === "week" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ fontSize: 12, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 12 }}>
            Drag items between weeks · Tap empty weeks to add
          </div>
          {allWeeks.map(weekKey => {
            const weekItems = user.items.filter(i => i.weekKey === weekKey);
            const isCurrent = weekKey === currentWeek;
            const isPast = weekKey < currentWeek;
            const isEmpty = weekItems.length === 0;
            return (
              <div key={weekKey}
                onDragOver={e => { e.preventDefault(); setDragOverWeek(weekKey); }}
                onDrop={() => { if (dragItem) handleMoveItem(dragItem, weekKey); }}
                style={{
                  marginBottom: 12, borderRadius: 14,
                  border: dragOverWeek === weekKey ? "2px dashed #d4a854" : isCurrent ? `2px solid ${themeColor}` : "1px solid #e0d8cc",
                  background: isCurrent ? `${themeColor}10` : isPast ? "rgba(0,0,0,0.02)" : "#fff",
                  overflow: "hidden", transition: "border 0.15s",
                }}>
                <div
                  onClick={() => { if (isEmpty && !isPast) setAddToWeek(weekKey); }}
                  style={{
                    padding: "10px 14px", display: "flex", justifyContent: "space-between",
                    alignItems: "center", borderBottom: weekItems.length ? "1px solid #f0e8d8" : "none",
                    cursor: isEmpty && !isPast ? "pointer" : "default",
                  }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Instrument Sans', sans-serif", color: isCurrent ? themeColor : "#5a4e3a" }}>{weekKey}</span>
                    <span style={{ fontSize: 11, color: "#a89878", marginLeft: 8, fontFamily: "'Instrument Sans', sans-serif" }}>{formatWeekLabel(weekKey)}</span>
                  </div>
                  {weekItems.length > 0 ? (
                    <span style={{ fontSize: 11, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif" }}>{weekItems.length} item{weekItems.length !== 1 ? 's' : ''}</span>
                  ) : !isPast && (
                    <span style={{ fontSize: 11, color: "#c4b89a", fontFamily: "'Instrument Sans', sans-serif" }}>+ tap to add</span>
                  )}
                </div>
                {weekItems.map(item => (
                  <div key={item.id} draggable onDragStart={() => setDragItem(item.id)} onDragEnd={() => { setDragItem(null); setDragOverWeek(null); }}
                    style={{
                      padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
                      cursor: "grab", borderBottom: "1px solid #f5f0e8",
                      background: dragItem === item.id ? `${themeColor}15` : "transparent",
                    }}>
                    <span style={{ color: "#c4b89a", cursor: "grab" }}><IconGrip /></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif", color: "#2c2416" }}>{item.reference || item.title || item.author || "Untitled"}</div>
                      <div style={{ fontSize: 12, color: "#8a7a62", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60vw" }}>{item.text && item.text.substring(0, 60)}...</div>
                    </div>
                  </div>
                ))}
                {weekItems.length === 0 && isPast && (
                  <div style={{ padding: "8px 14px", fontSize: 12, color: "#c4b89a", fontStyle: "italic", fontFamily: "'Instrument Sans', sans-serif" }}>No items</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ARCHIVE VIEW */}
      {viewMode === "archive" && (
        <>
          {archive.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 32px", color: "#a89878" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗄️</div>
              <div style={{ fontSize: 16, fontFamily: "'Instrument Sans', sans-serif" }}>No archived items</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>Items you archive will appear here.</div>
            </div>
          ) : (
            archive.map(item => {
              const label = item.type === "scripture" ? item.reference
                : `${item.author || "Unknown"}${item.title ? ` — "${item.title}"` : ""}`;
              return (
                <div key={item.id} style={{
                  margin: "8px 16px", padding: "14px 16px", borderRadius: 14,
                  background: "#fff", border: "1px solid #e0d8cc",
                  boxShadow: "0 2px 8px rgba(44,36,22,0.04)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Instrument Sans', sans-serif", color: "#2c2416" }}>{label}</div>
                      {item.archivedAt && (
                        <div style={{ fontSize: 11, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginTop: 2 }}>
                          Archived {new Date(item.archivedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 8px", background: "#f0e8d8", borderRadius: 6, color: "#8a7a62", fontWeight: 600 }}>{item.weekKey}</span>
                  </div>
                  <div style={{ fontSize: 14, fontStyle: "italic", color: "#5a4e3a", lineHeight: 1.5, marginBottom: 12 }}>
                    {item.text.length > 120 ? item.text.substring(0, 120) + "..." : item.text}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleRestore(item.id)} style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "10px", borderRadius: 10, border: "1px solid #e0d8cc",
                      background: "#fff", color: "#5a8e4a", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
                    }}>
                      <IconRestore size={14} /> Restore
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "10px", borderRadius: 10, border: "1px solid #e0d8cc",
                      background: "#fff", color: "#d4726a", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
                    }}>
                      <IconTrash size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {/* Archive confirmation dialog */}
      <Modal open={!!archiveConfirm} onClose={() => setArchiveConfirm(null)} title="Archive this item?">
        <p style={{ fontSize: 14, color: "#5a4e3a", lineHeight: 1.6, margin: "0 0 16px", fontFamily: "'Instrument Sans', sans-serif" }}>
          This will move the item to your archive. You can restore it later from the Archive tab.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={confirmArchive} style={{
            flex: 1, padding: "12px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>Yes, archive it</button>
          <button onClick={() => setArchiveConfirm(null)} style={{
            flex: 1, padding: "12px", borderRadius: 12,
            border: "1px solid #d4cbb8", background: "#fff", color: "#8a7a62",
            fontSize: 14, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>Cancel</button>
        </div>
      </Modal>

      {/* Delete confirmation dialog */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Permanently delete?">
        <p style={{ fontSize: 14, color: "#5a4e3a", lineHeight: 1.6, margin: "0 0 16px", fontFamily: "'Instrument Sans', sans-serif" }}>
          This action cannot be undone. The item and all its practice history will be permanently removed.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={confirmDelete} style={{
            flex: 1, padding: "12px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #d4726a, #c45a52)", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>Yes, delete permanently</button>
          <button onClick={() => setDeleteConfirm(null)} style={{
            flex: 1, padding: "12px", borderRadius: 12,
            border: "1px solid #d4cbb8", background: "#fff", color: "#8a7a62",
            fontSize: 14, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>Cancel</button>
        </div>
      </Modal>

      {/* Add to week dialog */}
      <Modal open={!!addToWeek} onClose={() => { setAddToWeek(null); setSelectedQueueItem(""); }} title={`Add to ${addToWeek}`}>
        <div style={{ fontSize: 13, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 8 }}>
          {formatWeekLabel(addToWeek || "")}
        </div>
        {(() => {
          // Filter out suggestions that are already in user's items
          const availableSuggestions = user.suggestedQueue.filter(s => {
            return !user.items.some(i => 
              (s.reference && i.reference === s.reference && i.language === s.language) ||
              (s.title && i.title === s.title && i.author === s.author)
            );
          });
          return availableSuggestions.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif", color: "#5a4e3a", marginBottom: 8 }}>
                Pick from your queue:
              </div>
              <select value={selectedQueueItem} onChange={e => setSelectedQueueItem(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "1px solid #d4cbb8", borderRadius: 10, fontSize: 14, marginBottom: 12, background: "#fff" }}>
                <option value="">Select a scripture...</option>
                {availableSuggestions.map(s => (
                  <option key={s.id} value={s.id}>{s.reference || s.title || s.author || "Untitled"}</option>
                ))}
              </select>
              <button onClick={handleAddFromQueue} disabled={!selectedQueueItem} style={{
                width: "100%", padding: "12px", borderRadius: 12, border: "none",
                background: selectedQueueItem ? `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})` : "#e0d8cc",
                color: selectedQueueItem ? "#fff" : "#a89878", fontSize: 14, fontWeight: 600,
                cursor: selectedQueueItem ? "pointer" : "not-allowed", fontFamily: "'Instrument Sans', sans-serif",
              }}>Add to {addToWeek}</button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#a89878", fontStyle: "italic", fontFamily: "'Instrument Sans', sans-serif" }}>
              No new items in your suggested queue. Add some from Suggested Scriptures!
            </div>
          );
        })()}
      </Modal>

      {/* Suggest dialog */}
      <Modal open={!!shareItem} onClose={() => setShareItem(null)} title="Suggest to users">
        <div style={{ fontSize: 13, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 12 }}>
          Add this scripture to suggested scriptures:
        </div>
        
        {/* Suggest to all users */}
        {allUsers.filter(u => u.id !== user.id).length > 0 && (
          <button onClick={() => {
            if (!shareItem) return;
            const suggestion = {
              id: generateId(),
              type: shareItem.type || "scripture",
              reference: shareItem.reference || "",
              author: shareItem.author || "",
              title: shareItem.title || "",
              year: shareItem.year || "",
              source: shareItem.source || "",
              context: shareItem.context || "",
              url: shareItem.url || "",
              text: shareItem.text,
              language: shareItem.language || "English",
              sharedBy: user.name,
              sharedAt: new Date().toISOString(),
            };
            allUsers.filter(u => u.id !== user.id).forEach(u => {
              updateUserById(u.id, (targetUser) => ({
                ...targetUser,
                suggestedQueue: [...(targetUser.suggestedQueue || []), { ...suggestion, id: generateId() }],
              }));
            });
            setShareToast(`Suggested to all ${allUsers.length - 1} users!`);
            setTimeout(() => setShareToast(null), 2500);
            setShareItem(null);
          }} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "14px 16px", borderRadius: 12, border: `2px solid ${themeColor}`,
            background: `${themeColor}10`, color: "#2c2416", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
            marginBottom: 16, textAlign: "left",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff",
            }}>✨</div>
            Suggest to all users ({allUsers.length - 1})
          </button>
        )}
        
        {allUsers.filter(u => u.id !== user.id).map(u => (
          <button key={u.id} onClick={() => shareToUser(u.id)} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "12px 14px", borderRadius: 12, border: "1px solid #e0d8cc",
            background: "#faf8f4", color: "#2c2416", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
            marginBottom: 8, textAlign: "left",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: u.avatarColor || "#e0d8cc",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>{u.avatarEmoji || "📖"}</div>
            {u.name}
          </button>
        ))}
        {allUsers.filter(u => u.id !== user.id).length === 0 && !showNewUser && (
          <div style={{ fontSize: 13, color: "#a89878", fontStyle: "italic", marginBottom: 12, fontFamily: "'Instrument Sans', sans-serif" }}>No other users yet — create one below!</div>
        )}
        {!showNewUser ? (
          <button onClick={() => setShowNewUser(true)} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "12px", borderRadius: 12,
            border: "2px dashed #d4cbb8", background: "transparent",
            color: "#8a7a62", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Instrument Sans', sans-serif",
          }}>
            <IconPlus size={16} /> Add new user & suggest
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input value={shareNewName} onChange={e => setShareNewName(e.target.value)}
              placeholder="New user's name"
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #d4cbb8", borderRadius: 10, fontSize: 14, background: "#faf8f4", outline: "none" }}
              onKeyDown={e => e.key === "Enter" && createAndShare()}
            />
            <button onClick={createAndShare} style={{
              padding: "10px 16px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`,
              color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
            }}>Create & Suggest</button>
          </div>
        )}
      </Modal>

      {/* Share toast */}
      {shareToast && (
        <div style={{
          position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "#2c2416", color: themeColor,
          padding: "12px 24px", borderRadius: 14, fontSize: 14, fontWeight: 600,
          fontFamily: "'Instrument Sans', sans-serif",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", animation: "toastIn 0.3s ease",
        }}>
          {shareToast}
        </div>
      )}
      <PageFooter />
    </div>
  );
}

// --- Suggested Scriptures Page ---
function SuggestedPage({ user, updateUser, languages, allUsers, persist, data, themeColor = "#d4a854" }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ type: "scripture", reference: "", text: "", language: "English", author: "", title: "", source: "", year: "", url: "", context: "" });
  const [removeConfirm, setRemoveConfirm] = useState(null); // suggestion to remove
  const [confirmAllRemove, setConfirmAllRemove] = useState(false); // extra confirmation for all users

  const addToThisWeek = (s) => {
    const newItem = {
      id: generateId(), type: s.type || "scripture", reference: s.reference || "",
      author: s.author || "", title: s.title || "", year: s.year || "",
      source: s.source || "", context: s.context || "", url: s.url || "",
      text: s.text, language: s.language || "English",
      weekKey: getWeekKey(new Date()), createdAt: new Date().toISOString(),
      practices: {}, gotIts: {}, ponders: {}, lifetimePractices: 0, lifetimeGotIts: 0, lifetimePonders: 0, comments: [],
    };
    updateUser({ ...user, items: [...user.items, newItem], suggestedQueue: user.suggestedQueue.filter(x => x.id !== s.id) });
  };

  const addToQueue = (s) => {
    const wk = findNextEmptyWeek(user);
    const newItem = {
      id: generateId(), type: s.type || "scripture", reference: s.reference || "",
      author: s.author || "", title: s.title || "", year: s.year || "",
      source: s.source || "", context: s.context || "", url: s.url || "",
      text: s.text, language: s.language || "English",
      weekKey: wk, createdAt: new Date().toISOString(),
      practices: {}, gotIts: {}, ponders: {}, lifetimePractices: 0, lifetimeGotIts: 0, lifetimePonders: 0, comments: [],
    };
    updateUser({ ...user, items: [...user.items, newItem], suggestedQueue: user.suggestedQueue.filter(x => x.id !== s.id) });
  };

  const removeForMe = () => {
    if (!removeConfirm) return;
    updateUser({ ...user, suggestedQueue: user.suggestedQueue.filter(x => x.id !== removeConfirm.id) });
    setRemoveConfirm(null);
  };

  const removeForAll = () => {
    if (!removeConfirm || !persist || !data) return;
    // Remove this suggestion from all users' queues
    const updatedUsers = data.users.map(u => ({
      ...u,
      suggestedQueue: (u.suggestedQueue || []).filter(s => {
        // Match by reference+language or title+author
        const matchesRef = removeConfirm.reference && s.reference === removeConfirm.reference && s.language === removeConfirm.language;
        const matchesTitle = removeConfirm.title && s.title === removeConfirm.title && s.author === removeConfirm.author;
        return !(matchesRef || matchesTitle || s.id === removeConfirm.id);
      }),
    }));
    persistData({ ...data, users: updatedUsers });
    setRemoveConfirm(null);
  };

  const addNewSuggestion = () => {
    if (!form.text.trim()) return;
    updateUser({ ...user, suggestedQueue: [...user.suggestedQueue, { ...form, id: generateId() }] });
    setForm({ type: "scripture", reference: "", text: "", language: "English", author: "", title: "", source: "", year: "", url: "", context: "" });
    setEditing(false);
  };

  return (
    <div>
      <SectionHeader sub={`${user.suggestedQueue.length} in queue`}>Suggested Scriptures</SectionHeader>
      
      <GuidanceTip tipKey="suggested_intro" user={user} updateUser={updateUser}>
        This is your suggestion queue. Add scriptures here to try later, or accept shared scriptures from family members!
      </GuidanceTip>

      {user.suggestedQueue.map(s => (
        <div key={s.id} style={{ margin: "8px 16px", padding: "14px 16px", borderRadius: 14, background: "#fff", boxShadow: "0 2px 8px rgba(44,36,22,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif", color: "#2c2416" }}>{s.reference || (s.title ? `"${s.title}"` : s.author) || "Untitled"}</div>
          <div style={{ fontSize: 14, color: "#5a4e3a", marginTop: 4, lineHeight: 1.5, fontStyle: "italic", fontWeight: 300 }}>{s.text}</div>
          {(s.context || "").trim() && (
            <div style={{ margin: "6px 0 0", padding: "6px 10px", background: "#faf5ec", borderRadius: 8, borderLeft: "3px solid #d4a854", fontSize: 12, color: "#8a7a62" }}>{s.context}</div>
          )}
          {s.sharedBy && (
            <div style={{ fontSize: 11, color: "#a89878", marginTop: 4, fontFamily: "'Instrument Sans', sans-serif" }}>
              Shared by {s.sharedBy}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => addToThisWeek(s)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>Add to This Week</button>
            <button onClick={() => addToQueue(s)} style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid #d4cbb8", background: "#fff", color: "#5a4e3a", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>Queue Up Next</button>
            <button onClick={() => setRemoveConfirm(s)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: "#f5f0e8", color: "#a89878", fontSize: 12, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>Remove</button>
          </div>
        </div>
      ))}

      {/* Remove confirmation modal */}
      <Modal open={!!removeConfirm && !confirmAllRemove} onClose={() => setRemoveConfirm(null)} title="Remove Suggestion?">
        <p style={{ fontSize: 14, color: "#5a4e3a", lineHeight: 1.6, margin: "0 0 16px", fontFamily: "'Instrument Sans', sans-serif" }}>
          Are you sure you want to remove "{removeConfirm?.reference || removeConfirm?.title || "this item"}" from your suggestions?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={removeForMe} style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>Yes, remove for me</button>
          {allUsers && allUsers.length > 1 && (
            <button onClick={() => setConfirmAllRemove(true)} style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #d4cbb8",
              background: "#fff", color: "#8a7a62",
              fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
            }}>Remove for all users...</button>
          )}
          <button onClick={() => setRemoveConfirm(null)} style={{
            width: "100%", padding: "12px", borderRadius: 12,
            border: "1px solid #e0d8cc", background: "#faf8f4", color: "#8a7a62",
            fontSize: 14, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>Cancel</button>
        </div>
      </Modal>

      {/* Extra confirmation for removing for all users */}
      <Modal open={!!confirmAllRemove} onClose={() => setConfirmAllRemove(false)} title="⚠️ Remove for ALL Users?">
        <p style={{ fontSize: 14, color: "#5a4e3a", lineHeight: 1.6, margin: "0 0 8px", fontFamily: "'Instrument Sans', sans-serif" }}>
          This will permanently remove "{removeConfirm?.reference || removeConfirm?.title || "this item"}" from <strong>everyone's</strong> suggested scriptures.
        </p>
        <p style={{ fontSize: 13, color: "#a89878", lineHeight: 1.5, margin: "0 0 16px", fontFamily: "'Instrument Sans', sans-serif" }}>
          This affects all {allUsers?.length || 0} users and cannot be undone.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => { removeForAll(); setConfirmAllRemove(false); }} style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #c45a52, #a84a42)", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>Yes, remove for all {allUsers?.length || 0} users</button>
          <button onClick={() => setConfirmAllRemove(false)} style={{
            width: "100%", padding: "12px", borderRadius: 12,
            border: "1px solid #e0d8cc", background: "#faf8f4", color: "#8a7a62",
            fontSize: 14, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
          }}>Cancel</button>
        </div>
      </Modal>

      {!editing ? (
        <button onClick={() => setEditing(true)} style={{
          display: "flex", alignItems: "center", gap: 8, margin: "16px 16px", padding: "14px 20px",
          borderRadius: 14, border: "2px dashed #d4cbb8", background: "transparent", color: "#8a7a62",
          fontSize: 14, fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, cursor: "pointer",
          width: "calc(100% - 32px)", justifyContent: "center",
        }}><IconPlus /> Add Suggestion</button>
      ) : (
        <div style={{ margin: "16px", padding: "16px", borderRadius: 14, background: "#fff", border: "1px solid #d4cbb8" }}>
          <FormFields form={form} setForm={setForm} languages={languages} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={addNewSuggestion} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>Add to Suggestions</button>
            <button onClick={() => setEditing(false)} style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #d4cbb8", background: "#fff", color: "#8a7a62", cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}
      <PageFooter />
    </div>
  );
}

function findNextEmptyWeek(user) {
  for (let i = 1; i <= 52; i++) {
    const wk = weeksAgo(-i);
    if (user.items.filter(it => it.weekKey === wk).length === 0) return wk;
  }
  return weeksAgo(-1);
}

// --- Form Fields (shared) — URL first, with auto-populate attempt ---
function FormFields({ form, setForm, languages, showWeek, user }) {
  const [addingLang, setAddingLang] = useState(false);
  const [newLang, setNewLang] = useState("");
  const [fetching, setFetching] = useState(false);

  // Try to auto-detect type and pre-populate from URL
  const handleUrlBlur = () => {
    const url = (form.url || "").trim();
    if (!url) return;

    // Auto-detect type from URL patterns
    let detectedType = form.type;
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("churchofjesuschrist.org") || lowerUrl.includes("scriptures") || lowerUrl.includes("biblegateway") || lowerUrl.includes("lds.org")) {
      detectedType = "scripture";
    } else if (lowerUrl.includes("poetryfoundation") || lowerUrl.includes("poem") || lowerUrl.includes("lyrics") || lowerUrl.includes("allpoetry")) {
      detectedType = "poem/lyrics";
    } else if (lowerUrl.includes("quote") || lowerUrl.includes("brainyquote") || lowerUrl.includes("goodreads.com/quotes")) {
      detectedType = "quote";
    }

    // Try to extract info from URL path
    const updates = { type: detectedType };

    // Church of Jesus Christ scripture URLs
    const churchMatch = url.match(/\/scriptures\/(bofm|dc-testament|ot|nt|pgp)\/([^/?]+)\/(\d+)(?:\.(\d+(?:-\d+)?))?/);
    if (churchMatch) {
      const bookMap = {
        "bofm": { "1-ne": "1 Nephi", "2-ne": "2 Nephi", "jacob": "Jacob", "enos": "Enos", "jarom": "Jarom", "omni": "Omni", "w-of-m": "Words of Mormon", "mosiah": "Mosiah", "alma": "Alma", "hel": "Helaman", "3-ne": "3 Nephi", "4-ne": "4 Nephi", "morm": "Mormon", "ether": "Ether", "moro": "Moroni" },
        "dc-testament": { "dc": "D&C" },
        "pgp": { "moses": "Moses", "abr": "Abraham", "js-m": "JS—Matthew", "js-h": "JS—History", "a-of-f": "Articles of Faith" },
        "ot": { "gen": "Genesis", "ex": "Exodus", "lev": "Leviticus", "num": "Numbers", "deut": "Deuteronomy", "josh": "Joshua", "judg": "Judges", "ruth": "Ruth", "1-sam": "1 Samuel", "2-sam": "2 Samuel", "1-kgs": "1 Kings", "2-kgs": "2 Kings", "1-chr": "1 Chronicles", "2-chr": "2 Chronicles", "ezra": "Ezra", "neh": "Nehemiah", "esth": "Esther", "job": "Job", "ps": "Psalms", "prov": "Proverbs", "eccl": "Ecclesiastes", "song": "Song of Solomon", "isa": "Isaiah", "jer": "Jeremiah", "lam": "Lamentations", "ezek": "Ezekiel", "dan": "Daniel", "hosea": "Hosea", "joel": "Joel", "amos": "Amos", "obad": "Obadiah", "jonah": "Jonah", "micah": "Micah", "nahum": "Nahum", "hab": "Habakkuk", "zeph": "Zephaniah", "hag": "Haggai", "zech": "Zechariah", "mal": "Malachi" },
        "nt": { "matt": "Matthew", "mark": "Mark", "luke": "Luke", "john": "John", "acts": "Acts", "rom": "Romans", "1-cor": "1 Corinthians", "2-cor": "2 Corinthians", "gal": "Galatians", "eph": "Ephesians", "philip": "Philippians", "col": "Colossians", "1-thes": "1 Thessalonians", "2-thes": "2 Thessalonians", "1-tim": "1 Timothy", "2-tim": "2 Timothy", "titus": "Titus", "philem": "Philemon", "heb": "Hebrews", "james": "James", "1-pet": "1 Peter", "2-pet": "2 Peter", "1-jn": "1 John", "2-jn": "2 John", "3-jn": "3 John", "jude": "Jude", "rev": "Revelation" },
      };
      const vol = churchMatch[1];
      const book = churchMatch[2];
      const chapter = churchMatch[3];
      const verse = churchMatch[4];
      const bookName = bookMap[vol]?.[book] || book;
      updates.reference = verse ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`;
      updates.type = "scripture";
    }

    // General Conference talk URLs
    if (lowerUrl.includes("churchofjesuschrist.org/study/general-conference")) {
      updates.type = "quote";
      const confMatch = url.match(/general-conference\/(\d{4})\/(\d{2})/);
      if (confMatch) {
        const months = { "04": "April", "10": "October" };
        updates.source = `${months[confMatch[2]] || confMatch[2]} ${confMatch[1]} General Conference`;
      }
    }

    setForm(f => ({ ...f, ...updates }));
  };

  // Generate week dropdown options
  const weekOptions = [];
  for (let i = 0; i <= 52; i++) {
    const wk = weeksAgo(-i);
    const label = formatWeekLabel(wk);
    const itemCount = user ? (user.items || []).filter(it => it.weekKey === wk).length : 0;
    weekOptions.push({ key: wk, label: `${wk} — ${label}${itemCount > 0 ? ` (${itemCount} items)` : ""}` });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* URL first */}
      <input value={form.url || ""} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
        onBlur={handleUrlBlur}
        placeholder="URL (optional — paste to auto-fill details)"
        style={{ ...inputStyle, borderColor: "#c4943e", background: "#fffcf5" }} />
      {form.url && (
        <div style={{ fontSize: 11, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginTop: -6, paddingLeft: 2 }}>
          Tip: Paste a churchofjesuschrist.org scripture URL to auto-detect reference
        </div>
      )}

      {/* Type selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["scripture", "quote", "poem/lyrics", "saying"].map(t => (
          <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
            style={{
              flex: 1, minWidth: 60, padding: "8px 4px", borderRadius: 10,
              border: form.type === t ? "2px solid #d4a854" : "1px solid #d4cbb8",
              background: form.type === t ? "rgba(212,168,84,0.1)" : "#fff",
              color: form.type === t ? "#d4a854" : "#8a7a62",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif", textTransform: "capitalize",
            }}>{t}</button>
        ))}
      </div>

      {form.type === "scripture" && (
        <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
          placeholder="Reference (e.g. D&C 25:12)" style={inputStyle} />
      )}
      {(form.type === "quote" || form.type === "poem/lyrics" || form.type === "saying") && (
        <>
          <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            placeholder="Author" style={inputStyle} />
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (optional)" style={inputStyle} />
        </>
      )}
      {form.type === "quote" && (
        <>
          <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
            placeholder="Year (optional)" style={inputStyle} />
          <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            placeholder="Source (e.g. April 2023 General Conference)" style={inputStyle} />
        </>
      )}

      {/* Context field */}
      <textarea value={form.context || ""} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
        placeholder="Context / background (e.g. 'One of Lincoln's favorite poems')" rows={2}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />

      <div style={{ display: "flex", gap: 8 }}>
        <select value={form.language} onChange={e => {
          if (e.target.value === "__add__") { setAddingLang(true); return; }
          setForm(f => ({ ...f, language: e.target.value }));
        }} style={{ ...inputStyle, flex: 1 }}>
          {languages.map(l => <option key={l} value={l}>{l}</option>)}
          <option value="__add__">+ Add language...</option>
        </select>
      </div>
      {addingLang && (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newLang} onChange={e => setNewLang(e.target.value)}
            placeholder="New language name" style={{ ...inputStyle, flex: 1 }} />
          <button onClick={() => {
            if (newLang.trim() && !languages.includes(newLang.trim())) {
              setForm(f => ({ ...f, language: newLang.trim(), _newLanguage: newLang.trim() }));
            }
            setNewLang(""); setAddingLang(false);
          }} style={{
            padding: "8px 14px", borderRadius: 10, border: "none",
            background: "#2c2416", color: "#d4a854", fontWeight: 600,
            cursor: "pointer", fontSize: 13, fontFamily: "'Instrument Sans', sans-serif",
          }}>Add</button>
        </div>
      )}

      {/* Week assignment: dropdown or queue */}
      {showWeek && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 4 }}>
            Assign to:
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button onClick={() => setForm(f => ({ ...f, weekKey: "__queue__" }))}
              style={{
                padding: "8px 14px", borderRadius: 10,
                border: form.weekKey === "__queue__" ? "2px solid #d4a854" : "1px solid #d4cbb8",
                background: form.weekKey === "__queue__" ? "rgba(212,168,84,0.1)" : "#fff",
                color: form.weekKey === "__queue__" ? "#d4a854" : "#8a7a62",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
              }}>Add to Queue</button>
            <button onClick={() => setForm(f => ({ ...f, weekKey: getWeekKey(new Date()) }))}
              style={{
                padding: "8px 14px", borderRadius: 10,
                border: form.weekKey !== "__queue__" ? "2px solid #d4a854" : "1px solid #d4cbb8",
                background: form.weekKey !== "__queue__" ? "rgba(212,168,84,0.1)" : "#fff",
                color: form.weekKey !== "__queue__" ? "#d4a854" : "#8a7a62",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
              }}>Assign to Week</button>
          </div>
          {form.weekKey !== "__queue__" && (
            <select value={form.weekKey || getWeekKey(new Date())} onChange={e => setForm(f => ({ ...f, weekKey: e.target.value }))}
              style={inputStyle}>
              {weekOptions.map(w => (
                <option key={w.key} value={w.key}>{w.label}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
        placeholder="Full text of scripture, quote, or poem..." rows={5}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
    </div>
  );
}

const inputStyle = {
  padding: "12px 14px", border: "1px solid #d4cbb8", borderRadius: 10,
  fontSize: 15, background: "#faf8f4", outline: "none", width: "100%",
  fontFamily: "'Crimson Pro', Georgia, serif",
};

// --- Add Page (URL-first, queue or week assignment) ---
function AddPage({ user, updateUser, languages, setPage, themeColor = "#d4a854", defaultType }) {
  const [form, setForm] = useState({
    type: defaultType || "scripture", reference: "", text: "", language: "English",
    author: "", title: "", year: "", source: "", url: "", context: "",
    weekKey: getWeekKey(new Date()),
  });
  const [saved, setSaved] = useState(false);

  // Update form type if defaultType changes
  useEffect(() => {
    if (defaultType && defaultType !== form.type) {
      setForm(f => ({ ...f, type: defaultType }));
    }
  }, [defaultType]);

  const handleSave = () => {
    if (!form.text.trim()) return;
    let updatedUser = { ...user };
    if (form._newLanguage && !(user.customLanguages || []).includes(form._newLanguage)) {
      updatedUser.customLanguages = [...(user.customLanguages || []), form._newLanguage];
    }

    // If "queue" selected, add to suggestedQueue instead
    if (form.weekKey === "__queue__") {
      const suggestion = {
        id: generateId(), type: form.type, reference: form.reference,
        author: form.author, title: form.title, year: form.year,
        source: form.source, context: form.context || "", url: form.url,
        text: form.text, language: form.language,
      };
      updatedUser.suggestedQueue = [...(updatedUser.suggestedQueue || []), suggestion];
      updateUser(updatedUser);
      setSaved(true);
      setTimeout(() => { setSaved(false); setPage("suggested"); }, 1200);
      return;
    }

    const newItem = {
      id: generateId(), type: form.type, reference: form.reference,
      author: form.author, title: form.title, year: form.year,
      source: form.source, context: form.context || "", url: form.url,
      text: form.text, language: form.language,
      weekKey: form.weekKey || getWeekKey(new Date()),
      createdAt: new Date().toISOString(),
      practices: {}, gotIts: {}, lifetimePractices: 0, lifetimeGotIts: 0, comments: [],
    };
    updatedUser.items = [...updatedUser.items, newItem];
    updateUser(updatedUser);
    setSaved(true);
    setTimeout(() => { setSaved(false); setPage("practice"); }, 1200);
  };

  return (
    <div>
      <SectionHeader sub="Paste a URL or enter details manually">Add New</SectionHeader>
      
      <GuidanceTip tipKey="add_intro" user={user} updateUser={updateUser}>
        Paste a Gospel Library URL to auto-fill scripture details, or enter text manually. Choose to add to this week or queue it for later!
      </GuidanceTip>

      <div style={{ padding: "0 16px" }}>
        <FormFields form={form} setForm={setForm} languages={languages} showWeek user={user} />
        <button onClick={handleSave} disabled={saved} style={{
          width: "100%", marginTop: 16, padding: "14px",
          borderRadius: 14, border: "none",
          background: saved ? "linear-gradient(135deg, #6a9e5a, #5a8e4a)" : `linear-gradient(135deg, ${themeColor}, ${darkenColor(themeColor, 0.7)})`,
          color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Instrument Sans', sans-serif",
          boxShadow: "0 4px 16px rgba(212,168,84,0.3)", transition: "all 0.3s",
        }}>{saved ? "✓ Saved!" : (form.weekKey === "__queue__" ? "Add to Queue" : "Save Scripture")}</button>
      </div>
      <PageFooter />
    </div>
  );
}

// --- Users Page ---
function UsersPage({ data, persist, setPage, onClose, themeColor = "#d4a854", session }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [manageMode, setManageMode] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // userId for avatar modal
  const [importResult, setImportResult] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [approvedList, setApprovedList] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteToast, setInviteToast] = useState(null);
  const isAdmin = session?.user?.email === ADMIN_EMAIL || session?.user?.email === data.adminEmail;

  const loadApprovedList = async () => {
    const list = await listApprovedUsers();
    setApprovedList(list);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    const ok = await approveUser(inviteEmail.trim(), session.user.id);
    setInviteLoading(false);
    if (ok) {
      setInviteToast(`✓ ${inviteEmail.trim()} can now sign in`);
      setInviteEmail("");
      loadApprovedList();
    } else {
      setInviteToast("Failed to invite — already invited?");
    }
    setTimeout(() => setInviteToast(null), 3000);
  };

  const handleRevoke = async (email) => {
    await revokeUser(email);
    loadApprovedList();
  };

  const MANAGE_PASSCODE = "1234";

  const createUser = () => {
    if (!name.trim()) return;
    const newUser = createDefaultUser(name.trim(), birthdate);
    persistData({ ...data, users: [...data.users, newUser], activeUserId: newUser.id });
    setCreating(false); setName(""); setBirthdate("");
  };

  const switchUserAndGo = (userId) => {
    persistData({ ...data, activeUserId: userId });
    setPage("practice");
  };

  const setDefaultUser = (userId) => {
    const newDefault = data.defaultUserId === userId ? null : userId;
    persistData({ ...data, defaultUserId: newDefault });
  };

  const updateUserAvatar = (userId, field, value) => {
    persistData({
      ...data,
      users: data.users.map(u => u.id === userId ? { ...u, [field]: value } : u),
    });
  };

  const deleteUser = (userId) => {
    if (data.users.length <= 1) return alert("Cannot delete the only user");
    const remaining = data.users.filter(u => u.id !== userId);
    const newDefault = data.defaultUserId === userId ? null : data.defaultUserId;
    persistData({ ...data, users: remaining, activeUserId: remaining[0].id, defaultUserId: newDefault });
  };

  const tryEnterManageMode = () => {
    if (passcodeInput === MANAGE_PASSCODE) {
      setManageMode(true);
      setPasscodeInput("");
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 1500);
    }
  };

  // Export all data
  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      ...data,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scripture-memorizer-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data additively
  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.users || !Array.isArray(imported.users)) {
          setImportResult({ success: false, message: "Invalid file format" });
          setTimeout(() => setImportResult(null), 3000);
          return;
        }

        let newUsersCount = 0;
        let updatedUsersCount = 0;
        let newItemsCount = 0;

        const mergedUsers = [...data.users];

        imported.users.forEach(importedUser => {
          const existingUserIdx = mergedUsers.findIndex(u => u.name === importedUser.name);
          
          if (existingUserIdx === -1) {
            // New user - add them
            mergedUsers.push(importedUser);
            newUsersCount++;
            newItemsCount += (importedUser.items || []).length;
          } else {
            // Existing user - merge items
            const existingUser = mergedUsers[existingUserIdx];
            const mergedItems = [...existingUser.items];
            const mergedArchive = [...(existingUser.archive || [])];

            (importedUser.items || []).forEach(importedItem => {
              const existingItemIdx = mergedItems.findIndex(i => 
                (i.reference && i.reference === importedItem.reference && i.language === importedItem.language) ||
                (i.title && i.title === importedItem.title && i.author === importedItem.author)
              );

              if (existingItemIdx === -1) {
                // New scripture - add it
                mergedItems.push(importedItem);
                newItemsCount++;
              } else {
                // Existing scripture - use highest counts
                const existing = mergedItems[existingItemIdx];
                mergedItems[existingItemIdx] = {
                  ...existing,
                  ...importedItem,
                  lifetimePractices: Math.max(existing.lifetimePractices || 0, importedItem.lifetimePractices || 0),
                  lifetimeGotIts: Math.max(existing.lifetimeGotIts || 0, importedItem.lifetimeGotIts || 0),
                  lifetimePonders: Math.max(existing.lifetimePonders || 0, importedItem.lifetimePonders || 0),
                  practices: { ...(existing.practices || {}), ...(importedItem.practices || {}) },
                  gotIts: { ...(existing.gotIts || {}), ...(importedItem.gotIts || {}) },
                  ponders: { ...(existing.ponders || {}), ...(importedItem.ponders || {}) },
                  comments: [...(existing.comments || []), ...(importedItem.comments || []).filter(c => 
                    !(existing.comments || []).some(ec => ec.date === c.date && ec.text === c.text)
                  )],
                };
              }
            });

            // Merge archive
            (importedUser.archive || []).forEach(importedArchiveItem => {
              if (!mergedArchive.some(a => a.id === importedArchiveItem.id)) {
                mergedArchive.push(importedArchiveItem);
              }
            });

            // Merge suggested queue
            const mergedQueue = [...(existingUser.suggestedQueue || [])];
            (importedUser.suggestedQueue || []).forEach(importedSuggestion => {
              if (!mergedQueue.some(s => 
                (s.reference && s.reference === importedSuggestion.reference) ||
                (s.title && s.title === importedSuggestion.title)
              )) {
                mergedQueue.push(importedSuggestion);
              }
            });

            // Use highest game completions
            mergedUsers[existingUserIdx] = {
              ...existingUser,
              items: mergedItems,
              archive: mergedArchive,
              suggestedQueue: mergedQueue,
              flashAttackCompletions: Math.max(existingUser.flashAttackCompletions || 0, importedUser.flashAttackCompletions || 0),
              matchingGameCompletions: Math.max(existingUser.matchingGameCompletions || 0, importedUser.matchingGameCompletions || 0),
              dragDropCompletions: Math.max(existingUser.dragDropCompletions || 0, importedUser.dragDropCompletions || 0),
              holdToRodCompletions: Math.max(existingUser.holdToRodCompletions || 0, importedUser.holdToRodCompletions || 0),
            };
            updatedUsersCount++;
          }
        });

        persistData({ ...data, users: mergedUsers });
        
        const messages = [];
        if (newUsersCount > 0) messages.push(`${newUsersCount} new user${newUsersCount > 1 ? 's' : ''}`);
        if (updatedUsersCount > 0) messages.push(`${updatedUsersCount} user${updatedUsersCount > 1 ? 's' : ''} updated`);
        if (newItemsCount > 0) messages.push(`${newItemsCount} new scripture${newItemsCount > 1 ? 's' : ''}`);
        
        setImportResult({ 
          success: true, 
          message: messages.length > 0 ? `Imported: ${messages.join(", ")}` : "No new data to import"
        });
        setTimeout(() => setImportResult(null), 4000);
      } catch (err) {
        setImportResult({ success: false, message: "Failed to parse file" });
        setTimeout(() => setImportResult(null), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const editingUserData = editingUser ? data.users.find(u => u.id === editingUser) : null;

  return (
    <div>
      <SectionHeader 
        sub={`${data.users.length} user${data.users.length > 1 ? 's' : ''}`}
        right={
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#a89878", cursor: "pointer",
            padding: 4, display: "flex", alignItems: "center",
          }}>
            <IconX size={20} />
          </button>
        }
      >
        Choose User
      </SectionHeader>

      {/* Get the active user for guidance tips */}
      {(() => {
        const activeUser = data.users.find(u => u.id === data.activeUserId) || data.users[0];
        const updateActiveUser = (updated) => persistData({ ...data, users: data.users.map(u => u.id === updated.id ? updated : u) });
        return (
          <GuidanceTip tipKey="users_intro" user={activeUser} updateUser={updateActiveUser}>
            Tap anywhere on a user card to switch to them. Tap the profile picture or "Customize" to change their avatar and color!
          </GuidanceTip>
        );
      })()}
      
      {data.users.map(u => {
        const isActive = u.id === data.activeUserId;
        const isDefault = u.id === data.defaultUserId;
        const userColor = u.avatarColor || "#d4a854";
        return (
          <div 
            key={u.id} 
            onClick={(e) => {
              // Only switch if not clicking a button or interactive element
              if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                switchUserAndGo(u.id);
              }
            }}
            style={{
              margin: "8px 16px", padding: "16px", borderRadius: 14,
              background: isActive ? `${userColor}15` : "#fff",
              border: isActive ? `2px solid ${userColor}` : "1px solid #e0d8cc",
              transition: "all 0.15s", cursor: "pointer",
            }}
          >
            {/* User row with avatar, name, and GO button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Clickable avatar to edit */}
              <button
                onClick={(e) => { e.stopPropagation(); setEditingUser(u.id); }}
                style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: userColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, flexShrink: 0, border: "none", cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                {u.avatarEmoji || "📖"}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif", color: "#2c2416" }}>{u.name}</span>
                  {isDefault && (
                    <span style={{ fontSize: 8, padding: "2px 5px", background: "#6a9e5a", color: "#fff", borderRadius: 4, fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Default</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginTop: 2 }}>
                  {u.items.length} scriptures{u.birthdate && ` · ${u.birthdate}`}
                </div>
                {/* Customize button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingUser(u.id); }}
                  style={{
                    marginTop: 6, padding: "4px 10px", borderRadius: 6,
                    border: "1px solid #d4cbb8", background: "#faf8f4",
                    color: "#8a7a62", fontSize: 11, cursor: "pointer",
                    fontFamily: "'Instrument Sans', sans-serif", fontWeight: 500,
                  }}
                >
                  Customize Profile
                </button>
              </div>
              {/* GO button - switches user and closes */}
              <button
                onClick={(e) => { e.stopPropagation(); switchUserAndGo(u.id); }}
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${userColor}, ${darkenColor(userColor, 0.7)})`,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <IconChevron size={22} direction="right" />
              </button>
            </div>

            {/* Default toggle & manage delete */}
            <div style={{
              marginTop: 12, paddingTop: 10, borderTop: "1px solid #f0e8d8",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif" }}>
                Default user
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setDefaultUser(u.id); }}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: "none",
                  background: isDefault ? "linear-gradient(135deg, #6a9e5a, #5a8e4a)" : "#e0d8cc",
                  cursor: "pointer", position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 2, left: isDefault ? 22 : 2,
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>

            {/* Remove button in manage mode */}
            {manageMode && (
              <button
                onClick={() => deleteUser(u.id)}
                style={{
                  marginTop: 10, width: "100%", padding: "10px",
                  borderRadius: 8, border: "1px solid #e8a4a4",
                  background: "#fff5f5", color: "#d4726a",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif",
                }}
              >
                Remove {u.name}
              </button>
            )}
          </div>
        );
      })}

      {/* Create new user */}
      {!creating ? (
        <button onClick={() => setCreating(true)} style={{
          display: "flex", alignItems: "center", gap: 8, margin: "16px 16px", padding: "14px 20px",
          borderRadius: 14, border: "2px dashed #d4cbb8", background: "transparent", color: "#8a7a62",
          fontSize: 14, fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, cursor: "pointer",
          width: "calc(100% - 32px)", justifyContent: "center",
        }}><IconPlus /> Create New User</button>
      ) : (
        <div style={{ margin: "16px", padding: "16px", borderRadius: 14, background: "#fff", border: "1px solid #d4cbb8" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", display: "block", marginBottom: 4 }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", display: "block", marginBottom: 4 }}>Birthday (optional)</label>
              <input value={birthdate} onChange={e => setBirthdate(e.target.value)} placeholder="e.g. March 15, 2012" style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createUser} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #d4a854, #c4943e)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>Create User</button>
              <button onClick={() => setCreating(false)} style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #d4cbb8", background: "#fff", color: "#8a7a62", cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", fontSize: 14 }}>Cancel</button>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif" }}>
            New users start with 2 Nephi 2:25
          </div>
        </div>
      )}

      {/* Manage Users button */}
      <div style={{ margin: "16px 16px 8px" }}>
        {!manageMode ? (
          <button
            onClick={() => {
              const code = prompt("Enter passcode to manage users:");
              if (code === MANAGE_PASSCODE) setManageMode(true);
              else if (code !== null) alert("Incorrect passcode");
            }}
            style={{
              width: "100%", padding: "12px",
              borderRadius: 10, border: "1px solid #e0d8cc",
              background: "#faf8f4", color: "#8a7a62",
              fontSize: 13, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
            }}
          >
            Manage Users...
          </button>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff5f5", borderRadius: 10, border: "1px solid #e8a4a4" }}>
            <span style={{ fontSize: 12, color: "#d4726a", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600 }}>
              ⚠️ Manage mode — remove users above
            </span>
            <button
              onClick={() => setManageMode(false)}
              style={{
                padding: "6px 12px", borderRadius: 8, border: "1px solid #d4cbb8",
                background: "#fff", color: "#8a7a62",
                fontSize: 12, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Import / Export Section */}
      <div style={{ margin: "24px 16px 8px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 12 }}>
          Data Management
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExport}
            style={{
              flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #e0d8cc",
              background: "#fff", color: "#5a4e3a",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <IconDownload size={16} /> Export Data
          </button>
          <label style={{
            flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #e0d8cc",
            background: "#fff", color: "#5a4e3a",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Instrument Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <IconPlus size={16} /> Import Data
            <input 
              type="file" 
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImport}
            />
          </label>
        </div>
        <div style={{ fontSize: 11, color: "#a89878", marginTop: 8, fontFamily: "'Instrument Sans', sans-serif" }}>
          Export backs up all users & scriptures. Import merges data additively.
        </div>
      </div>

      {/* Import result toast */}
      {importResult && (
        <div style={{
          position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: importResult.success ? "#2c2416" : "#d4726a", color: importResult.success ? themeColor : "#fff",
          padding: "12px 24px", borderRadius: 14, fontSize: 14, fontWeight: 600,
          fontFamily: "'Instrument Sans', sans-serif",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", animation: "toastIn 0.3s ease",
        }}>
          {importResult.message}
        </div>
      )}

      {/* Avatar customization modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Customize Profile">
        {editingUserData && (
          <div>
            {/* Preview */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: editingUserData.avatarColor || "#d4a854",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}>
                {editingUserData.avatarEmoji || "📖"}
              </div>
            </div>

            {/* Color picker */}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 8 }}>
              Choose Color
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updateUserAvatar(editingUser, "avatarColor", color)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: color, 
                    border: editingUserData.avatarColor === color ? "3px solid #2c2416" : "2px solid #fff",
                    cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  }}
                />
              ))}
            </div>

            {/* Emoji picker */}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#a89878", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 8 }}>
              Choose Emoji
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {AVATAR_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => updateUserAvatar(editingUser, "avatarEmoji", emoji)}
                  style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: editingUserData.avatarEmoji === emoji ? `${editingUserData.avatarColor || "#d4a854"}30` : "#faf8f4",
                    border: editingUserData.avatarEmoji === emoji ? `2px solid ${editingUserData.avatarColor || "#d4a854"}` : "1px solid #e0d8cc",
                    cursor: "pointer", fontSize: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              onClick={() => setEditingUser(null)}
              style={{
                width: "100%", marginTop: 20, padding: "14px",
                borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${editingUserData.avatarColor || "#d4a854"}, ${darkenColor(editingUserData.avatarColor || "#d4a854", 0.7)})`,
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* Account section */}
      <div style={{ margin: "24px 16px 0", padding: 16, background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Account</div>
        {session && (
          <div style={{ fontSize: 14, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 16 }}>
            Signed in as <strong>{session.user.email}</strong>
          </div>
        )}
        <button onClick={() => supabase.auth.signOut()} style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e0d8cc",
          background: "none", fontSize: 14, color: "#8a7a62", cursor: "pointer",
          fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600,
        }}>
          Sign Out
        </button>
      </div>

      {isAdmin && (
        <div style={{ margin: "16px 16px 0", padding: 16, background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#8a7a62", fontFamily: "'Instrument Sans', sans-serif", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Manage Invites</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInvite()} placeholder="email@example.com" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #e0d8cc", fontSize: 14, fontFamily: "'Instrument Sans', sans-serif" }} />
            <button onClick={handleInvite} disabled={inviteLoading || !inviteEmail.trim()} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: themeColor, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", opacity: inviteLoading || !inviteEmail.trim() ? 0.6 : 1 }}>Invite</button>
          </div>
          {inviteToast && <div style={{ fontSize: 13, color: themeColor, fontFamily: "'Instrument Sans', sans-serif", marginBottom: 8 }}>{inviteToast}</div>}
          <button onClick={loadApprovedList} style={{ fontSize: 12, color: "#a89878", background: "none", border: "none", cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", padding: 0, marginBottom: 8 }}>
            {approvedList === null ? "Show approved users ▾" : "Refresh list ↺"}
          </button>
          {approvedList && (
            <div style={{ maxHeight: 200, overflow: "auto" }}>
              {approvedList.length === 0 && <div style={{ fontSize: 13, color: "#a89878", fontFamily: "'Instrument Sans', sans-serif" }}>No approved users yet.</div>}
              {approvedList.map(u => (
                <div key={u.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0ece4" }}>
                  <span style={{ fontSize: 13, color: "#5a4e3a", fontFamily: "'Instrument Sans', sans-serif" }}>{u.email}</span>
                  {u.email !== session?.user?.email && <button onClick={() => handleRevoke(u.email)} style={{ fontSize: 11, color: "#c0392b", background: "none", border: "none", cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>Revoke</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PageFooter />
    </div>
  );
}

