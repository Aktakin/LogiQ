# LogiQuest - Learn Logic Through Play 🧩

A beautiful, engaging platform for kids to learn logic concepts through interactive games and puzzles. Built with Next.js, TypeScript, and Tailwind CSS.

![LogiQuest](https://img.shields.io/badge/Age%20Range-4--12%20years-purple)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

### 🎮 Four Engaging Games
- **Pattern Quest** 🎨 - Identify missing pieces in colorful patterns
- **Sequence Master** 🔢 - Discover numerical sequences and progressions  
- **Logic Detective** 🔍 - Solve mysteries using deductive reasoning
- **Shape Shifter** 🧊 - Match rotated and transformed shapes

### 🎯 Age-Appropriate Content
- **Ages 4-6**: Simple patterns, basic sequences, easy puzzles
- **Ages 7-9**: More complex patterns, arithmetic sequences, intermediate logic
- **Ages 10-12**: Advanced patterns, algebraic sequences, challenging deduction

### 📊 Progress Tracking
- Star collection and achievement system
- Level progression per game
- Streak tracking and bonus rewards
- Persistent progress with local storage

### 🎨 Stunning Design
- Cosmic/space-inspired theme
- Smooth animations powered by Framer Motion
- Responsive design for all devices
- Accessible and kid-friendly interface

## 🚀 Getting Started

### Prerequisites
- Node.js 20.9.0 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd kidsapp

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Deployment on Vercel

This app is optimized for deployment on Vercel:

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will auto-detect Next.js and configure everything
4. Click "Deploy"

That's it! Your app will be live in minutes.

### Environment Variables
No environment variables are required for basic deployment.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

## 📁 Project Structure

```
src/
├── app/
│   ├── dashboard/       # Main game selection dashboard
│   ├── games/
│   │   ├── patterns/    # Pattern recognition game
│   │   ├── sequences/   # Number sequence game
│   │   ├── deduction/   # Logic deduction game
│   │   └── spatial/     # Spatial reasoning game
│   ├── globals.css      # Global styles & theme
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/
│   ├── Confetti.tsx     # Celebration effect
│   ├── FloatingShapes.tsx # Background decoration
│   └── GameCard.tsx     # Game selection cards
└── store/
    └── gameStore.ts     # Zustand state management
```

## 🎯 Educational Goals

LogiQuest develops critical thinking skills through:

1. **Pattern Recognition** - Visual-spatial intelligence
2. **Sequence Analysis** - Mathematical reasoning
3. **Deductive Logic** - Analytical thinking
4. **Spatial Reasoning** - Mental rotation and transformation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with 💜 for curious young minds
