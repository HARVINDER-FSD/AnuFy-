# Install Animated Lottie Emojis - Telegram Style

## 📦 Installation

Run these commands to install required packages:

```bash
npm install lottie-react @lottiefiles/react-lottie-player
```

Or with yarn:

```bash
yarn add lottie-react @lottiefiles/react-lottie-player
```

## 🎨 Lottie Emoji Sources

### Free Lottie Emoji Libraries

1. **LottieFiles** (Best for Telegram-style)
   - URL: https://lottiefiles.com/featured
   - Search: "emoji", "animated emoji", "telegram emoji"
   - Free animated emojis with JSON files

2. **Telegram Animated Emojis** (Open Source)
   - GitHub: https://github.com/TelegramMessenger/TelegramAnimatedEmojis
   - Direct Telegram emoji animations
   - High quality, optimized

3. **Google Emoji Kitchen**
   - Animated emoji combinations
   - Creative and fun

## 📥 Download Emoji Animations

### Method 1: Use CDN (Recommended)
```typescript
// No download needed, use URLs directly
const emojiAnimations = {
  '❤️': 'https://assets9.lottiefiles.com/packages/lf20_heart.json',
  '😂': 'https://assets9.lottiefiles.com/packages/lf20_laugh.json',
  '👍': 'https://assets9.lottiefiles.com/packages/lf20_thumbsup.json',
  // ... more
}
```

### Method 2: Download and Host Locally
1. Go to LottieFiles.com
2. Search for emoji animations
3. Download JSON files
4. Place in `public/lottie/emojis/`
5. Reference locally

## 🚀 Quick Start

After installation, the animated emojis will work automatically in your chat!

Features:
- ✅ Animate when sending
- ✅ Animate on receive
- ✅ Animate on reaction
- ✅ Full screen emoji animation
- ✅ Telegram-style effects
