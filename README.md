# 🚀 AI Blog Automation Tool - Automated Content Generation Platform

> **Generate high-quality, SEO-optimized blog posts automatically with AI-powered research, topic discovery, and content creation.**

A powerful Next.js-based blog automation platform that leverages Google Gemini AI to streamline your content creation workflow. Perfect for content marketers, bloggers, digital agencies, and businesses looking to scale their content production efficiently.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Use Cases](#use-cases)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Export Options](#export-options)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**Blog Automation Tool** is an intelligent content generation platform designed to revolutionize your blogging workflow. By combining advanced AI capabilities with an intuitive user interface, this tool helps you:

- **Research trending topics** in any niche automatically
- **Generate complete blog posts** with customizable length and tone
- **Edit and refine content** using a rich text editor
- **Export professionally formatted** PDFs and HTML files

Whether you're managing a personal blog, running a content agency, or scaling your digital marketing efforts, this automation tool saves hours of research and writing time while maintaining high content quality.

## ✨ Key Features

### 🔍 **AI-Powered Topic Research**
- Discover 5 trending, high-demand blog topics for any niche
- Automated keyword research and topic validation
- Real-time trend analysis using Google Gemini AI

### ✍️ **Intelligent Content Generation**
- Generate complete, human-like blog posts (500-3000+ words)
- Customizable writing tone (Professional, Casual, Technical, Friendly)
- SEO-optimized content structure with proper headings and formatting
- Natural language generation that avoids robotic patterns

### 📝 **Rich Text Editor Integration**
- Full-featured WYSIWYG editor powered by TipTap
- Real-time content editing and formatting
- Support for:
  - Bold, italic, and text styling
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Paragraph formatting

### 📤 **Professional Export Options**
- **PDF Export**: Download publication-ready PDF documents
- **HTML Export**: Get clean HTML for direct publishing
- Formatted output optimized for web and print

### 🎨 **Modern User Interface**
- Clean, responsive dashboard design
- Intuitive workflow: Research → Select → Generate → Edit → Export
- Real-time loading states and progress indicators
- Mobile-friendly responsive layout

### 🤖 **Persistent AI Session Management**
- Browser session persistence using Puppeteer
- Automatic login state management
- Reduced API overhead with session reuse

## 💼 Use Cases

- **Content Marketers**: Scale your content production without sacrificing quality
- **SEO Agencies**: Generate optimized blog content for multiple clients
- **Bloggers & Writers**: Beat writer's block with AI-assisted topic research
- **E-commerce Businesses**: Create product descriptions and category content
- **Digital Publishers**: Maintain consistent publishing schedules effortlessly
- **Affiliate Marketers**: Produce review and comparison content quickly
- **Startups**: Build content libraries without hiring large writing teams

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.1** - React framework with App Router
- **React 19.2** - UI library
- **TailwindCSS 4.0** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **TipTap** - Headless rich text editor

### Backend & AI
- **Next.js API Routes** - Serverless API endpoints
- **Google Gemini AI** - Advanced language model for content generation
- **Puppeteer 24.34** - Browser automation for AI interaction

### Export & Processing
- **jsPDF** - Client-side PDF generation
- **html2canvas** - HTML to canvas rendering
- **HTML-to-Text** - Content conversion utilities

### Development Tools
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing
- **Tailwind Typography** - Beautiful typographic defaults

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **Google Account** (required for Gemini AI authentication)
- **Modern web browser** (Chrome recommended for Puppeteer)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/zain-khokhar/blog-automation.git
cd blog-automation
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Configure environment variables** (if needed)

```bash
# Create .env.local file for any custom configurations
cp .env.example .env.local
```

4. **Start the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to access the application.

## ⚙️ Configuration

### First-Time Setup

On your first run, the application will:

1. Launch a browser window for Google Gemini authentication
2. Wait for you to log in to your Google account
3. Save the session for future use in the `./session` folder
4. Initialize the AI automation system

**Important**: Keep the browser window open during the first login. The session will be persisted for subsequent uses.

### Content Generation Settings

Customize your blog generation with these parameters:

- **Word Count**: 500 - 3000 words (default: 1500)
- **Tone Options**:
  - Professional (default)
  - Casual
  - Technical
  - Friendly
  - Conversational

## 📖 Usage Guide

### Step 1: Research Topics

1. Enter your **niche or topic area** (e.g., "Digital Marketing", "Healthy Recipes", "Tech Reviews")
2. Click **"Research Topics"**
3. The AI will analyze trends and return 5 relevant blog topic suggestions

### Step 2: Select a Topic

- Review the suggested topics
- Click **"Select"** on your preferred topic
- The topic will be highlighted for content generation

### Step 3: Configure Content Settings

- Adjust **word count** using the slider or input field
- Select your desired **writing tone** from the dropdown
- Fine-tune settings based on your audience and platform

### Step 4: Generate Blog Content

1. Click **"Generate Blog"**
2. Wait for the AI to research and write your content (typically 30-90 seconds)
3. Review the generated content in the rich text editor

### Step 5: Edit & Refine

- Use the editor toolbar to format text
- Add or remove sections as needed
- Adjust headings, lists, and paragraph styles
- Preview changes in real-time

### Step 6: Export Your Content

- **Download PDF**: Click the PDF button to export a formatted document
- **Copy HTML**: Get clean HTML markup for publishing
- **Direct Publishing**: Copy and paste into your CMS or blog platform

## 🔌 API Documentation

### Research Topics Endpoint

```javascript
POST /api/research-topics

Request Body:
{
  "niche": "Your niche or topic area"
}

Response:
{
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3",
    "Topic 4",
    "Topic 5"
  ]
}
```

### Generate Blog Endpoint

```javascript
POST /api/generate-blog

Request Body:
{
  "topic": "Selected blog topic",
  "wordCount": 1500,
  "tone": "Professional"
}

Response:
{
  "content": "<h1>Blog Title</h1><h2>Section 1</h2><p>Content...</p>"
}
```

## 📁 Project Structure

```
blog-automation/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── research-topics/    # Topic research API
│   │   │   └── generate-blog/      # Content generation API
│   │   ├── layout.js               # App layout wrapper
│   │   ├── page.js                 # Main dashboard
│   │   └── globals.css             # Global styles
│   └── lib/
│       └── gemini.js               # Gemini AI automation class
├── public/                         # Static assets
├── session/                        # Browser session data (gitignored)
├── components.json                 # UI component config
├── package.json                    # Dependencies
├── next.config.mjs                 # Next.js configuration
├── tailwind.config.js              # Tailwind CSS config
└── README.md                       # Documentation
```

## 🎨 Customization

### Styling

The project uses **TailwindCSS** for styling. Customize the theme in:
- `tailwind.config.js` - Theme configuration
- `src/app/globals.css` - Global styles and CSS variables

### AI Prompts

Modify AI behavior by editing prompts in:
- `src/app/api/research-topics/route.js` - Topic research prompts
- `src/app/api/generate-blog/route.js` - Content generation prompts

### Editor Configuration

Customize the rich text editor in `src/app/page.js`:
- Add more TipTap extensions
- Modify toolbar buttons
- Adjust editor styling and behavior

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Repository**: [github.com/zain-khokhar/blog-automation](https://github.com/zain-khokhar/blog-automation)
- **Issues**: [Report a bug or request a feature](https://github.com/zain-khokhar/blog-automation/issues)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **TipTap Editor**: [tiptap.dev](https://tiptap.dev)

## 🙏 Acknowledgments

- **Google Gemini AI** for powering intelligent content generation
- **Next.js Team** for the amazing React framework
- **TipTap** for the flexible editor component
- **Puppeteer Team** for browser automation capabilities

---

**Built with ❤️ for content creators who want to work smarter, not harder.**

*Keywords: blog automation, AI content generation, automated blogging, content marketing automation, AI writing tool, blog post generator, SEO content automation, content creation platform, AI blog writer, automatic content creator, blog writing software, AI copywriting tool, content generation API, automated SEO blog posts*
