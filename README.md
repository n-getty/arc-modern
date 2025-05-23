# ARC-AGI Modern Interface

A modern web interface for the Abstraction and Reasoning Corpus (ARC) challenge, supporting both the original ARC and ARC-AGI-2.

> **Note:** This project's code was initially generated by AI (Claude 3.7 Sonnet).

## Overview

This application provides an intuitive interface for exploring and solving ARC puzzles. It features:

- Support for both ARC-AGI 1 and ARC-AGI 2 challenges
- A clean, responsive UI for various screen sizes
- Interactive grid editing with multiple tools
- Example magnification for better pattern recognition
- Task navigation with 1-indexed display
- Solution validation
- TTS Reasoning transcription
- Timing an transcription data exporting

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/water-vapor/arc-modern.git
   cd arc-modern
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run serve
   ```

4. Build for production:
   ```
   npm run build
   ```

## Usage

1. **Load a puzzle**: Choose between ARC-AGI 1 and ARC-AGI 2, then select a task from the training or evaluation sets.
2. **Start timer**: Initiates timing and TTS transcription features.
3. **Study examples**: Review the provided examples to understand the pattern.
4. **Create solution**: Use the editing tools to create your solution for the test input.
5. **Validate**: Submit your solution to check if it's correct.

## Features

- **Challenge Version Selection**: Switch between ARC-AGI 1 and ARC-AGI 2 datasets
- **Example Magnification**: Click on examples to expand them for easier analysis
- **Multiple Editing Tools**: Edit mode, select mode, and flood fill for efficient grid creation
- **Symbol Picker**: Quickly select symbols with visual color indicators
- **Responsive Design**: Works on desktops, tablets, and mobile devices
- **Transcribe Reasoning**: Capture your reasoning trace audibly while working through the puzzle.

## Deployment

### GitHub Pages Deployment

This application is configured for easy deployment to GitHub Pages. You can deploy it in two ways:

#### Automatic Deployment (GitHub Actions)

1. Fork or push this repository to your GitHub account
2. Ensure the repository name is updated in `vue.config.js`:
   ```js
   publicPath: process.env.NODE_ENV === 'production'
     ? '/arc-modern/'  // Replace with your repository name if different
     : '/'
   ```
3. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Set Source to "GitHub Actions"
4. Push to the main branch, and the GitHub Action will automatically build and deploy the site

## Acknowledgments

- Original ARC challenge by François Chollet
- ARC-AGI 2 challenge by the ARC Prize Team 