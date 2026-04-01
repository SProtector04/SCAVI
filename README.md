<p align="center" style="text-align: center">
  <h1 align="center">SCAVI</h1>
</p>

<p align="center">
  Sistema de gestión de usuarios y vehículos con panel de control, historial y administración.
  <br/>
  <br/>
  <a href="https://github.com/SProtector04/Proyecto-Final-ProWeb/blob/main/LICENSE">
    <img alt="GitHub license" src="https://img.shields.io/github/license/SProtector04/Proyecto-Final-ProWeb"/>
  </a>
  <a href="https://github.com/SProtector04/Proyecto-Final-ProWeb/issues">
    <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat" alt="Contributions welcome" />
  </a>
  <a href="https://github.com/SProtector04/Proyecto-Final-ProWeb/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/SProtector04/Proyecto-Final-ProWeb/ci.yml?branch=main&logo=Github" alt="Build status" />
  </a>
</p>

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Management](#project-management)
- [Star History](#star-history)

## Introduction

SCAVI is a full-stack web application for managing users and vehicles. It provides a modern dashboard interface, user and vehicle management panels, activity history, and a contact page — all backed by a REST API and containerised for easy deployment.

## Features

- 📊 Dashboard with key metrics at a glance
- 👥 User listing and management
- 🚗 Vehicle management
- 📜 Activity history log
- ✉️ Contact form
- 🔐 User profile page
- 🐳 Fully containerised with Docker Compose
- 🔄 Nginx reverse proxy for production-ready routing

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React · TypeScript · Vite · Tailwind CSS |
| Backend  | Django · Django REST Framework           |
| Database | PostgreSQL 15                            |
| DevOps   | Docker · Docker Compose · Nginx          |

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Running the project

1. Clone the repository:

   ```bash
   git clone https://github.com/SProtector04/Proyecto-Final-ProWeb.git
   cd Proyecto-Final-ProWeb
   ```

2. Copy the example environment file and fill in the values:

   ```bash
   cp .env.example .env
   ```

3. Start all services:

   ```bash
   docker compose up --build
   ```

4. The application will be available at [http://localhost](http://localhost).

## Project Management

The project board is managed on Trello:

🔗 [https://trello.com/invite/b/69a5a3d8606a609ebf0d8137/ATTI27349fa4e6f1c85cca2fd9fabb6df9134FD47B4E/scavi](https://trello.com/invite/b/69a5a3d8606a609ebf0d8137/ATTI27349fa4e6f1c85cca2fd9fabb6df9134FD47B4E/scavi)

## Star History

<a href="https://www.star-history.com/?repos=SProtector04%2FProyecto-Final-ProWeb&amp;type=date&amp;logscale=&amp;legend=top-left">
 
</a>
