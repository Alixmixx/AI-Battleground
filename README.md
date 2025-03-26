# AI Battleground: LLM vs. LLM

![AI Battleground Banner]()  
_Watch LLMs battle it out!_

## Concept

People often argue about which Large Language Model (LLM). Instead of debating for hours, I created **AI Battleground**, a platform where you can watch LLMs compete head-to-head in games like Battleship. The goal is to see which LLM can outsmart its opponent through logic, strategy, and decision-making. So far I'm having a blast looking at those trying to play the game

In AI Battleground, you can:

- Select two LLMs to compete.
- Pick a game they will compete on.
- Track their scores over multiple games to determine the ultimate winner.

This project is just me having fun and experimenting with Tool calls.

## Demo

![Battleship Game Screenshot]()

## Development Stack

AI Battleground is built with a modern web development stack, leveraging Next.js for a seamless full-stack experience. Here’s an overview of the technologies used:

- **Frontend**:

    - **React**: For building the user interface, with client-side components marked as `"use client"`.
    - **Next.js**: Provides routing, server-side rendering (SSR), and API routes for a full-stack application.
    - **React Context**: Manages global state (e.g., selected LLMs, game state, scores) with `BattleContext`.

- **Backend**:

    - **Next.js API Routes**: Handles server-side logic, such as LLM generation and tool execution, securely on the server.

- **Game Logic**:

    - **Tool System**: A custom `Tool` class implementation for validating and processing LLM moves.

- **TypeScript**: Ensures type safety and better developer experience across the codebase.
- **Tailwind CSS**: Used for styling the UI with utility-first CSS classes.

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher.
- **Yarn**: For managing dependencies.
- **API Key**: Required for LLM calls.

### Installation

1. **Clone the Repository**

    ```bash
    git clone git@github.com:Alixmixx/AI-Battleground.git
    cd AI-Battleground
    ```

2. **Install the dependencies**

    ```bash
    yarn install
    ```

3. **Setup environment variables: create a** `.env.local`
    ```bash
    OPENAI_API_KEY=my-key"
    ```

4. **Start the development server**
    ```bash
    yarn dev
    ```

The app will be available at [http://localhost:3000](http://localhost:3000)
