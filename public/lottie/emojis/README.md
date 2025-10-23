# Lottie Emoji Animations

## 📁 Folder Structure

Place your Lottie emoji JSON files here with these naming conventions:

```
public/lottie/emojis/
├── heart.json          (❤️)
├── laugh.json          (😂)
├── fire.json           (🔥)
├── thumbsup.json       (👍)
├── party.json          (🎉)
├── cry.json            (😢)
├── angry.json          (😡)
├── wow.json            (😮)
├── pray.json           (🙏)
├── 100.json            (💯)
├── love.json           (😍)
├── thinking.json       (🤔)
├── cool.json           (😎)
├── hug.json            (🤗)
├── kiss.json           (😘)
├── celebrate.json      (🥳)
└── ... (add more)
```

## 📝 Naming Convention

Use lowercase, descriptive names:
- ✅ `heart.json` - Good
- ✅ `thumbs-up.json` - Good
- ✅ `fire.json` - Good
- ❌ `❤️.json` - Don't use emoji in filename
- ❌ `Heart.json` - Don't use capitals
- ❌ `1.json` - Don't use numbers only

## 🎯 Recommended Emojis

### Essential (16 emojis)
1. heart.json - ❤️ Red heart
2. laugh.json - 😂 Laughing with tears
3. fire.json - 🔥 Fire
4. thumbsup.json - 👍 Thumbs up
5. party.json - 🎉 Party popper
6. cry.json - 😢 Crying
7. angry.json - 😡 Angry face
8. wow.json - 😮 Surprised
9. pray.json - 🙏 Praying hands
10. 100.json - 💯 Hundred points
11. love.json - 😍 Heart eyes
12. thinking.json - 🤔 Thinking face
13. cool.json - 😎 Sunglasses
14. hug.json - 🤗 Hugging face
15. kiss.json - 😘 Blowing kiss
16. celebrate.json - 🥳 Party face

### Additional (Optional)
- clap.json - 👏 Clapping hands
- rocket.json - 🚀 Rocket
- star.json - ⭐ Star
- sparkles.json - ✨ Sparkles
- trophy.json - 🏆 Trophy
- gift.json - 🎁 Gift
- balloon.json - 🎈 Balloon
- confetti.json - 🎊 Confetti ball

## 📥 How to Add Your Files

1. **Copy your Lottie JSON files** to this folder
2. **Rename them** according to the convention above
3. **Update the mapping** in `components/chat/lottie-emoji.tsx`
4. **Test** by opening the emoji picker in chat

## 🔧 After Adding Files

Run this command to update the emoji mapping:
```bash
npm run update-emoji-map
```

Or manually update `components/chat/lottie-emoji.tsx`:
```typescript
const emojiAnimations: Record<string, string> = {
  '❤️': '/lottie/emojis/heart.json',
  '😂': '/lottie/emojis/laugh.json',
  '🔥': '/lottie/emojis/fire.json',
  // ... add all your emojis
}
```

## ✅ File Requirements

- **Format**: JSON (Lottie format)
- **Size**: < 100KB per file (recommended)
- **Version**: Lottie 5.x or higher
- **Optimization**: Use LottieFiles optimizer

## 🎨 Where to Get Lottie Emojis

1. **Telegram Animated Emojis** (Best quality)
   - GitHub: https://github.com/TelegramMessenger/TelegramAnimatedEmojis
   - Free and open source

2. **LottieFiles**
   - Website: https://lottiefiles.com
   - Search: "animated emoji"
   - Download JSON files

3. **Create Your Own**
   - Use After Effects
   - Export with Bodymovin plugin
   - Optimize with LottieFiles

## 📊 Current Status

- ✅ Folder created
- ⏳ Waiting for JSON files
- ⏳ Mapping to be updated
- ⏳ Testing required

## 🚀 Next Steps

1. Add your Lottie JSON files here
2. I'll update the component to use them
3. Test in the chat emoji picker
4. Enjoy animated emojis!
