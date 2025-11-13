<p align="center">
  <img src="https://www.pytogether.org/pytog.png" alt="Logo" width="150"><br>
  <strong style="font-size: 24px;">PyTogether</strong><br>
  <em>Google docs for Python. A fully browser-based collaborative Python IDE with real-time editing, chat, and visualization.</em>
  <br>
  <br>
  <a href="https://pytogether.org">pytogether.org</a>
</p>

(https://pytogether.org/)

## Features
- **Real-time Collaboration** - Edit Python code together instantly using Y.js.  
- **Secure Authentication** - Log in manually or with Google OAuth.  
- **Groups & Projects** - Organize your work into teams and projects.   
- **Live Drawings** - Draw directly on the IDE to assist with note-taking or teaching.
- **Live Cursors/Selections** - Google docs-like live selections for smoother collaboration.
- **Live Chat and Voice Calls** - Real-time messaging, and Discord-like voice chats for each project. 
- **Code Linting** - Integrated CodeMirror linting for cleaner, error-free code.  
- **Smart Autosave** - Code is automatically saved every minute and on exit. 

----

<p align="center">
  <img src="docs/live.gif" alt="Demo" width="600">
</p>
<p align="center">
  <img src="docs/drawinglive.gif" alt="Drawing Demo" width="600">
</p>

----

## About
When starting out in programming, many beginners find traditional IDEs overwhelming: full of plugins, extensions, configuration steps, paywalls, and complex UIs. PyTogether removes these barriers by offering a lightweight, distraction-free environment where you can focus on writing Python code right away.  

The platform is designed for **learning, teaching, and pair programming**, making it ideal for classrooms, coding clubs, or quick collaborations.  

> **Note:** PyTogether is intended for educational purposes and beginner use. It is *not* optimized for large-scale production development.

## Why PyTogether?  

While there are many online IDEs (Replit, Jupyter, Google Colab, etc.), PyTogether is built with a different goal: **simplicity first**.  

- ⚡**Instant Setup**⚡- No downloads, no pip installs, no hidden complexity. Just create a group, create a project, and bam!
- **Beginner Focused** - No confusing menus, terminals, or configuration. Just code and run.  
- **Real-Time Collaboration** - Work together with classmates, friends, or mentors in the same editor.  
- **Safe Learning Space** - Limited features by design to reduce distractions and keep beginners focused.  

Unlike production-grade IDEs, PyTogether prioritizes **ease of use and collaboration for learners** rather than advanced features.

## Technologies
- **Backend**: Django, Django REST Framework (DRF)
- **Real-Time**: Y.js, WebSockets (Django Channels)
- **Async Processing**: Celery
- **Data Store**: PostgreSQL (via Supabase)
- **Caching, Broker, & Channel layers**: Redis
- **Frontend**: React, Tailwind CSS, CodeMirror (code linting)
- **Python Execution**: Pyodide (via Web Worker)
- **Deployment**: Vercel (Frontend), Docker on VPS (Backend), Nginx (reverse proxy)
- **CI/CD**: GitHub Actions (deploy backend to VPS on push to main)

## Contributing & Local Setup
- Requirements: Docker, Node

Running PyTogether locally is a simple two-step process. Run the following commands from the project root:
```bash
# 1. Install all dependencies (automatically does it for root and frontend)
npm install

# 2. Start the servers
npm run dev
```

This will install all required packages and run the backend container and start the frontend. It should take around 2-5 minutes on initial launch.
The frontend will be live on http://localhost:5173. You can do CTRL+C to stop the program/containers.

> **Note**
> Two superusers are created automatically:
> * **Email:** `test1@gmail.com`
> * **Email:** `test2@gmail.com`
>
> Both have the password `testtest`. You can log in with them on the frontend.

You may also adjust the settings in backend/backend/settings/dev.py













